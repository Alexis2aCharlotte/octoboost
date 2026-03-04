"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { ArrowRight, Globe, Mail, Loader2, CheckCircle2, Search, FileText, BarChart3, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Step = "crawl" | "email" | "generating" | "done";

interface CrawlResult {
  url: string;
  title: string;
  description: string;
  ogImage: string | null;
}

interface GenerateResult {
  projectSlug: string;
  redirectUrl: string;
  article: { id: string; title: string; wordCount: number } | null;
  stats: { keywords: number; clusters: number; competitors: number };
}

const PROGRESS_STEPS = [
  { label: "Crawling your site", icon: Globe, duration: 8000 },
  { label: "Analyzing keywords", icon: Search, duration: 25000 },
  { label: "Spying on competitors", icon: BarChart3, duration: 20000 },
  { label: "Clustering topics", icon: Sparkles, duration: 15000 },
  { label: "Writing your article", icon: FileText, duration: 30000 },
];

function GenerateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlParam = searchParams.get("url") ?? "";

  const [step, setStep] = useState<Step>("crawl");
  const [crawlData, setCrawlData] = useState<CrawlResult | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [progressIndex, setProgressIndex] = useState(0);
  const [result, setResult] = useState<GenerateResult | null>(null);

  useEffect(() => {
    if (!urlParam) return;

    const doCrawl = async () => {
      try {
        const res = await fetch("/api/free-generate/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlParam }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Could not reach this website.");
          return;
        }

        const data = await res.json();
        setCrawlData(data);
        setStep("email");
      } catch {
        setError("Could not reach this website. Please check the URL.");
      }
    };

    doCrawl();
  }, [urlParam]);

  useEffect(() => {
    if (step !== "generating") return;
    const interval = setInterval(() => {
      setProgressIndex((prev) =>
        prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 20000);
    return () => clearInterval(interval);
  }, [step]);

  const handleGenerate = async () => {
    if (!email.trim()) return;
    setError("");
    setStep("generating");
    setProgressIndex(0);

    try {
      const res = await fetch("/api/free-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlParam, email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "ACCOUNT_EXISTS") {
          setError("An account with this email already exists. Please log in.");
          setStep("email");
          return;
        }
        setError(data.error || "Something went wrong.");
        setStep("email");
        return;
      }

      setResult(data);
      setStep("done");

      if (data.otp) {
        const supabase = createClient();
        await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: data.otp,
          type: "magiclink",
        });
      }

      setTimeout(() => {
        router.push(data.redirectUrl);
      }, 3000);
    } catch {
      setError("Connection error. Please try again.");
      setStep("email");
    }
  };

  if (!urlParam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">No URL provided</h1>
          <p className="mt-2 text-muted">
            Go back to the homepage and paste your site URL.
          </p>
          <button
            onClick={() => router.push("/")}
            className="btn-glow mt-6 rounded-lg px-6 py-3 text-sm"
          >
            Go to homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 pt-24 pb-16">
      <div className="w-full max-w-lg">
        {/* Step: Crawling */}
        {step === "crawl" && !error && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
              <Globe className="h-8 w-8 text-accent-light animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Analyzing your site
            </h1>
            <p className="mt-2 text-muted">{urlParam}</p>
            <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-accent" />
          </div>
        )}

        {/* Step: Email gate */}
        {step === "email" && crawlData && (
          <div>
            <div className="mb-8 rounded-xl border border-border bg-card p-6">
              <div className="flex items-start gap-4">
                {crawlData.ogImage && (
                  <img
                    src={crawlData.ogImage}
                    alt=""
                    className="h-12 w-12 rounded-lg object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-lg font-semibold">
                    {crawlData.title || crawlData.url}
                  </h2>
                  {crawlData.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-muted">
                      {crawlData.description}
                    </p>
                  )}
                  <p className="mt-1 truncate text-xs text-muted/60">
                    {crawlData.url}
                  </p>
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-bold tracking-tight">
              Generate your free SEO article
            </h1>
            <p className="mt-2 text-sm text-muted">
              We&apos;ll create your account, run a full keyword research, and
              generate your first article. Takes about 2 minutes.
            </p>

            <div className="mt-6 space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/40" />
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                  className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
                />
              </div>
              <button
                onClick={handleGenerate}
                disabled={!email.trim()}
                className="btn-glow flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm disabled:opacity-50"
              >
                Generate my free article
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-muted/50">
              No credit card required. One free article per account.
            </p>
          </div>
        )}

        {/* Step: Generating */}
        {step === "generating" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
              <Sparkles className="h-8 w-8 text-accent-light animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Building your SEO engine
            </h1>
            <p className="mt-2 text-sm text-muted">
              This takes about 2 minutes. We&apos;re running the same pipeline
              as our paid users.
            </p>

            <div className="mt-8 space-y-3">
              {PROGRESS_STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === progressIndex;
                const isDone = i < progressIndex;

                return (
                  <div
                    key={s.label}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-all ${
                      isDone
                        ? "border-success/30 bg-success/5 text-success"
                        : isActive
                          ? "border-accent/30 bg-accent/5 text-accent-light"
                          : "border-border bg-card text-muted/40"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Icon className="h-4 w-4 shrink-0" />
                    )}
                    <span>{s.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step: Done */}
        {step === "done" && result && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-success/30 bg-success/10">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Your article is ready!
            </h1>
            {result.article && (
              <p className="mt-2 text-sm text-muted">
                &ldquo;{result.article.title}&rdquo; ({result.article.wordCount}{" "}
                words)
              </p>
            )}
            <p className="mt-1 text-xs text-muted/50">
              {result.stats.keywords} keywords analyzed,{" "}
              {result.stats.clusters} article ideas found,{" "}
              {result.stats.competitors} competitors identified
            </p>

            <div className="mt-4 text-sm text-muted">
              <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
              Check your email for the login link, then we&apos;ll redirect you
              to your dashboard...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-6 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm text-danger">
            {error}
            {error.includes("log in") && (
              <button
                onClick={() => router.push("/login")}
                className="mt-2 block w-full text-center text-xs font-medium underline"
              >
                Go to login page
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      }
    >
      <GenerateContent />
    </Suspense>
  );
}
