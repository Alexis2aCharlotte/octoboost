import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function resolveProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  identifier: string,
  userId: string
) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );

  const query = supabase
    .from("projects")
    .select("id, slug, name, url, site_connection, api_key, created_at")
    .eq("user_id", userId);

  if (isUuid) {
    query.eq("id", identifier);
  } else {
    query.eq("slug", identifier);
  }

  return query.single();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project, error } = await resolveProject(supabase, id, user.id);
  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectId = project.id;

  const [analysesRes, articlesRes, channelsRes, variantsRes] =
    await Promise.all([
      supabase
        .from("analyses")
        .select("id, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("articles")
        .select("id, title, status, word_count, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false }),
      supabase
        .from("channels")
        .select("id, platform_type, name, config")
        .eq("project_id", projectId),
      supabase
        .from("article_variants")
        .select(
          "id, title, status, published_url, published_at, channel_id, channels!inner(platform_type, name, project_id)"
        )
        .eq("channels.project_id", projectId)
        .order("published_at", { ascending: false, nullsFirst: false }),
    ]);

  const analyses = analysesRes.data ?? [];
  const articles = articlesRes.data ?? [];
  const channels = channelsRes.data ?? [];
  const variants = variantsRes.data ?? [];

  let keywordCount = 0;
  let clusterCount = 0;
  if (analyses.length > 0) {
    const analysisId = analyses[0].id;
    const [kwRes, clRes] = await Promise.all([
      supabase
        .from("keywords")
        .select("id", { count: "exact", head: true })
        .eq("analysis_id", analysisId),
      supabase
        .from("keyword_clusters")
        .select("id", { count: "exact", head: true })
        .eq("analysis_id", analysisId),
    ]);
    keywordCount = kwRes.count ?? 0;
    clusterCount = clRes.count ?? 0;
  }

  const publishedVariants = variants.filter((v) => v.status === "published");
  const recentPublished = publishedVariants.slice(0, 5).map((v) => ({
    id: v.id,
    title: v.title,
    publishedUrl: v.published_url,
    publishedAt: v.published_at,
    platform: (v.channels as unknown as { platform_type: string })
      ?.platform_type,
  }));

  const hasAnalysis = analyses.length > 0;
  const siteConnection = project.site_connection as Record<
    string,
    unknown
  > | null;
  const hasApiKey = !!project.api_key;
  const hasGitHub =
    siteConnection?.type === "github" &&
    siteConnection?.status === "connected";
  const hasCustomApi =
    siteConnection?.status === "connected" &&
    !!siteConnection?.endpoint_url;
  const siteConnected = hasApiKey || hasGitHub || hasCustomApi;

  const pipeline = {
    siteConnected,
    analysisComplete: hasAnalysis,
    keywordsFound: keywordCount > 0,
    articlesGenerated: articles.length > 0,
    channelsConfigured: channels.length > 0,
    published: publishedVariants.length > 0,
  };

  return NextResponse.json({
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      url: project.url,
      createdAt: project.created_at,
    },
    stats: {
      keywords: keywordCount,
      clusters: clusterCount,
      articles: articles.length,
      articlesPublished: articles.filter((a) => a.status === "published").length,
      channels: channels.length,
      variantsPublished: publishedVariants.length,
      variantsTotal: variants.length,
    },
    pipeline,
    recentArticles: articles.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      wordCount: a.word_count,
      createdAt: a.created_at,
    })),
    recentPublished,
  });
}
