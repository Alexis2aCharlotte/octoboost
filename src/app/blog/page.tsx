import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { WaitlistForm } from "@/components/WaitlistForm";
import { fetchAllPosts, type BlogPost } from "./data";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog — SEO Insights & Content Strategy",
  description:
    "Actionable SEO tips, content strategy guides, GEO insights, and case studies from OctoBoost. Learn how to rank on Google and get cited by AI.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog — SEO Insights & Content Strategy | OctoBoost",
    description:
      "Actionable SEO tips, content strategy guides, GEO insights, and case studies from OctoBoost.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog — SEO Insights & Content Strategy | OctoBoost",
    description:
      "Actionable SEO tips, content strategy guides, GEO insights, and case studies from OctoBoost.",
  },
};

const categoryEmojis: Record<string, string> = {
  SEO: "🔍",
  GEO: "🤖",
  "Content Strategy": "✍️",
  "Case Studies": "📊",
  Guides: "📘",
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PostCard({ post }: { post: BlogPost }) {
  const emoji = categoryEmojis[post.category || ""] || "📝";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-accent/30 hover:bg-card-hover"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden">
        {post.cover_image ? (
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/15 to-accent/5">
            <span className="text-5xl">{emoji}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center gap-3">
          {post.category && (
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-light">
              {post.category}
            </span>
          )}
          {post.published_at && (
            <span className="text-xs text-muted/60">
              {formatDate(post.published_at)}
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug transition-colors group-hover:text-accent-light">
          {post.title}
        </h3>

        {post.excerpt && (
          <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-muted">
            {post.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-muted/60">{post.author}</span>
          <span className="flex items-center gap-1 text-xs font-medium text-accent-light transition-colors group-hover:underline">
            Read more <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const posts = await fetchAllPosts();

  return (
    <main className="isolate flex min-h-screen flex-col bg-background text-foreground">
      <Navbar />

      <section className="relative px-6 pt-28 pb-12">
        <div className="grid-bg" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <span className="mb-4 inline-block rounded-full border border-accent/20 bg-accent/5 px-4 py-1.5 text-xs font-medium text-accent-light">
            {posts.length} article{posts.length !== 1 ? "s" : ""} published
          </span>
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            The OctoBoost{" "}
            <span className="gradient-text">Blog</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-muted sm:text-base">
            SEO insights, content strategy guides, and everything you need to
            rank on Google and get cited by AI.
          </p>
        </div>
      </section>

      <section className="relative z-10 px-6 pb-16">
        <div className="mx-auto max-w-5xl">
          {posts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <BookOpen className="h-8 w-8 text-accent-light" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">
                Coming Soon
              </h2>
              <p className="mt-3 max-w-sm text-sm text-muted">
                We&apos;re preparing articles about SEO, GEO, and AI-powered
                content strategy.
              </p>
              <Link
                href="/"
                className="btn-glow mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
              >
                Start generating
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="relative z-10 px-6 py-16 md:py-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold tracking-tighter md:text-4xl">
            Start growing your traffic{" "}
            <span className="gradient-text">today</span>
          </h2>
          <p className="mx-auto mt-3 mb-6 max-w-md text-sm text-muted">
            Paste your URL and let OctoBoost handle the rest. SEO articles,
            backlinks, and organic traffic on autopilot.
          </p>
          <WaitlistForm />
          <div className="mt-4 flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-xs text-muted/50">
              <div className="flex -space-x-1.5">
                {[3, 11, 32, 44, 49].map((id) => (
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
                <strong className="text-foreground/70">67 founders</strong> joined
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted/50">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" />
                Google + AI optimized
              </span>
              <span>11 platforms</span>
              <span>Autopilot publishing</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
