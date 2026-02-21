"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Clock, FileText, BarChart3, AlignLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ToolCta } from "@/components/ToolCta";

interface ReadabilityResult {
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
  avgWordsPerSentence: number;
  avgSentencesPerParagraph: number;
  readingTimeMin: number;
  fleschScore: number;
  fleschGrade: string;
  level: "easy" | "medium" | "hard";
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  let count = 0;
  const vowels = "aeiouy";
  let prevVowel = false;
  for (const ch of w) {
    const isVowel = vowels.includes(ch);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (w.endsWith("e") && count > 1) count--;
  return Math.max(count, 1);
}

function analyze(text: string): ReadabilityResult | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  if (wordCount < 5) return null;

  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = Math.max(sentences.length, 1);

  const paragraphs = trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(paragraphs.length, 1);

  const avgWordsPerSentence = wordCount / sentenceCount;
  const avgSentencesPerParagraph = sentenceCount / paragraphCount;

  const totalSyllables = words.reduce((sum, w) => sum + countSyllables(w), 0);
  const avgSyllablesPerWord = totalSyllables / wordCount;

  const fleschScore = Math.round(
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord
  );
  const clamped = Math.max(0, Math.min(100, fleschScore));

  let fleschGrade: string;
  let level: "easy" | "medium" | "hard";
  if (clamped >= 70) { fleschGrade = "Easy to read"; level = "easy"; }
  else if (clamped >= 50) { fleschGrade = "Fairly easy"; level = "medium"; }
  else if (clamped >= 30) { fleschGrade = "Difficult"; level = "hard"; }
  else { fleschGrade = "Very difficult"; level = "hard"; }

  const readingTimeMin = Math.max(1, Math.round(wordCount / 230));

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
    avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
    readingTimeMin,
    fleschScore: clamped,
    fleschGrade,
    level,
  };
}

function getLevelColor(level: "easy" | "medium" | "hard"): string {
  if (level === "easy") return "text-green-400";
  if (level === "medium") return "text-amber-400";
  return "text-red-400";
}

export default function ReadabilityCheckerPage() {
  const [text, setText] = useState("");
  const result = analyze(text);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>

        <div className="mb-1 flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-accent-light" />
          <h1 className="text-2xl font-bold">Readability Checker</h1>
        </div>
        <p className="mb-8 text-sm text-muted">
          Paste your content to get word count, reading time, and a Flesch readability score. 100% free.
        </p>

        <textarea
          placeholder="Paste your article or text here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="mb-6 w-full resize-y rounded-xl border border-border bg-card px-5 py-4 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
          autoFocus
        />

        {result ? (
          <div className="space-y-5">
            {/* Score + grade */}
            <div className="flex items-center gap-5 rounded-xl border border-border bg-card p-6">
              <div className="text-center">
                <p className={`text-4xl font-bold ${getLevelColor(result.level)}`}>{result.fleschScore}</p>
                <p className="mt-0.5 text-xs text-muted">/100</p>
              </div>
              <div>
                <p className={`text-lg font-semibold ${getLevelColor(result.level)}`}>{result.fleschGrade}</p>
                <p className="text-sm text-muted">
                  {result.level === "easy"
                    ? "Your content is easy to read for a broad audience."
                    : result.level === "medium"
                      ? "Readable, but could be simplified for wider reach."
                      : "This content is complex. Consider shorter sentences."}
                </p>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                { icon: FileText, label: "Words", value: result.wordCount.toLocaleString() },
                { icon: AlignLeft, label: "Sentences", value: result.sentenceCount.toString() },
                { icon: BarChart3, label: "Paragraphs", value: result.paragraphCount.toString() },
                { icon: Clock, label: "Reading time", value: `${result.readingTimeMin} min` },
                { icon: AlignLeft, label: "Words/sentence", value: result.avgWordsPerSentence.toString() },
                { icon: BarChart3, label: "Sentences/paragraph", value: result.avgSentencesPerParagraph.toString() },
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-border bg-card p-4">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <stat.icon className="h-3.5 w-3.5 text-muted" />
                    <span className="text-xs text-muted">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Tips */}
            <div className="rounded-xl border border-border bg-card p-5">
              <p className="mb-2 text-sm font-semibold">SEO writing tips</p>
              <ul className="space-y-1.5 text-xs text-muted">
                <li>
                  {result.avgWordsPerSentence > 20
                    ? "Your sentences average " + result.avgWordsPerSentence + " words — try to keep them under 20 for better readability."
                    : "Good sentence length (" + result.avgWordsPerSentence + " words avg) — easy to scan."}
                </li>
                <li>
                  {result.wordCount < 1500
                    ? "Articles under 1,500 words rarely rank on page 1. Aim for 2,000+ for competitive keywords."
                    : result.wordCount >= 2000
                      ? "Great length (" + result.wordCount.toLocaleString() + " words) — in the sweet spot for SEO."
                      : "Decent length, but 2,000+ words perform better for competitive keywords."}
                </li>
                <li>Target a Flesch score of 60-70 for the best balance of readability and authority.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted">
            {text.trim().length > 0 ? "Need at least 5 words to analyze" : "Paste your text to see readability metrics"}
          </div>
        )}

        {result && <ToolCta currentTool="/tools/readability-checker" />}
      </div>
    </main>
  );
}
