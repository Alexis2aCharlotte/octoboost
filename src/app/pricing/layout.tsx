import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing — Simple Plans for Every SaaS | OctoBoost",
  description:
    "Choose the OctoBoost plan that fits your SaaS. AI-powered SEO articles, multi-platform publishing, and automated backlinks. Plans start at $19/mo. No hidden fees.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "Pricing — Simple Plans for Every SaaS | OctoBoost",
    description:
      "AI-powered SEO articles, multi-platform publishing, and automated backlinks. Plans start at $19/mo. No hidden fees.",
    url: "https://octoboost.app/pricing",
    type: "website",
    images: [
      {
        url: "https://octoboost.app/OG-Image-v2.png",
        width: 1200,
        height: 630,
        alt: "OctoBoost Pricing — Simple Plans for Every SaaS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Simple Plans for Every SaaS | OctoBoost",
    description:
      "AI-powered SEO articles, multi-platform publishing, and automated backlinks. Plans start at $19/mo.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
