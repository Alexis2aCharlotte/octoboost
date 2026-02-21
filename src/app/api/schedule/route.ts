import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [variantsResult, articlesResult] = await Promise.all([
    supabase
      .from("article_variants")
      .select(
        "id, title, status, scheduled_at, published_at, published_url, channel_id, article_id, channels!inner(platform_type, name, config, project_id), articles!inner(title, pillar_keyword)"
      )
      .eq("channels.project_id", projectId)
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("articles")
      .select("id, title, status, scheduled_at, slug, canonical_url")
      .eq("project_id", projectId)
      .not("scheduled_at", "is", null)
      .in("status", ["scheduled", "published"])
      .order("scheduled_at", { ascending: true }),
  ]);

  if (variantsResult.error) {
    console.error("[Schedule] Variants error:", variantsResult.error);
    return NextResponse.json({ error: variantsResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    variants: variantsResult.data ?? [],
    articles: (articlesResult.data ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      scheduled_at: a.scheduled_at,
      canonical_url: a.canonical_url,
    })),
  });
}
