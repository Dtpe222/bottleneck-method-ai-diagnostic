"use client";

import { useEffect, useState } from "react";
import { PROCESSING_MESSAGES } from "@/lib/config";

export function ProcessingScreen() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROCESSING_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main
      className="flex flex-1 flex-col items-center justify-center px-6 py-24"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center text-center">
        <span
          aria-hidden="true"
          className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]"
        />
        <h1 className="mt-8 text-xl font-semibold text-[var(--color-ink)]">
          Building Your Diagnostic
        </h1>
        <p className="mt-3 min-h-6 text-base text-[var(--color-muted)]">
          {PROCESSING_MESSAGES[messageIndex]}
        </p>
        <p className="mt-8 max-w-sm text-sm text-[var(--color-muted)]">
          This usually takes under a minute.
        </p>
      </div>
    </main>
  );
}
