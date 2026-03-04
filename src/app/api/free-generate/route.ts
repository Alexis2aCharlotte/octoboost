import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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
import { generateArticle } from "@/lib/engine/article-generator";
import { after } from "next/server";
import { sendWelcomeEmail } from "@/lib/services/email";
import { notifyTelegram } from "@/lib/services/telegram";

export const maxDuration = 300;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!serviceRoleKey) {
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient(supabaseUrl, serviceRoleKey);

  try {
    const { url, email } = await req.json();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // ── Validation ────────────────────────────────────────────
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
    const normalizedEmail = email.trim().toLowerCase();

    // ── Anti-abuse: one free generation per IP, ever ──────────
    const { count: ipCount } = await supabase
      .from("free_generation_limits")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip);

    if ((ipCount ?? 0) >= 1) {
      return NextResponse.json(
        {
          error: "You've already used your free generation. Upgrade to generate more articles.",
          code: "LIMIT_REACHED",
        },
        { status: 429 }
      );
    }

    // ── Anti-abuse: one free analysis per domain ────────────
    const domain = normalizedUrl
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .toLowerCase();

    const { data: existingSites } = await supabase
      .from("projects")
      .select("id, user_id")
      .ilike("url", `%${domain}%`);

    if (existingSites && existingSites.length > 0) {
      return NextResponse.json(
        {
          error: "This website has already been analyzed. Log in to your existing account or upgrade to run a new analysis.",
          code: "SITE_EXISTS",
        },
        { status: 409 }
      );
    }

    // ── Check if account already exists ───────────────────────
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email === normalizedEmail
    );

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email already exists. Please log in.",
          code: "ACCOUNT_EXISTS",
        },
        { status: 409 }
      );
    }

    // ── Create Supabase account ───────────────────────────────
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
      });

    if (authError || !authData.user) {
      console.error("Auth creation error:", authError);
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // ── Create free profile ──────────────────────────────────
    await supabase.from("profiles").insert({
      user_id: userId,
      email: normalizedEmail,
      has_password: false,
      plan: "free",
      interval: "monthly",
      status: "active",
    });

    // ── Step 1: Crawl ─────────────────────────────────────────
    const crawlData = await crawlUrl(normalizedUrl);

    // ── Step 2: LLM analysis ──────────────────────────────────
    const analysis = await analyzeSite(crawlData);
    const productContext = `${analysis.productSummary} Target audience: ${analysis.targetAudience}`;

    // ── Step 3: Keyword volumes ───────────────────────────────
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

      // ── Step 4: Expand top seeds ────────────────────────────
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

        // ── Step 5: Classify expanded keywords ────────────────
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

      // ── Step 6: Competitor spy ──────────────────────────────
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

    // ── Step 7: SERP difficulty ───────────────────────────────
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

    // ── Step 8: Cluster keywords ──────────────────────────────
    const keywordsForClustering = allKeywords
      .filter((k) => k.searchVolume > 0 || k.relevance === "high")
      .slice(0, 150);

    let clusters: {
      topic: string;
      articleTitle: string;
      pillarKeyword: string;
      supportingKeywords: string[];
      searchIntent: string;
      articleType?: string;
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
          productContext,
          undefined,
          analysis.competitors.slice(0, 5).map((c) => ({ name: c.name, url: c.url }))
        );
      } catch (e) {
        console.error("Clustering error (continuing):", e);
      }
    }

    // ── Step 9: Persist project + analysis ────────────────────
    const slug = generateSlug(crawlData.title || crawlData.url);

    const { data: newProject, error: projectError } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: crawlData.title || normalizedUrl,
        url: crawlData.url,
        slug,
        api_key: generateApiKey(),
      })
      .select("id")
      .single();

    if (projectError) {
      throw new Error(`Project insert failed: ${projectError.message}`);
    }

    const projectId = newProject.id;

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

    if (analysisError) {
      throw new Error(`Analysis insert failed: ${analysisError.message}`);
    }

    // Insert keywords
    if (allKeywords.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < allKeywords.length; i += BATCH_SIZE) {
        const batch = allKeywords.slice(i, i + BATCH_SIZE);
        await supabase.from("keywords").insert(
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
      }
    }

    // Insert competitors
    if (analysis.competitors.length > 0) {
      await supabase.from("competitors").insert(
        analysis.competitors.map((c) => ({
          analysis_id: newAnalysis.id,
          name: c.name,
          url: c.url,
          reason: c.reason,
        }))
      );
    }

    // Insert clusters
    let firstClusterId: string | null = null;
    if (clusters.length > 0) {
      const keywordMap = new Map(
        allKeywords.map((k) => [k.keyword.toLowerCase(), k])
      );

      const clusterRows = clusters.map((c) => {
        const pillar = keywordMap.get(c.pillarKeyword.toLowerCase());
        const supportingVols = c.supportingKeywords
          .map(
            (sk) => keywordMap.get(sk.toLowerCase())?.searchVolume ?? 0
          )
          .reduce((a, b) => a + b, 0);

        return {
          analysis_id: newAnalysis.id,
          topic: c.topic,
          article_title: c.articleTitle,
          pillar_keyword: c.pillarKeyword,
          supporting_keywords: c.supportingKeywords,
          search_intent: c.searchIntent,
          article_type: c.articleType ?? "informational",
          difficulty: c.difficulty,
          total_volume: (pillar?.searchVolume ?? 0) + supportingVols,
          avg_competition: pillar?.competition ?? 0,
        };
      });

      const { data: insertedClusters } = await supabase
        .from("keyword_clusters")
        .insert(clusterRows)
        .select("id");

      if (insertedClusters && insertedClusters.length > 0) {
        firstClusterId = insertedClusters[0].id;
      }
    }

    // Crawl sitemap in background
    crawlSitePages(crawlData.url)
      .then(async (pages) => {
        if (pages.length > 0) {
          await supabase
            .from("site_pages")
            .delete()
            .eq("project_id", projectId);
          await supabase.from("site_pages").insert(
            pages.map((p) => ({
              project_id: projectId,
              url: p.url,
              path: p.path,
              title: p.title,
              description: p.description,
            }))
          );
        }
      })
      .catch((e) => console.error("[Sitemap] crawl error:", e));

    // ── Step 10: Generate article for best cluster ────────────
    let articleResult = null;

    if (firstClusterId && clusters.length > 0) {
      const bestCluster = clusters[0];

      const keyTools =
        (analysis.keyTools as { name: string; description: string }[]) ?? [];

      try {
        const result = await generateArticle({
          cluster: {
            topic: bestCluster.topic,
            articleTitle: bestCluster.articleTitle,
            pillarKeyword: bestCluster.pillarKeyword,
            supportingKeywords: bestCluster.supportingKeywords ?? [],
            searchIntent: bestCluster.searchIntent ?? "informational",
            articleType: bestCluster.articleType ?? "informational",
            difficulty: bestCluster.difficulty ?? "medium",
            totalVolume: 0,
          },
          productContext: {
            name: crawlData.title || "",
            url: crawlData.url,
            summary: analysis.productSummary,
            targetAudience: analysis.targetAudience,
            keyTools,
          },
        });

        const articleSlug = result.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .slice(0, 80);

        const { data: article } = await supabase
          .from("articles")
          .insert({
            cluster_id: firstClusterId,
            project_id: projectId,
            title: result.title,
            slug: articleSlug,
            content: result.content,
            outline: result.outline,
            word_count: result.wordCount,
            pillar_keyword: bestCluster.pillarKeyword,
            supporting_keywords: bestCluster.supportingKeywords ?? [],
            meta_description: result.metaDescription,
            status: "draft",
            model_used: "claude-sonnet-4.6",
          })
          .select("id")
          .single();

        articleResult = {
          id: article?.id,
          title: result.title,
          wordCount: result.wordCount,
        };
      } catch (e) {
        console.error("Article generation error (continuing):", e);
      }
    }

    // ── Record rate limit ─────────────────────────────────────
    await supabase.from("free_generation_limits").insert({
      ip_address: ip,
      email: normalizedEmail,
    });

    // ── Generate magic link for auto-login ────────────────────
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
    });

    // ── Async: welcome email + telegram ───────────────────────
    after(async () => {
      try {
        await sendWelcomeEmail(normalizedEmail);
        await notifyTelegram(`Free Generation 🆓`);
      } catch (e) {
        console.error("Post-generation async error:", e);
      }
    });

    return NextResponse.json({
      success: true,
      projectSlug: slug,
      projectId,
      article: articleResult,
      stats: {
        keywords: allKeywords.length,
        clusters: clusters.length,
        competitors: analysis.competitors.length,
      },
      otp: linkData?.properties?.email_otp ?? null,
      redirectUrl: `/dashboard/projects/${slug}/overview`,
    });
  } catch (error) {
    console.error("Free generate error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Generation failed",
      },
      { status: 500 }
    );
  }
}
