import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listRepos } from "@/lib/github";
import type { GitHubSiteConnection } from "@/lib/github";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json({ error: "projectId required" }, { status: 400 });

  const { data: project } = await supabase
    .from("projects")
    .select("id, site_connection")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const conn = project.site_connection as GitHubSiteConnection | null;
  if (!conn?.github_token || conn.type !== "github")
    return NextResponse.json(
      { error: "GitHub not connected" },
      { status: 400 }
    );

  try {
    const repos = await listRepos(conn.github_token);
    return NextResponse.json({ repos });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch repos" },
      { status: 500 }
    );
  }
}
