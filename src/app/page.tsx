import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Search,
  FileText,
  Send,
  Code2,
  Hash,
  Globe,
  BookOpen,
  MessageSquare,
  Flame,
  HelpCircle,
  Mail,
  Zap,
  ClipboardCopy,
  Target,
  PenTool,
  Calendar,
  Link2,
  ChevronDown,
  Type,
  GitBranch,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { WaitlistForm } from "@/components/WaitlistForm";
import { PricingSection } from "@/components/PricingSection";

/* ─── Data ──────────────────────────────────────────────── */

const steps = [
  {
    icon: Search,
    title: "Paste your URL",
    description:
      "We crawl your site, spy on competitors, and build keyword clusters with real search volumes.",
  },
  {
    icon: PenTool,
    title: "AI writes your articles",
    description:
      "Long-form articles with FAQ schemas, structured data, and content formats optimized for Google rankings and AI citations.",
  },
  {
    icon: Send,
    title: "Publish everywhere",
    description:
      "Publish on your blog and distribute across 11 platforms. More sources mean more chances Google and AI tools reference you.",
  },
];

const features = [
  {
    icon: Target,
    title: "SEO Engine",
    description:
      "50-80 seed keywords, SERP difficulty, competitor analysis, and opportunity scores. We find what your audience searches for.",
  },
  {
    icon: FileText,
    title: "GEO-Optimized Articles",
    description:
      "Listicles, comparisons, how-tos, and FAQ-rich articles with structured data. Built to rank on Google and get cited by AI tools.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description:
      "Cron-based auto-publish every 10 min. Built-in constraints: max 2/day, 1 per platform/day.",
  },
  {
    icon: Link2,
    title: "Multi-Source Authority",
    description:
      "Your content published across 11 platforms with canonical backlinks. More sources referencing you means more trust from Google and AI.",
  },
];

const sitePublish = [
  { name: "Custom API", icon: Globe, description: "Fetch articles via REST API with your project key" },
  { name: "GitHub Push", icon: GitBranch, description: "Auto-push .md/.mdx to your repo (Astro, Hugo, Jekyll)" },
];

const autoPublishPlatforms = [
  { name: "Dev.to", icon: Code2, color: "text-blue-400", da: "85+" },
  { name: "Hashnode", icon: Hash, color: "text-indigo-400", da: "80+" },
  { name: "WordPress", icon: Globe, color: "text-cyan-400", da: "—" },
  { name: "Telegraph", icon: FileText, color: "text-sky-400", da: "83" },
  { name: "Blogger", icon: BookOpen, color: "text-orange-500", da: "89" },
];

const adaptedPlatforms = [
  { name: "Medium", icon: BookOpen, color: "text-green-400", da: "95" },
  { name: "Reddit", icon: MessageSquare, color: "text-orange-400", da: "99" },
  { name: "Indie Hackers", icon: Flame, color: "text-amber-400", da: "70+" },
  { name: "Hacker News", icon: Code2, color: "text-orange-300", da: "90+" },
  { name: "Quora", icon: HelpCircle, color: "text-red-400", da: "93" },
  { name: "Substack", icon: Mail, color: "text-orange-400", da: "80+" },
];

const freeTools = [
  {
    icon: Type,
    title: "Headline Analyzer",
    description: "Score your article titles for SEO impact, readability, and click-through potential.",
    href: "/tools/headline-analyzer",
    cta: "Analyze a headline",
  },
  {
    icon: Search,
    title: "AI Content Scorer",
    description: "Analyze your article for AI-readability: FAQ section, structured headings, content type. Get a GEO score.",
    href: "/tools/ai-content-scorer",
    cta: "Score your content",
  },
  {
    icon: Search,
    title: "Keyword Density Analyzer",
    description: "Find the most frequent keywords and phrases in your content. Spot over-optimization instantly.",
    href: "/tools/keyword-density",
    cta: "Analyze density",
  },
  {
    icon: Globe,
    title: "SERP Preview",
    description: "See exactly how your page looks in Google search results. Optimize title and description for maximum clicks.",
    href: "/tools/serp-preview",
    cta: "Preview your result",
  },
];

const stats = [
  { value: "DA 80–99", label: "Platform authority" },
  { value: "2 000+", label: "Words per article" },
  { value: "11", label: "Platforms" },
  { value: "0", label: "Copy/paste needed" },
];

const faqs = [
  {
    q: "What exactly is OctoBoost?",
    a: "OctoBoost is an automated SEO content engine for SaaS. You paste your site URL, we analyze it, generate long-form articles targeting high-opportunity keywords, and publish them across 11 platforms to build backlinks and organic traffic.",
  },
  {
    q: "How does article generation work?",
    a: "We use Claude (Anthropic) to write 2000-2500 word articles in two steps: first a structured outline targeting your keywords, then a full article with proper H1/H2/H3, internal links, and natural product mentions. Each article is unique and tailored to your product.",
  },
  {
    q: "Can I publish directly to my own site?",
    a: "Yes. OctoBoost provides a REST API with your project key to fetch articles, or you can use the GitHub connector to auto-push .md/.mdx files to your repo for static site generators like Astro, Hugo, or Jekyll.",
  },
  {
    q: "Which platforms can you publish to?",
    a: "Auto-publish: Dev.to, Hashnode, WordPress, Telegraph, and Blogger. Adapted content (copy/paste): Medium, Reddit, Indie Hackers, Hacker News, Quora, and Substack. Every variant is adapted to the platform's tone and format.",
  },
  {
    q: "What are canonical URLs and why do they matter?",
    a: "A canonical URL tells Google that the original version of the article lives on your site. This means the backlinks from high-DA platforms like Dev.to (DA 85) or Reddit (DA 99) point back to you, boosting your site's authority.",
  },
  {
    q: "How does scheduling work?",
    a: "When you generate article variants, OctoBoost auto-schedules them with smart constraints: max 2 publications per day, 1 per platform per day, and 2 blog posts per week. A cron job checks every 10 minutes and publishes when the time comes.",
  },
  {
    q: "Is this good for a solo founder?",
    a: "That's exactly who it's built for. Instead of spending hours writing blog posts and cross-posting, you paste your URL, click generate, and OctoBoost handles the rest. One analysis, dozens of SEO articles, published everywhere.",
  },
  {
    q: "How is this different from ChatGPT or other AI writers?",
    a: "AI writers give you text. OctoBoost gives you a full pipeline: keyword research, competitor analysis, topic clustering, article generation, platform adaptation, and automated publishing with canonical backlinks. It's the difference between a tool and a system.",
  },
];

/* ─── Page ──────────────────────────────────────────────── */

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Nav ── */}
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center px-6 pt-16">
        <div className="grid-bg" />

        <div className="relative z-10 mx-auto w-full max-w-4xl text-center">
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tighter sm:text-5xl md:text-7xl">
            <span className="gradient-text">Get discovered</span> on Google<br />
            and cited <span className="gradient-text">by AI</span>
          </h1>
          <p className="mt-6 mb-8 text-base leading-relaxed text-muted sm:text-lg md:text-xl">Automated SEO articles optimized for search engines and AI citations. Zero writing.</p>
          <WaitlistForm />
          <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted/60">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
              Google + AI optimized
            </span>
            <span>11 platforms</span>
          </div>
        </div>

      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">From zero to published <span className="gradient-text">in 3 steps</span></h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            Paste your URL. We handle from keyword research to AI-optimized articles published everywhere.
          </p>
          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="glow-card p-6">
                <s.icon className="mb-3 h-5 w-5 text-accent-light" />
                <h3 className="mb-1.5 text-base font-semibold">{s.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">A full <span className="gradient-text">SEO pipeline</span><br />not just an AI writer</h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            Keyword research, competitor analysis, topic clustering, article generation, and automated publishing with canonical backlinks.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="glow-card p-6">
                <f.icon className="mb-3 h-5 w-5 text-accent-light" />
                <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platforms ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">
            Be everywhere <span className="gradient-text">Google and AI</span> look
          </h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            Publish on your blog, then distribute across the web. Every platform adds a source that Google and AI engines trust.
          </p>

          {/* Your site */}
          <div className="mb-5 rounded-xl border border-accent/30 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent-light" />
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">Your site</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {sitePublish.map((s) => (
                <div key={s.name} className="flex items-start gap-3">
                  <s.icon className="mt-0.5 h-4 w-4 text-accent-light" />
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted">{s.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Zap className="h-4 w-4 text-accent-light" />
                <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">Auto-publish</span>
              </div>
              <div className="space-y-2.5">
                {autoPublishPlatforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <p.icon className={`h-4 w-4 ${p.color}`} />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted">DA {p.da}</span>
                  </div>
                ))}
              </div>
              <p className="mt-auto pt-3 text-xs text-muted">Published via API. Zero manual work.</p>
            </div>

            <div className="flex flex-col rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCopy className="h-4 w-4 text-muted/60" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted/60">Adapted content</span>
              </div>
              <div className="space-y-2.5">
                {adaptedPlatforms.map((p) => (
                  <div key={p.name} className="flex items-center gap-3">
                    <p.icon className={`h-4 w-4 ${p.color}`} />
                    <span className="flex-1 text-sm font-medium">{p.name}</span>
                    <span className="text-xs text-muted">DA {p.da}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">Content adapted per platform. Ready to paste.</p>
            </div>
          </div>
        </div>
      </section>


      {/* ── Free Tools ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">Test our <span className="gradient-text">Toolkit</span></h2>
          <p className="mx-auto mb-12 max-w-lg text-center text-sm text-muted sm:text-base">
            Free tools to help you research, validate, and optimize your content strategy.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            {freeTools.map((tool) => (
              <Link
                key={tool.title}
                href={tool.href}
                className="group glow-card block p-6"
              >
                <tool.icon className="mb-3 h-5 w-5 text-accent-light" />
                <h3 className="mb-1.5 text-base font-semibold">{tool.title}</h3>
                <p className="mb-3 text-sm leading-relaxed text-muted">{tool.description}</p>
                <span className="text-xs font-medium text-accent-light group-hover:underline">
                  {tool.cta} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── FAQ ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-center text-3xl font-bold tracking-tighter md:text-5xl">Frequently Asked <span className="gradient-text">Questions</span></h2>
          <p className="mx-auto mb-10 max-w-md text-center text-sm text-muted">Everything you need to know about OctoBoost</p>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-border bg-card">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 text-sm font-medium transition hover:text-accent-light [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed text-muted">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-3xl font-bold tracking-tighter md:text-5xl">Start growing your traffic <span className="gradient-text">today</span></h2>
          <p className="mx-auto mt-3 mb-6 max-w-md text-sm text-muted">
            Paste your URL and let OctoBoost handle the rest. SEO articles, backlinks, and organic traffic on autopilot.
          </p>
          <WaitlistForm />
          <p className="mt-4 text-xs text-muted/50">No spam · We'll notify you at launch</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Image src="/Logo Octoboost.png" alt="OctoBoost" width={60} height={60} className="h-6 w-6 object-contain" />
            <span className="text-sm font-semibold">OctoBoost</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted/60">
            <Link href="/terms" className="transition hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="transition hover:text-foreground">Privacy</Link>
            <span>&copy; {new Date().getFullYear()} OctoBoost</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
