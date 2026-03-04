const OCTOBOOST_KEY = "ob_pk_shMHkJ7tGEezMikHGqjtk52y9yrX72ks";
const BASE_URL = "https://octoboost.app/api/public/articles";

export type OctoArticle = {
  title: string;
  slug: string;
  content: string;
  metaDescription: string;
  keyword: string;
  tags: string[];
  wordCount: number;
  publishedAt: string;
};

export async function getOctoArticles(): Promise<OctoArticle[]> {
  if (!OCTOBOOST_KEY) return [];
  try {
    const res = await fetch(`${BASE_URL}?key=${OCTOBOOST_KEY}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.articles ?? [];
  } catch {
    return [];
  }
}

export async function getOctoArticle(
  slug: string
): Promise<OctoArticle | null> {
  if (!OCTOBOOST_KEY) return null;
  try {
    const res = await fetch(`${BASE_URL}/${slug}?key=${OCTOBOOST_KEY}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
