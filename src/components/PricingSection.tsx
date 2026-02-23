"use client";

import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";

const plans = [
  {
    name: "Explore",
    monthlyPrice: 19,
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
  const [yearly, setYearly] = useState(false);

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
            className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border border-border bg-card transition-colors hover:border-accent/30"
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
            const price = plan.monthlyPrice
              ? yearly
                ? Math.round(plan.monthlyPrice * 0.8)
                : plan.monthlyPrice
              : null;
            const yearlyTotal = plan.monthlyPrice
              ? Math.round(plan.monthlyPrice * 0.8 * 12)
              : null;

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
                    <p className="mt-6 text-5xl font-bold">
                      ${price}
                      <span className="text-lg font-normal text-muted">/mo</span>
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {yearly ? `$${yearlyTotal} billed yearly` : "Billed monthly"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-6 text-4xl font-bold">Let&apos;s talk</p>
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
                    disabled
                    className="mt-10 w-full cursor-not-allowed rounded-lg bg-accent/50 py-3 text-center text-sm font-semibold text-white/60"
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
