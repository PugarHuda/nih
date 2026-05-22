"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <main className="container mx-auto px-6 py-24 max-w-lg">
      <div className="comic-card">
        <span className="kicker">oof</span>
        <h2 className="h2 mt-2 mb-4">Dashboard hiccuped.</h2>
        <p style={{ color: "var(--ink-3)" }} className="mb-4 text-sm">
          {error.message || "Unknown client error."}
          {error.digest && <span className="mono text-xs block mt-2">digest: {error.digest}</span>}
        </p>
        <button onClick={reset} className="comic-btn primary">
          Try again
        </button>
      </div>
    </main>
  );
}
