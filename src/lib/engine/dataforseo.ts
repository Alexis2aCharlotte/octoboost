const DATAFORSEO_BASE = "https://api.dataforseo.com/v3";

interface KeywordMetrics {
  keyword: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: "LOW" | "MEDIUM" | "HIGH";
  trend: number[];
}

function getAuth(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) {
    throw new Error("DataForSEO credentials not configured");
  }
  return Buffer.from(`${login}:${password}`).toString("base64");
}

export async function getKeywordVolumes(
  keywords: string[],
  locationCode = 2840, // US
  languageCode = "en"
): Promise<KeywordMetrics[]> {
  const auth = getAuth();

  const body = [
    {
      keywords,
      location_code: locationCode,
      language_code: languageCode,
      date_from: getDateMonthsAgo(12),
    },
  ];

  const res = await fetch(
    `${DATAFORSEO_BASE}/keywords_data/google_ads/search_volume/live`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const results = data?.tasks?.[0]?.result ?? [];

  return results.map(
    (r: {
      keyword: string;
      search_volume: number;
      cpc: number;
      competition: unknown;
      competition_level: string | undefined;
      monthly_searches: { search_volume: number }[];
    }) => {
      const { numericComp, level } = resolveCompetition(
        r.competition,
        r.competition_level
      );
      return {
        keyword: r.keyword,
        searchVolume: Number(r.search_volume) || 0,
        cpc: Number(r.cpc) || 0,
        competition: numericComp,
        competitionLevel: level,
        trend: (r.monthly_searches ?? []).map(
          (m: { search_volume: number }) => m.search_volume
        ),
      };
    }
  );
}

export async function getKeywordSuggestions(
  seedKeyword: string,
  locationCode = 2840,
  languageCode = "en",
  limit = 50
): Promise<KeywordMetrics[]> {
  const auth = getAuth();

  const body = [
    {
      keyword: seedKeyword,
      location_code: locationCode,
      language_code: languageCode,
      limit,
      sort_by: "search_volume",
    },
  ];

  const res = await fetch(
    `${DATAFORSEO_BASE}/keywords_data/google_ads/keywords_for_keywords/live`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DataForSEO suggestions error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const results = data?.tasks?.[0]?.result ?? [];

  return results.map(
    (r: {
      keyword: string;
      search_volume: number;
      cpc: number;
      competition: unknown;
      competition_level: string | undefined;
      monthly_searches: { search_volume: number }[];
    }) => {
      const { numericComp, level } = resolveCompetition(
        r.competition,
        r.competition_level
      );
      return {
        keyword: r.keyword,
        searchVolume: Number(r.search_volume) || 0,
        cpc: Number(r.cpc) || 0,
        competition: numericComp,
        competitionLevel: level,
        trend: (r.monthly_searches ?? []).map(
          (m: { search_volume: number }) => m.search_volume
        ),
      };
    }
  );
}

const LEVEL_TO_NUMERIC: Record<string, number> = {
  LOW: 0.2,
  MEDIUM: 0.5,
  HIGH: 0.85,
};

function resolveCompetition(
  competition: unknown,
  competitionLevel: string | undefined
): { numericComp: number; level: KeywordMetrics["competitionLevel"] } {
  const compStr = String(competition ?? "").toUpperCase();

  if (compStr in LEVEL_TO_NUMERIC) {
    return {
      numericComp: LEVEL_TO_NUMERIC[compStr],
      level: compStr as KeywordMetrics["competitionLevel"],
    };
  }

  const levelStr = String(competitionLevel ?? "").toUpperCase();
  if (levelStr in LEVEL_TO_NUMERIC) {
    const n = Number(competition);
    return {
      numericComp: !isNaN(n) && n >= 0 && n <= 1 ? n : LEVEL_TO_NUMERIC[levelStr],
      level: levelStr as KeywordMetrics["competitionLevel"],
    };
  }

  const n = Number(competition);
  if (!isNaN(n) && n >= 0 && n <= 1) {
    const lvl = n < 0.33 ? "LOW" : n < 0.66 ? "MEDIUM" : "HIGH";
    return { numericComp: n, level: lvl as KeywordMetrics["competitionLevel"] };
  }

  return { numericComp: 0, level: "LOW" };
}

// ─── SERP Difficulty Analysis (Phase 3) ─────────────────────

interface SerpResult {
  keyword: string;
  difficulty: number;
  topResults: {
    position: number;
    title: string;
    domain: string;
    url: string;
  }[];
  hasFeaturedSnippet: boolean;
  hasPeopleAlsoAsk: boolean;
}

export async function analyzeSerpDifficulty(
  keywords: string[],
  locationCode = 2840,
  languageCode = "en"
): Promise<SerpResult[]> {
  const auth = getAuth();
  const results: SerpResult[] = [];

  const BATCH = 3;
  for (let i = 0; i < keywords.length; i += BATCH) {
    const batch = keywords.slice(i, i + BATCH);

    const tasks = batch.map((kw) => ({
      keyword: kw,
      location_code: locationCode,
      language_code: languageCode,
      depth: 10,
    }));

    const res = await fetch(
      `${DATAFORSEO_BASE}/serp/google/organic/live/regular`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tasks),
      }
    );

    if (!res.ok) {
      console.error(`SERP API error ${res.status}`);
      continue;
    }

    const data = await res.json();
    const taskResults = data?.tasks ?? [];

    for (const task of taskResults) {
      const kw = task?.data?.keyword ?? "";
      const items = task?.result?.[0]?.items ?? [];

      const organic = items.filter(
        (item: { type: string }) => item.type === "organic"
      );
      const topDomains = organic.slice(0, 10).map(
        (item: { rank_absolute: number; title: string; domain: string; url: string }) => ({
          position: item.rank_absolute,
          title: item.title ?? "",
          domain: item.domain ?? "",
          url: item.url ?? "",
        })
      );

      const hasFeaturedSnippet = items.some(
        (item: { type: string }) => item.type === "featured_snippet"
      );
      const hasPeopleAlsoAsk = items.some(
        (item: { type: string }) => item.type === "people_also_ask"
      );

      const bigBrands = new Set([
        "google.com", "apple.com", "amazon.com", "microsoft.com",
        "facebook.com", "wikipedia.org", "youtube.com", "reddit.com",
        "forbes.com", "techcrunch.com", "medium.com",
      ]);

      let difficulty = 0;
      const brandCount = topDomains.filter(
        (d: { domain: string }) => bigBrands.has(d.domain)
      ).length;
      difficulty += brandCount * 8;
      difficulty += Math.min(topDomains.length * 3, 30);
      if (hasFeaturedSnippet) difficulty += 10;
      difficulty = Math.min(difficulty, 100);

      results.push({
        keyword: kw,
        difficulty,
        topResults: topDomains,
        hasFeaturedSnippet,
        hasPeopleAlsoAsk,
      });
    }
  }

  return results;
}

function getDateMonthsAgo(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().split("T")[0];
}
