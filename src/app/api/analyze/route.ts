import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlUrl } from "@/lib/engine/crawler";
import {
  analyzeSite,
  classifyKeywords,
  clusterKeywords,
} from "@/lib/engine/llm-analyzer";
import { generateApiKey } from "@/lib/custom-api";
import { crawlSitePages } from "@/lib/engine/sitemap";
import {
  getKeywordVolumes,
  getKeywordSuggestions,
  analyzeSerpDifficulty,
} from "@/lib/engine/dataforseo";
import { spyCompetitorKeywords } from "@/lib/engine/competitor-spy";

export const maxDuration = 300;

function generateSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/https?:\/\//g, "")
    .replace(/www\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

interface EnrichedKeyword {
  keyword: string;
  intent: string;
  relevance: string;
  category: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  trend: number[];
  opportunityScore: number;
  serpDifficulty: number | null;
  source: "seed" | "expanded" | "competitor";
}

function computeOpportunityScore(
  volume: number,
  competition: number,
  cpc: number,
  serpDifficulty: number | null
): number {
  if (volume === 0) return 0;

  const volumeScore = Math.min(volume / 1000, 10);
  const compScore = 1 - competition;
  const cpcBonus = Math.min(cpc / 5, 1);

  let base = volumeScore * compScore * 80 + cpcBonus * 20;

  if (serpDifficulty !== null) {
    const serpBonus = (100 - serpDifficulty) / 100;
    base = base * 0.6 + base * serpBonus * 0.4;
  }

  return Math.round(base);
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    // ── Cache check ─────────────────────────────────────────
    const { data: existingProject } = await supabase
      .from("projects")
      .select("id, slug")
      .eq("user_id", user.id)
      .eq("url", normalizedUrl)
      .single();

    if (existingProject) {
      const { data: existingAnalysis } = await supabase
        .from("analyses")
        .select("id, created_at")
        .eq("project_id", existingProject.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (existingAnalysis) {
        const ageHours =
          (Date.now() - new Date(existingAnalysis.created_at).getTime()) /
          (1000 * 60 * 60);

        if (ageHours < 24) {
          return NextResponse.json({
            analysisId: existingAnalysis.id,
            cached: true,
          });
        }
      }
    }

    // ── Step 1: Crawl ───────────────────────────────────────
    const crawlData = await crawlUrl(url);

    // ── Step 2: LLM analysis ────────────────────────────────
    const analysis = await analyzeSite(crawlData);
    const productContext = `${analysis.productSummary} Target audience: ${analysis.targetAudience}`;

    // ── Step 3: Get volumes for seed keywords ───────────────
    const seedStrings = analysis.seedKeywords.map((k) => k.keyword);

    let allKeywords: EnrichedKeyword[] = [];

    try {
      const volumes = await getKeywordVolumes(seedStrings);
      const volumeMap = new Map(
        volumes.map((v) => [v.keyword.toLowerCase(), v])
      );

      const seedKeywords: EnrichedKeyword[] = analysis.seedKeywords.map(
        (seed) => {
          const data = volumeMap.get(seed.keyword.toLowerCase());
          const vol = data?.searchVolume ?? 0;
          const comp = data?.competition ?? 0;
          const cpc = data?.cpc ?? 0;

          return {
            keyword: seed.keyword,
            intent: seed.intent,
            relevance: seed.relevance,
            category: seed.category,
            searchVolume: vol,
            cpc,
            competition: comp,
            competitionLevel: data?.competitionLevel ?? "UNKNOWN",
            trend: data?.trend ?? [],
            opportunityScore: computeOpportunityScore(vol, comp, cpc, null),
            serpDifficulty: null,
            source: "seed" as const,
          };
        }
      );

      allKeywords.push(...seedKeywords);

      // ── Step 4: Expand top seeds ──────────────────────────
      const seedsWithVolume = seedKeywords
        .filter((k) => k.searchVolume >= 10)
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 5);

      if (seedsWithVolume.length > 0) {
        const existingSet = new Set(
          allKeywords.map((k) => k.keyword.toLowerCase())
        );

        const expansionResults = await Promise.all(
          seedsWithVolume.map((seed) =>
            getKeywordSuggestions(seed.keyword, 2840, "en", 20).catch(() => [])
          )
        );

        const expandedRaw: {
          keyword: string;
          searchVolume: number;
          cpc: number;
          competition: number;
          competitionLevel: string;
          trend: number[];
        }[] = [];

        for (const suggestions of expansionResults) {
          for (const s of suggestions) {
            const lower = s.keyword.toLowerCase();
            if (existingSet.has(lower)) continue;
            existingSet.add(lower);
            expandedRaw.push({
              keyword: s.keyword,
              searchVolume: s.searchVolume ?? 0,
              cpc: s.cpc ?? 0,
              competition: s.competition ?? 0,
              competitionLevel: s.competitionLevel ?? "UNKNOWN",
              trend: s.trend ?? [],
            });
          }
        }

        // ── Step 5: Classify expanded keywords (Phase 1) ────
        if (expandedRaw.length > 0) {
          const classificationMap = await classifyKeywords(
            expandedRaw.map((k) => ({
              keyword: k.keyword,
              searchVolume: k.searchVolume,
              cpc: k.cpc,
            })),
            productContext
          ).catch(() => new Map());

          for (const exp of expandedRaw) {
            const classified = classificationMap.get(
              exp.keyword.toLowerCase()
            );
            allKeywords.push({
              keyword: exp.keyword,
              intent: classified?.intent ?? "informational",
              relevance: classified?.relevance ?? "medium",
              category: classified?.category ?? "broad",
              searchVolume: exp.searchVolume,
              cpc: exp.cpc,
              competition: exp.competition,
              competitionLevel: exp.competitionLevel,
              trend: exp.trend,
              opportunityScore: computeOpportunityScore(
                exp.searchVolume,
                exp.competition,
                exp.cpc,
                null
              ),
              serpDifficulty: null,
              source: "expanded",
            });
          }
        }
      }

      // ── Step 6: Competitor keyword spying (Phase 4) ───────
      const competitorUrls = analysis.competitors
        .map((c) => c.url)
        .filter((u) => u.startsWith("http"));

      if (competitorUrls.length > 0) {
        const existingSet = new Set(
          allKeywords.map((k) => k.keyword.toLowerCase())
        );

        try {
          const competitorKws = await spyCompetitorKeywords(
            competitorUrls,
            productContext,
            existingSet,
            3
          );

          for (const ckw of competitorKws) {
            allKeywords.push({
              keyword: ckw.keyword,
              intent: ckw.intent,
              relevance: "medium",
              category: ckw.category,
              searchVolume: ckw.searchVolume,
              cpc: ckw.cpc,
              competition: ckw.competition,
              competitionLevel: ckw.competitionLevel,
              trend: [],
              opportunityScore: computeOpportunityScore(
                ckw.searchVolume,
                ckw.competition,
                ckw.cpc,
                null
              ),
              serpDifficulty: null,
              source: "competitor",
            });
          }
        } catch (e) {
          console.error("Competitor spy error (continuing):", e);
        }
      }
    } catch (e) {
      console.error("DataForSEO error (continuing without volumes):", e);
      allKeywords = analysis.seedKeywords.map((seed) => ({
        keyword: seed.keyword,
        intent: seed.intent,
        relevance: seed.relevance,
        category: seed.category,
        searchVolume: 0,
        cpc: 0,
        competition: 0,
        competitionLevel: "UNKNOWN",
        trend: [],
        opportunityScore: 0,
        serpDifficulty: null,
        source: "seed" as const,
      }));
    }

    // ── Step 7: SERP difficulty for top keywords (Phase 3) ──
    const topForSerp = allKeywords
      .filter((k) => k.searchVolume >= 50)
      .sort((a, b) => b.opportunityScore - a.opportunityScore)
      .slice(0, 15);

    if (topForSerp.length > 0) {
      try {
        const serpResults = await analyzeSerpDifficulty(
          topForSerp.map((k) => k.keyword)
        );
        const serpMap = new Map(
          serpResults.map((s) => [s.keyword.toLowerCase(), s])
        );

        for (const kw of allKeywords) {
          const serp = serpMap.get(kw.keyword.toLowerCase());
          if (serp) {
            kw.serpDifficulty = serp.difficulty;
            kw.opportunityScore = computeOpportunityScore(
              kw.searchVolume,
              kw.competition,
              kw.cpc,
              serp.difficulty
            );
          }
        }
      } catch (e) {
        console.error("SERP analysis error (continuing):", e);
      }
    }

    allKeywords.sort((a, b) => b.opportunityScore - a.opportunityScore);

    // ── Step 8: Cluster keywords (Phase 2) ──────────────────
    const keywordsForClustering = allKeywords
      .filter((k) => k.searchVolume > 0 || k.relevance === "high")
      .slice(0, 150);

    let clusters: {
      topic: string;
      articleTitle: string;
      pillarKeyword: string;
      supportingKeywords: string[];
      searchIntent: string;
      difficulty: string;
    }[] = [];

    if (keywordsForClustering.length >= 5) {
      try {
        clusters = await clusterKeywords(
          keywordsForClustering.map((k) => ({
            keyword: k.keyword,
            searchVolume: k.searchVolume,
            competition: k.competition,
            opportunityScore: k.opportunityScore,
            intent: k.intent,
          })),
          productContext
        );
      } catch (e) {
        console.error("Clustering error (continuing):", e);
      }
    }

    // ── Step 9: Persist everything ──────────────────────────
    let projectId: string;
    if (existingProject) {
      projectId = existingProject.id;
      if (!existingProject.slug) {
        const slug = generateSlug(crawlData.title || crawlData.url);
        await supabase.from("projects").update({ slug }).eq("id", projectId);
      }
    } else {
      const slug = generateSlug(crawlData.title || crawlData.url);
      const { data: newProject, error: projectError } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: crawlData.title,
          url: crawlData.url,
          slug,
          api_key: generateApiKey(),
        })
        .select("id")
        .single();

      if (projectError)
        throw new Error(`Project insert failed: ${projectError.message}`);
      projectId = newProject.id;
    }

    const { data: newAnalysis, error: analysisError } = await supabase
      .from("analyses")
      .insert({
        project_id: projectId,
        site_title: crawlData.title,
        site_description: crawlData.metaDescription,
        product_summary: analysis.productSummary,
        target_audience: analysis.targetAudience,
        content_angles: analysis.contentAngles,
        key_tools: analysis.keyTools ?? [],
      })
      .select("id")
      .single();

    if (analysisError)
      throw new Error(`Analysis insert failed: ${analysisError.message}`);

    // Insert keywords in batches
    if (allKeywords.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < allKeywords.length; i += BATCH_SIZE) {
        const batch = allKeywords.slice(i, i + BATCH_SIZE);
        const { error: kwError } = await supabase.from("keywords").insert(
          batch.map((kw) => ({
            analysis_id: newAnalysis.id,
            keyword: kw.keyword,
            intent: kw.intent,
            relevance: kw.relevance,
            category: kw.category,
            search_volume: kw.searchVolume,
            cpc: kw.cpc,
            competition: kw.competition,
            competition_level: kw.competitionLevel,
            trend: kw.trend,
            opportunity_score: kw.opportunityScore,
            serp_difficulty: kw.serpDifficulty,
            source: kw.source,
          }))
        );
        if (kwError) console.error("Keywords insert error:", kwError);
      }
    }

    // Insert competitors
    if (analysis.competitors.length > 0) {
      const { error: compError } = await supabase.from("competitors").insert(
        analysis.competitors.map((c) => ({
          analysis_id: newAnalysis.id,
          name: c.name,
          url: c.url,
          reason: c.reason,
        }))
      );
      if (compError) console.error("Competitors insert error:", compError);
    }

    // Insert clusters
    if (clusters.length > 0) {
      const keywordMap = new Map(
        allKeywords.map((k) => [k.keyword.toLowerCase(), k])
      );

      const { error: clusterError } = await supabase
        .from("keyword_clusters")
        .insert(
          clusters.map((c) => {
            const pillar = keywordMap.get(c.pillarKeyword.toLowerCase());
            const supportingVols = c.supportingKeywords
              .map((sk) => keywordMap.get(sk.toLowerCase())?.searchVolume ?? 0)
              .reduce((a, b) => a + b, 0);

            return {
              analysis_id: newAnalysis.id,
              topic: c.topic,
              article_title: c.articleTitle,
              pillar_keyword: c.pillarKeyword,
              supporting_keywords: c.supportingKeywords,
              search_intent: c.searchIntent,
              difficulty: c.difficulty,
              total_volume:
                (pillar?.searchVolume ?? 0) + supportingVols,
              avg_competition: pillar?.competition ?? 0,
            };
          })
        );
      if (clusterError) console.error("Clusters insert error:", clusterError);
    }

    // Crawl sitemap in background (non-blocking)
    crawlSitePages(crawlData.url).then(async (pages) => {
      if (pages.length > 0) {
        await supabase.from("site_pages").delete().eq("project_id", projectId);
        await supabase.from("site_pages").insert(
          pages.map((p) => ({
            project_id: projectId,
            url: p.url,
            path: p.path,
            title: p.title,
            description: p.description,
          }))
        );
        console.log(`[Sitemap] Crawled ${pages.length} pages for project ${projectId}`);
      }
    }).catch((e) => console.error("[Sitemap] crawl error:", e));

    return NextResponse.json({
      analysisId: newAnalysis.id,
      cached: false,
      stats: {
        totalKeywords: allKeywords.length,
        withVolume: allKeywords.filter((k) => k.searchVolume > 0).length,
        expanded: allKeywords.filter((k) => k.source === "expanded").length,
        fromCompetitors: allKeywords.filter((k) => k.source === "competitor")
          .length,
        withSerpData: allKeywords.filter((k) => k.serpDifficulty !== null)
          .length,
        clusters: clusters.length,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
