// Shared domain types for The Bottleneck Method AI Diagnostic

export const INDUSTRIES = [
  "Professional Services",
  "Agency / Marketing",
  "E-commerce",
  "Healthcare Practice",
  "B2B Software",
  "Consulting",
  "Other",
] as const;
export type Industry = (typeof INDUSTRIES)[number];

export const REVENUE_RANGES = [
  "Under $500K",
  "$500K–$2M",
  "$2M–$5M",
  "$5M–$20M",
  "$20M+",
] as const;
export type RevenueRange = (typeof REVENUE_RANGES)[number];

export const TEAM_SIZES = ["1–5", "6–15", "16–50", "51–150", "150+"] as const;
export type TeamSize = (typeof TEAM_SIZES)[number];

export interface BusinessContext {
  companyName: string;
  industry: Industry;
  revenueRange: RevenueRange;
  teamSize: TeamSize;
}

// The 12 assessment answers. Numeric fields are 1-5 Likert scores;
// text fields are free-form open responses.
export interface AssessmentAnswers {
  pricingConfidence: number; // Q1
  leadSourceDiversification: number; // Q2
  dealStallReason: string; // Q3

  processDocumentation: number; // Q4
  keyPersonDependency: number; // Q5
  lastOperationalBreak: string; // Q6

  roleClarity: number; // Q7
  decisionIndependence: number; // Q8
  capacityUnlockHire: string; // Q9

  systemsMaturity: number; // Q10
  dataAccessSpeed: number; // Q11
  scaleBreakingPoint: string; // Q12
}

export interface DiagnosticSubmission {
  businessContext: BusinessContext;
  answers: AssessmentAnswers;
}

// Output of the deterministic scoring engine only — numeric scores, no AI text.
export interface DeterministicScores {
  revenue_engine: number;
  operations: number;
  people_org: number;
  systems_readiness: number;
}

export interface CategoryScore {
  score: number; // 2-10 scale, deterministic
  justification: string;
}

export interface Scorecard {
  revenue_engine: CategoryScore;
  operations: CategoryScore;
  people_org: CategoryScore;
  systems_readiness: CategoryScore;
}

export interface RecommendationItem {
  action: string;
  expected_impact: string;
}

export interface SecondaryConstraint {
  constraint: string;
  why_it_matters: string;
}

export interface DiagnosticReport {
  executive_summary: string;
  scorecard: Scorecard;
  primary_root_cause: {
    headline: string;
    explanation: string;
  };
  secondary_constraints: SecondaryConstraint[];
  recommendations: {
    quick_wins: RecommendationItem[];
    strategic_bets: RecommendationItem[];
  };
  roadmap_90_day: {
    days_1_30: string[];
    days_31_60: string[];
    days_61_90: string[];
  };
  ai_automation_fit: string[];
  closing_note: string;
}

export interface DiagnosticResponse {
  businessContext: BusinessContext;
  report: DiagnosticReport;
  generatedAt: string;
}
