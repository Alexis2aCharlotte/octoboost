"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Rocket, Check, ArrowRight } from "lucide-react";

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const existing = JSON.parse(localStorage.getItem("octoboost_waitlist") || "[]");
    if (!existing.includes(email.trim())) {
      existing.push(email.trim());
      localStorage.setItem("octoboost_waitlist", JSON.stringify(existing));
    }
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pt-16">
        <div className="grid-bg" />

        <div className="relative z-10 mx-auto w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
            <Rocket className="h-8 w-8 text-accent-light" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Coming Soon</h1>
          <p className="mx-auto mt-3 mb-8 max-w-sm text-sm leading-relaxed text-muted">
            OctoBoost is launching soon. Join the waitlist to get early access and be the first to turn your SaaS into a content machine.
          </p>

          {submitted ? (
            <div className="glow-card mx-auto max-w-sm p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <p className="text-base font-semibold">You&apos;re on the list!</p>
              <p className="mt-1 text-sm text-muted">
                We&apos;ll notify you at <span className="font-medium text-foreground">{email}</span> when we launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mx-auto flex max-w-sm gap-2">
              <input
                type="email"
                required
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
                autoFocus
              />
              <button
                type="submit"
                className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light"
              >
                Join
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </form>
          )}

          <p className="mt-6 text-xs text-muted/40">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
    </main>
  );
}
