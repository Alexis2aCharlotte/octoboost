"use client";

import { BarChart3, Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { useDemo } from "@/lib/demo/context";

export default function AnalyticsPage() {
  useDemo();
  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-8 py-20 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
          <BarChart3 className="h-8 w-8 text-accent-light" />
        </div>

        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="mt-2 text-base text-muted">Coming soon</p>

        <div className="mt-10 grid w-full max-w-lg grid-cols-4 gap-4">
          {[
            { icon: Eye, label: "Views", color: "text-accent-light" },
            { icon: Heart, label: "Reactions", color: "text-pink-400" },
            { icon: MessageCircle, label: "Comments", color: "text-emerald-400" },
            { icon: TrendingUp, label: "Engagement", color: "text-amber-400" },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card-hover/30 p-4">
              <item.icon className={`h-5 w-5 ${item.color} opacity-40`} />
              <span className="text-xs text-muted/50">{item.label}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-md text-xs text-muted/50">
          Track views, reactions, and engagement across all your publishing platforms. Powered by Dev.to and Hashnode APIs.
        </p>
      </div>
    </div>
  );
}
