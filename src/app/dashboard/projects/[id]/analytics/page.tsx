"use client";

import { useParams } from "next/navigation";
import { BarChart3 } from "lucide-react";

export default function ProjectAnalyticsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="mt-1 text-sm text-muted">
          Track performance for this project.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
          <BarChart3 className="h-7 w-7 text-accent-light" />
        </div>
        <h3 className="mb-1 text-lg font-semibold text-foreground">
          No data yet
        </h3>
        <p className="max-w-sm text-center text-sm text-muted">
          Publish articles to start tracking performance.
        </p>
      </div>
    </div>
  );
}
