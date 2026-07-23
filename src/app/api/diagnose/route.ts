import { NextResponse } from "next/server";
import Anthropic, { APIError } from "@anthropic-ai/sdk";
import { diagnosticSubmissionSchema, diagnosticReportSchema } from "@/lib/schemas";
import { calculateDeterministicScores, ScoringValidationError } from "@/lib/scoring";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import type { DiagnosticReport, DiagnosticResponse } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOKENS = 3000;
const ANTHROPIC_KEY_PREFIX = "sk-ant-";

/**
 * Vercel's env var UI is a common source of silent 401s: a value pasted
 * with a trailing newline, leading/trailing spaces, or wrapped in quotes
 * (e.g. copied from a `KEY="value"` line) produces an x-api-key header
 * that looks right in the dashboard but never matches a real key.
 */
function sanitizeApiKey(raw: string | undefined): {
  key: string | undefined;
  wasModified: boolean;
} {
  if (!raw) return { key: undefined, wasModified: false };
  let value = raw.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return { key: value || undefined, wasModified: value !== raw };
}

/**
 * Temporary diagnostics: safe to log (never logs the key itself), and safe
 * to remove once the Vercel Anthropic auth issue is confirmed resolved.
 */
function logApiKeyDiagnostics(key: string | undefined, wasModified: boolean) {
  console.error("[diagnose] ANTHROPIC_API_KEY diagnostics:", {
    present: Boolean(key),
    length: key?.length ?? 0,
    startsWithExpectedPrefix: key ? key.startsWith(ANTHROPIC_KEY_PREFIX) : false,
    requiredWhitespaceOrQuoteStripping: wasModified,
    model: MODEL,
  });
}

/**
 * Anthropic.Error subclasses (AuthenticationError, etc.) carry `status`,
 * `type`, and a JSON `error` body — but `message` is a non-enumerable
 * Error property, so logging the raw error object can print as `{}` in
 * log pipelines that JSON-serialize it. Pull the fields out explicitly.
 */
function describeAnthropicError(err: unknown) {
  if (err instanceof APIError) {
    return {
      name: err.name,
      status: err.status,
      type: err.type,
      message: err.message,
      requestID: err.requestID,
      body: err.error,
    };
  }
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  return { message: String(err) };
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  // Defense in depth: the model is instructed not to use code fences, but
  // strip them if present rather than failing the whole request.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

async function callClaude(
  client: Anthropic,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const textBlock = message.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude returned no text content.");
  }
  return textBlock.text;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const parsedSubmission = diagnosticSubmissionSchema.safeParse(body);
  if (!parsedSubmission.success) {
    return NextResponse.json(
      {
        error: "The assessment submission is invalid.",
        issues: parsedSubmission.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { businessContext, answers } = parsedSubmission.data;

  let scores;
  try {
    scores = calculateDeterministicScores(answers);
  } catch (err) {
    if (err instanceof ScoringValidationError) {
      return NextResponse.json(
        { error: "Assessment answers could not be scored.", issues: err.issues },
        { status: 400 }
      );
    }
    throw err;
  }

  const { key: apiKey, wasModified: apiKeyWasModified } = sanitizeApiKey(
    process.env.ANTHROPIC_API_KEY
  );
  logApiKeyDiagnostics(apiKey, apiKeyWasModified);

  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not configured.");
    return NextResponse.json(
      { error: "The diagnostic service is not configured. Please try again later." },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });
  const userPrompt = buildUserPrompt(businessContext, answers, scores);

  let rawText: string;
  try {
    rawText = await callClaude(client, SYSTEM_PROMPT, userPrompt);
  } catch (err) {
    console.error(
      "[diagnose] Anthropic API call failed:",
      JSON.stringify(describeAnthropicError(err))
    );
    return NextResponse.json(
      {
        error:
          "We couldn't generate your diagnostic right now. Please try again.",
      },
      { status: 502 }
    );
  }

  let report: DiagnosticReport | null = null;

  for (let attempt = 0; attempt < 2 && !report; attempt++) {
    try {
      const parsedJson = extractJson(rawText);
      const parsedReport = diagnosticReportSchema.safeParse(parsedJson);
      if (parsedReport.success) {
        report = parsedReport.data;
      } else if (attempt === 0) {
        // Retry once with an explicit repair instruction.
        rawText = await callClaude(
          client,
          SYSTEM_PROMPT,
          `${userPrompt}\n\nYour previous response did not match the required JSON schema exactly. Return ONLY valid JSON matching the schema, with no markdown or commentary.`
        );
      }
    } catch {
      if (attempt === 0) {
        try {
          rawText = await callClaude(
            client,
            SYSTEM_PROMPT,
            `${userPrompt}\n\nYour previous response was not valid JSON. Return ONLY valid JSON matching the schema, with no markdown, commentary, or code fences.`
          );
        } catch (retryErr) {
          console.error(
            "[diagnose] Anthropic retry call failed:",
            JSON.stringify(describeAnthropicError(retryErr))
          );
          break;
        }
      }
    }
  }

  if (!report) {
    console.error("Claude output failed schema validation after retry.");
    return NextResponse.json(
      {
        error:
          "We received an unexpected response while generating your diagnostic. Please try again.",
      },
      { status: 502 }
    );
  }

  // Deterministic scores are the source of truth — overwrite whatever the
  // model produced, keeping only its justification text.
  report.scorecard.revenue_engine.score = scores.revenue_engine;
  report.scorecard.operations.score = scores.operations;
  report.scorecard.people_org.score = scores.people_org;
  report.scorecard.systems_readiness.score = scores.systems_readiness;

  const response: DiagnosticResponse = {
    businessContext,
    report,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(response, { status: 200 });
}
