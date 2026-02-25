import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Free SERP Preview Tool — Google Search Result Simulator",
  description:
    "Preview exactly how your page appears in Google search results on desktop and mobile. Optimize your title tag and meta description length for maximum click-through rate. Free tool by OctoBoost.",
  alternates: { canonical: "/tools/serp-preview" },
  openGraph: {
    title: "Free SERP Preview Tool — Google Search Result Simulator",
    description:
      "See how your page looks in Google search results. Optimize title and meta description for maximum clicks.",
    url: "https://octoboost.app/tools/serp-preview",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
