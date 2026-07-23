import type { AssessmentAnswers } from "./types";

export type ScaleFieldKey = Extract<
  keyof AssessmentAnswers,
  | "pricingConfidence"
  | "leadSourceDiversification"
  | "processDocumentation"
  | "keyPersonDependency"
  | "roleClarity"
  | "decisionIndependence"
  | "systemsMaturity"
  | "dataAccessSpeed"
>;

export type TextFieldKey = Extract<
  keyof AssessmentAnswers,
  | "dealStallReason"
  | "lastOperationalBreak"
  | "capacityUnlockHire"
  | "scaleBreakingPoint"
>;

export interface ScaleQuestion {
  id: ScaleFieldKey;
  number: number;
  prompt: string;
  lowLabel: string;
  highLabel: string;
}

export interface TextQuestion {
  id: TextFieldKey;
  number: number;
  prompt: string;
  placeholder: string;
}

export interface QuestionCategory {
  id: string;
  title: string;
  scaleQuestions: [ScaleQuestion, ScaleQuestion];
  textQuestion: TextQuestion;
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: "revenue-engine",
    title: "Revenue Engine",
    scaleQuestions: [
      {
        id: "pricingConfidence",
        number: 1,
        prompt:
          "How confident are you that your pricing reflects the actual value you deliver?",
        lowLabel: "Not at all confident",
        highLabel: "Extremely confident",
      },
      {
        id: "leadSourceDiversification",
        number: 2,
        prompt: "How diversified are your sources of new business?",
        lowLabel: "Almost all business comes from one source",
        highLabel: "Business comes from several reliable sources",
      },
    ],
    textQuestion: {
      id: "dealStallReason",
      number: 3,
      prompt: "In your own words, where do deals most often stall or get lost?",
      placeholder: "e.g. Prospects go quiet after receiving the proposal...",
    },
  },
  {
    id: "operations-delivery",
    title: "Operations & Delivery",
    scaleQuestions: [
      {
        id: "processDocumentation",
        number: 4,
        prompt: "How documented are your core operating processes?",
        lowLabel: "Nothing is written down",
        highLabel: "Core processes are fully documented",
      },
      {
        id: "keyPersonDependency",
        number: 5,
        prompt:
          "If your most critical team member were unavailable for two weeks, how much would delivery suffer?",
        lowLabel: "Delivery would largely stall",
        highLabel: "There would be no meaningful impact",
      },
    ],
    textQuestion: {
      id: "lastOperationalBreak",
      number: 6,
      prompt: "Describe the last time something broke operationally. What caused it?",
      placeholder: "e.g. A client deliverable slipped because...",
    },
  },
  {
    id: "people-organization",
    title: "People & Organization",
    scaleQuestions: [
      {
        id: "roleClarity",
        number: 7,
        prompt: "How clearly are roles and responsibilities defined across the team?",
        lowLabel: "Very unclear or overlapping",
        highLabel: "Very clear",
      },
      {
        id: "decisionIndependence",
        number: 8,
        prompt: "How independently can your team make meaningful decisions?",
        lowLabel: "Almost every decision routes through the owner or executive",
        highLabel: "The team handles most decisions independently",
      },
    ],
    textQuestion: {
      id: "capacityUnlockHire",
      number: 9,
      prompt: "What hire or role change would unlock the most capacity right now?",
      placeholder: "e.g. A dedicated operations manager to own...",
    },
  },
  {
    id: "systems-growth-readiness",
    title: "Systems & Growth Readiness",
    scaleQuestions: [
      {
        id: "systemsMaturity",
        number: 10,
        prompt: "How mature is your current technology and systems stack?",
        lowLabel: "Mostly spreadsheets and manual work",
        highLabel: "Integrated systems that communicate reliably",
      },
      {
        id: "dataAccessSpeed",
        number: 11,
        prompt: "How quickly can you access accurate revenue or margin information?",
        lowLabel: "It requires significant digging",
        highLabel: "It is available immediately",
      },
    ],
    textQuestion: {
      id: "scaleBreakingPoint",
      number: 12,
      prompt:
        "If you had to double revenue in 12 months without adding headcount, what would break first?",
      placeholder: "e.g. Customer support response times would...",
    },
  },
];
