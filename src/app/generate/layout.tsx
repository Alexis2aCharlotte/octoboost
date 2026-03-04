import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata = {
  title: "Generate Your Free SEO Article | OctoBoost",
  description:
    "Paste your URL and get a free AI-generated SEO article with keyword research, competitor analysis, and content strategy.",
};

export default function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
