"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ToolCta } from "@/components/ToolCta";

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
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>

        <div className="mb-1 flex items-center gap-2">
          <Search className="h-5 w-5 text-accent-light" />
          <h1 className="text-2xl font-bold">Keyword Density Analyzer</h1>
        </div>
        <p className="mb-8 text-sm text-muted">
          Paste your content to find the most frequent keywords and phrases. Spot over-optimization instantly. 100% free.
        </p>

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
      </div>
    </main>
  );
}
