import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import type { CrawlResult } from "./crawler";

// ─── Site Analysis ──────────────────────────────────────────

const analysisSchema = z.object({
  productSummary: z
    .string()
    .describe("One-paragraph summary of what the product/site does"),
  targetAudience: z
    .string()
    .describe("Who is the target audience"),
  seedKeywords: z
    .array(
      z.object({
        keyword: z.string(),
        intent: z.enum([
          "informational",
          "commercial",
          "transactional",
          "navigational",
        ]),
        relevance: z.enum(["high", "medium", "low"]),
        category: z.enum(["broad", "niche", "question", "comparison"]),
      })
    )
    .describe("50-80 seed keywords across all categories"),
  competitors: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        reason: z.string(),
      })
    )
    .describe("5-10 direct or indirect competitors"),
  contentAngles: z
    .array(
      z.object({
        title: z.string().describe("SEO-optimized article title"),
        type: z.enum([
          "informational",
          "comparison",
          "listicle",
          "how-to",
          "faq",
        ]).describe("Content type"),
      })
    )
    .describe(
      "15-25 article ideas optimized for SEO and AI discoverability. Mix of types: informational (deep dives), comparison (X vs Y, alternatives), listicle (Top 5, Best X for Y), how-to (step-by-step guides), faq (answering common questions)."
    ),
  keyTools: z
    .array(
      z.object({
        name: z.string().describe("Tool or feature name as shown on the site"),
        description: z.string().describe("One-sentence description of what it does"),
      })
    )
    .describe(
      "Key tools, features, or capabilities of the product extracted from the site content. Return empty array if no clear tools/features are found."
    ),
});

export type SiteAnalysis = z.infer<typeof analysisSchema>;

export async function analyzeSite(
  crawlData: CrawlResult
): Promise<SiteAnalysis> {
  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: analysisSchema,
    system: `You are a world-class SEO strategist who specializes in finding keywords that are easy to rank for while still having meaningful search volume. Your goal is to find "golden keywords": terms that real people type into Google, that have decent volume, and where competition is low enough to rank on page 1 within 3-6 months.

You think like someone who would actually search Google. You avoid jargon-heavy terms that nobody types. You prioritize:
- Questions people ask ("how to...", "what is the best...", "why do...")
- Comparison queries ("X vs Y", "X alternatives", "best X for Y")
- Broad industry terms that bring top-of-funnel traffic
- Long-tail terms with clear purchase or action intent
- Terms that AI tools (ChatGPT, Perplexity) would cite content for`,
    prompt: `Analyze this website and generate a comprehensive keyword strategy.

Website data:
URL: ${crawlData.url}
Title: ${crawlData.title}
Meta Description: ${crawlData.metaDescription}
Meta Keywords: ${crawlData.metaKeywords.join(", ")}

${crawlData.structuredText}

Generate 50-80 seed keywords split into 4 categories:

**BROAD (15-20 keywords):** High-volume industry terms. These are 1-3 word terms that many people search for. Think of what someone types when starting their research. Examples: "app ideas", "mobile app development", "side project ideas".

**NICHE (15-20 keywords):** Specific to this product's domain. 2-4 word terms. Examples: "ios niche finder", "app store analytics tool", "profitable app categories".

**QUESTION (10-20 keywords):** Exact questions people type into Google or ask AI assistants. Always start with how/what/why/where/which/can/is/does. Examples: "how to find profitable app ideas", "what apps make the most money".

**COMPARISON (5-10 keywords):** "vs" queries, "alternatives to", "best X for Y". Examples: "sensor tower alternatives", "best app analytics tools 2026".

Also provide:
- 5-10 competitors (direct and indirect tools/sites in this space)
- 15-25 article ideas that would rank well on Google AND get cited by AI tools like ChatGPT and Perplexity.

Article types to include (mix of all):
- **informational**: Deep dives, "What is X", "How X works" - AI tools love citing definitions and explanations
- **comparison**: "X vs Y", "Best alternatives to X", "X review" - these get cited when users ask AI for recommendations
- **listicle**: "Top 5 tools for Y", "Best X for Y in 2026" - AI tools frequently cite ranked lists
- **how-to**: "How to do X step by step" - highly cited by AI for actionable queries
- **faq**: "X: everything you need to know" - FAQ-style content gets parsed and cited by AI

Aim for at least 3 comparison/listicle articles and 2 FAQ-style articles. These content types are the most likely to be cited by ChatGPT, Perplexity, and Claude.

IMPORTANT: Only suggest keywords that REAL PEOPLE actually type into Google. Avoid made-up compound terms. Think about what you would personally search for.
IMPORTANT: NEVER use em dashes in any output. Use commas, colons, or hyphens instead.`,
  });

  return object;
}

// ─── Classify expanded keywords (Phase 1) ───────────────────

const classificationSchema = z.object({
  classified: z.array(
    z.object({
      keyword: z.string(),
      intent: z.enum([
        "informational",
        "commercial",
        "transactional",
        "navigational",
      ]),
      relevance: z.enum(["high", "medium", "low"]),
      category: z.enum(["broad", "niche", "question", "comparison"]),
    })
  ),
});

export interface KeywordToClassify {
  keyword: string;
  searchVolume: number;
  cpc: number;
}

export interface ClassifiedKeyword {
  keyword: string;
  intent: string;
  relevance: string;
  category: string;
}

export async function classifyKeywords(
  keywords: KeywordToClassify[],
  productContext: string
): Promise<Map<string, ClassifiedKeyword>> {
  if (keywords.length === 0) return new Map();

  const BATCH = 80;
  const results = new Map<string, ClassifiedKeyword>();

  for (let i = 0; i < keywords.length; i += BATCH) {
    const batch = keywords.slice(i, i + BATCH);
    const kwList = batch
      .map((k) => `- "${k.keyword}" (vol: ${k.searchVolume}, cpc: $${k.cpc})`)
      .join("\n");

    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: classificationSchema,
      system: `You classify SEO keywords. For each keyword, determine:
- intent: informational (learning), commercial (researching products), transactional (ready to buy/use), navigational (looking for specific site)
- relevance: how relevant is this keyword to the product described? high/medium/low
- category: broad (generic industry term), niche (domain-specific), question (starts with how/what/why/etc), comparison (vs, alternatives, best X for Y)`,
      prompt: `Product context: ${productContext}

Classify each keyword:\n${kwList}`,
    });

    for (const c of object.classified) {
      results.set(c.keyword.toLowerCase(), c);
    }
  }

  return results;
}

// ─── Keyword Clustering (Phase 2) ───────────────────────────

const clusterSchema = z.object({
  clusters: z.array(
    z.object({
      topic: z.string().describe("Short topic name for this cluster"),
      articleTitle: z
        .string()
        .describe("Suggested SEO-optimized article title"),
      pillarKeyword: z
        .string()
        .describe("The main keyword for this cluster"),
      supportingKeywords: z
        .array(z.string())
        .describe("Other keywords in this cluster"),
      searchIntent: z.enum([
        "informational",
        "commercial",
        "transactional",
      ]),
      articleType: z.enum([
        "informational",
        "comparison",
        "listicle",
        "how-to",
      ]).describe("The type of article to write: informational (deep dive), comparison (X vs Y, alternatives), listicle (Top N, Best X for Y), how-to (step-by-step guide)"),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })
  ),
});

export interface KeywordForClustering {
  keyword: string;
  searchVolume: number;
  competition: number;
  opportunityScore: number;
  intent: string;
}

export interface KeywordCluster {
  topic: string;
  articleTitle: string;
  pillarKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  articleType: string;
  difficulty: string;
}

export async function clusterKeywords(
  keywords: KeywordForClustering[],
  productContext: string
): Promise<KeywordCluster[]> {
  if (keywords.length === 0) return [];

  const kwList = keywords
    .map(
      (k) =>
        `- "${k.keyword}" (vol: ${k.searchVolume}, comp: ${Math.round(k.competition * 100)}%, opp: ${k.opportunityScore}, intent: ${k.intent})`
    )
    .join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4o"),
    schema: clusterSchema,
    system: `You are an SEO content strategist. You group keywords into topic clusters where each cluster represents ONE article to write. The goal is to maximize ranking potential and AI citability.

Rules:
- Each cluster should have 1 pillar keyword (highest volume/opportunity) and 3-10 supporting keywords
- Group by semantic similarity and search intent
- The article title should target the pillar keyword and naturally include supporting keywords
- Prioritize clusters that are easy to rank for (low competition, decent volume)
- A keyword can only belong to ONE cluster
- Create 10-25 clusters depending on how many keywords there are
- Order clusters by ranking potential (easiest to rank with most traffic first)
- Include a mix of article types: standard informational, but also comparison ("X vs Y"), listicle ("Top 5..."), and how-to guides
- For each cluster, assign an articleType: "informational" for deep dives, "comparison" for X vs Y or alternatives articles, "listicle" for Top N or Best X for Y articles, "how-to" for step-by-step guides
- Aim for at least 2-3 comparison clusters, 2-3 listicle clusters, and 2-3 how-to clusters. The rest can be informational.
- NEVER use em dashes in article titles or any output. Use commas, colons, or hyphens instead.`,
    prompt: `Product context: ${productContext}

Group these keywords into topic clusters. Each cluster = 1 article to write.

Keywords:\n${kwList}`,
  });

  return object.clusters;
}
