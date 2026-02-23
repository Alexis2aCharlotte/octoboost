import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

export async function GET(req: NextRequest) {
  const isDemo = isDemoRequest(req);
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

  const projectParam = req.nextUrl.searchParams.get("projectId");
  if (!projectParam) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("user_id", userId);

  const isUuid = /^[0-9a-f]{8}-/i.test(projectParam);
  const project = (projects ?? []).find((p) =>
    isUuid ? p.id === projectParam : p.slug === projectParam
  );

  if (!project) {
    return NextResponse.json(
      { error: "Project not found" },
      { status: 404 }
    );
  }

  const { data: articles, error } = await supabase
    .from("articles")
    .select("id, cluster_id, title, slug, word_count, pillar_keyword, meta_description, status, model_used, created_at, updated_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    articles: (articles ?? []).map((a) => ({
      id: a.id,
      clusterId: a.cluster_id,
      title: a.title,
      slug: a.slug,
      wordCount: a.word_count,
      pillarKeyword: a.pillar_keyword,
      metaDescription: a.meta_description,
      status: a.status,
      modelUsed: a.model_used,
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    })),
  });
}
