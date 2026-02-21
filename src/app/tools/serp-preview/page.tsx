"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Monitor, Smartphone, Globe } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ToolCta } from "@/components/ToolCta";

const TITLE_LIMIT = 60;
const DESC_LIMIT = 160;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

function formatUrl(url: string): string {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const path = u.pathname === "/" ? "" : u.pathname;
    return `${u.hostname}${path}`;
  } catch {
    return url || "yourURL.example.com";
  }
}

function buildBreadcrumb(url: string): string[] {
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    const parts = [u.hostname];
    const segments = u.pathname.split("/").filter(Boolean);
    for (const seg of segments) {
      parts.push(seg.replace(/-/g, " "));
    }
    return parts;
  } catch {
    return [url || "yourURL.example.com"];
  }
}

export default function SerpPreviewPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [view, setView] = useState<"desktop" | "mobile">("desktop");

  const hasContent = title.trim().length > 0 || description.trim().length > 0;

  const displayTitle = title.trim() || "Your Page Title Goes Here";
  const displayDesc = description.trim() || "Your meta description will appear here. Write a compelling 150-160 character description to improve your click-through rate from Google search results.";
  const displayUrl = formatUrl(url);
  const breadcrumb = buildBreadcrumb(url);

  const titleLen = title.trim().length;
  const descLen = description.trim().length;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="mx-auto max-w-3xl px-6 pt-24 pb-16">
        <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground">
          <ArrowLeft className="h-3 w-3" />
          Back to home
        </Link>

        <div className="mb-1 flex items-center gap-2">
          <Globe className="h-5 w-5 text-accent-light" />
          <h1 className="text-2xl font-bold">SERP Preview</h1>
        </div>
        <p className="mb-8 text-sm text-muted">
          See exactly how your page will look in Google search results. Optimize your title and meta description for maximum clicks. 100% free.
        </p>

        {/* Inputs */}
        <div className="mb-8 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Page Title</label>
              <span className={`text-xs ${titleLen > TITLE_LIMIT ? "text-red-400" : titleLen > 0 ? "text-green-400" : "text-muted"}`}>
                {titleLen}/{TITLE_LIMIT}
              </span>
            </div>
            <input
              type="text"
              placeholder="e.g. 10 Best SEO Tools for Startups in 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
              autoFocus
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Meta Description</label>
              <span className={`text-xs ${descLen > DESC_LIMIT ? "text-red-400" : descLen > 0 ? "text-green-400" : "text-muted"}`}>
                {descLen}/{DESC_LIMIT}
              </span>
            </div>
            <textarea
              placeholder="e.g. Discover the top SEO tools that help startups grow organic traffic fast. Compared features, pricing, and results."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium">URL</label>
            <input
              type="text"
              placeholder="e.g. yourURL.example.com/blog/best-seo-tools"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:border-accent/50 focus:outline-none"
            />
          </div>
        </div>

        {/* Device toggle */}
        <div className="mb-4 flex items-center gap-2">
          <button
            onClick={() => setView("desktop")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${view === "desktop" ? "bg-accent/10 text-accent-light" : "text-muted hover:text-foreground"}`}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setView("mobile")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${view === "mobile" ? "bg-accent/10 text-accent-light" : "text-muted hover:text-foreground"}`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
        </div>

        {/* Google Preview */}
        <div className="rounded-xl border border-border bg-white p-6">
          <div className={view === "mobile" ? "max-w-[360px]" : ""}>
            {/* Breadcrumb */}
            <div className="mb-1 flex items-center gap-1">
              <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-gray-100">
                <Globe className="h-3.5 w-3.5 text-gray-500" />
              </div>
              <div className="ml-1.5">
                <p className="text-xs leading-tight text-gray-800">{displayUrl.split("/")[0]}</p>
                <p className="text-xs leading-tight text-gray-500">
                  {breadcrumb.map((part, i) => (
                    <span key={i}>
                      {i > 0 && <span className="mx-0.5">&rsaquo;</span>}
                      {part}
                    </span>
                  ))}
                </p>
              </div>
            </div>

            {/* Title */}
            <h3
              className={`mb-0.5 cursor-pointer font-medium leading-snug text-[#1a0dab] hover:underline ${view === "mobile" ? "text-[16px]" : "text-[20px]"}`}
            >
              {truncate(displayTitle, TITLE_LIMIT)}
            </h3>

            {/* Description */}
            <p className={`leading-relaxed text-[#4d5156] ${view === "mobile" ? "text-xs" : "text-[13px]"}`}>
              {truncate(displayDesc, DESC_LIMIT)}
            </p>
          </div>
        </div>

        {/* Warnings */}
        {hasContent && (
          <div className="mt-5 space-y-2">
            {titleLen === 0 && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
                Missing title tag — Google will generate one automatically (bad for CTR).
              </p>
            )}
            {titleLen > 0 && titleLen < 30 && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
                Title is short ({titleLen} chars). Aim for 50-60 characters to maximize SERP real estate.
              </p>
            )}
            {titleLen > TITLE_LIMIT && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
                Title will be truncated ({titleLen} chars). Google cuts off at ~{TITLE_LIMIT} characters.
              </p>
            )}
            {titleLen >= 50 && titleLen <= TITLE_LIMIT && (
              <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2 text-xs text-green-400">
                Perfect title length ({titleLen} chars) — fully visible in search results.
              </p>
            )}
            {descLen === 0 && titleLen > 0 && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
                Missing meta description — Google will auto-generate one from your page content.
              </p>
            )}
            {descLen > 0 && descLen < 120 && (
              <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-400">
                Description is short ({descLen} chars). Aim for 150-160 characters.
              </p>
            )}
            {descLen > DESC_LIMIT && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-400">
                Description will be truncated ({descLen} chars). Google cuts off at ~{DESC_LIMIT} characters.
              </p>
            )}
            {descLen >= 140 && descLen <= DESC_LIMIT && (
              <p className="rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-2 text-xs text-green-400">
                Great description length ({descLen} chars) — compelling and fully visible.
              </p>
            )}
          </div>
        )}

        {hasContent && <ToolCta currentTool="/tools/serp-preview" />}
      </div>
    </main>
  );
}
