import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { publishVariant } from "@/lib/engine/publisher";
import { publishToSite, type SiteConnection } from "@/lib/custom-api";
import { publishArticleToGitHub, getValidToken, type GitHubSiteConnection } from "@/lib/github";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!auth || auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const results: { type: string; id: string; success: boolean; error?: string }[] = [];

  const { data: dueVariants } = await supabase
    .from("article_variants")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  for (const v of dueVariants ?? []) {
    const result = await publishVariant(supabase, v.id);
    results.push({
      type: "variant",
      id: v.id,
      success: result.success,
      error: result.error,
    });
  }

  const { data: dueArticles } = await supabase
    .from("articles")
    .select("id, title, slug, content, meta_description, pillar_keyword, supporting_keywords, canonical_url, project_id")
    .eq("status", "scheduled")
    .lte("scheduled_at", now);

  for (const article of dueArticles ?? []) {
    try {
      const { data: project } = await supabase
        .from("projects")
        .select("id, url, site_connection")
        .eq("id", article.project_id)
        .single();

      if (!project) {
        results.push({ type: "article", id: article.id, success: false, error: "Project not found" });
        continue;
      }

      const conn = project.site_connection as SiteConnection | null;
      if (!conn || conn.status !== "connected") {
        await supabase
          .from("articles")
          .update({ status: "published", updated_at: now })
          .eq("id", article.id);
        results.push({ type: "article", id: article.id, success: true });
        continue;
      }

      const slug =
        article.slug ||
        article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");

      const tags = (article.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9 ]/g, "").trim().toLowerCase())
        .filter((t: string) => t.length > 0);

      let resultUrl: string;

      if (conn.type === "github") {
        const ghConn = conn as unknown as GitHubSiteConnection;
        const tokenResult = await getValidToken(ghConn);
        if (!tokenResult) {
          results.push({ type: "article", id: article.id, success: false, error: "GitHub token expired" });
          continue;
        }
        if (tokenResult.updated) {
          const updatedConn = { ...conn, ...tokenResult.updated };
          await supabase.from("projects").update({ site_connection: updatedConn }).eq("id", project.id);
          ghConn.github_token = tokenResult.token;
        }

        const ghResult = await publishArticleToGitHub(ghConn, {
          title: article.title,
          slug,
          content: article.content,
          metaDescription: article.meta_description ?? undefined,
          tags,
        });
        resultUrl = ghResult.url;
      } else {
        if (!conn.endpoint_url || !conn.secret) {
          results.push({ type: "article", id: article.id, success: false, error: "Custom API not configured" });
          continue;
        }
        const apiResult = await publishToSite(conn.endpoint_url, conn.secret, {
          title: article.title,
          slug,
          content: article.content,
          metaDescription: article.meta_description ?? undefined,
          tags,
        });
        resultUrl = apiResult.url;
      }

      await supabase
        .from("articles")
        .update({
          status: "published",
          canonical_url: resultUrl,
          updated_at: now,
        })
        .eq("id", article.id);

      results.push({ type: "article", id: article.id, success: true });
    } catch (e) {
      console.error(`[Cron] Article ${article.id} error:`, e);
      results.push({
        type: "article",
        id: article.id,
        success: false,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
