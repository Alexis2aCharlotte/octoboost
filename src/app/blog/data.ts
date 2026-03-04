import { createClient } from "@supabase/supabase-js";
import { getOctoArticles, getOctoArticle, type OctoArticle } from "@/lib/octoboost";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  category: string | null;
  tags: string[] | null;
  author: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  meta_title: string | null;
  meta_description: string | null;
  views: number;
  source: "supabase" | "octoboost";
}

function octoToBlogPost(a: OctoArticle): BlogPost {
  return {
    id: `octo-${a.slug}`,
    slug: a.slug,
    title: a.title,
    excerpt: a.metaDescription,
    content: a.content,
    cover_image: null,
    category: a.tags?.[0] || null,
    tags: a.tags,
    author: "Tobby",
    published: true,
    published_at: a.publishedAt,
    created_at: a.publishedAt,
    updated_at: a.publishedAt,
    meta_title: a.title,
    meta_description: a.metaDescription,
    views: 0,
    source: "octoboost",
  };
}

export async function fetchAllPosts(): Promise<BlogPost[]> {
  const [supabaseResult, octoArticles] = await Promise.all([
    supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("published_at", { ascending: false }),
    getOctoArticles(),
  ]);

  const supabasePosts: BlogPost[] = (supabaseResult.data || []).map((p) => ({
    ...p,
    source: "supabase" as const,
  }));

  const supabaseSlugs = new Set(supabasePosts.map((p) => p.slug));
  const octoPosts = octoArticles
    .filter((a) => !supabaseSlugs.has(a.slug))
    .map(octoToBlogPost);

  return [...supabasePosts, ...octoPosts].sort((a, b) => {
    const da = a.published_at ? new Date(a.published_at).getTime() : 0;
    const db = b.published_at ? new Date(b.published_at).getTime() : 0;
    return db - da;
  });
}

export async function fetchPostBySlug(
  slug: string
): Promise<BlogPost | null> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .single();

  if (data) {
    await supabase
      .from("blog_posts")
      .update({ views: (data.views || 0) + 1 })
      .eq("id", data.id);
    return { ...data, source: "supabase" as const };
  }

  const octoArticle = await getOctoArticle(slug);
  if (octoArticle) return octoToBlogPost(octoArticle);

  return null;
}

export async function fetchAllSlugs(): Promise<string[]> {
  const allPosts = await fetchAllPosts();
  return allPosts.map((p) => p.slug);
}

export const BLOG_CATEGORIES = [
  "All",
  "SEO",
  "Content Strategy",
  "GEO",
  "Case Studies",
  "Guides",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];
