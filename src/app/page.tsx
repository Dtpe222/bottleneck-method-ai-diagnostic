"use client";

import { useState } from "react";
import { LandingScreen } from "@/components/LandingScreen";
import {
  AssessmentForm,
  EMPTY_FORM_STATE,
  type AssessmentFormState,
} from "@/components/AssessmentForm";
import { ProcessingScreen } from "@/components/ProcessingScreen";
import { ReportScreen } from "@/components/ReportScreen";
import { BRAND_NAME } from "@/lib/config";
import type { DiagnosticResponse, DiagnosticSubmission } from "@/lib/types";

type Screen = "landing" | "assessment" | "processing" | "report";

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [formState, setFormState] =
    useState<AssessmentFormState>(EMPTY_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [report, setReport] = useState<DiagnosticResponse | null>(null);

  async function handleSubmit(submission: DiagnosticSubmission) {
    setSubmitError(null);
    setIsSubmitting(true);
    setScreen("processing");

    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        setSubmitError(
          (data && typeof data.error === "string" && data.error) ||
            "Something went wrong while generating your diagnostic. Please try again."
        );
        setScreen("assessment");
        return;
      }

      setReport(data as DiagnosticResponse);
      setScreen("report");
    } catch {
      setSubmitError(
        "We couldn't reach the diagnostic service. Check your connection and try again."
      );
      setScreen("assessment");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleRestart() {
    setFormState(EMPTY_FORM_STATE);
    setSubmitError(null);
    setReport(null);
    setScreen("landing");
  }

  if (screen === "landing") {
    return <LandingScreen onStart={() => setScreen("assessment")} />;
  }

  if (screen === "processing") {
    return <ProcessingScreen />;
  }

  if (screen === "report" && report) {
    return <ReportScreen response={report} onRestart={handleRestart} />;
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="border-b border-[var(--color-border)]">
        <div className="mx-auto w-full max-w-3xl px-6 py-6 sm:px-8">
          <p className="text-sm font-semibold tracking-[0.15em] text-[var(--color-accent)] uppercase">
            {BRAND_NAME}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-ink)]">
            Business Context &amp; Assessment
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            All fields are required. This takes about 5 minutes.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-8">
        <AssessmentForm
          value={formState}
          onChange={setFormState}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </div>
    </main>
  );
}
