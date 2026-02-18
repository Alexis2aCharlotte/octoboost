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
    console.error("[Blogger OAuth] User denied:", error);
    return NextResponse.redirect(
      new URL(`/dashboard?error=blogger_denied`, req.url)
    );
  }

  if (!code || !stateParam) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("blogger_oauth_state")?.value;
  cookieStore.delete("blogger_oauth_state");

  if (!savedState || savedState !== stateParam) {
    console.error("[Blogger OAuth] State mismatch");
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
    console.error("[Blogger OAuth] Invalid state payload");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${new URL(req.url).origin}/api/auth/blogger/callback`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    console.error(
      "[Blogger OAuth] Token exchange failed:",
      await tokenRes.text()
    );
    return NextResponse.redirect(
      new URL(
        `/dashboard/projects/${projectSlug}/channels?error=blogger_token_failed`,
        req.url
      )
    );
  }

  const tokenData = await tokenRes.json();
  const { access_token, refresh_token, expires_in } = tokenData;

  if (!refresh_token) {
    console.error("[Blogger OAuth] No refresh_token in response");
    return NextResponse.redirect(
      new URL(
        `/dashboard/projects/${projectSlug}/channels?error=blogger_no_refresh`,
        req.url
      )
    );
  }

  const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

  const { data: channel } = await supabase
    .from("channels")
    .select("config")
    .eq("id", channelId)
    .single();

  const existingConfig = (channel?.config as Record<string, unknown>) ?? {};
  const blogUrl = (existingConfig.blogUrl as string)?.trim();
  if (!blogUrl) {
    console.error("[Blogger OAuth] No blogUrl in channel config");
    return NextResponse.redirect(
      new URL(
        `/dashboard/projects/${projectSlug}/channels?error=blogger_no_blog_url`,
        req.url
      )
    );
  }

  const { getBlogIdFromUrl } = await import("@/lib/blogger");
  const blogId = await getBlogIdFromUrl(blogUrl, access_token);

  const { error: updateError } = await supabase
    .from("channels")
    .update({
      config: {
        ...existingConfig,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
        blogUrl,
        blogId: blogId ?? undefined,
        connectedAt: new Date().toISOString(),
      },
    })
    .eq("id", channelId);

  if (updateError) {
    console.error("[Blogger OAuth] Channel update failed:", updateError);
  }

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${projectSlug}/channels`, req.url)
  );
}
