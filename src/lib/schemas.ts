import { z } from "zod";
import { INDUSTRIES, REVENUE_RANGES, TEAM_SIZES } from "./types";

const scaleSchema = z
  .number({ error: "This field must be a number." })
  .int({ error: "This field must be a whole number." })
  .min(1, { error: "This field must be between 1 and 5." })
  .max(5, { error: "This field must be between 1 and 5." });

const openTextSchema = z
  .string({ error: "This field is required." })
  .trim()
  .min(3, { error: "Please provide a bit more detail (at least 3 characters)." })
  .max(2000, { error: "Please keep responses under 2000 characters." });

export const businessContextSchema = z.object({
  companyName: z
    .string({ error: "Company name is required." })
    .trim()
    .min(1, { error: "Company name is required." })
    .max(200, { error: "Company name is too long." }),
  industry: z.enum(INDUSTRIES, { error: "Please select an industry." }),
  revenueRange: z.enum(REVENUE_RANGES, {
    error: "Please select a revenue range.",
  }),
  teamSize: z.enum(TEAM_SIZES, { error: "Please select a team size." }),
});

export const assessmentAnswersSchema = z.object({
  pricingConfidence: scaleSchema,
  leadSourceDiversification: scaleSchema,
  dealStallReason: openTextSchema,

  processDocumentation: scaleSchema,
  keyPersonDependency: scaleSchema,
  lastOperationalBreak: openTextSchema,

  roleClarity: scaleSchema,
  decisionIndependence: scaleSchema,
  capacityUnlockHire: openTextSchema,

  systemsMaturity: scaleSchema,
  dataAccessSpeed: scaleSchema,
  scaleBreakingPoint: openTextSchema,
});

export const diagnosticSubmissionSchema = z.object({
  businessContext: businessContextSchema,
  answers: assessmentAnswersSchema,
});

// --- AI response schema -----------------------------------------------

const scorecardCategorySchema = z.object({
  score: z.number(),
  justification: z.string().trim().min(1).max(400),
});

const recommendationItemSchema = z.object({
  action: z.string().trim().min(1).max(400),
  expected_impact: z.string().trim().min(1).max(200),
});

const secondaryConstraintSchema = z.object({
  constraint: z.string().trim().min(1).max(300),
  why_it_matters: z.string().trim().min(1).max(400),
});

export const diagnosticReportSchema = z.object({
  executive_summary: z.string().trim().min(1).max(2000),
  scorecard: z.object({
    revenue_engine: scorecardCategorySchema,
    operations: scorecardCategorySchema,
    people_org: scorecardCategorySchema,
    systems_readiness: scorecardCategorySchema,
  }),
  primary_root_cause: z.object({
    headline: z.string().trim().min(1).max(200),
    explanation: z.string().trim().min(1).max(1500),
  }),
  secondary_constraints: z.array(secondaryConstraintSchema).min(1).max(6),
  recommendations: z.object({
    quick_wins: z.array(recommendationItemSchema).min(1).max(6),
    strategic_bets: z.array(recommendationItemSchema).min(1).max(6),
  }),
  roadmap_90_day: z.object({
    days_1_30: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    days_31_60: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
    days_61_90: z.array(z.string().trim().min(1).max(300)).min(1).max(8),
  }),
  ai_automation_fit: z.array(z.string().trim().min(1).max(400)).min(1).max(8),
  closing_note: z.string().trim().min(1).max(1000),
});

export type DiagnosticReportShape = z.infer<typeof diagnosticReportSchema>;
