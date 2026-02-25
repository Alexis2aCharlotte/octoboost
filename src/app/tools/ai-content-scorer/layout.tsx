import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Content Scorer — GEO Score for Google & AI Citations",
  description:
    "Score your articles for AI readability and Google rankings. Analyze heading structure, FAQ sections, lists, formatting, and content type. Get your GEO optimization score. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/ai-content-scorer" },
  openGraph: {
    title: "Free AI Content Scorer — GEO Score for Google & AI Citations",
    description:
      "Analyze your articles for Google rankings and AI citation potential. Get a detailed GEO score across 6 categories.",
    url: "https://octoboost.app/tools/ai-content-scorer",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
