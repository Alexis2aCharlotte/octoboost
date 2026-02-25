import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  Zap,
  Bot,
  Database,
  UserCircle,
  Rocket,
  Search,
  PenTool,
  Send,
  Twitter,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  Trophy,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about OctoBoost — the automated SEO content engine built by an indie maker for SaaS founders and indie hackers.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About OctoBoost",
    description:
      "Built by a builder, for builders. The automated SEO engine that handles your entire content pipeline on autopilot.",
    images: [{ url: "/OG-Image-v2.png", width: 1200, height: 630 }],
  },
};

const stats = [
  { value: "43.3k+", label: "Impressions in 2 months" },
  { value: "11", label: "Publishing platforms" },
  { value: "89+", label: "Founders on the waitlist" },
  { value: "5", label: "Free SEO tools" },
];

const story = [
  {
    step: 1,
    icon: AlertTriangle,
    title: "The Problem",
    subtitle: "Hours of SEO Work, Zero Shipping",
    text: "As a SaaS founder, writing SEO articles, cross-posting across platforms, managing canonical URLs… it eats hours every week. Hours that should be spent building your product.",
  },
  {
    step: 2,
    icon: Clock,
    title: "The Frustration",
    subtitle: "I Just Wanted to Build",
    text: "SEO is crucial for organic growth. But the manual process — keyword research, writing, formatting for each platform — kills productivity for solo founders. Something had to change.",
  },
  {
    step: 3,
    icon: Lightbulb,
    title: "The Solution",
    subtitle: "Building OctoBoost",
    text: "I built the engine I wished I had. A system that analyzes your site, generates articles optimized for Google AND AI tools like ChatGPT and Perplexity, and publishes everywhere automatically.",
  },
  {
    step: 4,
    icon: Trophy,
    title: "Today",
    subtitle: "Proven Results, Open to All",
    text: "The same engine powered NicheHunter from 0 to 43.3k impressions in just 2 months. Now, I'm opening it to every SaaS founder who'd rather build than write blog posts.",
  },
];

const values = [
  {
    icon: Zap,
    title: "Automation Over Manual Work",
    description:
      "Your time is better spent building features, not writing blog posts. We automate the entire SEO pipeline.",
  },
  {
    icon: Database,
    title: "Data-Driven SEO",
    description:
      "Every article targets real keywords with real search volume. No guesswork, just data.",
  },
  {
    icon: UserCircle,
    title: "Built for Solo Founders",
    description:
      "One-click setup, automated publishing. You don't need a content team.",
  },
  {
    icon: Bot,
    title: "Google + AI Optimized",
    description:
      "Articles structured to rank on Google AND get cited by ChatGPT, Perplexity, and Claude.",
  },
];

const howItWorks = [
  {
    step: 1,
    icon: Search,
    title: "Paste your URL",
    description:
      "We crawl your site, analyze competitors, and build keyword clusters with real search volumes.",
  },
  {
    step: 2,
    icon: PenTool,
    title: "AI writes articles",
    description:
      "Long-form, GEO-optimized articles with FAQ schemas and structured data — built to rank and get cited.",
  },
  {
    step: 3,
    icon: Send,
    title: "Publish everywhere",
    description:
      "Auto-publish across 11 platforms with canonical backlinks pointing back to your site.",
  },
];

const faqs = [
  {
    q: "What exactly does OctoBoost do?",
    a: "OctoBoost is a full SEO pipeline for SaaS founders. You paste your site URL, and we handle everything: keyword research, competitor analysis, article generation optimized for Google and AI tools, and automated publishing across 11 platforms with canonical backlinks.",
  },
  {
    q: "Who is OctoBoost for?",
    a: "OctoBoost is built for SaaS founders, indie hackers, and solo developers who want organic traffic but don't have time to write blog posts manually. If you'd rather ship features than write content, OctoBoost is for you.",
  },
  {
    q: "How is this different from other AI writers?",
    a: "AI writers give you text. OctoBoost gives you a complete system: keyword research, competitor analysis, topic clustering, article generation, platform adaptation, and automated publishing with canonical backlinks. It's the difference between a tool and an engine.",
  },
  {
    q: "How does multi-platform publishing work?",
    a: "OctoBoost auto-publishes to platforms like Dev.to, Hashnode, WordPress, Telegraph, and Blogger via their APIs. For platforms like Medium, Reddit, and Hacker News, we generate adapted content ready to post. Every version includes canonical URLs pointing to your site.",
  },
  {
    q: "Can I really grow my traffic with this?",
    a: "Yes. The same engine powered NicheHunter from 0 to 43.3k Google impressions in 2 months using only automated SEO articles. More publishing sources means more trust signals for Google and more chances to get cited by AI tools.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "OctoBoost",
      url: "https://octoboost.app",
      logo: "https://octoboost.app/Logo%20Octoboost.png",
      founder: {
        "@type": "Person",
        name: "Tobby",
        url: "https://x.com/Tobby_scraper",
      },
      description:
        "Automated SEO content engine for SaaS founders and indie hackers.",
      contactPoint: {
        "@type": "ContactPoint",
        email: "contact@octoboost.app",
        contactType: "customer support",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    },
  ],
};

export default function AboutPage() {
  return (
    <main className="isolate flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-32 pb-16 md:pt-40 md:pb-20">
        <div className="grid-bg" />
        <div className="relative z-10 mx-auto w-full max-w-3xl">
          <h1 className="text-center text-4xl font-bold leading-[1.08] tracking-tighter sm:text-5xl md:text-6xl">
            <span className="gradient-text">Built</span> by a Builder<br />
            For <span className="gradient-text">Builders</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-center text-base leading-relaxed text-muted sm:text-lg">
            I was tired of spending hours writing SEO content instead of
            building. So I built OctoBoost: the engine that handles your entire{" "}
            <span className="font-medium text-foreground">
              SEO pipeline on autopilot
            </span>
            .
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 px-6 py-12">
        <div className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-border bg-card p-5 text-center"
            >
              <p className="text-2xl font-bold tracking-tight md:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs text-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Story ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            The <span className="gradient-text">Story</span>
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            How a frustrated founder turned a personal pain into a product.
          </p>
          <div className="relative space-y-8">
            <div className="absolute top-8 bottom-8 left-5 hidden w-px bg-gradient-to-b from-accent/40 via-accent/20 to-transparent sm:block" />
            {story.map((s) => (
              <div key={s.step} className="flex gap-5">
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-card text-sm font-bold text-accent-light">
                  {s.step}
                </div>
                <div className="pt-1">
                  <div className="mb-1 flex items-center gap-2">
                    <s.icon className="h-4 w-4 text-accent-light" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">
                      {s.title}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-bold sm:text-xl">
                    {s.subtitle}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-2xl border border-accent/20 bg-card p-8 md:p-12">
            <Rocket className="mx-auto mb-4 h-8 w-8 text-accent-light" />
            <h2 className="mb-4 text-2xl font-bold tracking-tight md:text-3xl">
              Our Mission
            </h2>
            <blockquote className="text-base leading-relaxed text-muted italic sm:text-lg">
              &ldquo;To help every SaaS founder skip the SEO grind and focus on
              building. We believe great products deserve organic traffic —
              without spending hours writing blog posts.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            What We <span className="gradient-text">Believe</span>
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            The principles behind every feature we build.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="glow-card p-6">
                <v.icon className="mb-3 h-5 w-5 text-accent-light" />
                <h3 className="mb-1.5 text-base font-semibold">{v.title}</h3>
                <p className="text-sm leading-relaxed text-muted">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Founder ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-10 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            Meet the <span className="gradient-text">Founder</span>
          </h2>
          <div className="glow-card p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <Image
                src="/founder.jpg"
                alt="Tobby — Founder of OctoBoost"
                width={80}
                height={80}
                className="h-20 w-20 shrink-0 rounded-full border-2 border-accent/30 object-cover"
              />
              <div className="text-center sm:text-left">
                <h3 className="text-xl font-bold">Tobby</h3>
                <p className="mb-3 text-sm font-medium text-accent-light">
                  Founder &amp; Developer
                </p>
                <p className="mb-4 text-sm leading-relaxed text-muted">
                  I&apos;m an indie developer who built{" "}
                  <a
                    href="https://nicheshunter.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-foreground underline decoration-accent/40 underline-offset-2 transition-colors hover:text-accent-light"
                  >
                    NicheHunter
                  </a>{" "}
                  and OctoBoost. I believe in automation, shipping fast, and
                  letting tools do the heavy lifting so founders can focus on
                  what matters: building great products.
                </p>
                <a
                  href="https://x.com/Tobby_scraper"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition-all hover:border-accent/40 hover:text-foreground"
                >
                  <Twitter className="h-4 w-4" />
                  @Tobby_scraper
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How OctoBoost Works ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            How OctoBoost <span className="gradient-text">Works</span>
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            From your URL to published articles everywhere — in 3 steps.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((s) => (
              <div key={s.step} className="glow-card p-6">
                <s.icon className="mb-3 h-5 w-5 text-accent-light" />
                <h3 className="mb-1.5 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            Frequently Asked{" "}
            <span className="gradient-text">Questions</span>
          </h2>
          <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted">
            Everything you need to know about OctoBoost.
          </p>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium transition hover:text-accent-light [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">
            Ready to automate your{" "}
            <span className="gradient-text">SEO?</span>
          </h2>
          <p className="mx-auto mt-3 mb-8 max-w-md text-sm text-muted">
            Stop writing blog posts manually. Let OctoBoost handle your keyword
            research, article generation, and multi-platform publishing — all on
            autopilot.
          </p>
          <Link href="/waitlist" className="btn-glow inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base">
            Join the Waitlist
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Link>
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted/60">
              <div className="flex -space-x-1.5">
                {[3, 11, 32].map((id) => (
                  <img
                    key={id}
                    src={`https://i.pravatar.cc/48?img=${id}`}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full border-2 border-background object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
              <span>
                Already{" "}
                <strong className="text-foreground/70">89 founders</strong> on
                the waitlist
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted/50">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Free to join
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" />
                No spam
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3 w-3 text-success" />
                Early access perks
              </span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
