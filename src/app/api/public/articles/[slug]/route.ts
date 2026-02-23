import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateArticleJsonLd } from "@/lib/engine/json-ld";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
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

  const { data: article } = await supabase
    .from("articles")
    .select(
      "title, slug, content, meta_description, pillar_keyword, supporting_keywords, word_count, created_at, updated_at"
    )
    .eq("project_id", project.id)
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!article) {
    return NextResponse.json(
      { error: "Article not found" },
      { status: 404, headers: CORS_HEADERS }
    );
  }

  const jsonLd = generateArticleJsonLd({
    title: article.title,
    description: article.meta_description ?? "",
    content: article.content,
    slug: article.slug,
    siteUrl: project.url ?? "",
    siteName: project.name ?? "",
    publishedAt: article.created_at,
    updatedAt: article.updated_at ?? undefined,
    pillarKeyword: article.pillar_keyword,
    tags: article.supporting_keywords ?? [],
  });

  return NextResponse.json(
    {
      title: article.title,
      slug: article.slug,
      content: article.content,
      metaDescription: article.meta_description,
      keyword: article.pillar_keyword,
      tags: article.supporting_keywords ?? [],
      wordCount: article.word_count,
      publishedAt: article.updated_at ?? article.created_at,
      jsonLd,
    },
    {
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
