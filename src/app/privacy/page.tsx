import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How OctoBoost collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 pt-24 pb-16">
        <h1 className="mb-8 text-3xl font-bold">Privacy Policy</h1>
        <div className="prose prose-invert prose-sm max-w-none text-muted">
          <p>Last updated: February 21, 2026</p>

          <h2>1. Information We Collect</h2>
          <p>We collect information you provide when creating an account (email, password) and data generated through your use of the Service (site URLs, generated articles, channel configurations).</p>

          <h2>2. How We Use Your Information</h2>
          <p>Your information is used to provide the Service: analyzing your site, generating content, and publishing articles to platforms you configure. We do not sell your data to third parties.</p>

          <h2>3. Data Storage</h2>
          <p>Your data is stored securely on Supabase (PostgreSQL) with row-level security enabled. API keys for third-party platforms are stored encrypted in your project configuration.</p>

          <h2>4. Third-Party Services</h2>
          <p>OctoBoost integrates with third-party services (OpenAI, Anthropic, DataForSEO, Dev.to, Hashnode, WordPress, etc.) to provide its features. Your data may be processed by these services according to their respective privacy policies.</p>

          <h2>5. Cookies</h2>
          <p>We use essential cookies for authentication and session management. We use Vercel Analytics for anonymous usage statistics. No advertising cookies are used.</p>

          <h2>6. Your Rights</h2>
          <p>You can request deletion of your account and all associated data at any time by contacting us. You can export your articles and data from the dashboard.</p>

          <h2>7. Data Retention</h2>
          <p>Your data is retained as long as your account is active. Upon account deletion, all data is permanently removed within 30 days.</p>

          <h2>8. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email or through the Service.</p>

          <h2>9. Contact</h2>
          <p>For privacy-related questions, contact us at support@octoboost.app.</p>
        </div>
      </div>
    </main>
  );
}
