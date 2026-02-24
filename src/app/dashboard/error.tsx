"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <span className="text-2xl">⚠</span>
      </div>
      <h2 className="mt-6 text-xl font-bold text-foreground">
        Something went wrong
      </h2>
      <p className="mt-2 max-w-sm text-center text-sm text-muted">
        An error occurred while loading this page.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
        >
          Try again
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
