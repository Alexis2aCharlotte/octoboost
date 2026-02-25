"use client";

import { useState } from "react";
import { Brain, CheckCircle2, AlertTriangle, XCircle, FileText, List, HelpCircle, Heading2, Code2, Quote } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ToolCta } from "@/components/ToolCta";
import { ToolHowItWorks } from "@/components/ToolHowItWorks";
import { ToolFaq, faqJsonLd } from "@/components/ToolFaq";
import type { HowItWorksStep } from "@/components/ToolHowItWorks";
import type { FaqItem } from "@/components/ToolFaq";

const howItWorks: HowItWorksStep[] = [
  {
    emoji: "📋",
    title: "Paste Your Article",
    description:
      "Copy your blog post or article in Markdown or plain text. We analyze structure, headings, FAQ sections, and formatting.",
  },
  {
    emoji: "📊",
    title: "Get Your GEO Score",
    description:
      "See a detailed breakdown across 6 categories: word count, heading structure, FAQ, lists, formatting, and content type.",
  },
  {
    emoji: "💡",
    title: "Follow the Tips",
    description:
      "Actionable recommendations show exactly what to add or improve so Google and AI tools like ChatGPT cite your content.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "What is a GEO score?",
    answer:
      "GEO stands for Google + Engine Optimization. It measures how well your content is structured for both traditional Google rankings and AI citation engines like ChatGPT, Perplexity, and Claude. A high GEO score means your content is optimized for both search and AI discovery.",
  },
  {
    question: "How is the AI Content Score calculated?",
    answer:
      "The score is based on 6 weighted categories: word count (20 points), heading structure with H2/H3 (20 points), FAQ section presence (20 points), lists and structured data (15 points), rich formatting like bold and blockquotes (10 points), and AI-friendly content type detection (15 points).",
  },
  {
    question: "Why does word count matter for AI citations?",
    answer:
      "Longer articles (2,000+ words) provide more context for AI models to understand and cite. They also tend to rank higher on Google because they cover topics more comprehensively. Short articles rarely appear in AI-generated answers or rank for competitive keywords.",
  },
  {
    question: "What content formats do AI tools prefer to cite?",
    answer:
      "AI tools most frequently cite comparisons (X vs Y), how-to guides, listicles (Top 10...), and FAQ-rich content. These formats provide structured, factual information that AI models can easily extract and reference in their responses.",
  },
  {
    question: "Do I need a FAQ section in every article?",
    answer:
      "Adding a FAQ section with 3-5 questions significantly increases your chances of appearing in Google's People Also Ask boxes and being cited by AI tools. FAQ schema markup also generates rich results in search, boosting click-through rates.",
  },
  {
    question: "Is this AI content scorer free?",
    answer:
      "Yes, the OctoBoost AI Content Scorer is completely free with unlimited analyses. No signup required. For automated article generation with built-in GEO optimization, explore the full OctoBoost platform.",
  },
];

interface ScoreBreakdown {
  label: string;
  score: number;
  max: number;
  detail: string;
  status: "good" | "ok" | "bad";
}

interface ScorerResult {
  total: number;
  grade: string;
  level: "good" | "ok" | "bad";
  breakdown: ScoreBreakdown[];
  tips: string[];
}

function scoreContent(text: string): ScorerResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 20) return null;

  const lines = trimmed.split("\n");
  const breakdown: ScoreBreakdown[] = [];
  const tips: string[] = [];

  // 1. Word count (max 20)
  const wordCount = words.length;
  let wcScore: number;
  if (wordCount >= 2000) wcScore = 20;
  else if (wordCount >= 1500) wcScore = 15;
  else if (wordCount >= 1000) wcScore = 10;
  else if (wordCount >= 500) wcScore = 5;
  else wcScore = 2;
  breakdown.push({
    label: "Word count",
    score: wcScore,
    max: 20,
    detail: `${wordCount.toLocaleString()} words${wordCount >= 2000 ? " - ideal for SEO and AI citations" : ""}`,
    status: wcScore >= 15 ? "good" : wcScore >= 10 ? "ok" : "bad",
  });
  if (wordCount < 1500) tips.push("Aim for 2,000+ words. Longer articles rank better and are more likely to be cited by AI tools.");

  // 2. Heading structure (max 20)
  const h2s = lines.filter((l) => /^##\s+[^#]/.test(l));
  const h3s = lines.filter((l) => /^###\s+/.test(l));
  const headingCount = h2s.length + h3s.length;
  let hScore: number;
  if (h2s.length >= 3 && h3s.length >= 2) hScore = 20;
  else if (h2s.length >= 2 && h3s.length >= 1) hScore = 15;
  else if (h2s.length >= 2) hScore = 10;
  else if (h2s.length >= 1) hScore = 5;
  else hScore = 0;
  breakdown.push({
    label: "Heading structure (H2/H3)",
    score: hScore,
    max: 20,
    detail: `${h2s.length} H2, ${h3s.length} H3 headings found`,
    status: hScore >= 15 ? "good" : hScore >= 10 ? "ok" : "bad",
  });
  if (h2s.length < 3) tips.push("Add more H2 headings (3+). Clear structure helps Google and AI parse your content.");
  if (h3s.length < 2) tips.push("Add H3 sub-headings under your H2s for deeper content hierarchy.");

  // 3. FAQ section (max 20)
  const hasFaqHeading = lines.some((l) => /^#{1,3}\s.*\b(faq|frequently asked|questions)\b/i.test(l));
  const questionMarks = trimmed.match(/\?\s*\n/g)?.length ?? 0;
  let faqScore: number;
  if (hasFaqHeading && questionMarks >= 3) faqScore = 20;
  else if (hasFaqHeading && questionMarks >= 1) faqScore = 15;
  else if (questionMarks >= 3) faqScore = 10;
  else if (questionMarks >= 1) faqScore = 5;
  else faqScore = 0;
  breakdown.push({
    label: "FAQ section",
    score: faqScore,
    max: 20,
    detail: hasFaqHeading
      ? `FAQ section detected with ${questionMarks} question(s)`
      : questionMarks > 0
        ? `${questionMarks} question(s) found but no FAQ heading`
        : "No FAQ section detected",
    status: faqScore >= 15 ? "good" : faqScore >= 5 ? "ok" : "bad",
  });
  if (!hasFaqHeading) tips.push("Add a 'Frequently Asked Questions' section with 3-5 Q&A pairs. AI tools love structured FAQ content.");

  // 4. Lists and structured content (max 15)
  const bulletLines = lines.filter((l) => /^\s*[-*]\s+/.test(l)).length;
  const numberedLines = lines.filter((l) => /^\s*\d+[.)]\s+/.test(l)).length;
  const listItems = bulletLines + numberedLines;
  let listScore: number;
  if (listItems >= 8) listScore = 15;
  else if (listItems >= 5) listScore = 12;
  else if (listItems >= 3) listScore = 8;
  else if (listItems >= 1) listScore = 4;
  else listScore = 0;
  breakdown.push({
    label: "Lists and structured data",
    score: listScore,
    max: 15,
    detail: `${bulletLines} bullet points, ${numberedLines} numbered items`,
    status: listScore >= 12 ? "good" : listScore >= 4 ? "ok" : "bad",
  });
  if (listItems < 5) tips.push("Add more bullet points or numbered lists. Structured content is easier for AI to extract and cite.");

  // 5. Content formatting (bold, quotes, code) (max 10)
  const boldCount = (trimmed.match(/\*\*[^*]+\*\*/g) || []).length;
  const quoteLines = lines.filter((l) => /^>\s+/.test(l)).length;
  const codeBlocks = (trimmed.match(/```/g) || []).length / 2;
  let fmtScore: number;
  const fmtSignals = (boldCount >= 3 ? 1 : 0) + (quoteLines >= 1 ? 1 : 0) + (codeBlocks >= 1 ? 1 : 0);
  if (fmtSignals >= 3) fmtScore = 10;
  else if (fmtSignals >= 2) fmtScore = 7;
  else if (fmtSignals >= 1) fmtScore = 4;
  else fmtScore = 0;
  breakdown.push({
    label: "Rich formatting",
    score: fmtScore,
    max: 10,
    detail: `${boldCount} bold phrases, ${quoteLines} blockquotes, ${Math.floor(codeBlocks)} code blocks`,
    status: fmtScore >= 7 ? "good" : fmtScore >= 4 ? "ok" : "bad",
  });
  if (boldCount < 3) tips.push("Use **bold** to highlight key phrases. It helps AI tools identify important claims.");

  // 6. Content type signals (max 15)
  const hasComparison = /\b(vs\.?|versus|compared to|comparison|alternative)\b/i.test(trimmed);
  const hasHowTo = /\b(how to|step[- ]by[- ]step|guide|tutorial)\b/i.test(trimmed);
  const hasListicle = /\b(best|top \d+|\d+ (best|ways|tips|tools|reasons))\b/i.test(trimmed);
  let typeScore = 0;
  const types: string[] = [];
  if (hasComparison) { typeScore += 5; types.push("comparison"); }
  if (hasHowTo) { typeScore += 5; types.push("how-to"); }
  if (hasListicle) { typeScore += 5; types.push("listicle"); }
  typeScore = Math.min(typeScore, 15);
  breakdown.push({
    label: "AI-friendly content type",
    score: typeScore,
    max: 15,
    detail: types.length > 0
      ? `Detected: ${types.join(", ")}`
      : "No comparison, how-to, or listicle patterns detected",
    status: typeScore >= 10 ? "good" : typeScore >= 5 ? "ok" : "bad",
  });
  if (types.length === 0) tips.push("Frame your content as a listicle, comparison, or how-to guide. These formats are cited most by AI tools.");

  const total = breakdown.reduce((sum, b) => sum + b.score, 0);

  let grade: string;
  let level: "good" | "ok" | "bad";
  if (total >= 80) { grade = "Excellent"; level = "good"; }
  else if (total >= 60) { grade = "Good"; level = "good"; }
  else if (total >= 40) { grade = "Needs improvement"; level = "ok"; }
  else if (total >= 20) { grade = "Weak"; level = "bad"; }
  else { grade = "Not optimized"; level = "bad"; }

  return { total, grade, level, breakdown, tips };
}

function getLevelColor(level: "good" | "ok" | "bad"): string {
  if (level === "good") return "text-green-400";
  if (level === "ok") return "text-amber-400";
  return "text-red-400";
}

function getLevelBg(level: "good" | "ok" | "bad"): string {
  if (level === "good") return "bg-green-400/10 border-green-400/20";
  if (level === "ok") return "bg-amber-400/10 border-amber-400/20";
  return "bg-red-400/10 border-red-400/20";
}

function StatusIcon({ status }: { status: "good" | "ok" | "bad" }) {
  if (status === "good") return <CheckCircle2 className="h-4 w-4 text-green-400" />;
  if (status === "ok") return <AlertTriangle className="h-4 w-4 text-amber-400" />;
  return <XCircle className="h-4 w-4 text-red-400" />;
}

const categoryIcons: Record<string, React.ElementType> = {
  "Word count": FileText,
  "Heading structure (H2/H3)": Heading2,
  "FAQ section": HelpCircle,
  "Lists and structured data": List,
  "Rich formatting": Quote,
  "AI-friendly content type": Code2,
};

export default function AIContentScorerPage() {
  const [text, setText] = useState("");
  const result = scoreContent(text);

  return (
    <main className="isolate min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="grid-bg" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />

      <section className="relative flex flex-col items-center px-6 pt-28 pb-12 text-center">
        <span className="mb-5 inline-block rounded-full border border-white/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-white/70">
          Free Tool
        </span>

        <h1 className="text-5xl font-bold leading-[1.1] tracking-tighter md:text-7xl">
          AI Content <span className="gradient-text">Scorer</span>
        </h1>

        <p className="mx-auto mt-6 mb-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
          Paste your article and get a <strong className="text-foreground">GEO score</strong>. See how well your content is optimized for Google rankings and AI citations.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-16">

        <textarea
          placeholder="Paste your article (Markdown or plain text)..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mb-6 w-full resize-y rounded-xl border border-border bg-card px-5 py-4 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
          autoFocus
        />

        {result ? (
          <div className="space-y-5">
            {/* Overall score */}
            <div className={`flex items-center gap-5 rounded-xl border p-6 ${getLevelBg(result.level)}`}>
              <div className="text-center">
                <p className={`text-4xl font-bold ${getLevelColor(result.level)}`}>{result.total}</p>
                <p className="mt-0.5 text-xs text-muted">/100</p>
              </div>
              <div>
                <p className={`text-lg font-semibold ${getLevelColor(result.level)}`}>{result.grade}</p>
                <p className="text-sm text-muted">
                  {result.level === "good"
                    ? "Your content is well-structured for Google rankings and AI citations."
                    : result.level === "ok"
                      ? "Your content has potential but needs optimization for AI discoverability."
                      : "This content is unlikely to rank well or be cited by AI tools."}
                </p>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-3">
              {result.breakdown.map((b) => {
                const Icon = categoryIcons[b.label] ?? FileText;
                return (
                  <div key={b.label} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4 text-muted" />
                        <span className="text-sm font-medium">{b.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${getLevelColor(b.status)}`}>{b.score}/{b.max}</span>
                        <StatusIcon status={b.status} />
                      </div>
                    </div>
                    <p className="mt-1.5 pl-[26px] text-xs text-muted">{b.detail}</p>
                    {/* Progress bar */}
                    <div className="mt-2 ml-[26px] h-1.5 w-full overflow-hidden rounded-full bg-border">
                      <div
                        className={`h-full rounded-full transition-all ${b.status === "good" ? "bg-green-400" : b.status === "ok" ? "bg-amber-400" : "bg-red-400"}`}
                        style={{ width: `${(b.score / b.max) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tips */}
            {result.tips.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">How to improve your GEO score</p>
                <ul className="space-y-2 text-xs text-muted">
                  {result.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
            {text.trim().length > 0 ? "Need at least 20 words to analyze" : "Paste your article to get a GEO score"}
          </div>
        )}

        {result && <ToolCta currentTool="/tools/ai-content-scorer" />}

        <ToolHowItWorks steps={howItWorks} />
        <ToolFaq faqs={faqs} />
      </div>

      <Footer />
    </main>
  );
}
