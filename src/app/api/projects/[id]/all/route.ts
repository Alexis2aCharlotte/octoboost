import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = isDemoRequest(req);
  const supabase = isDemo ? createDemoClient() : await createClient();

  let userId: string;
  if (isDemo) {
    userId = getDemoUserId();
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    userId = user.id;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const projQuery = supabase
    .from("projects")
    .select(`id, name, slug, url, site_connection, api_key, created_at,
             analyses ( id, site_title, site_description, product_summary, target_audience, content_angles, created_at )`)
    .eq("user_id", userId);

  if (isUuid) projQuery.eq("id", id);
  else projQuery.eq("slug", id);

  const { data: project, error: projError } = await projQuery.single();
  if (projError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const projectId = project.id;
  const analyses = Array.isArray(project.analyses) ? project.analyses : [];
  const sortedAnalyses = [...analyses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latestAnalysis = sortedAnalyses[0] ?? null;
  const latestAnalysisId = latestAnalysis?.id ?? null;

  const [kwRes, clusterRes, articlesRes, channelsRes, variantsRes, competitorsRes, scheduleVarRes, scheduleArtRes] =
    await Promise.all([
      latestAnalysisId
        ? supabase.from("keywords").select("*").eq("analysis_id", latestAnalysisId).order("opportunity_score", { ascending: false })
        : Promise.resolve({ data: [] }),
      latestAnalysisId
        ? supabase.from("keyword_clusters").select("*").eq("analysis_id", latestAnalysisId).order("total_volume", { ascending: false })
        : Promise.resolve({ data: [] }),
      supabase.from("articles").select("id, cluster_id, title, slug, word_count, pillar_keyword, meta_description, status, model_used, created_at, updated_at").eq("project_id", projectId).order("created_at", { ascending: false }),
      supabase.from("channels").select("id, project_id, platform_type, name, config, constraints, created_at").eq("project_id", projectId).order("created_at", { ascending: true }),
      supabase
        .from("article_variants")
        .select("id, title, status, published_url, published_at, scheduled_at, channel_id, article_id, word_count, format, channels!inner(platform_type, name, project_id), articles!inner(title, pillar_keyword)")
        .eq("channels.project_id", projectId)
        .order("published_at", { ascending: false, nullsFirst: false }),
      latestAnalysisId
        ? supabase.from("competitors").select("*").eq("analysis_id", latestAnalysisId)
        : Promise.resolve({ data: [] }),
      supabase
        .from("article_variants")
        .select("id, title, status, scheduled_at, published_at, published_url, channel_id, article_id, channels!inner(platform_type, name, project_id), articles!inner(title, pillar_keyword)")
        .eq("channels.project_id", projectId)
        .not("scheduled_at", "is", null)
        .order("scheduled_at", { ascending: true }),
      supabase
        .from("articles")
        .select("id, title, status, scheduled_at, slug, canonical_url")
        .eq("project_id", projectId)
        .not("scheduled_at", "is", null)
        .in("status", ["scheduled", "published"])
        .order("scheduled_at", { ascending: true }),
    ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const keywords = (kwRes.data ?? []).map((k: any) => ({
    id: k.id, keyword: k.keyword, intent: k.intent, relevance: k.relevance,
    category: k.category ?? "broad", searchVolume: k.search_volume,
    cpc: Number(k.cpc), competition: Number(k.competition),
    competitionLevel: k.competition_level, trend: k.trend ?? [],
    opportunityScore: k.opportunity_score, serpDifficulty: k.serp_difficulty ?? null,
    source: k.source ?? "seed", analysisId: k.analysis_id,
  }));

  const clusters = (clusterRes.data ?? []).map((c: any) => ({
    id: c.id, topic: c.topic, articleTitle: c.article_title,
    pillarKeyword: c.pillar_keyword, supportingKeywords: c.supporting_keywords ?? [],
    searchIntent: c.search_intent, difficulty: c.difficulty,
    totalVolume: c.total_volume, avgCompetition: Number(c.avg_competition),
  }));

  const articles = (articlesRes.data ?? []).map((a: any) => ({
    id: a.id, clusterId: a.cluster_id, title: a.title, slug: a.slug,
    wordCount: a.word_count, pillarKeyword: a.pillar_keyword,
    metaDescription: a.meta_description, status: a.status,
    modelUsed: a.model_used, createdAt: a.created_at, updatedAt: a.updated_at,
  }));

  const channels = (channelsRes.data ?? []).map((c: any) => ({
    id: c.id, projectId: c.project_id, platformType: c.platform_type,
    name: c.name, config: c.config ?? {}, constraints: c.constraints,
    createdAt: c.created_at,
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const allVariants = variantsRes.data ?? [];
  const publishedVariants = allVariants.filter((v) => v.status === "published");

  const analysis = latestAnalysis
    ? {
        site: { url: project.url, title: latestAnalysis.site_title, description: latestAnalysis.site_description },
        analysis: { productSummary: latestAnalysis.product_summary, targetAudience: latestAnalysis.target_audience, contentAngles: latestAnalysis.content_angles },
        competitors: (competitorsRes.data ?? []).map((c) => ({ name: c.name, url: c.url, reason: c.reason })),
        keywords,
      }
    : null;

  const siteConn = project.site_connection as Record<string, unknown> | null;
  const hasApiKey = !!project.api_key;
  const hasGitHub = siteConn?.type === "github" && siteConn?.status === "connected";
  const hasCustomApi = siteConn?.status === "connected" && !!siteConn?.endpoint_url;
  const siteConnected = hasApiKey || !!hasGitHub || !!hasCustomApi;

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const analysesLast30d = sortedAnalyses.filter(
    (a) => new Date(a.created_at).getTime() > thirtyDaysAgo
  ).length;

  return NextResponse.json({
    project: {
      projectId: project.id, slug: project.slug, name: project.name,
      url: project.url, createdAt: project.created_at,
      latestAnalysisId,
      latestAnalysis: latestAnalysis
        ? { id: latestAnalysis.id, site_title: latestAnalysis.site_title, created_at: latestAnalysis.created_at }
        : null,
      analysesLast30d, totalAnalyses: analyses.length,
    },
    keywords,
    clusters,
    articles,
    channels,
    analysis,
    overview: {
      project: { id: project.id, slug: project.slug, name: project.name, url: project.url, createdAt: project.created_at },
      stats: {
        keywords: keywords.length, clusters: clusters.length,
        articles: articles.length, articlesPublished: articles.filter((a) => a.status === "published").length,
        channels: channels.length, variantsPublished: publishedVariants.length, variantsTotal: allVariants.length,
      },
      pipeline: {
        siteConnected, analysisComplete: !!latestAnalysisId,
        keywordsFound: keywords.length > 0, articlesGenerated: articles.length > 0,
        channelsConfigured: channels.length > 0, published: publishedVariants.length > 0,
      },
      recentArticles: articles.slice(0, 5).map((a) => ({
        id: a.id, title: a.title, status: a.status, wordCount: a.wordCount, createdAt: a.createdAt,
      })),
      recentPublished: publishedVariants.slice(0, 5).map((v) => ({
        id: v.id, title: v.title, publishedUrl: v.published_url, publishedAt: v.published_at,
        platform: (v.channels as unknown as { platform_type: string })?.platform_type,
      })),
    },
    schedule: {
      variants: scheduleVarRes.data ?? [],
      articles: (scheduleArtRes.data ?? []).map((a) => ({
        id: a.id, title: a.title, status: a.status, scheduled_at: a.scheduled_at, canonical_url: a.canonical_url,
      })),
    },
    connection: siteConn,
    apiKey: project.api_key,
  });
}
