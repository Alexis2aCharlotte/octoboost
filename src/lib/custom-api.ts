/**
 * Custom API connector — Publish articles to the user's own site
 * via a webhook endpoint they deploy (e.g. Next.js API route).
 *
 * Protocol:
 *   POST <endpoint_url>
 *   Headers: Authorization: Bearer <secret>
 *   Body: { title, slug, content, contentHtml, metaDescription, tags, canonicalUrl? }
 *   Expected response: { success: true, url: "https://..." }
 */

import { marked } from "marked";

export interface SiteConnection {
  type: "custom_api" | "github" | "wordpress" | "none";
  endpoint_url?: string;
  secret?: string;
  status: "connected" | "disconnected" | "error";
  last_tested_at?: string;
  last_error?: string;
  // GitHub-specific fields
  github_token?: string;
  github_refresh_token?: string;
  github_token_expires_at?: string;
  installation_id?: number;
  repo_owner?: string;
  repo_name?: string;
  branch?: string;
  content_dir?: string;
  file_format?: "md" | "mdx";
  connected_at?: string;
}

export interface PublishToSitePayload {
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  tags?: string[];
  canonicalUrl?: string;
}

export interface PublishToSiteResult {
  success: boolean;
  url: string;
}

export async function testSiteConnection(
  endpointUrl: string,
  secret: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = new URL(endpointUrl);
    if (!url.protocol.startsWith("http")) {
      return { valid: false, error: "URL must start with http:// or https://" };
    }
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  try {
    const res = await fetch(endpointUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        _test: true,
        title: "OctoBoost Connection Test",
        slug: "octoboost-test",
        content: "This is a test from OctoBoost to verify the connection.",
        contentHtml: "<p>This is a test from OctoBoost to verify the connection.</p>",
        metaDescription: "Test connection",
        tags: ["test"],
      }),
    });

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "Authentication failed — check your secret token" };
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { valid: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
    }

    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Connection failed",
    };
  }
}

export async function publishToSite(
  endpointUrl: string,
  secret: string,
  payload: PublishToSitePayload
): Promise<PublishToSiteResult> {
  const contentHtml = String(await marked.parse(payload.content));

  const res = await fetch(endpointUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      contentHtml,
      metaDescription: payload.metaDescription,
      tags: payload.tags ?? [],
      canonicalUrl: payload.canonicalUrl,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Publish failed (HTTP ${res.status}): ${text.slice(0, 300)}`);
  }

  const data = await res.json();

  if (!data.success && !data.url) {
    throw new Error(data.error ?? "Publish failed — no URL returned");
  }

  return { success: true, url: data.url };
}

export function generateSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "ob_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "ob_pk_";
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateSnippetFetchUtil(apiKey: string): string {
  return `// lib/octoboost.ts
// Utility to fetch your OctoBoost articles — add this file to your project

const OCTOBOOST_KEY = "${apiKey}";
const BASE_URL = "https://octoboost.app/api/public/articles";

export type OctoArticle = {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keyword: string;
  tags: string[];
  wordCount: number;
  publishedAt: string;
};

/** Fetch all published articles */
export async function getOctoArticles(): Promise<OctoArticle[]> {
  const res = await fetch(\`\${BASE_URL}?key=\${OCTOBOOST_KEY}\`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.articles ?? [];
}

/** Fetch a single article by slug */
export async function getOctoArticle(
  slug: string
): Promise<OctoArticle | null> {
  const res = await fetch(\`\${BASE_URL}/\${slug}?key=\${OCTOBOOST_KEY}\`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  return res.json();
}`;
}

export function generateSnippetUsageExample(apiKey: string): string {
  void apiKey;
  return `// Example: integrate in your existing blog page
// Works alongside your current articles — nothing gets replaced

import { getOctoArticles } from "@/lib/octoboost";

// In your existing blog page or data fetching:
const octoArticles = await getOctoArticles();

// Merge with your existing posts:
const allPosts = [
  ...yourExistingPosts,
  ...octoArticles.map((a) => ({
    title: a.title,
    slug: a.slug,
    description: a.metaDescription,
    date: a.publishedAt,
    source: "octoboost",
  })),
].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// For individual article pages (e.g. app/blog/[slug]/page.tsx):
import { getOctoArticle } from "@/lib/octoboost";

const article = await getOctoArticle(slug);
// If null → it's not from OctoBoost, use your normal logic
// If found → render article.content (markdown) with your existing styles`;
}
