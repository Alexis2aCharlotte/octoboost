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

export function generateSnippetNextjs(secret: string): string {
  return `// app/api/octoboost/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== \`Bearer \${process.env.OCTOBOOST_SECRET}\`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Test ping — just return OK
  if (body._test) {
    return NextResponse.json({ success: true, url: "" });
  }

  const { title, slug, content, contentHtml, metaDescription, tags } = body;

  // ─── Adapt this to your stack ───
  // Example: save to your database, write an MDX file, etc.
  //
  // await db.posts.create({
  //   title,
  //   slug,
  //   content,       // markdown
  //   contentHtml,   // pre-rendered HTML
  //   metaDescription,
  //   tags,
  // });

  const url = \`\${process.env.NEXT_PUBLIC_SITE_URL}/blog/\${slug}\`;
  return NextResponse.json({ success: true, url });
}`;
}

export function generateSnippetExpress(): string {
  return `// routes/octoboost.js
const express = require("express");
const router = express.Router();

router.post("/api/octoboost", (req, res) => {
  const auth = req.headers.authorization;
  if (auth !== \`Bearer \${process.env.OCTOBOOST_SECRET}\`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Test ping
  if (req.body._test) {
    return res.json({ success: true, url: "" });
  }

  const { title, slug, content, contentHtml, metaDescription, tags } = req.body;

  // ─── Adapt this to your stack ───
  // Save to your database, write a file, etc.

  const url = \`\${process.env.SITE_URL}/blog/\${slug}\`;
  res.json({ success: true, url });
});

module.exports = router;`;
}
