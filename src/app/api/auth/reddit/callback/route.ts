import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");
  const error = searchParams.get("error");

  if (error) {
    console.error("[Reddit OAuth] User denied:", error);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("reddit_oauth_state")?.value;
  cookieStore.delete("reddit_oauth_state");

  if (!savedState || savedState !== stateParam) {
    console.error("[Reddit OAuth] State mismatch");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  let channelId: string;
  let projectSlug: string;
  try {
    const payload = JSON.parse(
      Buffer.from(stateParam, "base64url").toString()
    );
    channelId = payload.channelId;
    projectSlug = payload.projectSlug;
  } catch {
    console.error("[Reddit OAuth] Invalid state payload");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const clientId = process.env.REDDIT_CLIENT_ID!;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET!;
  const redirectUri = `${new URL(req.url).origin}/api/auth/reddit/callback`;

  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "OctoBoost/1.0",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error("[Reddit OAuth] Token exchange failed:", await tokenRes.text());
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectSlug}/channels?error=reddit_token_failed`, req.url)
    );
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  const meRes = await fetch("https://oauth.reddit.com/api/v1/me", {
    headers: {
      Authorization: `Bearer ${access_token}`,
      "User-Agent": "OctoBoost/1.0",
    },
  });

  let redditUsername = "unknown";
  if (meRes.ok) {
    const meData = await meRes.json();
    redditUsername = meData.name;
  }

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  const { error: updateError } = await supabase
    .from("channels")
    .update({
      config: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        redditUsername,
        connectedAt: new Date().toISOString(),
      },
    })
    .eq("id", channelId);

  if (updateError) {
    console.error("[Reddit OAuth] Channel update failed:", updateError);
  }

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${projectSlug}/channels`, req.url)
  );
}
