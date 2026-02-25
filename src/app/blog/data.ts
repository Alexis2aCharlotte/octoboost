import { createClient } from "@supabase/supabase-js";

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
}

export async function fetchAllPosts(): Promise<BlogPost[]> {
  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false });
  return data || [];
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
    return data;
  }

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
