import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

const { MockAPIError } = vi.hoisted(() => {
  class MockAPIError extends Error {
    status: number;
    type: string | null;
    error: unknown;
    requestID: string | null;
    constructor(
      status: number,
      error: unknown,
      message: string,
      type: string | null = null
    ) {
      super(message);
      this.name = "APIError";
      this.status = status;
      this.error = error;
      this.type = type;
      this.requestID = "req_mock_123";
    }
  }
  return { MockAPIError };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: createMock },
  })),
  APIError: MockAPIError,
}));

import AnthropicMock from "@anthropic-ai/sdk";
import { POST } from "./route";

const validSubmission = {
  businessContext: {
    companyName: "Acme Consulting",
    industry: "Consulting",
    revenueRange: "$2M–$5M",
    teamSize: "6–15",
  },
  answers: {
    pricingConfidence: 2,
    leadSourceDiversification: 1,
    dealStallReason: "Deals stall after the proposal because pricing is unclear.",
    processDocumentation: 1,
    keyPersonDependency: 1,
    lastOperationalBreak: "The founder was on vacation and delivery slipped.",
    roleClarity: 2,
    decisionIndependence: 1,
    capacityUnlockHire: "An operations lead.",
    systemsMaturity: 1,
    dataAccessSpeed: 2,
    scaleBreakingPoint: "Client onboarding would collapse.",
  },
};

// Deterministic scores for the payload above:
// revenue_engine = (2+1)/2*2 = 3, operations = (1+1)/2*2 = 2,
// people_org = (2+1)/2*2 = 3, systems_readiness = (1+2)/2*2 = 3

function validReportPayload(overrideScores?: Record<string, number>) {
  return {
    executive_summary:
      "The business is constrained primarily by pricing uncertainty and key-person dependency. Based on the assessment, growth is capped by manual delivery processes. The evidence points to a leadership bottleneck as the compounding factor.",
    scorecard: {
      revenue_engine: {
        score: overrideScores?.revenue_engine ?? 999,
        justification: "Pricing confidence is low and lead sources are concentrated.",
      },
      operations: {
        score: overrideScores?.operations ?? 999,
        justification: "Processes are undocumented and fragile to key-person absence.",
      },
      people_org: {
        score: overrideScores?.people_org ?? 999,
        justification: "Roles are unclear and decisions bottleneck at the top.",
      },
      systems_readiness: {
        score: overrideScores?.systems_readiness ?? 999,
        justification: "Systems are manual and data access is slow.",
      },
    },
    primary_root_cause: {
      headline: "Owner-Dependent Delivery Model",
      explanation:
        "The founder's direct involvement in delivery is the strongest constraint. This is likely creating a ceiling on growth referenced in the operational break described.",
    },
    secondary_constraints: [
      { constraint: "Pricing is not value-based.", why_it_matters: "This compresses margin as volume grows." },
      { constraint: "Lead generation is concentrated.", why_it_matters: "This creates revenue fragility." },
    ],
    recommendations: {
      quick_wins: [
        { action: "Document the top 3 delivery workflows.", expected_impact: "Reduces key-person risk" },
        { action: "Introduce value-based pricing tiers.", expected_impact: "Improves margin" },
      ],
      strategic_bets: [
        { action: "Hire an operations lead.", expected_impact: "Unlocks founder capacity" },
        { action: "Diversify lead generation channels.", expected_impact: "Reduces revenue concentration risk" },
      ],
    },
    roadmap_90_day: {
      days_1_30: ["Document core workflows", "Audit pricing model"],
      days_31_60: ["Hire or designate an operations owner", "Pilot new pricing tiers"],
      days_61_90: ["Launch a second lead channel", "Review margin impact"],
    },
    ai_automation_fit: [
      "Directional estimate: automating client onboarding could reduce delivery time.",
      "An AI-assisted proposal generator could reduce pricing inconsistency.",
    ],
    closing_note: "Addressing the owner-dependency constraint first will compound every other recommendation.",
  };
}

function textResponse(payload: unknown) {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/diagnose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/diagnose", () => {
  beforeEach(() => {
    createMock.mockReset();
    process.env.ANTHROPIC_API_KEY = "test-key";
  });

  it("returns 400 for an invalid submission", async () => {
    const res = await POST(makeRequest({ businessContext: {}, answers: {} }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 500 when ANTHROPIC_API_KEY is not configured", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toBeDefined();
    expect(createMock).not.toHaveBeenCalled();
  });

  it("returns 502 when the Anthropic API call fails", async () => {
    createMock.mockRejectedValueOnce(new Error("network error"));
    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(502);
  });

  it("retries once and succeeds when the first response is malformed JSON", async () => {
    createMock
      .mockResolvedValueOnce({ content: [{ type: "text", text: "{not valid json" }] })
      .mockResolvedValueOnce(textResponse(validReportPayload()));

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(200);
    expect(createMock).toHaveBeenCalledTimes(2);

    const data = await res.json();
    expect(data.report.scorecard.revenue_engine.score).toBe(3);
    expect(data.report.scorecard.operations.score).toBe(2);
    expect(data.report.scorecard.people_org.score).toBe(3);
    expect(data.report.scorecard.systems_readiness.score).toBe(3);
  });

  it("returns 502 when the AI output never matches the schema", async () => {
    createMock.mockResolvedValue(
      textResponse({ executive_summary: "incomplete payload" })
    );
    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(502);
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("overwrites AI-provided scores with the deterministic scorecard", async () => {
    createMock.mockResolvedValueOnce(
      textResponse(
        validReportPayload({
          revenue_engine: 10,
          operations: 10,
          people_org: 10,
          systems_readiness: 10,
        })
      )
    );

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(200);
    const data = await res.json();

    // The mock told the model to say every score is 10 — the server must
    // ignore that and use the deterministic calculation instead.
    expect(data.report.scorecard.revenue_engine.score).toBe(3);
    expect(data.report.scorecard.operations.score).toBe(2);
    expect(data.report.scorecard.people_org.score).toBe(3);
    expect(data.report.scorecard.systems_readiness.score).toBe(3);
    expect(data.report.scorecard.revenue_engine.justification).toContain(
      "Pricing confidence"
    );
  });

  it("strips markdown code fences from the AI response before parsing", async () => {
    createMock.mockResolvedValueOnce({
      content: [
        {
          type: "text",
          text: "```json\n" + JSON.stringify(validReportPayload()) + "\n```",
        },
      ],
    });

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(200);
  });

  it("never sends temperature, top_p, or top_k to the Anthropic API (claude-sonnet-5 rejects them)", async () => {
    createMock.mockResolvedValueOnce(textResponse(validReportPayload()));

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(200);

    expect(createMock).toHaveBeenCalledTimes(1);
    const requestBody = createMock.mock.calls[0][0] as Record<string, unknown>;
    expect(requestBody).not.toHaveProperty("temperature");
    expect(requestBody).not.toHaveProperty("top_p");
    expect(requestBody).not.toHaveProperty("top_k");
    expect(requestBody.model).toBe("claude-sonnet-5");
  });

  it("trims whitespace and strips wrapping quotes from the API key before use", async () => {
    process.env.ANTHROPIC_API_KEY = '  "sk-ant-test-key-12345"  \n';
    createMock.mockResolvedValueOnce(textResponse(validReportPayload()));

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(200);

    const constructorMock = AnthropicMock as unknown as {
      mock: { calls: unknown[][] };
    };
    const lastCallArgs = constructorMock.mock.calls.at(-1)![0] as {
      apiKey: string;
    };
    expect(lastCallArgs.apiKey).toBe("sk-ant-test-key-12345");
  });

  it("logs safe API key diagnostics without ever logging the key itself", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.ANTHROPIC_API_KEY = " sk-ant-abcdef123456 ";
    createMock.mockResolvedValueOnce(textResponse(validReportPayload()));

    await POST(makeRequest(validSubmission));

    const diagnosticsCall = consoleErrorSpy.mock.calls.find(
      (call) =>
        typeof call[0] === "string" &&
        call[0].includes("ANTHROPIC_API_KEY diagnostics")
    );
    expect(diagnosticsCall).toBeDefined();

    const payload = diagnosticsCall![1] as Record<string, unknown>;
    expect(payload.present).toBe(true);
    expect(payload.startsWithExpectedPrefix).toBe(true);
    expect(payload.requiredWhitespaceOrQuoteStripping).toBe(true);
    expect(JSON.stringify(diagnosticsCall)).not.toContain(
      "sk-ant-abcdef123456"
    );

    consoleErrorSpy.mockRestore();
  });

  it("logs the real Anthropic status/type/message when authentication fails with a 401", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const authError = new MockAPIError(
      401,
      {
        type: "error",
        error: { type: "authentication_error", message: "invalid x-api-key" },
      },
      "401 authentication_error",
      "authentication_error"
    );
    createMock.mockRejectedValueOnce(authError);

    const res = await POST(makeRequest(validSubmission));
    expect(res.status).toBe(502);

    const loggedCall = consoleErrorSpy.mock.calls.find(
      (call) =>
        typeof call[0] === "string" &&
        call[0].includes("Anthropic API call failed")
    );
    expect(loggedCall).toBeDefined();

    const loggedPayload = JSON.parse(loggedCall![1] as string);
    expect(loggedPayload.status).toBe(401);
    expect(loggedPayload.type).toBe("authentication_error");
    expect(loggedPayload.message.length).toBeGreaterThan(0);
    expect(loggedPayload.body.error.message).toBe("invalid x-api-key");

    consoleErrorSpy.mockRestore();
  });
});
