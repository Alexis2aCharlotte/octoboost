import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free Readability Checker — Flesch-Kincaid & Grade Level",
  description: "Check your content's readability with Flesch-Kincaid score, grade level, and sentence analysis. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/readability-checker" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
