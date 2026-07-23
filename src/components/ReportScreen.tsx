"use client";

import { useState } from "react";
import type { DiagnosticResponse } from "@/lib/types";
import { ScoreBar } from "./ScoreBar";
import {
  BRAND_NAME,
  CTA_BUTTON_LABEL,
  CTA_HEADLINE,
  CTA_LINK,
  RESPONSIBLE_USE_NOTE,
  SCORECARD_DISCLOSURE,
} from "@/lib/config";

interface ReportScreenProps {
  response: DiagnosticResponse;
  onRestart: () => void;
}

function SectionHeading({
  number,
  children,
}: {
  number: number;
  children: React.ReactNode;
}) {
  return (
    <h2 className="flex items-baseline gap-3 text-xl font-semibold text-[var(--color-ink)]">
      <span className="text-sm font-normal text-[var(--color-muted)]">
        {String(number).padStart(2, "0")}
      </span>
      {children}
    </h2>
  );
}

export function ReportScreen({ response, onRestart }: ReportScreenProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle"
  );
  const { businessContext, report, generatedAt } = response;

  const reportDate = new Date(generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(report.executive_summary);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    setTimeout(() => setCopyState("idle"), 2500);
  }

  return (
    <main className="flex flex-1 flex-col">
      <div className="no-print border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-6 py-4 sm:px-8">
          <p className="text-sm font-semibold tracking-[0.15em] text-[var(--color-accent)] uppercase">
            {BRAND_NAME}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleCopySummary}
              className="rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              {copyState === "copied"
                ? "Copied"
                : copyState === "error"
                  ? "Copy failed"
                  : "Copy Executive Summary"}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-md border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              Print / Save as PDF
            </button>
            <button
              type="button"
              onClick={onRestart}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#16304d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              Start New Diagnostic
            </button>
          </div>
        </div>
      </div>

      <div className="print-container mx-auto w-full max-w-3xl flex-1 px-6 py-12 sm:px-8">
        <header className="print-section border-b border-[var(--color-border)] pb-8">
          <p className="text-sm font-semibold tracking-[0.15em] text-[var(--color-accent)] uppercase print-only hidden">
            {BRAND_NAME}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-4xl">
            Bottleneck Diagnostic — {businessContext.companyName}
          </h1>
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm text-[var(--color-muted)]">
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--color-body)]">Report date:</dt>
              <dd>{reportDate}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--color-body)]">Industry:</dt>
              <dd>{businessContext.industry}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--color-body)]">Revenue range:</dt>
              <dd>{businessContext.revenueRange}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="font-medium text-[var(--color-body)]">Team size:</dt>
              <dd>{businessContext.teamSize}</dd>
            </div>
          </dl>
        </header>

        <section className="print-section mt-10 space-y-4">
          <SectionHeading number={1}>Executive Summary</SectionHeading>
          <p className="text-base leading-relaxed text-[var(--color-body)]">
            {report.executive_summary}
          </p>
        </section>

        <section className="print-section mt-12 space-y-5">
          <div>
            <SectionHeading number={2}>Bottleneck Scorecard</SectionHeading>
            <p className="mt-1 text-xs font-semibold tracking-wide text-[var(--color-muted)] uppercase">
              Internal Diagnostic Scores
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:grid-cols-2">
            <ScoreBar
              label="Revenue Engine"
              score={report.scorecard.revenue_engine.score}
              justification={report.scorecard.revenue_engine.justification}
            />
            <ScoreBar
              label="Operations"
              score={report.scorecard.operations.score}
              justification={report.scorecard.operations.justification}
            />
            <ScoreBar
              label="People & Organization"
              score={report.scorecard.people_org.score}
              justification={report.scorecard.people_org.justification}
            />
            <ScoreBar
              label="Systems & Growth Readiness"
              score={report.scorecard.systems_readiness.score}
              justification={report.scorecard.systems_readiness.justification}
            />
          </div>

          <p className="text-xs leading-relaxed text-[var(--color-muted)]">
            {SCORECARD_DISCLOSURE}
          </p>
        </section>

        <section className="print-section mt-12 space-y-3">
          <SectionHeading number={3}>Primary Root Cause</SectionHeading>
          <div className="rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-ink)]">
              {report.primary_root_cause.headline}
            </h3>
            <p className="mt-2 text-base leading-relaxed text-[var(--color-body)]">
              {report.primary_root_cause.explanation}
            </p>
          </div>
        </section>

        <section className="print-section mt-12 space-y-4">
          <SectionHeading number={4}>Secondary Constraints</SectionHeading>
          <ul className="space-y-4">
            {report.secondary_constraints.map((item, i) => (
              <li
                key={i}
                className="print-avoid-break border-l-2 border-[var(--color-border)] pl-4"
              >
                <p className="font-medium text-[var(--color-ink)]">
                  {item.constraint}
                </p>
                <p className="mt-1 text-sm text-[var(--color-body)]">
                  {item.why_it_matters}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-section mt-12 space-y-4">
          <SectionHeading number={5}>Quick Wins</SectionHeading>
          <ul className="space-y-3">
            {report.recommendations.quick_wins.map((item, i) => (
              <li
                key={i}
                className="print-avoid-break flex flex-col gap-1 rounded-md border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-[var(--color-body)]">{item.action}</span>
                <span className="shrink-0 text-sm font-medium text-[var(--color-accent)]">
                  {item.expected_impact}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-section mt-12 space-y-4">
          <SectionHeading number={6}>Strategic Bets</SectionHeading>
          <ul className="space-y-3">
            {report.recommendations.strategic_bets.map((item, i) => (
              <li
                key={i}
                className="print-avoid-break flex flex-col gap-1 rounded-md border border-[var(--color-border)] p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <span className="text-[var(--color-body)]">{item.action}</span>
                <span className="shrink-0 text-sm font-medium text-[var(--color-accent)]">
                  {item.expected_impact}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-section mt-12 space-y-6">
          <SectionHeading number={7}>90-Day Roadmap</SectionHeading>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <RoadmapColumn title="Days 1–30" items={report.roadmap_90_day.days_1_30} />
            <RoadmapColumn title="Days 31–60" items={report.roadmap_90_day.days_31_60} />
            <RoadmapColumn title="Days 61–90" items={report.roadmap_90_day.days_61_90} />
          </div>
        </section>

        <section className="print-section mt-12 space-y-4">
          <SectionHeading number={8}>Where AI and Automation Fit</SectionHeading>
          <ul className="space-y-2">
            {report.ai_automation_fit.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 text-[var(--color-body)]"
              >
                <span aria-hidden="true" className="text-[var(--color-accent)]">
                  &rsaquo;
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="print-section mt-12 space-y-3 border-t border-[var(--color-border)] pt-8">
          <SectionHeading number={9}>Closing Note</SectionHeading>
          <p className="text-base leading-relaxed text-[var(--color-body)]">
            {report.closing_note}
          </p>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-[var(--color-muted)]">
          {RESPONSIBLE_USE_NOTE}
        </p>

        <section className="no-print mt-12 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-lg font-medium text-[var(--color-ink)]">
            {CTA_HEADLINE}
          </p>
          <a
            href={CTA_LINK}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-7 py-3 text-base font-medium text-white transition-colors hover:bg-[#16304d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            {CTA_BUTTON_LABEL}
          </a>
        </section>
      </div>
    </main>
  );
}

function RoadmapColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="print-avoid-break">
      <h3 className="text-sm font-semibold text-[var(--color-ink)]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-sm text-[var(--color-body)]">
            <span aria-hidden="true" className="text-[var(--color-muted)]">
              —
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
