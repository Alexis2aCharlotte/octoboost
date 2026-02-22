"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
      } else {
        setSubmitted(true);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-sm items-center gap-2 text-sm text-green-400">
        <Check className="h-4 w-4 shrink-0" />
        <span>You&apos;re on the list! We&apos;ll notify you at launch.</span>
      </div>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-2">
        <input
          type="email"
          required
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-50"
        >
          {loading ? "..." : "Join the waitlist"}
          {!loading && <ArrowRight className="h-3.5 w-3.5" />}
        </button>
      </form>
      {error && <p className="mt-3 text-center text-xs text-red-400">{error}</p>}
    </div>
  );
}
