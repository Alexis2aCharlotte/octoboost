"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Check, X, ArrowRight, ChevronDown, Lock, ShieldCheck, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";

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

const comparisonFeatures: {
  label: string;
  explore: string | boolean;
  pro: string | boolean;
  custom: string | boolean;
}[] = [
  { label: "Sites included", explore: "1", pro: "5", custom: "Unlimited" },
  { label: "AI articles / month", explore: "50", pro: "50", custom: "Custom" },
  { label: "Platform channels", explore: "11", pro: "11", custom: "11" },
  { label: "Auto-scheduling", explore: true, pro: true, custom: true },
  { label: "GEO-optimized articles", explore: true, pro: true, custom: true },
  { label: "GitHub Push connector", explore: true, pro: true, custom: true },
  { label: "Custom API", explore: true, pro: true, custom: true },
  { label: "Priority support", explore: false, pro: true, custom: true },
  {
    label: "Dedicated account manager",
    explore: false,
    pro: false,
    custom: true,
  },
  { label: "Custom integrations", explore: false, pro: false, custom: true },
  { label: "SLA & onboarding", explore: false, pro: false, custom: true },
];

const pricingFaqs = [
  {
    q: "Can I switch plans?",
    a: "Yes. You can upgrade or downgrade your plan at any time. When upgrading, you'll get instant access to the new features. When downgrading, the change applies at the end of your current billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "We don't offer a free trial, but we have a 14-day money-back guarantee. If OctoBoost isn't the right fit, just reach out within 14 days of purchase and we'll issue a full refund.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit and debit cards (Visa, Mastercard, American Express) through Stripe. All payments are processed securely.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts. You can cancel your subscription at any time from your dashboard, and you'll keep access until the end of your billing period.",
  },
  {
    q: "What happens when I reach my article limit?",
    a: "Once you've used your monthly article credits, you can wait for the next billing cycle to reset or upgrade to a higher plan. We'll notify you when you're approaching your limit.",
  },
  {
    q: "Do you offer refunds?",
    a: "Yes. We offer a 14-day money-back guarantee on all plans. If you're not satisfied, contact us at contact@octoboost.io and we'll process your refund promptly.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: pricingFaqs.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function PricingPage() {
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
    <main className="isolate flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-8">
        <div className="grid-bg" />
        <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tighter sm:text-5xl md:text-7xl">
            Simple <span className="gradient-text">pricing</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
            Pick the plan that fits your SaaS. No hidden fees, no surprises.
            Cancel anytime.
          </p>
        </div>
      </section>

      {/* ── Pricing Cards ── */}
      <section className="relative z-10 px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Toggle */}
          <div className="mb-10 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium ${!yearly ? "text-foreground" : "text-muted"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setYearly(!yearly)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${yearly ? "border border-accent bg-accent/20" : "border border-border bg-card hover:border-accent/30"}`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-accent transition-transform ${yearly ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
            <span
              className={`text-sm font-medium ${yearly ? "text-foreground" : "text-muted"}`}
            >
              Yearly
              <span className="ml-1.5 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-light">
                -20%
              </span>
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
                        <span className="text-lg font-normal text-muted">
                          /mo
                        </span>
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        {yearly
                          ? "Per month, billed yearly"
                          : "Billed monthly"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-6 text-4xl font-bold text-accent-light">
                        Let&apos;s talk
                      </p>
                      <p className="mt-1 text-sm text-muted">
                        Tailored to your needs
                      </p>
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

      {/* ── Comparison Table ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            Compare <span className="gradient-text">plans</span>
          </h2>
          <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted">
            See exactly what&apos;s included in each plan
          </p>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card">
                  <th className="px-6 py-4 text-left font-medium text-muted">
                    Feature
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Explore
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    <span className="inline-flex items-center gap-2">
                      Pro
                      <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-light">
                        Popular
                      </span>
                    </span>
                  </th>
                  <th className="px-6 py-4 text-center font-semibold">
                    Custom
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feat, i) => (
                  <tr
                    key={feat.label}
                    className={
                      i < comparisonFeatures.length - 1
                        ? "border-b border-border"
                        : ""
                    }
                  >
                    <td className="px-6 py-3.5 text-muted">{feat.label}</td>
                    {(["explore", "pro", "custom"] as const).map((plan) => (
                      <td key={plan} className="px-6 py-3.5 text-center">
                        {typeof feat[plan] === "boolean" ? (
                          feat[plan] ? (
                            <Check className="mx-auto h-4 w-4 text-accent-light" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-muted/30" />
                          )
                        ) : (
                          <span className="font-medium">{feat[plan]}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            Pricing <span className="gradient-text">FAQ</span>
          </h2>
          <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted">
            Everything you need to know about billing and plans
          </p>
          <div className="space-y-3">
            {pricingFaqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium transition hover:text-accent-light [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
            Ready to grow your traffic{" "}
            <span className="gradient-text">on autopilot</span>?
          </h2>
          <p className="mx-auto mt-3 mb-6 max-w-md text-sm text-muted">
            Join founders who automate their SEO. Paste your URL and let
            OctoBoost handle the rest.
          </p>
          <WaitlistForm />
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-muted/50">
              No spam · We&apos;ll notify you at launch
            </p>
            <div className="flex items-center gap-2 text-xs text-muted/50">
              <div className="flex -space-x-1.5">
                {[3, 11, 32].map((id) => (
                  <img
                    key={id}
                    src={`https://i.pravatar.cc/48?img=${id}`}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full border-2 border-background object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <span>
                Already{" "}
                <strong className="text-foreground/70">89 founders</strong> on
                the waitlist
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
