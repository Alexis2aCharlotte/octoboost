"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, ArrowRight, Search } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const router = useRouter();

  function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const encoded = encodeURIComponent(url.trim());
    router.push(`/dashboard/analyze?url=${encoded}`);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 text-foreground">
      <nav className="fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-end border-b border-border/50 bg-background/80 px-6 backdrop-blur-sm">
        <Link
          href="/login"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
        >
          Login
        </Link>
      </nav>

      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-pulse-glow absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/15 blur-[140px]" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-2xl text-center">
          <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
            <Send className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">OctoBoost</span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Grow your organic traffic
          <br />
          <span className="gradient-text">on autopilot</span>
        </h1>

        <p className="mx-auto mb-10 max-w-lg text-muted md:text-lg">
          Enter your website URL. We analyze your site, find competitors, and
          discover the keywords that will drive traffic.
        </p>

        <form onSubmit={handleAnalyze} className="mx-auto w-full max-w-xl">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2 transition-colors focus-within:border-accent/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted">
              <Search className="h-5 w-5" />
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://yoursite.com"
              required
              className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted/50"
            />
            <button
              type="submit"
              className="group flex shrink-0 items-center gap-2 rounded-xl bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
            >
              Analyze
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </button>
          </div>
        </form>

        <p className="mt-6 text-sm text-muted/60">
          Free analysis · No credit card required
        </p>
        </div>
      </div>
    </main>
  );
}
