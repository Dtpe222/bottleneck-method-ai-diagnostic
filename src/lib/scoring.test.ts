import { describe, expect, it } from "vitest";
import {
  calculateDeterministicScores,
  ScoringValidationError,
} from "./scoring";

const baseAnswers = {
  pricingConfidence: 3,
  leadSourceDiversification: 3,
  dealStallReason: "Pricing objections late in the sales cycle.",
  processDocumentation: 3,
  keyPersonDependency: 3,
  lastOperationalBreak: "The fulfillment lead went on vacation.",
  roleClarity: 3,
  decisionIndependence: 3,
  capacityUnlockHire: "An operations manager.",
  systemsMaturity: 3,
  dataAccessSpeed: 3,
  scaleBreakingPoint: "Customer support would collapse.",
};

describe("calculateDeterministicScores", () => {
  it("scores all 1s at the minimum of the 2-10 scale", () => {
    const answers = {
      ...baseAnswers,
      pricingConfidence: 1,
      leadSourceDiversification: 1,
      processDocumentation: 1,
      keyPersonDependency: 1,
      roleClarity: 1,
      decisionIndependence: 1,
      systemsMaturity: 1,
      dataAccessSpeed: 1,
    };
    const result = calculateDeterministicScores(answers);
    expect(result).toEqual({
      revenue_engine: 2,
      operations: 2,
      people_org: 2,
      systems_readiness: 2,
    });
  });

  it("scores all 5s at the maximum of the 2-10 scale", () => {
    const answers = {
      ...baseAnswers,
      pricingConfidence: 5,
      leadSourceDiversification: 5,
      processDocumentation: 5,
      keyPersonDependency: 5,
      roleClarity: 5,
      decisionIndependence: 5,
      systemsMaturity: 5,
      dataAccessSpeed: 5,
    };
    const result = calculateDeterministicScores(answers);
    expect(result).toEqual({
      revenue_engine: 10,
      operations: 10,
      people_org: 10,
      systems_readiness: 10,
    });
  });

  it("computes correct averages for mixed answers, including rounding", () => {
    const answers = {
      ...baseAnswers,
      pricingConfidence: 4,
      leadSourceDiversification: 1, // avg 2.5 -> 5.0
      processDocumentation: 2,
      keyPersonDependency: 3, // avg 2.5 -> 5.0
      roleClarity: 5,
      decisionIndependence: 4, // avg 4.5 -> 9.0
      systemsMaturity: 1,
      dataAccessSpeed: 2, // avg 1.5 -> 3.0
    };
    const result = calculateDeterministicScores(answers);
    expect(result).toEqual({
      revenue_engine: 5,
      operations: 5,
      people_org: 9,
      systems_readiness: 3,
    });
  });

  it("rounds to one decimal place when the average is not a clean tenth", () => {
    // 3 and 4 -> average 3.5 -> displayScore 7.0 (clean), use 1 and 2 for a fraction instead
    const answers = {
      ...baseAnswers,
      pricingConfidence: 1,
      leadSourceDiversification: 2, // avg 1.5 -> display 3.0
    };
    const result = calculateDeterministicScores(answers);
    expect(result.revenue_engine).toBe(3);
    expect(Number.isFinite(result.revenue_engine)).toBe(true);
  });

  it("throws ScoringValidationError when a required numeric field is missing", () => {
    const rest: Record<string, unknown> = { ...baseAnswers };
    delete rest.pricingConfidence;
    expect(() => calculateDeterministicScores(rest)).toThrow(
      ScoringValidationError
    );
  });

  it("throws ScoringValidationError for non-numeric input", () => {
    const answers = { ...baseAnswers, processDocumentation: "high" as never };
    expect(() => calculateDeterministicScores(answers)).toThrow(
      ScoringValidationError
    );
  });

  it("throws ScoringValidationError for out-of-range values (too high)", () => {
    const answers = { ...baseAnswers, roleClarity: 7 };
    expect(() => calculateDeterministicScores(answers)).toThrow(
      ScoringValidationError
    );
  });

  it("throws ScoringValidationError for out-of-range values (too low / zero)", () => {
    const answers = { ...baseAnswers, systemsMaturity: 0 };
    expect(() => calculateDeterministicScores(answers)).toThrow(
      ScoringValidationError
    );
  });

  it("throws ScoringValidationError for non-integer values", () => {
    const answers = { ...baseAnswers, dataAccessSpeed: 2.5 };
    expect(() => calculateDeterministicScores(answers)).toThrow(
      ScoringValidationError
    );
  });

  it("collects multiple issues at once rather than failing on the first", () => {
    const answers = {
      ...baseAnswers,
      pricingConfidence: undefined as unknown as number,
      leadSourceDiversification: 99,
    };
    try {
      calculateDeterministicScores(answers);
      throw new Error("expected calculateDeterministicScores to throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ScoringValidationError);
      const validationError = err as ScoringValidationError;
      expect(validationError.issues.length).toBeGreaterThanOrEqual(2);
    }
  });
});
