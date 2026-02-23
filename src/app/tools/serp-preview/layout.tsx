import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free SERP Preview — See How Your Page Looks on Google",
  description: "Preview exactly how your page appears in Google search results. Optimize title and meta description for maximum clicks. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/serp-preview" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
