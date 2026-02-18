import { marked } from "marked";

const BLOGGER_API = "https://www.googleapis.com/blogger/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

export async function getBlogIdFromUrl(
  blogUrl: string,
  accessToken?: string
): Promise<string | null> {
  const url = blogUrl.startsWith("http") ? blogUrl : `https://${blogUrl}`;
  const params = new URLSearchParams({ url });

  const headers: Record<string, string> = {};
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${BLOGGER_API}/blogs/byurl?${params}`, { headers });
  const data = await res.json();

  if (data.error || !data.id) return null;
  return data.id;
}

export async function refreshBloggerAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number }> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error_description ?? `Token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  return { accessToken: data.access_token, expiresIn: data.expires_in };
}

export async function verifyBloggerToken(
  accessToken: string,
  blogId: string
): Promise<{ valid: boolean; blogName?: string; error?: string }> {
  try {
    const res = await fetch(
      `${BLOGGER_API}/blogs/${blogId}?fields=id,name,url`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await res.json();
    if (data.error) {
      return { valid: false, error: data.error.message };
    }
    return { valid: true, blogName: data.name };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function publishToBlogger(
  accessToken: string,
  blogId: string,
  article: {
    title: string;
    bodyMarkdown: string;
    labels?: string[];
  }
): Promise<{ url: string; id: string }> {
  const contentHtml = String(await marked.parse(article.bodyMarkdown));
  const labels = article.labels ?? [];

  const res = await fetch(
    `${BLOGGER_API}/blogs/${blogId}/posts?isDraft=false`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        kind: "blogger#post",
        title: article.title,
        content: contentHtml,
        labels: labels.length > 0 ? labels : undefined,
      }),
    }
  );

  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message ?? `Blogger API error: ${res.status}`);
  }

  const postUrl = data.url ?? `https://www.blogger.com/blog/post/edit/${blogId}/${data.id}`;
  return { url: postUrl, id: data.id };
}
