"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#030712] px-6 text-white">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
        <span className="text-2xl">⚠</span>
      </div>
      <h2 className="mt-6 text-xl font-bold">Something went wrong</h2>
      <p className="mt-2 max-w-sm text-center text-sm text-gray-400">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-[#0077FF] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#33AAFF]"
      >
        Try again
      </button>
    </div>
  );
}
