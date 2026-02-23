import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join the Waitlist",
  description: "Be the first to try OctoBoost. Join the waitlist for early access to automated SEO articles and multi-platform publishing.",
  alternates: { canonical: "/waitlist" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
