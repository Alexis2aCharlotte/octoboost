import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publishVariant } from "@/lib/engine/publisher";
import { verifyDevtoKey } from "@/lib/devto";
import { verifyHashnodeKey } from "@/lib/hashnode";
import { verifyTelegraphToken } from "@/lib/telegraph";
import {
  refreshBloggerAccessToken,
  verifyBloggerToken,
  getBlogIdFromUrl,
} from "@/lib/blogger";

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { variantId } = await req.json();

  if (!variantId) {
    return NextResponse.json({ error: "variantId is required" }, { status: 400 });
  }

  const { data: variant } = await supabase
    .from("article_variants")
    .select("articles!inner(project_id)")
    .eq("id", variantId)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const variantArticles = variant.articles as unknown as { project_id: string };
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", variantArticles.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const result = await publishVariant(supabase, variantId);

  if (!result.success) {
    const status = result.error === "Already published" ? 409 : 500;
    return NextResponse.json({ error: result.error, url: result.url }, { status });
  }

  return NextResponse.json({
    success: true,
    url: result.url,
    platform: result.platform,
  });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const channelId = searchParams.get("channelId");

  if (!channelId) {
    return NextResponse.json({ error: "channelId is required" }, { status: 400 });
  }

  const { data: channel } = await supabase
    .from("channels")
    .select("*, projects!inner(user_id)")
    .eq("id", channelId)
    .single();

  const channelProjects = channel?.projects as unknown as { user_id: string } | null;
  if (!channel || !channelProjects || channelProjects.user_id !== user.id) {
    return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  }

  const config = channel.config as Record<string, unknown>;

  if (channel.platform_type === "devto") {
    const apiKey = config?.apiKey as string;
    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "No API key" });
    }
    const result = await verifyDevtoKey(apiKey);
    return NextResponse.json(result);
  }

  if (channel.platform_type === "hashnode") {
    const apiKey = config?.apiKey as string;
    const publicationHost = config?.publicationHost as string | undefined;
    if (!apiKey) {
      return NextResponse.json({ valid: false, error: "No API key" });
    }
    const result = await verifyHashnodeKey(apiKey, publicationHost);
    return NextResponse.json(result);
  }

  if (channel.platform_type === "telegraph") {
    const accessToken = config?.apiKey as string;
    if (!accessToken) {
      return NextResponse.json({ valid: false, error: "No access token" });
    }
    const result = await verifyTelegraphToken(accessToken);
    return NextResponse.json(result);
  }

  if (channel.platform_type === "blogger") {
    const refreshToken = config?.refreshToken as string;
    const blogId = config?.blogId as string;
    const blogUrl = config?.blogUrl as string;

    if (!refreshToken) {
      return NextResponse.json({
        valid: false,
        error: "Not connected. Connect your Google account.",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return NextResponse.json({
        valid: false,
        error: "Blogger API not configured",
      });
    }

    try {
      const { accessToken } = await refreshBloggerAccessToken(
        clientId,
        clientSecret,
        refreshToken
      );
      const resolvedBlogId =
        blogId ?? (blogUrl ? await getBlogIdFromUrl(blogUrl, accessToken) : null);
      if (!resolvedBlogId) {
        return NextResponse.json({
          valid: false,
          error: "Could not resolve blog ID",
        });
      }
      const result = await verifyBloggerToken(accessToken, resolvedBlogId);
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({
        valid: false,
        error: e instanceof Error ? e.message : "Verification failed",
      });
    }
  }

  return NextResponse.json({ valid: false, error: `Verify not supported for ${channel.platform_type}` });
}
