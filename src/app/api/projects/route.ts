import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: projects, error } = await supabase
    .from("projects")
    .select(
      `
      id,
      name,
      slug,
      url,
      created_at,
      analyses (
        id,
        site_title,
        site_description,
        created_at
      )
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const projectList = (projects ?? []).map((p: { analyses?: { id: string; site_title: string; site_description: string; created_at: string }[] } & Record<string, unknown>) => {
    const analyses = Array.isArray(p.analyses) ? p.analyses : [];
    const sorted = [...analyses].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const latest = sorted[0] ?? null;

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const analysesLast30d = sorted.filter(
      (a) => new Date(a.created_at).getTime() > thirtyDaysAgo
    ).length;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug ?? p.id,
      url: p.url,
      created_at: p.created_at,
      latestAnalysisId: latest?.id ?? null,
      latestAnalysis: latest
        ? { id: latest.id, site_title: latest.site_title, created_at: latest.created_at }
        : null,
      analysesLast30d,
      totalAnalyses: analyses.length,
    };
  });

  return NextResponse.json({ projects: projectList });
}
