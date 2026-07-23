import { BRAND_NAME, ESTIMATED_COMPLETION_MINUTES } from "@/lib/config";

interface LandingScreenProps {
  onStart: () => void;
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <main className="flex flex-1 flex-col">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-24 sm:px-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-[var(--color-accent)] uppercase">
          {BRAND_NAME}
        </p>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-[var(--color-ink)] sm:text-5xl">
          Identify the Bottleneck Holding Your Business Back
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-[var(--color-body)]">
          Most businesses do not have a growth problem. They have a
          bottleneck problem — and most cannot clearly identify their own.
        </p>

        <p className="mt-4 text-base leading-relaxed text-[var(--color-muted)]">
          Complete a structured business assessment and receive an
          AI-powered executive diagnostic identifying growth constraints,
          operational friction, and AI opportunities.
        </p>

        <div className="mt-10 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onStart}
            className="inline-flex items-center justify-center rounded-md bg-[var(--color-accent)] px-7 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#16304d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Start My Diagnostic
          </button>

          <p className="text-sm text-[var(--color-muted)]">
            Approximate completion time: {ESTIMATED_COMPLETION_MINUTES} minutes
          </p>
        </div>
      </div>
    </main>
  );
}
