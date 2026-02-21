import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateArticle } from "@/lib/engine/article-generator";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clusterId, projectId } = await req.json();

  if (!clusterId || !projectId) {
    return NextResponse.json(
      { error: "clusterId and projectId are required" },
      { status: 400 }
    );
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from("projects")
    .select("id, name, url")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  // Check if article already exists for this cluster
  const { data: existing } = await supabase
    .from("articles")
    .select("id")
    .eq("cluster_id", clusterId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Article already exists for this cluster", articleId: existing.id },
      { status: 409 }
    );
  }

  // Fetch cluster data
  const { data: cluster, error: clusterError } = await supabase
    .from("keyword_clusters")
    .select("*")
    .eq("id", clusterId)
    .single();

  if (clusterError || !cluster) {
    return NextResponse.json(
      { error: "Cluster not found" },
      { status: 404 }
    );
  }

  // Fetch product context from latest analysis
  const { data: analysis } = await supabase
    .from("analyses")
    .select("product_summary, target_audience, site_title")
    .eq("id", cluster.analysis_id)
    .single();

  try {
    // Fetch site pages for internal linking
    const { data: sitePages } = await supabase
      .from("site_pages")
      .select("path, title, description")
      .eq("project_id", projectId)
      .order("path");

    const result = await generateArticle({
      cluster: {
        topic: cluster.topic,
        articleTitle: cluster.article_title,
        pillarKeyword: cluster.pillar_keyword,
        supportingKeywords: cluster.supporting_keywords ?? [],
        searchIntent: cluster.search_intent ?? "informational",
        difficulty: cluster.difficulty ?? "medium",
        totalVolume: cluster.total_volume ?? 0,
      },
      productContext: {
        name: analysis?.site_title ?? project.name ?? "",
        url: project.url,
        summary: analysis?.product_summary ?? "",
        targetAudience: analysis?.target_audience ?? "",
      },
      sitePages: sitePages?.map((p) => ({
        path: p.path,
        title: p.title,
        description: p.description,
      })),
    });

    const slug = result.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    console.log("[ArticleGen] Inserting article:", { clusterId, projectId, title: result.title, wordCount: result.wordCount });

    const { data: article, error: insertError } = await supabase
      .from("articles")
      .insert({
        cluster_id: clusterId,
        project_id: projectId,
        title: result.title,
        slug,
        content: result.content,
        outline: result.outline,
        word_count: result.wordCount,
        pillar_keyword: cluster.pillar_keyword,
        supporting_keywords: cluster.supporting_keywords ?? [],
        meta_description: result.metaDescription,
        status: "draft",
        model_used: "claude-sonnet-4.6",
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("[ArticleGen] Insert error:", insertError);
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    console.log("[ArticleGen] Article inserted:", article.id);

    return NextResponse.json({
      articleId: article.id,
      title: result.title,
      wordCount: result.wordCount,
      metaDescription: result.metaDescription,
    });
  } catch (e) {
    console.error("Article generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
