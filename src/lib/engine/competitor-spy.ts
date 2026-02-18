import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { crawlUrl } from "./crawler";
import { getKeywordVolumes } from "./dataforseo";

const competitorKeywordsSchema = z.object({
  inferredKeywords: z.array(
    z.object({
      keyword: z.string(),
      intent: z.enum([
        "informational",
        "commercial",
        "transactional",
        "navigational",
      ]),
      category: z.enum(["broad", "niche", "question", "comparison"]),
      confidence: z.enum(["high", "medium", "low"]),
    })
  ),
});

export interface CompetitorKeyword {
  keyword: string;
  intent: string;
  category: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  source: "competitor";
  competitorDomain: string;
}

export async function spyCompetitorKeywords(
  competitorUrls: string[],
  productContext: string,
  existingKeywords: Set<string>,
  maxCompetitors = 3
): Promise<CompetitorKeyword[]> {
  const urls = competitorUrls.slice(0, maxCompetitors);
  const allInferred: {
    keyword: string;
    intent: string;
    category: string;
    domain: string;
  }[] = [];

  for (const url of urls) {
    try {
      const crawlData = await crawlUrl(url);
      const domain = new URL(crawlData.url).hostname;

      const { object } = await generateObject({
        model: openai("gpt-4o"),
        schema: competitorKeywordsSchema,
        system: `You analyze competitor websites to extract keywords they are targeting. Focus on keywords visible in their content, headings, meta data, and page structure. Only extract keywords that real people would search on Google.`,
        prompt: `Our product: ${productContext}

Analyze this competitor website and extract 20-40 keywords they appear to be targeting:

Competitor URL: ${crawlData.url}
Title: ${crawlData.title}
Description: ${crawlData.metaDescription}

${crawlData.structuredText}

Extract keywords that:
- Are clearly targeted by this competitor's content
- Real people would search for on Google
- Would be relevant to our product too (potential content gaps)
- Include a mix of broad, niche, question, and comparison terms`,
      });

      for (const kw of object.inferredKeywords) {
        const lower = kw.keyword.toLowerCase();
        if (!existingKeywords.has(lower)) {
          existingKeywords.add(lower);
          allInferred.push({
            keyword: kw.keyword,
            intent: kw.intent,
            category: kw.category,
            domain,
          });
        }
      }
    } catch (e) {
      console.error(`Failed to spy on ${url}:`, e);
    }
  }

  if (allInferred.length === 0) return [];

  let volumeMap = new Map<
    string,
    { searchVolume: number; cpc: number; competition: number; competitionLevel: string }
  >();
  try {
    const volumes = await getKeywordVolumes(
      allInferred.map((k) => k.keyword)
    );
    volumeMap = new Map(
      volumes.map((v) => [
        v.keyword.toLowerCase(),
        {
          searchVolume: v.searchVolume,
          cpc: v.cpc,
          competition: v.competition,
          competitionLevel: v.competitionLevel,
        },
      ])
    );
  } catch (e) {
    console.error("DataForSEO error during competitor enrichment:", e);
  }

  return allInferred.map((kw) => {
    const data = volumeMap.get(kw.keyword.toLowerCase());
    return {
      keyword: kw.keyword,
      intent: kw.intent,
      category: kw.category,
      searchVolume: data?.searchVolume ?? 0,
      cpc: data?.cpc ?? 0,
      competition: data?.competition ?? 0,
      competitionLevel: data?.competitionLevel ?? "UNKNOWN",
      source: "competitor" as const,
      competitorDomain: kw.domain,
    };
  });
}
