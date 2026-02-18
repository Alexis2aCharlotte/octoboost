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
  const channelId = searchParams.get("channelId");
  const projectSlug = searchParams.get("projectSlug");

  if (!channelId || !projectSlug) {
    return NextResponse.json(
      { error: "channelId and projectSlug are required" },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  const statePayload = JSON.stringify({ state, channelId, projectSlug });
  const encoded = Buffer.from(statePayload).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("reddit_oauth_state", encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const clientId = process.env.REDDIT_CLIENT_ID;
  const redirectUri = `${new URL(req.url).origin}/api/auth/reddit/callback`;

  const authUrl = new URL("https://www.reddit.com/api/v1/authorize");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", encoded);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("duration", "permanent");
  authUrl.searchParams.set("scope", "identity submit read");

  return NextResponse.redirect(authUrl.toString());
}
