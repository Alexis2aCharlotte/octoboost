import { generateText, generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export interface SitePageRef {
  path: string;
  title: string;
  description: string;
}

export interface ArticleInput {
  cluster: {
    topic: string;
    articleTitle: string;
    pillarKeyword: string;
    supportingKeywords: string[];
    searchIntent: string;
    difficulty: string;
    totalVolume: number;
  };
  productContext: {
    name: string;
    url: string;
    summary: string;
    targetAudience: string;
    keyTools?: { name: string; description: string }[];
  };
  sitePages?: SitePageRef[];
}

export interface GeneratedArticle {
  title: string;
  metaDescription: string;
  content: string;
  outline: string[];
  wordCount: number;
}

const outlineSchema = z.object({
  title: z.string().describe("SEO-optimized article title"),
  metaDescription: z
    .string()
    .describe("155 chars max meta description for Google"),
  sections: z.array(
    z.object({
      heading: z.string(),
      keyPoints: z.array(z.string()),
      targetKeywords: z.array(z.string()),
    })
  ),
});

export async function generateArticle(
  input: ArticleInput
): Promise<GeneratedArticle> {
  const { cluster, productContext, sitePages } = input;
  const allKeywords = [
    cluster.pillarKeyword,
    ...cluster.supportingKeywords,
  ];

  const internalLinksBlock = sitePages && sitePages.length > 0
    ? `\n\nInternal pages on the site (use these for internal linking where relevant):
${sitePages.map((p) => `- [${p.title}](${p.path}) — ${p.description}`).join("\n")}`
    : "";

  const keyToolsBlock = productContext.keyTools && productContext.keyTools.length > 0
    ? `\n\nKey tools/features of the product (mention these naturally where relevant):
${productContext.keyTools.map((t) => `- **${t.name}**: ${t.description}`).join("\n")}`
    : "";

  // Step 1: Generate structured outline
  const { object: outline } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: outlineSchema,
    system: `You are a senior SEO content strategist. You create article outlines that are designed to rank on Google page 1 and get cited by AI tools like ChatGPT and Perplexity.

Your outlines:
- Start with a compelling H1 that includes the pillar keyword naturally
- Use H2/H3 that target supporting keywords
- Include a "What is..." or definition section early (AI tools love citing these)
- Have a clear structure: intro, problem/context, main content, actionable takeaways, conclusion
- Target 2000-2500 words total (keep it focused, no filler)
- Include sections that answer "People Also Ask" style questions
- NEVER use em dashes in headings or key points`,
    prompt: `Create a detailed outline for this article:

Topic: ${cluster.topic}
Suggested title: ${cluster.articleTitle}
Pillar keyword: ${cluster.pillarKeyword}
Supporting keywords: ${cluster.supportingKeywords.join(", ")}
Search intent: ${cluster.searchIntent}
Monthly search volume: ${cluster.totalVolume}

Product context (to mention naturally, not as an ad):
- Product: ${productContext.name} (${productContext.url})
- What it does: ${productContext.summary}
- Audience: ${productContext.targetAudience}

The article should naturally reference the product where relevant, but the primary goal is to provide genuine value to the reader.${keyToolsBlock}${internalLinksBlock}`,
  });

  // Step 2: Generate full article from outline
  const sectionPrompts = outline.sections
    .map(
      (s, i) =>
        `## ${s.heading}\nKey points: ${s.keyPoints.join("; ")}\nTarget keywords: ${s.targetKeywords.join(", ")}`
    )
    .join("\n\n");

  const { text: content } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are an expert content writer who creates long-form SEO articles that rank on Google and get cited by AI assistants.

Writing style:
- Clear, direct, and authoritative
- Use short paragraphs (2-3 sentences max)
- Include data, examples, and actionable advice
- Write like a knowledgeable human, not a corporate blog
- Natural keyword placement, never stuff keywords
- Use markdown formatting: ## for H2, ### for H3, **bold** for emphasis, - for lists
- Include a brief intro paragraph before the first H2
- End with a clear conclusion/takeaway section
- NEVER use em dashes (—). Use commas, colons, parentheses, or split into separate sentences instead.

SEO rules:
- Include the pillar keyword in the first 100 words
- Use supporting keywords naturally throughout
- Add internal context about the product only where it genuinely helps the reader
- Write content that directly answers the search query
- STRICT word count: aim for 2000-2500 words. Do NOT exceed 2500 words. Be concise and avoid filler.
- Include 3-6 internal links to other pages on the site where contextually relevant (use the provided site pages list)
- Internal links should use descriptive anchor text and feel natural in the sentence

CRITICAL: Write the full article. Do not use placeholders, do not skip sections, do not write "continue here". Every section must be complete.`,
    prompt: `Write the complete article using this outline.

Title: ${outline.title}
Meta description: ${outline.metaDescription}
Pillar keyword: ${cluster.pillarKeyword}
All target keywords: ${allKeywords.join(", ")}

Product to mention naturally:
- ${productContext.name} (${productContext.url}): ${productContext.summary}${keyToolsBlock}

Outline:
${sectionPrompts}

Write the FULL article now in markdown. Start directly with the content (no title heading — it will be added separately). Include all sections from the outline.${internalLinksBlock}`,
  });

  const wordCount = content
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    title: outline.title,
    metaDescription: outline.metaDescription,
    content,
    outline: outline.sections.map((s) => s.heading),
    wordCount,
  };
}
