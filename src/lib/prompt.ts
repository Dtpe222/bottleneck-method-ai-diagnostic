import type {
  AssessmentAnswers,
  BusinessContext,
  DeterministicScores,
} from "./types";

export const SYSTEM_PROMPT = `You are a senior management consultant producing a Bottleneck Diagnostic report for a business executive.

You receive:
- Company context
- Numeric assessment answers
- Open-text answers
- A pre-calculated deterministic scorecard

Rules:
- Ground conclusions in the user's specific answers.
- Reference the user's actual language where useful.
- Do not contradict, recalculate, modify, or invent score values. Use the exact deterministic scores provided to you, verbatim, in the "score" fields.
- Distinguish symptoms from root causes.
- Use a direct, confident, executive tone.
- Avoid filler, generic business advice, and unnecessary jargon.
- Avoid unsupported statistics.
- Any estimate must be labeled as directional.
- Do not claim certainty beyond the supplied information.
- The report should be decisive, but remain honest about the limits of self-reported information. Use phrasing such as "The evidence points to...", "Based on the assessment...", "The strongest constraint appears to be...", "This is likely creating...". Avoid weak filler such as "maybe", "it is hard to say", "there could potentially be".
- Return valid JSON only. Do not include markdown outside JSON. Do not wrap the JSON in code fences.

Return exactly this JSON structure and nothing else:
{
  "executive_summary": "3-5 sentences",
  "scorecard": {
    "revenue_engine": { "score": 0, "justification": "1 sentence" },
    "operations": { "score": 0, "justification": "1 sentence" },
    "people_org": { "score": 0, "justification": "1 sentence" },
    "systems_readiness": { "score": 0, "justification": "1 sentence" }
  },
  "primary_root_cause": {
    "headline": "5-8 words",
    "explanation": "2-3 sentences referencing specific answers"
  },
  "secondary_constraints": [
    { "constraint": "string", "why_it_matters": "1 sentence" },
    { "constraint": "string", "why_it_matters": "1 sentence" }
  ],
  "recommendations": {
    "quick_wins": [
      { "action": "string", "expected_impact": "short phrase" },
      { "action": "string", "expected_impact": "short phrase" }
    ],
    "strategic_bets": [
      { "action": "string", "expected_impact": "short phrase" },
      { "action": "string", "expected_impact": "short phrase" }
    ]
  },
  "roadmap_90_day": {
    "days_1_30": ["string", "string"],
    "days_31_60": ["string", "string"],
    "days_61_90": ["string", "string"]
  },
  "ai_automation_fit": ["specific recommendation", "specific recommendation"],
  "closing_note": "1-2 sentences"
}`;

export function buildUserPrompt(
  businessContext: BusinessContext,
  answers: AssessmentAnswers,
  scores: DeterministicScores
): string {
  return `COMPANY CONTEXT
Company: ${businessContext.companyName}
Industry: ${businessContext.industry}
Annual revenue range: ${businessContext.revenueRange}
Team size: ${businessContext.teamSize}

DETERMINISTIC SCORECARD (already calculated — use these exact numbers, do not change them)
Revenue Engine: ${scores.revenue_engine} / 10
Operations: ${scores.operations} / 10
People & Organization: ${scores.people_org} / 10
Systems & Growth Readiness: ${scores.systems_readiness} / 10

REVENUE ENGINE
Q1. Pricing confidence (1-5, 5 = extremely confident): ${answers.pricingConfidence}
Q2. Lead source diversification (1-5, 5 = several reliable sources): ${answers.leadSourceDiversification}
Q3. Where deals most often stall or get lost: "${answers.dealStallReason}"

OPERATIONS & DELIVERY
Q4. Process documentation (1-5, 5 = fully documented): ${answers.processDocumentation}
Q5. Key-person dependency (1-5, 5 = no meaningful impact if unavailable): ${answers.keyPersonDependency}
Q6. Last operational break and its cause: "${answers.lastOperationalBreak}"

PEOPLE & ORGANIZATION
Q7. Role clarity (1-5, 5 = very clear): ${answers.roleClarity}
Q8. Decision independence (1-5, 5 = team handles most decisions independently): ${answers.decisionIndependence}
Q9. Hire or role change that would unlock the most capacity: "${answers.capacityUnlockHire}"

SYSTEMS & GROWTH READINESS
Q10. Systems maturity (1-5, 5 = integrated systems that communicate reliably): ${answers.systemsMaturity}
Q11. Speed of access to accurate revenue/margin data (1-5, 5 = immediate): ${answers.dataAccessSpeed}
Q12. What would break first if revenue doubled in 12 months without adding headcount: "${answers.scaleBreakingPoint}"

Produce the Bottleneck Diagnostic report as specified.`;
}
