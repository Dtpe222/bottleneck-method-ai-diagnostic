"use client";

import { useId, useState } from "react";
import {
  INDUSTRIES,
  REVENUE_RANGES,
  TEAM_SIZES,
  type Industry,
  type RevenueRange,
  type TeamSize,
  type DiagnosticSubmission,
} from "@/lib/types";
import { QUESTION_CATEGORIES, type ScaleQuestion, type TextQuestion } from "@/lib/questions";
import { diagnosticSubmissionSchema } from "@/lib/schemas";

export interface AssessmentFormState {
  companyName: string;
  industry: Industry | "";
  revenueRange: RevenueRange | "";
  teamSize: TeamSize | "";
  pricingConfidence: number | null;
  leadSourceDiversification: number | null;
  dealStallReason: string;
  processDocumentation: number | null;
  keyPersonDependency: number | null;
  lastOperationalBreak: string;
  roleClarity: number | null;
  decisionIndependence: number | null;
  capacityUnlockHire: string;
  systemsMaturity: number | null;
  dataAccessSpeed: number | null;
  scaleBreakingPoint: string;
}

export const EMPTY_FORM_STATE: AssessmentFormState = {
  companyName: "",
  industry: "",
  revenueRange: "",
  teamSize: "",
  pricingConfidence: null,
  leadSourceDiversification: null,
  dealStallReason: "",
  processDocumentation: null,
  keyPersonDependency: null,
  lastOperationalBreak: "",
  roleClarity: null,
  decisionIndependence: null,
  capacityUnlockHire: "",
  systemsMaturity: null,
  dataAccessSpeed: null,
  scaleBreakingPoint: "",
};

function buildCandidate(state: AssessmentFormState) {
  return {
    businessContext: {
      companyName: state.companyName,
      industry: state.industry === "" ? undefined : state.industry,
      revenueRange: state.revenueRange === "" ? undefined : state.revenueRange,
      teamSize: state.teamSize === "" ? undefined : state.teamSize,
    },
    answers: {
      pricingConfidence: state.pricingConfidence ?? undefined,
      leadSourceDiversification: state.leadSourceDiversification ?? undefined,
      dealStallReason: state.dealStallReason,
      processDocumentation: state.processDocumentation ?? undefined,
      keyPersonDependency: state.keyPersonDependency ?? undefined,
      lastOperationalBreak: state.lastOperationalBreak,
      roleClarity: state.roleClarity ?? undefined,
      decisionIndependence: state.decisionIndependence ?? undefined,
      capacityUnlockHire: state.capacityUnlockHire,
      systemsMaturity: state.systemsMaturity ?? undefined,
      dataAccessSpeed: state.dataAccessSpeed ?? undefined,
      scaleBreakingPoint: state.scaleBreakingPoint,
    },
  };
}

interface AssessmentFormProps {
  value: AssessmentFormState;
  onChange: (next: AssessmentFormState) => void;
  onSubmit: (submission: DiagnosticSubmission) => void;
  isSubmitting: boolean;
  submitError?: string | null;
}

export function AssessmentForm({
  value,
  onChange,
  onSubmit,
  isSubmitting,
  submitError,
}: AssessmentFormProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function setField<K extends keyof AssessmentFormState>(
    key: K,
    fieldValue: AssessmentFormState[K]
  ) {
    onChange({ ...value, [key]: fieldValue });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const candidate = buildCandidate(value);
    const result = diagnosticSubmissionSchema.safeParse(candidate);

    if (!result.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[issue.path.length - 1]);
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setFieldErrors(nextErrors);
      const firstKey = Object.keys(nextErrors)[0];
      if (firstKey) {
        document
          .getElementById(`field-${firstKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setFieldErrors({});
    onSubmit(result.data);
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-12">
      {submitError && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <p className="font-medium">We couldn&apos;t generate your diagnostic.</p>
          <p className="mt-1">{submitError}</p>
          <p className="mt-1">Your answers have been saved — you can retry below.</p>
        </div>
      )}

      <section aria-labelledby="business-context-heading" className="space-y-6">
        <div>
          <h2
            id="business-context-heading"
            className="text-lg font-semibold text-[var(--color-ink)]"
          >
            Business Context
          </h2>
          <div className="mt-1 h-px w-12 bg-[var(--color-accent)]" />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <TextInputField
            id="companyName"
            label="Company or business name"
            value={value.companyName}
            onChange={(v) => setField("companyName", v)}
            error={fieldErrors.companyName}
          />
          <SelectField
            id="industry"
            label="Industry"
            value={value.industry}
            options={INDUSTRIES}
            onChange={(v) => setField("industry", v as Industry)}
            error={fieldErrors.industry}
          />
          <SelectField
            id="revenueRange"
            label="Annual revenue range"
            value={value.revenueRange}
            options={REVENUE_RANGES}
            onChange={(v) => setField("revenueRange", v as RevenueRange)}
            error={fieldErrors.revenueRange}
          />
          <SelectField
            id="teamSize"
            label="Team size"
            value={value.teamSize}
            options={TEAM_SIZES}
            onChange={(v) => setField("teamSize", v as TeamSize)}
            error={fieldErrors.teamSize}
          />
        </div>
      </section>

      {QUESTION_CATEGORIES.map((category) => (
        <section
          key={category.id}
          aria-labelledby={`${category.id}-heading`}
          className="space-y-6"
        >
          <div>
            <h2
              id={`${category.id}-heading`}
              className="text-lg font-semibold text-[var(--color-ink)]"
            >
              {category.title}
            </h2>
            <div className="mt-1 h-px w-12 bg-[var(--color-accent)]" />
          </div>

          <div className="space-y-8">
            {category.scaleQuestions.map((q) => (
              <ScaleField
                key={q.id}
                question={q}
                value={value[q.id]}
                onChange={(v) => setField(q.id, v)}
                error={fieldErrors[q.id]}
              />
            ))}
            <TextAreaField
              question={category.textQuestion}
              value={value[category.textQuestion.id]}
              onChange={(v) => setField(category.textQuestion.id, v)}
              error={fieldErrors[category.textQuestion.id]}
            />
          </div>
        </section>
      ))}

      <div className="flex flex-col items-start gap-3 border-t border-[var(--color-border)] pt-8">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#16304d] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          {isSubmitting ? "Generating..." : "Generate My Diagnostic"}
        </button>
        {Object.keys(fieldErrors).length > 0 && (
          <p role="alert" className="text-sm text-red-700">
            Please resolve the highlighted fields above before continuing.
          </p>
        )}
      </div>
    </form>
  );
}

function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[var(--color-ink)]"
    >
      {children}
    </label>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 text-sm text-red-700">
      {message}
    </p>
  );
}

function TextInputField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div id={`field-${id}`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 block w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5 text-[var(--color-ink)] shadow-sm focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function SelectField<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: T | "";
  options: readonly T[];
  onChange: (v: T | "") => void;
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div id={`field-${id}`}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 block w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5 text-[var(--color-ink)] shadow-sm focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <FieldError id={errorId} message={error} />
    </div>
  );
}

function ScaleField({
  question,
  value,
  onChange,
  error,
}: {
  question: ScaleQuestion;
  value: number | null;
  onChange: (v: number) => void;
  error?: string;
}) {
  const name = useId();
  const errorId = `${question.id}-error`;

  return (
    <fieldset id={`field-${question.id}`}>
      <legend className="text-sm font-medium text-[var(--color-ink)]">
        {question.number}. {question.prompt}
      </legend>

      <div
        className="mt-3 flex items-center gap-2"
        role="radiogroup"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const inputId = `${question.id}-${n}`;
          const checked = value === n;
          return (
            <div key={n}>
              <input
                type="radio"
                id={inputId}
                name={`${question.id}-${name}`}
                value={n}
                checked={checked}
                onChange={() => onChange(n)}
                className="peer sr-only"
              />
              <label
                htmlFor={inputId}
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-md border border-[var(--color-border)] text-sm font-medium text-[var(--color-body)] transition-colors peer-checked:border-[var(--color-accent)] peer-checked:bg-[var(--color-accent)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-accent)] hover:border-[var(--color-accent)]"
              >
                {n}
              </label>
            </div>
          );
        })}
      </div>

      <div className="mt-2 flex justify-between text-xs text-[var(--color-muted)]">
        <span className="max-w-[45%]">{question.lowLabel}</span>
        <span className="max-w-[45%] text-right">{question.highLabel}</span>
      </div>

      <FieldError id={errorId} message={error} />
    </fieldset>
  );
}

function TextAreaField({
  question,
  value,
  onChange,
  error,
}: {
  question: TextQuestion;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const errorId = `${question.id}-error`;
  return (
    <div id={`field-${question.id}`}>
      <label
        htmlFor={question.id}
        className="block text-sm font-medium text-[var(--color-ink)]"
      >
        {question.number}. {question.prompt}
      </label>
      <textarea
        id={question.id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={question.placeholder}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className="mt-1.5 block w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2.5 text-[var(--color-ink)] shadow-sm focus:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      />
      <FieldError id={errorId} message={error} />
    </div>
  );
}
