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

  const articleId = req.nextUrl.searchParams.get("articleId");
  if (!articleId) {
    return NextResponse.json(
      { error: "articleId is required" },
      { status: 400 }
    );
  }

  const { data: article } = await supabase
    .from("articles")
    .select("id, project_id")
    .eq("id", articleId)
    .single();

  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", article.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: variants, error } = await supabase
    .from("article_variants")
    .select(
      "id, article_id, channel_id, title, word_count, format, status, published_url, published_at, model_used, created_at, updated_at, channels!inner(platform_type, name)"
    )
    .eq("article_id", articleId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    variants: (variants ?? []).map((v: Record<string, unknown>) => {
      const ch = v.channels as { platform_type: string; name: string } | null;
      return {
        id: v.id,
        articleId: v.article_id,
        channelId: v.channel_id,
        title: v.title,
        wordCount: v.word_count,
        format: v.format,
        status: v.status,
        publishedUrl: v.published_url,
        publishedAt: v.published_at,
        modelUsed: v.model_used,
        createdAt: v.created_at,
        updatedAt: v.updated_at,
        platformType: ch?.platform_type ?? "",
        channelName: ch?.name ?? "",
      };
    }),
  });
}
