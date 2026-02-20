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
  const projectId = searchParams.get("projectId");
  const projectSlug = searchParams.get("projectSlug");

  if (!projectId || !projectSlug) {
    return NextResponse.json(
      { error: "projectId and projectSlug are required" },
      { status: 400 }
    );
  }

  const state = crypto.randomUUID();
  const statePayload = JSON.stringify({ state, projectId, projectSlug });
  const encoded = Buffer.from(statePayload).toString("base64url");

  const cookieStore = await cookies();
  cookieStore.set("github_oauth_state", encoded, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const appSlug = process.env.GITHUB_APP_SLUG;

  if (appSlug) {
    const installUrl = new URL(`https://github.com/apps/${appSlug}/installations/new`);
    installUrl.searchParams.set("state", encoded);
    return NextResponse.redirect(installUrl.toString());
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = `${new URL(req.url).origin}/api/auth/github/callback`;
  const authUrl = new URL("https://github.com/login/oauth/authorize");
  authUrl.searchParams.set("client_id", clientId!);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "repo");
  authUrl.searchParams.set("state", encoded);
  return NextResponse.redirect(authUrl.toString());
}
