import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adaptArticle } from "@/lib/engine/variant-adapter";
import { computeNextSlot } from "@/lib/engine/scheduler";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { articleId, channelId } = await req.json();

  if (!articleId || !channelId) {
    return NextResponse.json(
      { error: "articleId and channelId are required" },
      { status: 400 }
    );
  }

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("*, projects!inner(id, user_id, name, url)")
    .eq("id", articleId)
    .single();

  if (articleError || !article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  if (article.projects.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data: channel, error: channelError } = await supabase
    .from("channels")
    .select("*")
    .eq("id", channelId)
    .single();

  if (channelError || !channel) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  if (channel.project_id !== article.project_id) {
    return NextResponse.json(
      { error: "Channel and article must belong to the same project" },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("article_variants")
    .select("id")
    .eq("article_id", articleId)
    .eq("channel_id", channelId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "Variant already exists for this channel", variantId: existing.id },
      { status: 409 }
    );
  }

  const { data: analysis } = await supabase
    .from("analyses")
    .select("product_summary, site_title")
    .eq("project_id", article.project_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  try {
    const result = await adaptArticle({
      masterArticle: {
        title: article.title,
        content: article.content,
        pillarKeyword: article.pillar_keyword ?? "",
        supportingKeywords: article.supporting_keywords ?? [],
        metaDescription: article.meta_description ?? "",
      },
      platform: channel.platform_type,
      productContext: {
        name: analysis?.site_title ?? article.projects.name ?? "",
        url: article.projects.url,
        summary: analysis?.product_summary ?? "",
      },
    });

    const scheduledAt = await computeNextSlot(
      supabase,
      article.project_id,
      channel.platform_type
    );

    const { data: variant, error: insertError } = await supabase
      .from("article_variants")
      .insert({
        article_id: articleId,
        channel_id: channelId,
        title: result.title,
        content: result.content,
        format: result.format,
        word_count: result.wordCount,
        status: "scheduled",
        scheduled_at: scheduledAt,
        model_used: "claude-sonnet-4.6",
      })
      .select("id, scheduled_at")
      .single();

    if (insertError) {
      console.error("[VariantGen] Insert error:", insertError);
      throw new Error(`Insert failed: ${insertError.message}`);
    }

    return NextResponse.json({
      variantId: variant.id,
      title: result.title,
      wordCount: result.wordCount,
      format: result.format,
      platform: channel.platform_type,
      scheduledAt: variant.scheduled_at,
    });
  } catch (e) {
    console.error("Variant generation error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Generation failed" },
      { status: 500 }
    );
  }
}
