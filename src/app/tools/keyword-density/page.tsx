"use client";

import { useState, useMemo } from "react";
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
    title: "Paste Your Content",
    description:
      "Copy and paste your blog post, landing page copy, or any text you want to analyze for keyword usage.",
  },
  {
    emoji: "🔍",
    title: "See Keyword Frequency",
    description:
      "Get a ranked list of your most-used single keywords, 2-word phrases (bigrams), and 3-word phrases (trigrams) with density percentages.",
  },
  {
    emoji: "⚠️",
    title: "Fix Over-Optimization",
    description:
      "Identify keywords above 3% density that could trigger a stuffing penalty. Adjust your content before publishing.",
  },
];

const faqs: FaqItem[] = [
  {
    question: "What is keyword density?",
    answer:
      "Keyword density is the percentage of times a keyword appears in your content relative to the total word count. For example, if your keyword appears 10 times in a 1,000-word article, the density is 1%. It helps search engines understand what your content is about.",
  },
  {
    question: "What is the ideal keyword density for SEO?",
    answer:
      "The ideal primary keyword density is 0.5-2%. Above 2% is acceptable but risky. Anything above 3% may be flagged as keyword stuffing by Google, which can hurt your rankings. Focus on natural writing with semantic variations instead of repeating the same phrase.",
  },
  {
    question: "What is keyword stuffing and why is it bad?",
    answer:
      "Keyword stuffing is the practice of unnaturally repeating keywords to manipulate search rankings. Google's algorithms detect this and can penalize your page by lowering its ranking or removing it from results entirely. Modern SEO rewards natural, helpful content over keyword repetition.",
  },
  {
    question: "What are bigrams and trigrams?",
    answer:
      "Bigrams are 2-word phrases (e.g., 'content marketing') and trigrams are 3-word phrases (e.g., 'search engine optimization'). Analyzing these multi-word phrases helps you identify your content's topical focus and find long-tail keyword opportunities that single-word analysis misses.",
  },
  {
    question: "How often should I check keyword density?",
    answer:
      "Check keyword density before publishing any new content and during content audits. It's especially important when targeting competitive keywords where over-optimization could cost you rankings. Use this tool alongside the AI Content Scorer for a complete optimization check.",
  },
  {
    question: "Is this keyword density tool free?",
    answer:
      "Yes, the OctoBoost Keyword Density Analyzer is 100% free with no usage limits. Analyze as many texts as you want without signing up. For automated keyword research and content generation, check out the full OctoBoost platform.",
  },
];

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "it", "as", "was", "are", "be",
  "has", "had", "have", "this", "that", "which", "who", "will", "can",
  "not", "no", "do", "if", "its", "you", "your", "we", "our", "they",
  "their", "them", "he", "she", "his", "her", "my", "me", "i", "so",
  "been", "were", "am", "all", "also", "just", "than", "then", "about",
  "more", "some", "any", "up", "out", "when", "what", "how", "where",
  "very", "most", "only", "into", "over", "such", "each", "between",
  "through", "after", "before", "does", "did", "would", "could", "should",
  "may", "might", "one", "two", "these", "those", "other", "there",
  "le", "la", "les", "de", "du", "des", "un", "une", "et", "en", "est",
  "que", "qui", "dans", "pour", "sur", "avec", "par", "ce", "se", "ne",
  "pas", "il", "elle", "nous", "vous", "ils", "son", "sa", "ses", "au",
  "aux", "ou", "mais", "donc", "car", "ni", "si", "je", "tu", "on",
]);

interface WordEntry {
  word: string;
  count: number;
  density: number;
}

interface PhraseEntry {
  phrase: string;
  count: number;
  density: number;
}

function analyzeText(text: string): { words: WordEntry[]; bigrams: PhraseEntry[]; trigrams: PhraseEntry[]; totalWords: number } | null {
  const cleaned = text.toLowerCase().replace(/[^a-zà-ÿ0-9\s'-]/g, " ");
  const allWords = cleaned.split(/\s+/).filter((w) => w.length > 1);
  const totalWords = allWords.length;
  if (totalWords < 5) return null;

  const meaningful = allWords.filter((w) => !STOP_WORDS.has(w) && w.length > 2);

  const wordFreq = new Map<string, number>();
  for (const w of meaningful) {
    wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);
  }

  const words: WordEntry[] = [...wordFreq.entries()]
    .map(([word, count]) => ({ word, count, density: Math.round((count / totalWords) * 10000) / 100 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  const buildNgrams = (n: number): PhraseEntry[] => {
    const freq = new Map<string, number>();
    for (let i = 0; i <= meaningful.length - n; i++) {
      const phrase = meaningful.slice(i, i + n).join(" ");
      freq.set(phrase, (freq.get(phrase) ?? 0) + 1);
    }
    return [...freq.entries()]
      .filter(([, c]) => c >= 2)
      .map(([phrase, count]) => ({ phrase, count, density: Math.round((count / totalWords) * 10000) / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  return {
    words,
    bigrams: buildNgrams(2),
    trigrams: buildNgrams(3),
    totalWords,
  };
}

function DensityBar({ density, max }: { density: number; max: number }) {
  const width = max > 0 ? Math.min((density / max) * 100, 100) : 0;
  return (
    <div className="h-1.5 w-full rounded-full bg-border">
      <div className="h-full rounded-full bg-accent-light transition-all" style={{ width: `${width}%` }} />
    </div>
  );
}

export default function KeywordDensityPage() {
  const [text, setText] = useState("");
  const result = useMemo(() => analyzeText(text), [text]);

  const maxDensity = result?.words[0]?.density ?? 1;

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
          <span className="gradient-text">Keyword</span> Density Analyzer
        </h1>

        <p className="mx-auto mt-6 mb-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
          Find the most frequent keywords and phrases in your content. Spot <strong className="text-foreground">keyword stuffing</strong> before Google does.
        </p>
      </section>

      <div className="mx-auto max-w-4xl px-6 pb-16">

        <textarea
          placeholder="Paste your article or text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="mb-6 w-full resize-y rounded-xl border border-border bg-card px-5 py-4 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
          autoFocus
        />

        {result ? (
          <div className="space-y-6">
            <p className="text-xs text-muted">{result.totalWords.toLocaleString()} words analyzed</p>

            {/* Single words */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-3 text-sm font-semibold">Top Keywords</p>
              <div className="space-y-2">
                {result.words.map((w) => (
                  <div key={w.word} className="grid grid-cols-[1fr_50px_50px_80px] items-center gap-2 text-xs">
                    <span className="font-mono">{w.word}</span>
                    <span className="text-right text-muted">{w.count}x</span>
                    <span className={`text-right font-medium ${w.density > 3 ? "text-red-400" : w.density > 2 ? "text-amber-400" : "text-green-400"}`}>
                      {w.density}%
                    </span>
                    <DensityBar density={w.density} max={maxDensity} />
                  </div>
                ))}
              </div>
              {result.words.some((w) => w.density > 3) && (
                <p className="mt-3 text-xs text-red-400">
                  Keywords above 3% density may be flagged as keyword stuffing by search engines.
                </p>
              )}
            </div>

            {/* 2-word phrases */}
            {result.bigrams.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">2-Word Phrases</p>
                <div className="space-y-2">
                  {result.bigrams.map((b) => (
                    <div key={b.phrase} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{b.phrase}</span>
                      <span className="text-muted">{b.count}x ({b.density}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3-word phrases */}
            {result.trigrams.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-5">
                <p className="mb-3 text-sm font-semibold">3-Word Phrases</p>
                <div className="space-y-2">
                  {result.trigrams.map((t) => (
                    <div key={t.phrase} className="flex items-center justify-between text-xs">
                      <span className="font-mono">{t.phrase}</span>
                      <span className="text-muted">{t.count}x ({t.density}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-semibold">Density guidelines</p>
              <ul className="space-y-1 text-xs text-muted">
                <li><span className="text-green-400 font-medium">0.5–2%</span> — Ideal keyword density for primary keywords</li>
                <li><span className="text-amber-400 font-medium">2–3%</span> — Acceptable but use with caution</li>
                <li><span className="text-red-400 font-medium">3%+</span> — Risk of keyword stuffing penalty</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
            {text.trim().length > 0 ? "Need at least 5 words to analyze" : "Paste your text to see keyword density"}
          </div>
        )}

        {result && <ToolCta currentTool="/tools/keyword-density" />}

        <ToolHowItWorks steps={howItWorks} />
        <ToolFaq faqs={faqs} />
      </div>

      <Footer />
    </main>
  );
}
