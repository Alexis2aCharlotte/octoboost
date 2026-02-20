import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json(
      { error: "Missing API key. Pass ?key=ob_pk_xxx" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const supabase = createServiceClient();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, url")
    .eq("api_key", key)
    .single();

  if (!project) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401, headers: CORS_HEADERS }
    );
  }

  const limit = Math.min(
    parseInt(req.nextUrl.searchParams.get("limit") ?? "50", 10),
    100
  );
  const offset = parseInt(req.nextUrl.searchParams.get("offset") ?? "0", 10);

  const { data: articles, error } = await supabase
    .from("articles")
    .select(
      "title, slug, meta_description, pillar_keyword, supporting_keywords, word_count, created_at, updated_at"
    )
    .eq("project_id", project.id)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch articles" },
      { status: 500, headers: CORS_HEADERS }
    );
  }

  const formatted = (articles ?? []).map((a) => ({
    title: a.title,
    slug: a.slug,
    metaDescription: a.meta_description,
    keyword: a.pillar_keyword,
    tags: a.supporting_keywords ?? [],
    wordCount: a.word_count,
    publishedAt: a.updated_at ?? a.created_at,
  }));

  return NextResponse.json(
    { articles: formatted, total: formatted.length, site: project.name },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
