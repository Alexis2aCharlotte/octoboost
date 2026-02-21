import { marked } from "marked";

function markdownToHtml(md: string): string {
  return marked.parse(md, { async: false }) as string;
}

export async function verifyWordPressCredentials(
  siteUrl: string,
  username: string,
  appPassword: string
): Promise<{
  valid: boolean;
  siteName?: string;
  error?: string;
}> {
  const base = siteUrl.replace(/\/+$/, "");
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");

  try {
    const res = await fetch(`${base}/wp-json/wp/v2/users/me`, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "Invalid credentials or insufficient permissions" };
    }
    if (!res.ok) {
      return { valid: false, error: `HTTP ${res.status}` };
    }

    const user = await res.json();

    const siteRes = await fetch(`${base}/wp-json`);
    const siteData = siteRes.ok ? await siteRes.json() : null;

    return {
      valid: true,
      siteName: siteData?.name ?? user.name ?? base,
    };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Connection failed" };
  }
}

export async function publishToWordPress(
  siteUrl: string,
  username: string,
  appPassword: string,
  article: {
    title: string;
    bodyMarkdown: string;
    slug?: string;
    tags?: string[];
    canonicalUrl?: string;
    status?: "publish" | "draft";
  }
): Promise<{ url: string; id: number }> {
  const base = siteUrl.replace(/\/+$/, "");
  const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
  const htmlContent = markdownToHtml(article.bodyMarkdown);

  const tagIds = article.tags?.length ? await resolveTagIds(base, auth, article.tags) : [];

  const body: Record<string, unknown> = {
    title: article.title,
    content: htmlContent,
    status: article.status ?? "publish",
  };

  if (article.slug) body.slug = article.slug;
  if (tagIds.length > 0) body.tags = tagIds;

  const res = await fetch(`${base}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WordPress API error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { url: data.link, id: data.id };
}

async function resolveTagIds(
  base: string,
  auth: string,
  tags: string[]
): Promise<number[]> {
  const ids: number[] = [];

  for (const tag of tags.slice(0, 5)) {
    try {
      const searchRes = await fetch(
        `${base}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}&per_page=1`,
        { headers: { Authorization: `Basic ${auth}` } }
      );
      if (searchRes.ok) {
        const found = await searchRes.json();
        if (found.length > 0) {
          ids.push(found[0].id);
          continue;
        }
      }

      const createRes = await fetch(`${base}/wp-json/wp/v2/tags`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: tag }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        ids.push(created.id);
      }
    } catch {
      // skip tag on error
    }
  }

  return ids;
}
