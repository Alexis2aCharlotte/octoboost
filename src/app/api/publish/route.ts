import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyDevtoKey, publishToDevto } from "@/lib/devto";
import { verifyHashnodeKey, publishToHashnode } from "@/lib/hashnode";
import { verifyTelegraphToken, publishToTelegraph } from "@/lib/telegraph";
import {
  refreshBloggerAccessToken,
  publishToBlogger,
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

  const { data: variant, error: variantError } = await supabase
    .from("article_variants")
    .select(
      "*, channels!inner(id, platform_type, config, project_id), articles!inner(title, project_id, canonical_url, pillar_keyword, supporting_keywords)"
    )
    .eq("id", variantId)
    .single();

  if (variantError || !variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const pubArticles = variant.articles as unknown as {
    title: string;
    project_id: string;
    canonical_url: string | null;
    pillar_keyword: string | null;
    supporting_keywords: string[] | null;
  };
  const pubChannels = variant.channels as unknown as {
    id: string;
    platform_type: string;
    config: unknown;
    project_id: string;
  };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", pubArticles.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (variant.status === "published") {
    return NextResponse.json(
      { error: "Already published", url: variant.published_url },
      { status: 409 }
    );
  }

  const platform = pubChannels.platform_type;
  const config = pubChannels.config as Record<string, unknown>;

  try {
    let publishedUrl: string;

    if (platform === "devto") {
      const apiKey = config?.apiKey as string;
      if (!apiKey) {
        return NextResponse.json({ error: "No API key configured for Dev.to" }, { status: 400 });
      }

      const tags = (pubArticles.supporting_keywords ?? [])
        .slice(0, 4)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToDevto(apiKey, {
        title: variant.title,
        bodyMarkdown: variant.content,
        tags,
        canonicalUrl: pubArticles.canonical_url ?? undefined,
        published: true,
      });

      publishedUrl = result.url;
    } else if (platform === "hashnode") {
      const apiKey = config?.apiKey as string;
      const publicationId = config?.publicationId as string;
      if (!apiKey) {
        return NextResponse.json({ error: "No API key configured for Hashnode" }, { status: 400 });
      }
      if (!publicationId) {
        return NextResponse.json(
          { error: "No publication ID configured for Hashnode. Add your blog URL (e.g. niches-hunter.hashnode.dev)" },
          { status: 400 }
        );
      }

      const tags = (pubArticles.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToHashnode(apiKey, publicationId, {
        title: variant.title,
        bodyMarkdown: variant.content,
        tags,
        canonicalUrl: pubArticles.canonical_url ?? undefined,
      });

      publishedUrl = result.url;
    } else if (platform === "telegraph") {
      const accessToken = config?.apiKey as string;
      if (!accessToken) {
        return NextResponse.json(
          { error: "No access token configured for Telegraph" },
          { status: 400 }
        );
      }

      const result = await publishToTelegraph(accessToken, {
        title: variant.title,
        bodyMarkdown: variant.content,
        authorName: (config?.authorName as string) ?? undefined,
        authorUrl: (config?.authorUrl as string) ?? undefined,
      });

      publishedUrl = result.url;
    } else if (platform === "blogger") {
      const refreshToken = config?.refreshToken as string;
      const blogUrl = config?.blogUrl as string;
      const blogId = config?.blogId as string | undefined;

      if (!refreshToken) {
        return NextResponse.json(
          { error: "Blogger not connected. Connect your Google account first." },
          { status: 400 }
        );
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return NextResponse.json(
          { error: "Blogger API not configured (GOOGLE_CLIENT_ID/SECRET)" },
          { status: 500 }
        );
      }

      const { accessToken } = await refreshBloggerAccessToken(
        clientId,
        clientSecret,
        refreshToken
      );

      let resolvedBlogId = blogId;
      if (!resolvedBlogId && blogUrl) {
        resolvedBlogId =
          (await getBlogIdFromUrl(blogUrl, accessToken)) ?? undefined;
      }
      if (!resolvedBlogId) {
        return NextResponse.json(
          { error: "Could not resolve Blogger blog ID. Check blog URL." },
          { status: 400 }
        );
      }

      const labels = (pubArticles.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToBlogger(accessToken, resolvedBlogId, {
        title: variant.title,
        bodyMarkdown: variant.content,
        labels,
      });

      publishedUrl = result.url;
    } else {
      return NextResponse.json(
        { error: `Publishing not yet supported for ${platform}` },
        { status: 400 }
      );
    }

    await supabase
      .from("article_variants")
      .update({
        status: "published",
        published_url: publishedUrl,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", variantId);

    return NextResponse.json({
      success: true,
      url: publishedUrl,
      platform,
    });
  } catch (e) {
    console.error(`[Publish] ${platform} error:`, e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Publish failed" },
      { status: 500 }
    );
  }
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
