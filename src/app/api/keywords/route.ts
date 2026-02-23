import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

export async function GET(req: NextRequest) {
  const isDemo = isDemoRequest(req);
  const supabase = isDemo ? createDemoClient() : await createClient();

  let userId: string;
  if (isDemo) {
    userId = getDemoUserId();
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  const projectParam = req.nextUrl.searchParams.get("projectId");

  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("user_id", userId);

  if (!projects || projects.length === 0) {
    return NextResponse.json({ keywords: [], clusters: [], projects: [] });
  }

  let projectIds: string[];
  if (projectParam) {
    const isUuid = /^[0-9a-f]{8}-/i.test(projectParam);
    const match = projects.find((p) =>
      isUuid ? p.id === projectParam : p.slug === projectParam
    );
    projectIds = match ? [match.id] : [];
  } else {
    projectIds = projects.map((p) => p.id);
  }

  if (projectIds.length === 0) {
    return NextResponse.json({ keywords: [], clusters: [], projects });
  }

  const { data: analyses } = await supabase
    .from("analyses")
    .select("id, project_id, created_at")
    .in("project_id", projectIds)
    .order("created_at", { ascending: false });

  if (!analyses || analyses.length === 0) {
    return NextResponse.json({ keywords: [], projects });
  }

  const latestByProject = new Map<string, string>();
  for (const a of analyses) {
    if (!latestByProject.has(a.project_id)) {
      latestByProject.set(a.project_id, a.id);
    }
  }
  const latestAnalysisIds = [...latestByProject.values()];

  const { data: keywords, error } = await supabase
    .from("keywords")
    .select("*")
    .in("analysis_id", latestAnalysisIds)
    .order("opportunity_score", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: clusters } = await supabase
    .from("keyword_clusters")
    .select("*")
    .in("analysis_id", latestAnalysisIds)
    .order("total_volume", { ascending: false });

  return NextResponse.json({
    clusters: (clusters ?? []).map((c) => ({
      id: c.id,
      topic: c.topic,
      articleTitle: c.article_title,
      pillarKeyword: c.pillar_keyword,
      supportingKeywords: c.supporting_keywords ?? [],
      searchIntent: c.search_intent,
      difficulty: c.difficulty,
      totalVolume: c.total_volume,
      avgCompetition: Number(c.avg_competition),
    })),
    keywords: (keywords ?? []).map((k) => ({
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
    })),
    projects: projects.map((p) => ({ id: p.id })),
  });
}
