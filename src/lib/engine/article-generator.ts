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
    articleType?: string;
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

const SHARED_WRITING_RULES = `Writing style:
- Clear, direct, and authoritative
- Use short paragraphs (2-3 sentences max)
- Include data, examples, and actionable advice
- Write like a knowledgeable human, not a corporate blog
- Natural keyword placement, never stuff keywords
- Use markdown formatting: ## for H2, ### for H3, **bold** for emphasis, - for lists
- Include a brief intro paragraph before the first H2
- End with a clear conclusion/takeaway section
- NEVER use em dashes. Use commas, colons, parentheses, or split into separate sentences instead.

SEO rules:
- Include the pillar keyword in the first 100 words
- Use supporting keywords naturally throughout
- Write content that directly answers the search query
- Include 3-6 internal links to other pages on the site where contextually relevant
- Internal links should use descriptive anchor text and feel natural in the sentence`;

const FAQ_RULES = `FAQ section (MANDATORY):
- End the article with a "## Frequently Asked Questions" section BEFORE the conclusion
- Include 3-5 questions and answers
- Questions should be real queries people type into Google or ask AI assistants about this topic
- Format each as: ### Question text\\nAnswer paragraph
- Answers should be concise (2-3 sentences), direct, and authoritative
- These FAQ entries are highly cited by ChatGPT, Perplexity, and Claude`;

function getOutlineSystem(articleType: string): string {
  const base = `You are a senior SEO content strategist. You create article outlines that are designed to rank on Google page 1 and get cited by AI tools like ChatGPT and Perplexity.
- NEVER use em dashes in headings or key points`;

  switch (articleType) {
    case "listicle":
      return `${base}

You are creating a LISTICLE article (e.g., "Top 5...", "Best X for Y").

Your outlines:
- Title must include a number and the pillar keyword (e.g., "Top 7 SEO Tools for SaaS Founders in 2026")
- Structure: intro, then one H2 per item in the list, then FAQ, then conclusion
- Each item section should cover: what it is, key features, pros, cons, who it's best for
- Include the client's product as one of the items (not necessarily #1, keep it credible)
- Include 5-10 items in the list
- Target 2000-2500 words total
- ALWAYS include a "Frequently Asked Questions" section near the end with 3-5 Q&A pairs`;

    case "comparison":
      return `${base}

You are creating a COMPARISON article (e.g., "X vs Y", "X alternatives").

Your outlines:
- Title should include "vs" or "alternative" and the pillar keyword
- Structure: intro with quick verdict, overview of each product, feature-by-feature comparison table section, use cases (who should use what), FAQ, conclusion with recommendation
- Be fair and balanced, but highlight where the client's product excels
- Include a "Quick comparison" section early with a summary table
- Cover: features, pricing, ease of use, best for
- Target 2000-2500 words total
- ALWAYS include a "Frequently Asked Questions" section near the end with 3-5 Q&A pairs`;

    case "how-to":
      return `${base}

You are creating a HOW-TO article (step-by-step guide).

Your outlines:
- Title should start with "How to" and include the pillar keyword
- Structure: intro (what you'll learn), prerequisites if any, numbered steps as H2s, tips/common mistakes, FAQ, conclusion
- Each step should be actionable and specific
- Include screenshots/tool suggestions where relevant
- Mention the client's product naturally where it helps accomplish a step
- Target 2000-2500 words total
- ALWAYS include a "Frequently Asked Questions" section near the end with 3-5 Q&A pairs`;

    default:
      return `${base}

Your outlines:
- Start with a compelling H1 that includes the pillar keyword naturally
- Use H2/H3 that target supporting keywords
- Include a "What is..." or definition section early (AI tools love citing these)
- Have a clear structure: intro, problem/context, main content, actionable takeaways, FAQ, conclusion
- Target 2000-2500 words total (keep it focused, no filler)
- Include sections that answer "People Also Ask" style questions
- ALWAYS include a "Frequently Asked Questions" section near the end with 3-5 Q&A pairs`;
  }
}

function getWritingSystem(articleType: string): string {
  const base = `You are an expert content writer who creates long-form SEO articles that rank on Google and get cited by AI assistants.

${SHARED_WRITING_RULES}`;

  switch (articleType) {
    case "listicle":
      return `${base}

Listicle-specific rules:
- Add internal context about the product only where it genuinely helps the reader
- STRICT word count: aim for 2000-2500 words. Do NOT exceed 2500 words.
- Each list item should have a consistent structure: brief intro, key features, pros/cons, verdict
- The client's product should be included naturally as one item, not as an ad
- Use numbered H2 headings for each item (e.g., "## 1. Tool Name")
- Include a brief intro paragraph comparing the landscape before diving into the list

${FAQ_RULES}

CRITICAL: Write the full article. Do not use placeholders or skip sections.`;

    case "comparison":
      return `${base}

Comparison-specific rules:
- Add internal context about the product only where it genuinely helps the reader
- STRICT word count: aim for 2000-2500 words. Do NOT exceed 2500 words.
- Start with a "Quick Verdict" paragraph giving the bottom line
- Be balanced and fair, acknowledge strengths of both sides
- Use a comparison structure: feature-by-feature analysis
- Include a summary section with a markdown table comparing key aspects
- The recommendation should feel earned, not forced

${FAQ_RULES}

CRITICAL: Write the full article. Do not use placeholders or skip sections.`;

    case "how-to":
      return `${base}

How-to specific rules:
- Add internal context about the product only where it genuinely helps the reader
- STRICT word count: aim for 2000-2500 words. Do NOT exceed 2500 words.
- Number each step clearly in the H2 headings
- Each step should be self-contained and actionable
- Include expected outcomes or what to look for after each step
- Mention tools (including the client's product) only when they genuinely help accomplish a step
- Add a "Common Mistakes to Avoid" or "Pro Tips" section before the FAQ

${FAQ_RULES}

CRITICAL: Write the full article. Do not use placeholders or skip sections.`;

    default:
      return `${base}

- Add internal context about the product only where it genuinely helps the reader
- STRICT word count: aim for 2000-2500 words. Do NOT exceed 2500 words. Be concise and avoid filler.

${FAQ_RULES}

CRITICAL: Write the full article. Do not use placeholders, do not skip sections, do not write "continue here". Every section must be complete.`;
  }
}

export async function generateArticle(
  input: ArticleInput
): Promise<GeneratedArticle> {
  const { cluster, productContext, sitePages } = input;
  const articleType = cluster.articleType ?? "informational";
  const allKeywords = [
    cluster.pillarKeyword,
    ...cluster.supportingKeywords,
  ];

  const internalLinksBlock = sitePages && sitePages.length > 0
    ? `\n\nInternal pages on the site (use these for internal linking where relevant):
${sitePages.map((p) => `- [${p.title}](${p.path}): ${p.description}`).join("\n")}`
    : "";

  const keyToolsBlock = productContext.keyTools && productContext.keyTools.length > 0
    ? `\n\nKey tools/features of the product (mention these naturally where relevant):
${productContext.keyTools.map((t) => `- **${t.name}**: ${t.description}`).join("\n")}`
    : "";

  const { object: outline } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: outlineSchema,
    system: getOutlineSystem(articleType),
    prompt: `Create a detailed outline for this ${articleType} article:

Topic: ${cluster.topic}
Suggested title: ${cluster.articleTitle}
Article type: ${articleType}
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

  const sectionPrompts = outline.sections
    .map(
      (s) =>
        `## ${s.heading}\nKey points: ${s.keyPoints.join("; ")}\nTarget keywords: ${s.targetKeywords.join(", ")}`
    )
    .join("\n\n");

  const { text: content } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: getWritingSystem(articleType),
    prompt: `Write the complete ${articleType} article using this outline.

Title: ${outline.title}
Meta description: ${outline.metaDescription}
Article type: ${articleType}
Pillar keyword: ${cluster.pillarKeyword}
All target keywords: ${allKeywords.join(", ")}

Product to mention naturally:
- ${productContext.name} (${productContext.url}): ${productContext.summary}${keyToolsBlock}

Outline:
${sectionPrompts}

Write the FULL article now in markdown. Start directly with the content (no title heading, it will be added separately). Include all sections from the outline.${internalLinksBlock}`,
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
