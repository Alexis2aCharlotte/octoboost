import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Keyword Density Analyzer — Check Keyword Frequency & Stuffing",
  description:
    "Analyze keyword frequency and density in your content. Find top single keywords, 2-word and 3-word phrases. Spot keyword stuffing and over-optimization instantly. Free SEO tool by OctoBoost.",
  alternates: { canonical: "/tools/keyword-density" },
  openGraph: {
    title: "Free Keyword Density Analyzer — Check Keyword Frequency & Stuffing",
    description:
      "Find your most used keywords and phrases. Spot over-optimization and keyword stuffing before Google does.",
    url: "https://octoboost.app/tools/keyword-density",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
