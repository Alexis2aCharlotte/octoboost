import { SupabaseClient } from "@supabase/supabase-js";
import { publishToDevto } from "@/lib/devto";
import { publishToHashnode } from "@/lib/hashnode";
import { publishToTelegraph } from "@/lib/telegraph";
import {
  refreshBloggerAccessToken,
  publishToBlogger,
  getBlogIdFromUrl,
} from "@/lib/blogger";
import { publishToWordPress } from "@/lib/wordpress";

export interface PublishResult {
  success: boolean;
  url?: string;
  platform?: string;
  error?: string;
}

export async function publishVariant(
  supabase: SupabaseClient,
  variantId: string
): Promise<PublishResult> {
  const { data: variant, error: variantError } = await supabase
    .from("article_variants")
    .select(
      "*, channels!inner(id, platform_type, config, project_id), articles!inner(title, project_id, canonical_url, pillar_keyword, supporting_keywords)"
    )
    .eq("id", variantId)
    .single();

  if (variantError || !variant) {
    return { success: false, error: "Variant not found" };
  }

  if (variant.status === "published") {
    return { success: false, error: "Already published", url: variant.published_url };
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

  const platform = pubChannels.platform_type;
  const config = pubChannels.config as Record<string, unknown>;
  const canonicalUrl = pubArticles.canonical_url ?? undefined;

  function withCanonicalFooter(content: string): string {
    if (!canonicalUrl) return content;
    return `${content}\n\n---\n\n*Originally published on [${pubArticles.title}](${canonicalUrl})*`;
  }

  try {
    let publishedUrl: string;

    if (platform === "devto") {
      const apiKey = config?.apiKey as string;
      if (!apiKey) return { success: false, error: "No API key configured for Dev.to" };

      const tags = (pubArticles.supporting_keywords ?? [])
        .slice(0, 4)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToDevto(apiKey, {
        title: variant.title,
        bodyMarkdown: variant.content,
        tags,
        canonicalUrl,
        published: true,
      });
      publishedUrl = result.url;
    } else if (platform === "hashnode") {
      const apiKey = config?.apiKey as string;
      const publicationId = config?.publicationId as string;
      if (!apiKey) return { success: false, error: "No API key configured for Hashnode" };
      if (!publicationId) {
        return { success: false, error: "No publication ID configured for Hashnode" };
      }

      const tags = (pubArticles.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToHashnode(apiKey, publicationId, {
        title: variant.title,
        bodyMarkdown: variant.content,
        tags,
        canonicalUrl,
      });
      publishedUrl = result.url;
    } else if (platform === "telegraph") {
      const accessToken = config?.apiKey as string;
      if (!accessToken) return { success: false, error: "No access token configured for Telegraph" };

      const result = await publishToTelegraph(accessToken, {
        title: variant.title,
        bodyMarkdown: withCanonicalFooter(variant.content),
        authorName: (config?.authorName as string) ?? undefined,
        authorUrl: canonicalUrl ?? (config?.authorUrl as string) ?? undefined,
      });
      publishedUrl = result.url;
    } else if (platform === "blogger") {
      const refreshToken = config?.refreshToken as string;
      const blogUrl = config?.blogUrl as string;
      const blogId = config?.blogId as string | undefined;

      if (!refreshToken) {
        return { success: false, error: "Blogger not connected. Connect your Google account first." };
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) {
        return { success: false, error: "Blogger API not configured (GOOGLE_CLIENT_ID/SECRET)" };
      }

      const { accessToken } = await refreshBloggerAccessToken(clientId, clientSecret, refreshToken);

      let resolvedBlogId = blogId;
      if (!resolvedBlogId && blogUrl) {
        resolvedBlogId = (await getBlogIdFromUrl(blogUrl, accessToken)) ?? undefined;
      }
      if (!resolvedBlogId) {
        return { success: false, error: "Could not resolve Blogger blog ID. Check blog URL." };
      }

      const labels = (pubArticles.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9]/g, "").toLowerCase())
        .filter((t: string) => t.length > 0);

      const result = await publishToBlogger(accessToken, resolvedBlogId, {
        title: variant.title,
        bodyMarkdown: withCanonicalFooter(variant.content),
        labels,
      });
      publishedUrl = result.url;
    } else if (platform === "wordpress") {
      const siteUrl = config?.siteUrl as string;
      const username = config?.username as string;
      const appPassword = config?.apiKey as string;
      if (!siteUrl || !username || !appPassword) {
        return { success: false, error: "WordPress not fully configured (site URL, username, app password)" };
      }

      const tags = (pubArticles.supporting_keywords ?? [])
        .slice(0, 5)
        .map((k: string) => k.replace(/[^a-zA-Z0-9\s]/g, "").trim())
        .filter((t: string) => t.length > 0);

      const result = await publishToWordPress(siteUrl, username, appPassword, {
        title: variant.title,
        bodyMarkdown: variant.content,
        tags,
        canonicalUrl,
        status: "publish",
      });
      publishedUrl = result.url;
    } else {
      return { success: false, error: `Publishing not yet supported for ${platform}` };
    }

    const now = new Date().toISOString();

    await supabase
      .from("article_variants")
      .update({
        status: "published",
        published_url: publishedUrl,
        published_at: now,
        updated_at: now,
      })
      .eq("id", variantId);

    // Auto-update parent article status to "published" if still draft/ready
    const articleId = variant.article_id;
    if (articleId) {
      const { data: article } = await supabase
        .from("articles")
        .select("status")
        .eq("id", articleId)
        .single();

      if (article && (article.status === "draft" || article.status === "ready")) {
        await supabase
          .from("articles")
          .update({ status: "published", updated_at: now })
          .eq("id", articleId);
      }
    }

    return { success: true, url: publishedUrl, platform };
  } catch (e) {
    const errorMsg = e instanceof Error ? e.message : "Publish failed";
    console.error(`[Publisher] ${platform} error:`, e);

    await supabase
      .from("article_variants")
      .update({
        status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", variantId);

    return { success: false, error: errorMsg };
  }
}
