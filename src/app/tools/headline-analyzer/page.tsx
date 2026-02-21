"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Type, Check, X, Minus } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ToolCta } from "@/components/ToolCta";

const POWER_WORDS = [
  "ultimate", "proven", "essential", "complete", "definitive", "powerful",
  "best", "top", "easy", "fast", "free", "secret", "simple", "quick",
  "amazing", "incredible", "effective", "guaranteed", "exclusive", "master",
  "boost", "hack", "strategy", "guide", "step", "mistake", "avoid",
  "why", "how", "what", "review", "comparison", "alternative", "vs",
];

const EMOTIONAL_WORDS = [
  "never", "always", "worst", "shocking", "surprising", "unbelievable",
  "critical", "urgent", "warning", "danger", "risk", "fear", "love",
  "hate", "brilliant", "genius", "stupid", "crazy", "insane", "epic",
];

interface CheckResult {
  label: string;
  status: "good" | "warn" | "bad";
  detail: string;
}

function analyzeHeadline(title: string): { score: number; checks: CheckResult[] } {
  const words = title.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = title.trim().length;
  const lower = title.toLowerCase();
  const lowerWords = words.map((w) => w.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const checks: CheckResult[] = [];
  let score = 0;

  // Length (characters)
  if (charCount >= 50 && charCount <= 60) {
    checks.push({ label: "Title length", status: "good", detail: `${charCount} chars — perfect for Google (50-60)` });
    score += 20;
  } else if (charCount >= 40 && charCount <= 70) {
    checks.push({ label: "Title length", status: "warn", detail: `${charCount} chars — aim for 50-60 for Google` });
    score += 10;
  } else {
    checks.push({ label: "Title length", status: "bad", detail: `${charCount} chars — ${charCount < 40 ? "too short" : "too long"}, aim for 50-60` });
  }

  // Word count
  if (wordCount >= 6 && wordCount <= 12) {
    checks.push({ label: "Word count", status: "good", detail: `${wordCount} words — ideal range (6-12)` });
    score += 15;
  } else if (wordCount >= 4 && wordCount <= 15) {
    checks.push({ label: "Word count", status: "warn", detail: `${wordCount} words — aim for 6-12` });
    score += 8;
  } else {
    checks.push({ label: "Word count", status: "bad", detail: `${wordCount} words — ${wordCount < 4 ? "too few" : "too many"}, aim for 6-12` });
  }

  // Starts with number
  if (/^\d/.test(title.trim())) {
    checks.push({ label: "Starts with number", status: "good", detail: "Numbers in titles boost CTR by 36%" });
    score += 15;
  } else {
    checks.push({ label: "Starts with number", status: "warn", detail: "Adding a number can boost CTR (e.g. \"7 Ways...\")" });
    score += 5;
  }

  // Contains power word
  const foundPower = lowerWords.filter((w) => POWER_WORDS.includes(w));
  if (foundPower.length > 0) {
    checks.push({ label: "Power words", status: "good", detail: `Found: ${foundPower.slice(0, 3).join(", ")}` });
    score += 15;
  } else {
    checks.push({ label: "Power words", status: "warn", detail: "No power words found — try: best, guide, proven, easy" });
    score += 3;
  }

  // Emotional words
  const foundEmotional = lowerWords.filter((w) => EMOTIONAL_WORDS.includes(w));
  if (foundEmotional.length > 0) {
    checks.push({ label: "Emotional trigger", status: "good", detail: `Found: ${foundEmotional.slice(0, 3).join(", ")}` });
    score += 10;
  } else {
    checks.push({ label: "Emotional trigger", status: "warn", detail: "No emotional words — can increase engagement" });
    score += 3;
  }

  // Question format
  if (/^(how|what|why|when|where|which|who|can|is|does|do|will|should)\b/i.test(title.trim())) {
    checks.push({ label: "Question format", status: "good", detail: "Questions rank well for featured snippets" });
    score += 10;
  } else {
    checks.push({ label: "Question format", status: "warn", detail: "Not a question — questions get more clicks from search" });
    score += 3;
  }

  // Contains brackets/parentheses
  if (/[\[\(]/.test(title)) {
    checks.push({ label: "Brackets/parentheses", status: "good", detail: "Brackets boost CTR by 38% (e.g. [2026 Guide])" });
    score += 10;
  } else {
    checks.push({ label: "Brackets/parentheses", status: "warn", detail: "Try adding [Guide], [2026], (Free) for more clicks" });
    score += 2;
  }

  // No all caps
  const allCapsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
  if (allCapsWords.length === 0) {
    checks.push({ label: "No ALL CAPS", status: "good", detail: "Clean formatting — no shouting" });
    score += 5;
  } else {
    checks.push({ label: "No ALL CAPS", status: "bad", detail: `Avoid ALL CAPS: ${allCapsWords.join(", ")}` });
  }

  // Contains year
  if (/20\d{2}/.test(title)) {
    checks.push({ label: "Contains year", status: "good", detail: "Year in title signals freshness to Google" });
    score += 5;
  } else if (lower.includes("new") || lower.includes("latest") || lower.includes("updated")) {
    checks.push({ label: "Freshness signal", status: "good", detail: "Freshness keyword detected" });
    score += 3;
  }

  return { score: Math.min(score, 100), checks };
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-400";
  if (score >= 40) return "text-amber-400";
  return "text-red-400";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Average";
  return "Needs work";
}

const StatusIcon = ({ status }: { status: "good" | "warn" | "bad" }) => {
  if (status === "good") return <Check className="h-3.5 w-3.5 text-green-400" />;
  if (status === "warn") return <Minus className="h-3.5 w-3.5 text-amber-400" />;
  return <X className="h-3.5 w-3.5 text-red-400" />;
};

export default function HeadlineAnalyzerPage() {
  const [title, setTitle] = useState("");
  const result = title.trim().length > 0 ? analyzeHeadline(title) : null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>

        <div className="mb-1 flex items-center gap-2">
          <Type className="h-5 w-5 text-accent-light" />
          <h1 className="text-2xl font-bold">Headline Analyzer</h1>
        </div>
        <p className="mb-8 text-sm text-muted">
          Score your article title for SEO impact, readability, and click-through potential. 100% free.
        </p>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Type your headline here..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-card px-5 py-4 text-lg text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
            autoFocus
          />
        </div>

        {result && (
          <div className="space-y-6">
            {/* Score */}
            <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${getScoreColor(result.score)}`}>{result.score}</p>
                <p className="mt-0.5 text-xs text-muted">/100</p>
              </div>
              <div>
                <p className={`text-lg font-semibold ${getScoreColor(result.score)}`}>{getScoreLabel(result.score)}</p>
                <p className="text-sm text-muted">
                  {result.score >= 70
                    ? "This headline is optimized for search and clicks."
                    : result.score >= 40
                      ? "Decent, but a few tweaks could boost performance."
                      : "This headline needs improvement for better SEO results."}
                </p>
              </div>
            </div>

            {/* Checks */}
            <div className="space-y-2">
              {result.checks.map((check) => (
                <div key={check.label} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3">
                  <StatusIcon status={check.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{check.label}</p>
                    <p className="text-xs text-muted">{check.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!result && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
            Start typing a headline to see your SEO score
          </div>
        )}

        {result && <ToolCta currentTool="/tools/headline-analyzer" />}
      </div>
    </main>
  );
}
