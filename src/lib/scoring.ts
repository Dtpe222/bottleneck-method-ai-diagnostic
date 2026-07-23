import type { AssessmentAnswers, DeterministicScores } from "./types";

// Pure, deterministic scoring engine. The AI model never calculates or
// alters these values — it only receives them and writes justification text.

const MIN_SCALE = 1;
const MAX_SCALE = 5;

const SCALE_FIELDS = [
  "pricingConfidence",
  "leadSourceDiversification",
  "processDocumentation",
  "keyPersonDependency",
  "roleClarity",
  "decisionIndependence",
  "systemsMaturity",
  "dataAccessSpeed",
] as const;

export type ScaleField = (typeof SCALE_FIELDS)[number];

export class ScoringValidationError extends Error {
  issues: string[];

  constructor(issues: string[]) {
    super(`Invalid assessment answers: ${issues.join("; ")}`);
    this.name = "ScoringValidationError";
    this.issues = issues;
  }
}

function validateScaleValue(
  value: unknown,
  fieldName: string,
  issues: string[]
): number {
  if (value === undefined || value === null || value === "") {
    issues.push(`${fieldName} is required.`);
    return NaN;
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    issues.push(`${fieldName} must be a number.`);
    return NaN;
  }
  if (!Number.isInteger(value)) {
    issues.push(`${fieldName} must be a whole number.`);
    return NaN;
  }
  if (value < MIN_SCALE || value > MAX_SCALE) {
    issues.push(
      `${fieldName} must be between ${MIN_SCALE} and ${MAX_SCALE}.`
    );
    return NaN;
  }
  return value;
}

function categoryScore(a: number, b: number): number {
  const average = (a + b) / 2;
  const displayScore = average * 2;
  return Math.round(displayScore * 10) / 10;
}

/**
 * Validates the eight numeric (1-5) assessment answers and computes the
 * four category scores on a deterministic 2-10 scale.
 *
 * Throws ScoringValidationError if any required numeric field is missing,
 * non-numeric, non-integer, or out of the 1-5 range.
 */
export function calculateDeterministicScores(
  answers: Record<string, unknown>
): DeterministicScores {
  const issues: string[] = [];
  const values: Partial<Record<ScaleField, number>> = {};

  for (const field of SCALE_FIELDS) {
    values[field] = validateScaleValue(answers?.[field], field, issues);
  }

  if (issues.length > 0) {
    throw new ScoringValidationError(issues);
  }

  return {
    revenue_engine: categoryScore(
      values.pricingConfidence as number,
      values.leadSourceDiversification as number
    ),
    operations: categoryScore(
      values.processDocumentation as number,
      values.keyPersonDependency as number
    ),
    people_org: categoryScore(
      values.roleClarity as number,
      values.decisionIndependence as number
    ),
    systems_readiness: categoryScore(
      values.systemsMaturity as number,
      values.dataAccessSpeed as number
    ),
  };
}

export function isCompleteAssessmentAnswers(
  value: unknown
): value is AssessmentAnswers {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return SCALE_FIELDS.every(
    (field) => typeof v[field] === "number" && !Number.isNaN(v[field])
  );
}
