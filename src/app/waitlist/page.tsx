"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Check, ArrowRight } from "lucide-react";

function WaitlistForm() {
  const searchParams = useSearchParams();
  const urlSuccess = searchParams.get("success") === "true";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(urlSuccess);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    urlError === "invalid" ? "Invalid email address." :
    urlError === "failed" ? "Something went wrong. Please try again." :
    urlError === "server" ? "Server error. Please try again." : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!res.ok) {
        let errorMsg = "Something went wrong. Please try again.";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {
          // Response wasn't JSON
        }
        setError(errorMsg);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Connection error. Please check your network and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {submitted ? (
        <div className="glow-card mx-auto max-w-sm p-6">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
            <Check className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-base font-semibold">You&apos;re on the list!</p>
          <p className="mt-1 text-sm text-muted">
            We&apos;ll notify you at <span className="font-medium text-foreground">{email}</span> when we launch.
          </p>
          <p className="mt-2 text-xs text-muted/60">
            Don&apos;t see our email? Check your spam folder.
          </p>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} action="/api/waitlist" method="POST" className="mx-auto flex max-w-sm gap-2">
            <input
              name="email"
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
              autoFocus
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-50"
            >
              {loading ? "..." : "Join"}
              {!loading && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </form>
          {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        </>
      )}
    </>
  );
}

export default function WaitlistPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-6 pt-16">
        <div className="grid-bg" />

        <div className="relative z-10 mx-auto w-full max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Coming Soon</h1>
          <p className="mx-auto mt-3 mb-8 max-w-sm text-sm leading-relaxed text-muted">
            OctoBoost is launching soon. Join the waitlist to get early access and be the first to turn your SaaS into a content machine.
          </p>

          <Suspense>
            <WaitlistForm />
          </Suspense>

          <p className="mt-6 text-xs text-muted/40">No spam. Unsubscribe anytime.</p>
        </div>
      </div>
      <Footer />
    </main>
  );
}
