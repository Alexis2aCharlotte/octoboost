import * as cheerio from "cheerio";

export interface CrawlResult {
  url: string;
  title: string;
  metaDescription: string;
  metaKeywords: string[];
  headings: { level: string; text: string }[];
  paragraphs: string[];
  links: { href: string; text: string }[];
  ogData: Record<string, string>;
  structuredText: string;
}

export async function crawlUrl(url: string): Promise<CrawlResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

  const res = await fetch(normalizedUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; OctoBoostBot/1.0; +https://octoboost.app)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${normalizedUrl}: ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, nav, footer, header, noscript, iframe, svg").remove();

  const title = $("title").first().text().trim();

  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() ?? "";

  const metaKeywords = ($('meta[name="keywords"]').attr("content") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const headings: CrawlResult["headings"] = [];
  $("h1, h2, h3").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      headings.push({ level: el.tagName, text });
    }
  });

  const paragraphs: string[] = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 30) {
      paragraphs.push(text);
    }
  });

  const links: CrawlResult["links"] = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    const text = $(el).text().trim();
    if (href.startsWith("http") && text) {
      links.push({ href, text });
    }
  });

  const ogData: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr("property") ?? "";
    const content = $(el).attr("content") ?? "";
    if (prop && content) {
      ogData[prop.replace("og:", "")] = content;
    }
  });

  const structuredText = [
    `# ${title}`,
    metaDescription ? `\n> ${metaDescription}` : "",
    "\n## Headings",
    ...headings.map((h) => `${"#".repeat(parseInt(h.level[1]))} ${h.text}`),
    "\n## Content",
    ...paragraphs.slice(0, 30),
  ]
    .filter(Boolean)
    .join("\n");

  return {
    url: normalizedUrl,
    title,
    metaDescription,
    metaKeywords,
    headings,
    paragraphs: paragraphs.slice(0, 30),
    links: links.slice(0, 50),
    ogData,
    structuredText,
  };
}
