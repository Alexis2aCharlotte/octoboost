import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { marked } from "marked";
import { ArrowLeft, ArrowRight, Calendar, Eye, User } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { fetchPostBySlug, fetchAllSlugs } from "../data";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await fetchAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) return { title: "Article not found" };

  const title = post.meta_title || post.title;
  const description =
    post.meta_description || post.excerpt || "Read this article on OctoBoost.";

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `/blog/${post.slug}`,
      type: "article",
      ...(post.cover_image && { images: [{ url: post.cover_image }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(post.cover_image && { images: [post.cover_image] }),
    },
  };
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatISODate(dateStr: string): string {
  return new Date(dateStr).toISOString();
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await fetchPostBySlug(slug);
  if (!post) notFound();

  const htmlContent = marked(post.content) as string;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.meta_description || post.excerpt || "",
    ...(post.cover_image && { image: post.cover_image }),
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: "OctoBoost",
      url: "https://octoboost.app",
      logo: {
        "@type": "ImageObject",
        url: "https://octoboost.app/Logo%20Octoboost.png",
      },
    },
    datePublished: post.published_at
      ? formatISODate(post.published_at)
      : formatISODate(post.created_at),
    dateModified: formatISODate(post.updated_at),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://octoboost.app/blog/${post.slug}`,
    },
  };

  return (
    <main className="isolate flex min-h-screen flex-col bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <article className="relative z-10 px-6 pt-28 pb-16">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-xs text-muted/60">
            <Link href="/" className="transition hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="transition hover:text-foreground">
              Blog
            </Link>
            <span>/</span>
            <span className="truncate max-w-[200px] text-muted">
              {post.title}
            </span>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              {post.category && (
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-light">
                  {post.category}
                </span>
              )}
              {post.published_at && (
                <span className="flex items-center gap-1.5 text-xs text-muted/60">
                  <Calendar className="h-3 w-3" />
                  {formatDate(post.published_at)}
                </span>
              )}
              {post.views > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-muted/60">
                  <Eye className="h-3 w-3" />
                  {post.views.toLocaleString()} views
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">
                {post.excerpt}
              </p>
            )}

            <div className="mt-6 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10">
                <User className="h-4 w-4 text-accent-light" />
              </div>
              <div>
                <p className="text-sm font-medium">{post.author}</p>
                <p className="text-xs text-muted/60">Author</p>
              </div>
            </div>
          </header>

          {/* Cover image */}
          {post.cover_image && (
            <div className="relative mb-10 aspect-[2/1] w-full overflow-hidden rounded-2xl border border-border">
              <Image
                src={post.cover_image}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:font-bold prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-muted prose-p:leading-relaxed prose-a:text-accent-light prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground prose-ul:text-muted prose-ol:text-muted prose-li:marker:text-accent-light prose-blockquote:border-accent prose-blockquote:text-muted prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-card prose-pre:border prose-pre:border-border"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border pt-8">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted transition-colors hover:border-accent/30 hover:text-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5 p-8 text-center">
            <h3 className="text-xl font-bold tracking-tight sm:text-2xl">
              Automate your SEO pipeline
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted">
              From keyword research to multi-platform publishing. Let OctoBoost
              handle your content strategy on autopilot.
            </p>
            <Link
              href="/waitlist"
              className="btn-glow mt-5 inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
            >
              Get early access
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm text-accent-light transition-colors hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to all articles
            </Link>
          </div>
        </div>
      </article>

      <Footer />
    </main>
  );
}
