"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface SessionData {
  email: string | null;
  customerId: string | null;
  subscriptionId: string | null;
  plan: string;
  interval: string;
  amount: string | null;
}

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }
    fetch(`/api/stripe/session?session_id=${sessionId}`)
      .then((res) => res.json())
      .then((data) => {
        setSessionData(data);
        if (data.email) setEmail(data.email);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sessionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFormLoading(true);

    try {
      const res = await fetch("/api/auth/create-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          sessionId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setFormLoading(false);
        return;
      }

      if (data.accessToken && data.refreshToken) {
        const supabase = createClient();
        await supabase.auth.setSession({
          access_token: data.accessToken,
          refresh_token: data.refreshToken,
        });
      }

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch {
      setError("Something went wrong. Please try again.");
      setFormLoading(false);
    }
  };

  const planLabel = sessionData?.plan
    ? sessionData.plan.charAt(0).toUpperCase() + sessionData.plan.slice(1)
    : "Pro";

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <Check className="h-10 w-10 text-accent-light" />
          </div>
          <h1 className="mb-4 text-3xl font-bold">Account Created!</h1>
          <p className="mb-6 text-muted">
            Redirecting you to your dashboard...
          </p>
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent-light" />
        </div>
      </div>
    );
  }

  if (!sessionId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold">No session found</h1>
          <p className="mb-6 text-muted">
            This page should be accessed after a successful payment.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            View plans <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex justify-center">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/Logo Octoboost.png"
              alt="OctoBoost"
              width={120}
              height={120}
              className="h-9 w-9 object-contain"
              priority
            />
            <span className="text-lg font-bold tracking-tight">OctoBoost</span>
          </Link>
        </div>

        {/* Success Card */}
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          {/* Check icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Check className="h-8 w-8 text-accent-light" />
          </div>

          <h1 className="mb-2 text-2xl font-bold">Payment successful!</h1>
          <p className="mb-8 text-muted">
            Your <span className="font-medium text-accent-light">{planLabel}</span> plan is active.
            Create your account to get started.
          </p>

          {/* Included features */}
          <div className="mb-8 rounded-xl border border-border bg-background p-4 text-left">
            <h3 className="mb-3 text-sm font-semibold">Your plan includes:</h3>
            <ul className="space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                +50 AI articles/month
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                All 11 platform channels
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                Auto-scheduling & publishing
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-3.5 w-3.5 shrink-0 text-accent-light" />
                GEO-optimized articles
              </li>
            </ul>
          </div>

          {/* Create Account Form */}
          <div className="border-t border-border pt-6">
            <h3 className="mb-1 text-lg font-semibold">Create your account</h3>
            <p className="mb-5 text-sm text-muted">
              Set a password to access your dashboard anytime
            </p>

            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                <div className="h-11 animate-pulse rounded-lg bg-border/30" />
                <div className="h-11 animate-pulse rounded-lg bg-border/30" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  readOnly={!!sessionData?.email}
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50 read-only:text-muted"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min 6 characters)"
                  required
                  minLength={6}
                  autoFocus
                  className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none transition focus:border-accent/50"
                />
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Support link */}
        <p className="mt-6 text-center text-xs text-muted/50">
          Need help?{" "}
          <a
            href="mailto:contact@octoboost.app"
            className="text-accent-light hover:underline"
          >
            contact@octoboost.app
          </a>
        </p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-accent-light" />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <SuccessContent />
    </Suspense>
  );
}
