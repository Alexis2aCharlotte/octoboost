import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchDevtoArticleStats, type DevtoArticleStats } from "@/lib/devto";
import { fetchHashnodePostStats, type HashnodePostStats } from "@/lib/hashnode";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

export const maxDuration = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveProject(
  supabase: any,
  identifier: string,
  userId: string
) {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      identifier
    );
  const query = supabase
    .from("projects")
    .select("id, slug, url")
    .eq("user_id", userId);
  if (isUuid) query.eq("id", identifier);
  else query.eq("slug", identifier);
  return query.single();
}

export interface PlatformStats {
  platform: string;
  articles: {
    title: string;
    url: string;
    publishedAt: string;
    views: number;
    reactions: number;
    comments: number;
  }[];
  totals: {
    views: number;
    reactions: number;
    comments: number;
    articles: number;
  };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const isDemo = isDemoRequest(_req);
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

  const { data: project } = await resolveProject(supabase, id, userId);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: channels } = await supabase
    .from("channels")
    .select("id, platform_type, config")
    .eq("project_id", project.id);

  const { data: variants } = await supabase
    .from("article_variants")
    .select("id, title, published_url, published_at, channels!inner(platform_type)")
    .eq("status", "published")
    .in(
      "channel_id",
      (channels ?? []).map((c) => c.id)
    );

  const publishedUrls = new Set(
    (variants ?? []).map((v) => v.published_url).filter(Boolean)
  );

  const platformStats: PlatformStats[] = [];
  const errors: { platform: string; error: string }[] = [];

  for (const channel of channels ?? []) {
    const config = channel.config as Record<string, unknown>;

    if (channel.platform_type === "devto" && config?.apiKey) {
      try {
        const allStats = await fetchDevtoArticleStats(config.apiKey as string);
        const matched = allStats.filter((a) => publishedUrls.has(a.url));

        if (matched.length > 0) {
          platformStats.push(buildPlatformStats("Dev.to", matched));
        }
      } catch (e) {
        errors.push({ platform: "Dev.to", error: e instanceof Error ? e.message : "Failed" });
      }
    }

    if (channel.platform_type === "hashnode" && config?.apiKey && config?.publicationHost) {
      try {
        const allStats = await fetchHashnodePostStats(
          config.apiKey as string,
          config.publicationHost as string
        );
        const matched = allStats.filter((a) => publishedUrls.has(a.url));

        if (matched.length > 0) {
          platformStats.push(buildPlatformStats("Hashnode", matched));
        }
      } catch (e) {
        errors.push({ platform: "Hashnode", error: e instanceof Error ? e.message : "Failed" });
      }
    }
  }

  const totals = {
    views: platformStats.reduce((s, p) => s + p.totals.views, 0),
    reactions: platformStats.reduce((s, p) => s + p.totals.reactions, 0),
    comments: platformStats.reduce((s, p) => s + p.totals.comments, 0),
    articles: platformStats.reduce((s, p) => s + p.totals.articles, 0),
  };

  const publishedCount = (variants ?? []).length;
  const platformBreakdown = (channels ?? []).reduce<Record<string, number>>(
    (acc, ch) => {
      const count = (variants ?? []).filter(
        (v) =>
          (v.channels as unknown as { platform_type: string }).platform_type ===
          ch.platform_type
      ).length;
      if (count > 0) acc[ch.platform_type] = (acc[ch.platform_type] ?? 0) + count;
      return acc;
    },
    {}
  );

  return NextResponse.json({
    totals,
    platforms: platformStats,
    publishedCount,
    platformBreakdown,
    errors: errors.length > 0 ? errors : undefined,
  });
}

function buildPlatformStats(
  platform: string,
  articles: (DevtoArticleStats | HashnodePostStats)[]
): PlatformStats {
  return {
    platform,
    articles: articles
      .sort((a, b) => b.views - a.views)
      .map((a) => ({
        title: a.title,
        url: a.url,
        publishedAt: a.publishedAt,
        views: a.views,
        reactions: a.reactions,
        comments: a.comments,
      })),
    totals: {
      views: articles.reduce((s, a) => s + a.views, 0),
      reactions: articles.reduce((s, a) => s + a.reactions, 0),
      comments: articles.reduce((s, a) => s + a.comments, 0),
      articles: articles.length,
    },
  };
}
