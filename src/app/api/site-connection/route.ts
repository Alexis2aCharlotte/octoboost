import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  testSiteConnection,
  generateSecret,
  type SiteConnection,
} from "@/lib/custom-api";
import { testGitHubConnection } from "@/lib/github";

async function resolveProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  identifier: string,
  userId: string
) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
  const query = supabase
    .from("projects")
    .select("id, slug, site_connection")
    .eq("user_id", userId);
  if (isUuid) query.eq("id", identifier);
  else query.eq("slug", identifier);
  return query.single();
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId)
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );

  const { data: project } = await resolveProject(supabase, projectId, user.id);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const conn = (project.site_connection as SiteConnection) ?? null;
  return NextResponse.json({ connection: conn });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, endpointUrl } = await req.json();
  if (!projectId || !endpointUrl)
    return NextResponse.json(
      { error: "projectId and endpointUrl required" },
      { status: 400 }
    );

  const { data: project } = await resolveProject(supabase, projectId, user.id);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const existingConn = project.site_connection as SiteConnection | null;
  const secret = existingConn?.secret ?? generateSecret();

  const connection: SiteConnection = {
    type: "custom_api",
    endpoint_url: endpointUrl.trim(),
    secret,
    status: "disconnected",
  };

  const { error } = await supabase
    .from("projects")
    .update({ site_connection: connection })
    .eq("id", project.id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ connection, secret });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, action, endpointUrl, repoOwner, repoName, branch, contentDir, fileFormat } = await req.json();
  if (!projectId)
    return NextResponse.json(
      { error: "projectId required" },
      { status: 400 }
    );

  const { data: project } = await resolveProject(supabase, projectId, user.id);
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const conn = (project.site_connection as SiteConnection) ?? null;

  if (action === "init") {
    if (conn?.secret) {
      return NextResponse.json({ connection: conn });
    }
    const newSecret = generateSecret();
    const updated: SiteConnection = {
      type: "custom_api",
      secret: newSecret,
      status: "disconnected",
    };
    await supabase
      .from("projects")
      .update({ site_connection: updated })
      .eq("id", project.id);
    return NextResponse.json({ connection: updated });
  }

  if (action === "test") {
    if (conn?.type === "github") {
      if (!conn.github_token || !conn.repo_owner || !conn.repo_name)
        return NextResponse.json({ error: "GitHub repo not configured" }, { status: 400 });

      const result = await testGitHubConnection(conn.github_token, conn.repo_owner, conn.repo_name);
      const updated: SiteConnection = {
        ...conn,
        status: result.valid ? "connected" : "error",
        last_tested_at: new Date().toISOString(),
        last_error: result.error,
      };
      await supabase.from("projects").update({ site_connection: updated }).eq("id", project.id);
      return NextResponse.json({ ...result, connection: updated });
    }

    if (!conn?.endpoint_url || !conn?.secret)
      return NextResponse.json(
        { error: "No site connection configured" },
        { status: 400 }
      );

    const result = await testSiteConnection(conn.endpoint_url, conn.secret);
    const updated: SiteConnection = {
      ...conn,
      status: result.valid ? "connected" : "error",
      last_tested_at: new Date().toISOString(),
      last_error: result.error,
    };

    await supabase
      .from("projects")
      .update({ site_connection: updated })
      .eq("id", project.id);

    return NextResponse.json({ ...result, connection: updated });
  }

  if (action === "github-configure") {
    if (!conn || conn.type !== "github" || !conn.github_token)
      return NextResponse.json({ error: "GitHub not connected" }, { status: 400 });

    const updated: SiteConnection = {
      ...conn,
      repo_owner: repoOwner ?? conn.repo_owner,
      repo_name: repoName ?? conn.repo_name,
      branch: branch ?? conn.branch ?? "main",
      content_dir: contentDir ?? conn.content_dir ?? "",
      file_format: fileFormat ?? conn.file_format ?? "mdx",
      status: "disconnected",
    };

    const testResult = await testGitHubConnection(
      conn.github_token,
      updated.repo_owner!,
      updated.repo_name!
    );

    updated.status = testResult.valid ? "connected" : "error";
    updated.last_tested_at = new Date().toISOString();
    updated.last_error = testResult.error;

    await supabase.from("projects").update({ site_connection: updated }).eq("id", project.id);
    return NextResponse.json({ connection: updated, valid: testResult.valid });
  }

  if (action === "update" && endpointUrl) {
    const updated: SiteConnection = {
      ...conn,
      type: "custom_api",
      endpoint_url: endpointUrl.trim(),
      status: "disconnected",
      last_error: undefined,
    };

    await supabase
      .from("projects")
      .update({ site_connection: updated })
      .eq("id", project.id);

    return NextResponse.json({ connection: updated });
  }

  if (action === "disconnect") {
    await supabase
      .from("projects")
      .update({ site_connection: null })
      .eq("id", project.id);

    return NextResponse.json({ connection: null });
  }

  if (action === "regenerate-secret") {
    const newSecret = generateSecret();
    const updated: SiteConnection = {
      ...conn,
      type: conn?.type ?? "custom_api",
      secret: newSecret,
      status: "disconnected",
    };

    await supabase
      .from("projects")
      .update({ site_connection: updated })
      .eq("id", project.id);

    return NextResponse.json({ connection: updated, secret: newSecret });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
