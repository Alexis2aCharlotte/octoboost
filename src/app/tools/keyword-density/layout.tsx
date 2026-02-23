import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Keyword Density Analyzer — Find Over-Optimization",
  description: "Analyze keyword frequency and density in your content. Spot over-optimization instantly. Free SEO tool by OctoBoost.",
  alternates: { canonical: "/tools/keyword-density" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
