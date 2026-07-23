import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { diagnosticSubmissionSchema, diagnosticReportSchema } from "@/lib/schemas";
import { calculateDeterministicScores, ScoringValidationError } from "@/lib/scoring";
import { buildUserPrompt, SYSTEM_PROMPT } from "@/lib/prompt";
import type { DiagnosticReport, DiagnosticResponse } from "@/lib/types";

export const runtime = "nodejs";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
const MAX_TOKENS = 3000;

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
    temperature: 0.4,
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
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
    console.error("Anthropic API call failed:", err);
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
          console.error("Anthropic retry call failed:", retryErr);
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
