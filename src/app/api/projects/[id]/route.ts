import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProject(supabase: any, identifier: string, userId: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

  const query = supabase
    .from("projects")
    .select("id, slug")
    .eq("user_id", userId);

  if (isUuid) {
    query.eq("id", identifier);
  } else {
    query.eq("slug", identifier);
  }

  return query.single();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = isDemoRequest(_req);
  const supabase = isDemo ? createDemoClient() : await createClient();

  let userId: string;
  if (isDemo) {
    userId = getDemoUserId();
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase
    .from("projects")
    .select(`id, name, slug, url, created_at, analyses ( id, site_title, site_description, created_at )`)
    .eq("user_id", userId);

  if (isUuid) {
    query.eq("id", id);
  } else {
    query.eq("slug", id);
  }

  const { data: project, error } = await query.single();

  if (error || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const analyses = Array.isArray(project.analyses) ? project.analyses : [];
  const sorted = [...analyses].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const latest = sorted[0] ?? null;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const analysesLast30d = sorted.filter(
    (a) => new Date(a.created_at).getTime() > thirtyDaysAgo
  ).length;

  return NextResponse.json({
    projectId: project.id,
    slug: project.slug,
    name: project.name,
    url: project.url,
    createdAt: project.created_at,
    latestAnalysisId: latest?.id ?? null,
    latestAnalysis: latest
      ? { id: latest.id, site_title: latest.site_title, created_at: latest.created_at }
      : null,
    analysesLast30d,
    totalAnalyses: analyses.length,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: project } = await resolveProject(supabase, id, user.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", project.id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
