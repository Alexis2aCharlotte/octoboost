const DEVTO_API = "https://dev.to/api";

export interface DevtoArticleStats {
  id: number;
  title: string;
  url: string;
  publishedAt: string;
  views: number;
  reactions: number;
  comments: number;
}

export async function fetchDevtoArticleStats(
  apiKey: string
): Promise<DevtoArticleStats[]> {
  const articles: DevtoArticleStats[] = [];
  let page = 1;
  const perPage = 30;

  while (page <= 5) {
    const res = await fetch(
      `${DEVTO_API}/articles/me/published?page=${page}&per_page=${perPage}`,
      { headers: { "api-key": apiKey } }
    );
    if (!res.ok) break;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) break;

    for (const a of data) {
      articles.push({
        id: a.id,
        title: a.title,
        url: a.url,
        publishedAt: a.published_at,
        views: a.page_views_count ?? 0,
        reactions: a.positive_reactions_count ?? 0,
        comments: a.comments_count ?? 0,
      });
    }

    if (data.length < perPage) break;
    page++;
  }

  return articles;
}

export async function verifyDevtoKey(apiKey: string): Promise<{
  valid: boolean;
  username?: string;
  error?: string;
}> {
  try {
    const res = await fetch(`${DEVTO_API}/users/me`, {
      headers: { "api-key": apiKey },
    });

    if (!res.ok) {
      return { valid: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { valid: true, username: data.username };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

export async function publishToDevto(
  apiKey: string,
  article: {
    title: string;
    bodyMarkdown: string;
    tags?: string[];
    canonicalUrl?: string;
    published?: boolean;
  }
): Promise<{ url: string; id: number }> {
  const res = await fetch(`${DEVTO_API}/articles`, {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      article: {
        title: article.title,
        body_markdown: article.bodyMarkdown,
        tags: article.tags ?? [],
        canonical_url: article.canonicalUrl,
        published: article.published ?? false,
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Dev.to API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { url: data.url, id: data.id };
}
