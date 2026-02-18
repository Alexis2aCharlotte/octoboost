import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data: variant, error } = await supabase
    .from("article_variants")
    .select(
      "*, channels!inner(platform_type, name), articles!inner(project_id, title)"
    )
    .eq("id", id)
    .single();

  if (error || !variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", variant.articles.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  return NextResponse.json({
    id: variant.id,
    articleId: variant.article_id,
    channelId: variant.channel_id,
    title: variant.title,
    content: variant.content,
    format: variant.format,
    wordCount: variant.word_count,
    status: variant.status,
    publishedUrl: variant.published_url,
    publishedAt: variant.published_at,
    modelUsed: variant.model_used,
    createdAt: variant.created_at,
    updatedAt: variant.updated_at,
    platformType: variant.channels.platform_type,
    channelName: variant.channels.name,
    masterTitle: variant.articles.title,
  });
}

export async function PATCH(
  req: NextRequest,
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

  const body = await req.json();

  const { data: variant } = await supabase
    .from("article_variants")
    .select("article_id, articles!inner(project_id)")
    .eq("id", id)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", variant.articles.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  const allowedFields = ["title", "content", "status", "published_url", "published_at"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  if (body.content) {
    updates.word_count = body.content
      .split(/\s+/)
      .filter((w: string) => w.length > 0).length;
  }

  const { error } = await supabase
    .from("article_variants")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
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

  const { data: variant } = await supabase
    .from("article_variants")
    .select("article_id, articles!inner(project_id)")
    .eq("id", id)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", variant.articles.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { error } = await supabase
    .from("article_variants")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
