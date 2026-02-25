import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Readability Checker — Flesch Score, Word Count & Reading Time",
  description:
    "Check your content's Flesch-Kincaid readability score, word count, sentence length, and reading time. Get SEO writing tips to improve rankings. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/readability-checker" },
  openGraph: {
    title: "Free Readability Checker — Flesch Score, Word Count & Reading Time",
    description:
      "Analyze readability with Flesch-Kincaid score, word count, and reading time. Get actionable SEO writing tips.",
    url: "https://octoboost.app/tools/readability-checker",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
