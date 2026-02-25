import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { DEMO_USER_ID, DEMO_PROJECT_SLUG } from "@/lib/demo/constants";

export const revalidate = 60;

function shiftDate(date: string | null | undefined, deltaMs: number): string | null {
  if (!date) return null;
  return new Date(new Date(date).getTime() + deltaMs).toISOString();
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function shiftAllDates(data: any, deltaMs: number): any {
  if (deltaMs === 0) return data;

  const shift = (d: string | null | undefined) => shiftDate(d, deltaMs);

  data.project.createdAt = shift(data.project.createdAt);
  if (data.project.latestAnalysis) {
    data.project.latestAnalysis.created_at = shift(data.project.latestAnalysis.created_at);
  }

  for (const a of data.articles) {
    a.createdAt = shift(a.createdAt);
    a.updatedAt = shift(a.updatedAt);
  }

  for (const c of data.channels) {
    c.createdAt = shift(c.createdAt);
  }

  data.overview.project.createdAt = shift(data.overview.project.createdAt);
  for (const a of data.overview.recentArticles) {
    a.createdAt = shift(a.createdAt);
  }
  for (const p of data.overview.recentPublished) {
    p.publishedAt = shift(p.publishedAt);
  }

  for (const v of data.schedule.variants) {
    v.scheduled_at = shift(v.scheduled_at);
    v.published_at = shift(v.published_at);
  }
  for (const a of data.schedule.articles) {
    a.scheduled_at = shift(a.scheduled_at);
  }

  return data;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function GET() {
  const supabase = createServiceClient();

  const { data: project, error: projError } = await supabase
    .from("projects")
    .select(
      `id, name, slug, url, created_at,
       analyses ( id, site_title, site_description, product_summary, target_audience, content_angles, created_at )`
    )
    .eq("user_id", DEMO_USER_ID)
    .eq("slug", DEMO_PROJECT_SLUG)
    .single();

  if (projError || !project) {
    return NextResponse.json({ error: "Demo project not found" }, { status: 404 });
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
      supabase.from("channels").select("id, project_id, platform_type, name, constraints, created_at").eq("project_id", projectId).order("created_at", { ascending: true }),
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

  const keywords = (kwRes.data ?? []).map((k) => ({
    id: k.id,
    keyword: k.keyword,
    intent: k.intent,
    relevance: k.relevance,
    category: k.category ?? "broad",
    searchVolume: k.search_volume,
    cpc: Number(k.cpc),
    competition: Number(k.competition),
    competitionLevel: k.competition_level,
    trend: k.trend ?? [],
    opportunityScore: k.opportunity_score,
    serpDifficulty: k.serp_difficulty ?? null,
    source: k.source ?? "seed",
    analysisId: k.analysis_id,
  }));

  const clusters = (clusterRes.data ?? []).map((c) => ({
    id: c.id,
    topic: c.topic,
    articleTitle: c.article_title,
    pillarKeyword: c.pillar_keyword,
    supportingKeywords: c.supporting_keywords ?? [],
    searchIntent: c.search_intent,
    difficulty: c.difficulty,
    totalVolume: c.total_volume,
    avgCompetition: Number(c.avg_competition),
  }));

  const articles = (articlesRes.data ?? []).map((a) => ({
    id: a.id,
    clusterId: a.cluster_id,
    title: a.title,
    slug: a.slug,
    wordCount: a.word_count,
    pillarKeyword: a.pillar_keyword,
    metaDescription: a.meta_description,
    status: a.status,
    modelUsed: a.model_used,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  const channels = (channelsRes.data ?? []).map((c) => ({
    id: c.id,
    projectId: c.project_id,
    platformType: c.platform_type,
    name: c.name,
    config: {},
    constraints: c.constraints,
    createdAt: c.created_at,
  }));

  const allVariants = variantsRes.data ?? [];
  const publishedVariants = allVariants.filter((v) => v.status === "published");

  // Analysis result
  const analysis = latestAnalysis
    ? {
        site: { url: project.url, title: latestAnalysis.site_title, description: latestAnalysis.site_description },
        analysis: {
          productSummary: latestAnalysis.product_summary,
          targetAudience: latestAnalysis.target_audience,
          contentAngles: latestAnalysis.content_angles,
        },
        competitors: (competitorsRes.data ?? []).map((c) => ({ name: c.name, url: c.url, reason: c.reason })),
        keywords,
      }
    : null;

  // Overview stats — demo always shows site as connected
  const siteConnected = true;

  const overview = {
    project: { id: project.id, slug: project.slug, name: project.name, url: project.url, createdAt: project.created_at },
    stats: {
      keywords: keywords.length,
      clusters: clusters.length,
      articles: articles.length,
      articlesPublished: articles.filter((a) => a.status === "published").length,
      channels: channels.length,
      variantsPublished: publishedVariants.length,
      variantsTotal: allVariants.length,
    },
    pipeline: {
      siteConnected,
      analysisComplete: !!latestAnalysisId,
      keywordsFound: keywords.length > 0,
      articlesGenerated: articles.length > 0,
      channelsConfigured: channels.length > 0,
      published: publishedVariants.length > 0,
    },
    recentArticles: articles.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      wordCount: a.wordCount,
      createdAt: a.createdAt,
    })),
    recentPublished: publishedVariants.slice(0, 5).map((v) => ({
      id: v.id,
      title: v.title,
      publishedUrl: v.published_url,
      publishedAt: v.published_at,
      platform: (v.channels as unknown as { platform_type: string })?.platform_type,
    })),
  };

  // Project info (matching /api/projects/[id] shape)
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const analysesLast30d = sortedAnalyses.filter(
    (a) => new Date(a.created_at).getTime() > thirtyDaysAgo
  ).length;

  const projectInfo = {
    projectId: project.id,
    slug: project.slug,
    name: project.name,
    url: project.url,
    createdAt: project.created_at,
    latestAnalysisId,
    latestAnalysis: latestAnalysis
      ? { id: latestAnalysis.id, site_title: latestAnalysis.site_title, created_at: latestAnalysis.created_at }
      : null,
    analysesLast30d,
    totalAnalyses: analyses.length,
  };

  // Schedule data
  const schedule = {
    variants: scheduleVarRes.data ?? [],
    articles: (scheduleArtRes.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      scheduled_at: a.scheduled_at,
      canonical_url: a.canonical_url,
    })),
  };

  // Dynamic date shifting: find the latest article date, shift so it = 1 day ago
  const allArticleDates = articles.map((a) => new Date(a.createdAt).getTime()).filter(Boolean);
  const anchorMs = allArticleDates.length > 0 ? Math.max(...allArticleDates) : Date.now();
  const targetMs = Date.now() - 24 * 60 * 60 * 1000; // yesterday
  const deltaMs = targetMs - anchorMs;

  const result = {
    project: projectInfo,
    keywords,
    clusters,
    articles,
    channels,
    analysis,
    overview,
    schedule,
  };

  const shifted = shiftAllDates(result, deltaMs);

  // Post-process schedule variants for demo: mix of published / scheduled / copy
  const sv = shifted.schedule.variants as Array<Record<string, unknown>>;
  if (sv.length > 0) {
    const keepPublished = Math.ceil(sv.length * 0.4);

    // Find the latest day among published variants to avoid overlap
    let lastPublishedDay = new Date();
    lastPublishedDay.setHours(0, 0, 0, 0);
    for (let i = 0; i < keepPublished; i++) {
      const d = new Date(sv[i].scheduled_at as string);
      if (d > lastPublishedDay) lastPublishedDay = d;
    }
    const scheduleStart = new Date(lastPublishedDay);
    scheduleStart.setDate(scheduleStart.getDate() + 1);
    scheduleStart.setHours(0, 0, 0, 0);

    for (let i = 0; i < sv.length; i++) {
      if (i >= keepPublished) {
        sv[i].status = "scheduled";
        sv[i].published_at = null;
        sv[i].published_url = null;
        const idx = i - keepPublished;
        const dayOffset = Math.floor(idx / 2);
        const d = new Date(scheduleStart);
        d.setDate(d.getDate() + dayOffset);
        d.setHours(idx % 2 === 0 ? 10 : 16, 0, 0, 0);
        sv[i].scheduled_at = d.toISOString();
      }
    }
  }

  return NextResponse.json(shifted);
}
