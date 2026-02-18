const DEVTO_API = "https://dev.to/api";

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
