import Link from "next/link";
import { ArrowRight, Zap } from "lucide-react";

const otherTools = [
  { label: "AI Content Scorer", href: "/tools/ai-content-scorer", description: "Get your GEO score" },
  { label: "Headline Analyzer", href: "/tools/headline-analyzer", description: "Score your titles for SEO" },
  { label: "Keyword Density", href: "/tools/keyword-density", description: "Spot over-optimization" },
  { label: "SERP Preview", href: "/tools/serp-preview", description: "Preview your Google result" },
  { label: "Readability Checker", href: "/tools/readability-checker", description: "Check Flesch score & reading time" },
];

export function ToolCta({ currentTool }: { currentTool: string }) {
  const suggestions = otherTools.filter((t) => t.href !== currentTool);

  return (
    <div className="mt-10 space-y-5">
      {/* Other tools */}
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-3 text-sm font-semibold">Try our other free tools</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {suggestions.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex items-center justify-between rounded-lg border border-border px-4 py-3 transition hover:border-accent/30"
            >
              <div>
                <p className="text-sm font-medium">{tool.label}</p>
                <p className="text-xs text-muted">{tool.description}</p>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted transition group-hover:text-accent-light" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main CTA */}
      <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/5 to-transparent p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
          <Zap className="h-5 w-5 text-accent-light" />
        </div>
        <h3 className="mb-1.5 text-lg font-semibold">Go further with OctoBoost</h3>
        <p className="mx-auto mb-4 max-w-sm text-sm text-muted">
          Analyze your site, generate SEO-optimized articles, and publish them across 11+ platforms — automatically.
        </p>
        <Link
          href="/waitlist"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light"
        >
          Get Started Free
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <p className="mt-2 text-xs text-muted">No credit card required</p>
      </div>
    </div>
  );
}
