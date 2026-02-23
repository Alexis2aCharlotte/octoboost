import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Headline Analyzer — Score Your Titles for SEO",
  description: "Analyze your article headlines for SEO impact, readability, and click-through potential. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/headline-analyzer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
