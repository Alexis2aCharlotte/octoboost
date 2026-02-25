"use client";

import { ChevronDown } from "lucide-react";

export interface FaqItem {
  question: string;
  answer: string;
}

export function ToolFaq({ faqs }: { faqs: FaqItem[] }) {
  return (
    <section className="mt-16">
      <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
        Frequently Asked Questions
      </h2>
      <div className="space-y-3">
        {faqs.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-xl border border-border bg-card"
          >
            <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium transition hover:text-accent-light [&::-webkit-details-marker]:hidden">
              {faq.question}
              <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-5 pb-4 text-sm leading-relaxed text-muted">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

export function faqJsonLd(faqs: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}
