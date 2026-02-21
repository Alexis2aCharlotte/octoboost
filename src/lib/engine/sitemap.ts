import * as cheerio from "cheerio";

export interface SitePage {
  url: string;
  path: string;
  title: string;
  description: string;
}

/**
 * Fetch and parse a sitemap.xml, trying multiple common locations.
 * Returns a list of URLs found.
 */
export async function fetchSitemapUrls(siteUrl: string): Promise<string[]> {
  const base = siteUrl.replace(/\/+$/, "");
  const candidates = [
    `${base}/sitemap.xml`,
    `${base}/sitemap_index.xml`,
    `${base}/sitemap-0.xml`,
  ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; OctoBoostBot/1.0; +https://octoboost.app)",
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;

      const xml = await res.text();
      if (!xml.includes("<url") && !xml.includes("<sitemap")) continue;

      const $ = cheerio.load(xml, { xml: true });

      // Check for sitemap index (contains <sitemap> entries)
      const sitemapLocs: string[] = [];
      $("sitemap > loc").each((_, el) => {
        sitemapLocs.push($(el).text().trim());
      });

      if (sitemapLocs.length > 0) {
        const allUrls: string[] = [];
        for (const subUrl of sitemapLocs.slice(0, 5)) {
          try {
            const subRes = await fetch(subUrl, {
              headers: { "User-Agent": "OctoBoostBot/1.0" },
              signal: AbortSignal.timeout(10000),
            });
            if (!subRes.ok) continue;
            const subXml = await subRes.text();
            const sub$ = cheerio.load(subXml, { xml: true });
            sub$("url > loc").each((_, el) => {
              allUrls.push(sub$(el).text().trim());
            });
          } catch {
            // skip sub-sitemap
          }
        }
        return allUrls;
      }

      // Regular sitemap with <url> entries
      const urls: string[] = [];
      $("url > loc").each((_, el) => {
        urls.push($(el).text().trim());
      });

      if (urls.length > 0) return urls;
    } catch {
      // try next candidate
    }
  }

  return [];
}

/**
 * Lightweight crawl of a single page — extract title + meta description.
 */
async function crawlPageMeta(
  url: string
): Promise<{ title: string; description: string } | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OctoBoostBot/1.0; +https://octoboost.app)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim() ||
      $('meta[property="og:title"]').attr("content")?.trim() || "";
    const description =
      $('meta[name="description"]').attr("content")?.trim() ||
      $('meta[property="og:description"]').attr("content")?.trim() || "";

    return { title, description };
  } catch {
    return null;
  }
}

/**
 * Fetch sitemap + crawl each page for title/description.
 * Returns structured list of site pages.
 */
export async function crawlSitePages(
  siteUrl: string,
  maxPages = 100
): Promise<SitePage[]> {
  const urls = await fetchSitemapUrls(siteUrl);
  if (urls.length === 0) return [];

  const base = new URL(siteUrl.startsWith("http") ? siteUrl : `https://${siteUrl}`);
  const filtered = urls
    .filter((u) => {
      try {
        const parsed = new URL(u);
        return parsed.hostname === base.hostname;
      } catch {
        return false;
      }
    })
    .slice(0, maxPages);

  // Crawl in batches of 5 for speed
  const pages: SitePage[] = [];
  const batchSize = 5;

  for (let i = 0; i < filtered.length; i += batchSize) {
    const batch = filtered.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (url) => {
        const meta = await crawlPageMeta(url);
        if (!meta) return null;
        const path = new URL(url).pathname;
        return {
          url,
          path,
          title: meta.title,
          description: meta.description,
        };
      })
    );
    for (const r of results) {
      if (r && r.title) pages.push(r);
    }
  }

  return pages;
}
