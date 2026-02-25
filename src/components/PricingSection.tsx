"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight, Lock, ShieldCheck, Loader2 } from "lucide-react";

const plans = [
  {
    name: "Explore",
    monthlyPrice: 19,
    yearlyPrice: 15,
    sites: "1 site",
    features: [
      "+50 AI articles/month",
      "All 11 platform channels",
      "Auto-scheduling & publishing",
      "GEO-optimized articles",
      "Email support",
    ],
    cta: "Coming Soon",
    highlighted: false,
  },
  {
    name: "Pro",
    monthlyPrice: 39,
    yearlyPrice: 31,
    sites: "5 sites",
    features: [
      "+50 AI articles/month",
      "All 11 platform channels",
      "Auto-scheduling & publishing",
      "GEO-optimized articles",
      "Priority support",
    ],
    cta: "Coming Soon",
    highlighted: true,
  },
  {
    name: "Custom",
    monthlyPrice: null,
    yearlyPrice: null,
    sites: "Unlimited sites",
    features: [
      "Everything in Pro",
      "Unlimited sites",
      "Dedicated account manager",
      "Custom integrations",
      "SLA & onboarding",
    ],
    cta: "Contact us",
    highlighted: false,
  },
];

export function PricingSection() {
  const [yearly, setYearly] = useState(true);
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(plan: string) {
    setLoading(plan);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.toLowerCase(), interval: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json();
      if (res.status === 401) {
        router.push(`/login?next=/pricing`);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <section id="pricing" className="relative z-10 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
          Simple <span className="gradient-text">pricing</span>
        </h2>
        <p className="mx-auto mb-8 max-w-md text-center text-sm text-muted">
          Pick the plan that fits your needs. No hidden fees.
        </p>

        {/* Toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted"}`}>Monthly</span>
          <button
            onClick={() => setYearly(!yearly)}
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${yearly ? "border border-accent bg-accent/20" : "border border-border bg-card hover:border-accent/30"}`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-accent transition-transform ${yearly ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted"}`}>
            Yearly
            <span className="ml-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-light">-20%</span>
          </span>
        </div>

        {/* Cards */}
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;

            return (
              <div
                key={plan.name}
                className={`flex flex-col glow-card p-8 ${plan.highlighted ? "!border-accent/30" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  {plan.highlighted && (
                    <span className="rounded-md bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-accent-light">
                      Popular
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{plan.sites}</p>

                {price !== null ? (
                  <>
                    <p className="mt-6 text-5xl font-bold text-accent-light">
                      ${price}
                      <span className="text-lg font-normal text-muted">/mo</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {yearly ? "Per month, billed yearly" : "Billed monthly"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-6 text-4xl font-bold text-accent-light">Let&apos;s talk</p>
                    <p className="mt-1 text-sm text-muted">Tailored to your needs</p>
                  </>
                )}

                <ul className="mt-8 space-y-3 text-sm text-muted">
                  {plan.features.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-light" />
                      {item}
                    </li>
                  ))}
                </ul>

                {plan.name === "Custom" ? (
                  <a
                    href="mailto:contact@octoboost.io"
                    className="btn-glow mt-10 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-center text-sm font-semibold text-white transition"
                  >
                    Contact us <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <button
                    onClick={() => handleCheckout(plan.name)}
                    disabled={loading === plan.name}
                    className="btn-glow mt-10 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-center text-sm font-semibold text-white transition disabled:opacity-60"
                  >
                    {loading === plan.name ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Get started <ArrowRight className="h-3.5 w-3.5" /></>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Trust bar */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted/60">
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Secure payment via Stripe
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            7-day money-back guarantee
          </span>
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Cancel anytime
          </span>
        </div>
      </div>
    </section>
  );
}
