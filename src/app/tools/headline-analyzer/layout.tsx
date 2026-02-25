import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Headline Analyzer — Score Your Titles for SEO & CTR",
  description:
    "Analyze your blog post headlines for SEO impact, readability, and click-through potential. Check title length, power words, emotional triggers, and 6 more ranking factors. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/headline-analyzer" },
  openGraph: {
    title: "Free Headline Analyzer — Score Your Titles for SEO & CTR",
    description:
      "Analyze your blog post headlines for SEO impact, readability, and click-through potential. Check 9 ranking factors instantly.",
    url: "https://octoboost.app/tools/headline-analyzer",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
