import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getGitHubUser, type GitHubSiteConnection } from "@/lib/github";

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
  const installationId = searchParams.get("installation_id");
  const error = searchParams.get("error");

  if (error) {
    console.error("[GitHub OAuth] User denied:", error);
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!stateParam) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const cookieStore = await cookies();
  const savedState = cookieStore.get("github_oauth_state")?.value;
  cookieStore.delete("github_oauth_state");

  if (!savedState || savedState !== stateParam) {
    console.error("[GitHub OAuth] State mismatch");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  let projectId: string;
  let projectSlug: string;
  try {
    const payload = JSON.parse(Buffer.from(stateParam, "base64url").toString());
    projectId = payload.projectId;
    projectSlug = payload.projectSlug;
  } catch {
    console.error("[GitHub OAuth] Invalid state payload");
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  let accessToken: string;
  let refreshToken: string | undefined;
  let expiresIn: number | undefined;

  if (code) {
    const clientId = process.env.GITHUB_CLIENT_ID!;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET!;

    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!tokenRes.ok) {
      console.error("[GitHub OAuth] Token exchange failed:", await tokenRes.text());
      return NextResponse.redirect(
        new URL(`/dashboard/projects/${projectSlug}/publish?error=github_token_failed`, req.url)
      );
    }

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error("[GitHub OAuth] Token error:", tokenData.error_description);
      return NextResponse.redirect(
        new URL(`/dashboard/projects/${projectSlug}/publish?error=github_token_failed`, req.url)
      );
    }

    accessToken = tokenData.access_token;
    refreshToken = tokenData.refresh_token;
    expiresIn = tokenData.expires_in;
  } else {
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectSlug}/publish?error=no_code`, req.url)
    );
  }

  let ghUser: { login: string };
  try {
    ghUser = await getGitHubUser(accessToken);
  } catch {
    return NextResponse.redirect(
      new URL(`/dashboard/projects/${projectSlug}/publish?error=github_user_failed`, req.url)
    );
  }

  const connection: GitHubSiteConnection = {
    type: "github",
    github_token: accessToken,
    github_refresh_token: refreshToken,
    github_token_expires_at: expiresIn
      ? new Date(Date.now() + expiresIn * 1000).toISOString()
      : undefined,
    installation_id: installationId ? parseInt(installationId, 10) : undefined,
    repo_owner: ghUser.login,
    repo_name: "",
    branch: "main",
    content_dir: "",
    file_format: "mdx",
    status: "disconnected",
    connected_at: new Date().toISOString(),
  };

  const { error: updateError } = await supabase
    .from("projects")
    .update({ site_connection: connection })
    .eq("id", projectId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[GitHub OAuth] Project update failed:", updateError);
  }

  return NextResponse.redirect(
    new URL(`/dashboard/projects/${projectSlug}/publish?github=connected`, req.url)
  );
}
