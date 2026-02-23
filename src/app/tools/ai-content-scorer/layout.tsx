import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free AI Content Scorer — GEO Readability Analysis",
  description: "Score your content for AI readability: FAQ sections, structured headings, content type. Get a GEO optimization score. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/ai-content-scorer" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
