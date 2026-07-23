interface ScoreBarProps {
  label: string;
  score: number;
  justification: string;
}

function formatScore(score: number): string {
  return Number.isInteger(score) ? `${score}` : score.toFixed(1);
}

export function ScoreBar({ label, score, justification }: ScoreBarProps) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));

  return (
    <div className="print-avoid-break">
      <div className="flex items-baseline justify-between gap-4">
        <h3 className="text-sm font-semibold text-[var(--color-ink)]">
          {label}
        </h3>
        <span className="shrink-0 text-sm font-semibold tabular-nums text-[var(--color-ink)]">
          {formatScore(score)} / 10
        </span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface)]"
        role="img"
        aria-label={`${label} internal diagnostic score: ${formatScore(score)} out of 10`}
      >
        <div
          className="h-full rounded-full bg-[var(--color-accent)]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-body)]">
        {justification}
      </p>
    </div>
  );
}
