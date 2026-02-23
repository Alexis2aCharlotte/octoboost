import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishToSite, type SiteConnection } from "@/lib/custom-api";
import { publishArticleToGitHub, getValidToken, type GitHubSiteConnection } from "@/lib/github";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { articleId } = await req.json();
  if (!articleId)
    return NextResponse.json(
      { error: "articleId is required" },
      { status: 400 }
    );

  const { data: article, error: artErr } = await supabase
    .from("articles")
    .select(
      "id, title, slug, content, meta_description, pillar_keyword, supporting_keywords, status, canonical_url, project_id"
    )
    .eq("id", articleId)
    .single();

  if (artErr || !article)
    return NextResponse.json({ error: "Article not found" }, { status: 404 });

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, name, url, site_connection")
    .eq("id", article.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project)
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const conn = project.site_connection as SiteConnection | null;
  if (!conn || conn.status !== "connected") {
    return NextResponse.json(
      { error: "Site not connected. Go to Publish > My Site to connect your site first." },
      { status: 400 }
    );
  }

  if (article.status === "published" && article.canonical_url) {
    return NextResponse.json(
      { error: "Already published", url: article.canonical_url },
      { status: 409 }
    );
  }

  try {
    const slug =
      article.slug ||
      article.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const tags = (article.supporting_keywords ?? [])
      .slice(0, 5)
      .map((k: string) =>
        k
          .replace(/[^a-zA-Z0-9 ]/g, "")
          .trim()
          .toLowerCase()
      )
      .filter((t: string) => t.length > 0);

    let resultUrl: string;

    if (conn.type === "github") {
      const ghConn = conn as unknown as GitHubSiteConnection;
      if (!ghConn.github_token || !ghConn.repo_owner || !ghConn.repo_name) {
        return NextResponse.json({ error: "GitHub repo not configured" }, { status: 400 });
      }

      const tokenResult = await getValidToken(ghConn);
      if (!tokenResult) {
        return NextResponse.json({ error: "GitHub token expired. Please reconnect." }, { status: 401 });
      }
      if (tokenResult.updated) {
        const updatedConn = { ...conn, ...tokenResult.updated };
        await supabase.from("projects").update({ site_connection: updatedConn }).eq("id", project.id);
        ghConn.github_token = tokenResult.token;
      }

      const result = await publishArticleToGitHub(ghConn, {
        title: article.title,
        slug,
        content: article.content,
        metaDescription: article.meta_description ?? undefined,
        tags,
        siteUrl: project.url ?? "",
        siteName: project.name ?? "",
      });
      resultUrl = result.url;
    } else {
      if (!conn.endpoint_url || !conn.secret) {
        return NextResponse.json({ error: "Custom API not configured" }, { status: 400 });
      }
      const result = await publishToSite(conn.endpoint_url, conn.secret, {
        title: article.title,
        slug,
        content: article.content,
        metaDescription: article.meta_description ?? undefined,
        tags,
      });
      resultUrl = result.url;
    }

    await supabase
      .from("articles")
      .update({
        status: "published",
        canonical_url: resultUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", articleId);

    return NextResponse.json({ success: true, url: resultUrl });
  } catch (e) {
    console.error("[Publish/Site] error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 500 }
    );
  }
}
