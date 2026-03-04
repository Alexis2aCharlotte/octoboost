"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface UpgradeCTAProps {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  variant?: "overlay" | "inline" | "banner";
}

export function UpgradeCTA({
  title = "Upgrade to unlock",
  description = "This feature is available on paid plans.",
  children,
  variant = "overlay",
}: UpgradeCTAProps) {
  if (variant === "banner") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Sparkles className="h-4 w-4 text-accent-light" />
          <div>
            <p className="text-sm font-medium">{title}</p>
            <p className="text-xs text-muted">{description}</p>
          </div>
        </div>
        <Link
          href="/pricing"
          className="btn-glow rounded-lg px-4 py-2 text-xs font-medium"
        >
          Upgrade
        </Link>
      </div>
    );
  }

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
          <Lock className="h-5 w-5 text-accent-light" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
        <Link
          href="/pricing"
          className="btn-glow mt-4 rounded-lg px-6 py-2.5 text-sm font-medium"
        >
          View plans
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="pointer-events-none select-none blur-[6px]">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/10">
            <Lock className="h-4 w-4 text-accent-light" />
          </div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="mt-1 max-w-xs text-xs text-muted">{description}</p>
          <Link
            href="/pricing"
            className="btn-glow mt-3 rounded-lg px-5 py-2 text-xs font-medium"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
