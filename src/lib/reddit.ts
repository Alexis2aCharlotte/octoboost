import { SupabaseClient } from "@supabase/supabase-js";

interface RedditConfig {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  redditUsername: string;
  connectedAt: string;
}

export function isRedditConnected(
  config: Record<string, unknown>
): config is RedditConfig {
  return !!(config?.accessToken && config?.refreshToken && config?.redditUsername);
}

export async function getValidAccessToken(
  supabase: SupabaseClient,
  channelId: string,
  config: RedditConfig
): Promise<string> {
  const now = new Date();
  const expiresAt = new Date(config.expiresAt);
  const buffer = 5 * 60 * 1000;

  if (now.getTime() < expiresAt.getTime() - buffer) {
    return config.accessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "OctoBoost/1.0",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: config.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`Reddit token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  const newExpiresAt = new Date(
    Date.now() + data.expires_in * 1000
  ).toISOString();

  await supabase
    .from("channels")
    .update({
      config: {
        ...config,
        accessToken: data.access_token,
        expiresAt: newExpiresAt,
      },
    })
    .eq("id", channelId);

  return data.access_token;
}

export async function submitRedditPost(
  supabase: SupabaseClient,
  channelId: string,
  config: RedditConfig,
  post: { title: string; content: string; subreddit: string }
): Promise<{ url: string }> {
  const token = await getValidAccessToken(supabase, channelId, config);

  const res = await fetch("https://oauth.reddit.com/api/submit", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "OctoBoost/1.0",
    },
    body: new URLSearchParams({
      api_type: "json",
      kind: "self",
      sr: post.subreddit,
      title: post.title,
      text: post.content,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Reddit submit failed: ${res.status} ${text}`);
  }

  const data = await res.json();
  const errors = data?.json?.errors;
  if (errors && errors.length > 0) {
    throw new Error(`Reddit submit error: ${JSON.stringify(errors)}`);
  }

  const url =
    data?.json?.data?.url ?? `https://reddit.com/u/${config.redditUsername}`;

  return { url };
}
