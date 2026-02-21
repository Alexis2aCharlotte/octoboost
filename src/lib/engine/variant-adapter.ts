import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export type ConnectionType = "api_key" | "oauth" | "manual";
export type SyndicationType = "full_canonical" | "summary_link";

export interface PlatformSpec {
  name: string;
  tone: string;
  maxWords: number;
  minWords: number;
  format: "markdown" | "html" | "plain";
  connectionType: ConnectionType;
  syndication: SyndicationType;
  guidelines: string;
}

export const PLATFORM_SPECS: Record<string, PlatformSpec> = {
  devto: {
    name: "Dev.to",
    tone: "Technical but approachable. Developer-to-developer. Casual is fine.",
    maxWords: 1500,
    minWords: 600,
    format: "markdown",
    connectionType: "api_key",
    syndication: "full_canonical",
    guidelines: `- Start with a brief TL;DR or summary
- Include code snippets or technical examples when relevant
- Use markdown features: code blocks, tables, callouts
- Add a front matter section (title, description, tags) as a YAML comment
- Be practical — devs want actionable content
- Mention tools/libraries with links
- Keep paragraphs short (2-3 sentences)`,
  },
  hashnode: {
    name: "Hashnode",
    tone: "Technical, tutorial-style. Similar to Dev.to but can be more in-depth.",
    maxWords: 2000,
    minWords: 800,
    format: "markdown",
    connectionType: "api_key",
    syndication: "full_canonical",
    guidelines: `- Structure as a technical guide or tutorial
- Include code examples and explanations
- Use markdown: headers, code blocks, images, tables
- Add a table of contents for longer articles
- Be thorough — Hashnode readers expect depth
- Include prerequisites or requirements section if applicable
- End with next steps or further reading`,
  },
  medium: {
    name: "Medium",
    tone: "Personal, engaging, storytelling-driven. First person OK.",
    maxWords: 1800,
    minWords: 800,
    format: "markdown",
    connectionType: "manual",
    syndication: "full_canonical",
    guidelines: `- Use a compelling hook in the first paragraph
- Break content into scannable sections with H2/H3
- Include personal insights or anecdotes where relevant
- End with a clear takeaway or call-to-action
- Avoid overly promotional language — Medium readers detect it instantly
- Use bold for emphasis, not ALL CAPS
- Include 3-5 relevant tags at the end as a comment`,
  },
  reddit: {
    name: "Reddit",
    tone: "Authentic, conversational, zero corporate speak. Like talking to a peer.",
    maxWords: 800,
    minWords: 200,
    format: "markdown",
    connectionType: "manual",
    syndication: "summary_link",
    guidelines: `- Write as a genuine community member sharing knowledge
- NO self-promotion feel — Reddit will downvote it to oblivion
- Start with the value/insight, not a product pitch
- Use casual language, contractions are fine
- Format with line breaks for readability
- If mentioning a tool, present it as "I found this" or "there's this tool"
- Keep it concise — Reddit favors brevity
- Include a question at the end to spark discussion`,
  },
  wordpress: {
    name: "WordPress",
    tone: "Standard blog post. Professional but accessible.",
    maxWords: 2000,
    minWords: 800,
    format: "markdown",
    connectionType: "api_key",
    syndication: "full_canonical",
    guidelines: `- Classic blog post structure with clear H2/H3 hierarchy
- Include an engaging introduction with the main keyword
- Use bullet points and numbered lists for scannability
- Add internal linking suggestions as [link text](URL) placeholders
- Include a meta-description-friendly opening paragraph
- End with a conclusion and call-to-action
- Optimize for featured snippets (definition boxes, lists)`,
  },
  telegraph: {
    name: "Telegraph",
    tone: "Concise, scannable. Minimalist format — Telegraph favors clean structure.",
    maxWords: 1200,
    minWords: 400,
    format: "markdown",
    connectionType: "api_key",
    syndication: "full_canonical",
    guidelines: `- Use clear H2/H3 for sections — Telegraph displays them well
- Keep paragraphs short (2-3 sentences max)
- Use bullet lists for scannability
- Bold key terms for emphasis
- Include [links](url) where relevant — dofollow backlinks
- No complex formatting — Telegraph has limited markup support
- End with a brief takeaway or call-to-action`,
  },
  blogger: {
    name: "Blogger",
    tone: "Standard blog post. Clear, accessible, SEO-friendly.",
    maxWords: 2000,
    minWords: 600,
    format: "markdown",
    connectionType: "oauth",
    syndication: "full_canonical",
    guidelines: `- Classic blog structure with clear H2/H3 hierarchy
- Engaging introduction with main keyword
- Use bullet points and numbered lists for scannability
- Include relevant internal links where appropriate
- Optimize opening paragraph for meta description
- End with conclusion and call-to-action
- Blogger supports labels (tags) — use 3-5 relevant labels`,
  },
  indiehackers: {
    name: "Indie Hackers",
    tone: "Founder-to-founder. Authentic, transparent, build-in-public style.",
    maxWords: 1000,
    minWords: 300,
    format: "markdown",
    connectionType: "manual",
    syndication: "summary_link",
    guidelines: `- Write as a fellow founder sharing real experience
- Be transparent about challenges, not just wins
- Share specific numbers/metrics when possible
- Frame insights as lessons learned, not advice
- Keep it conversational — IH is a community, not a publication
- Ask for feedback or share your thought process
- Mention your product naturally as part of your story, never as a pitch
- End with a question to invite discussion`,
  },
  hackernews: {
    name: "Hacker News",
    tone: "Intellectual, concise, technically rigorous. No fluff, no marketing.",
    maxWords: 600,
    minWords: 150,
    format: "plain",
    connectionType: "manual",
    syndication: "summary_link",
    guidelines: `- Lead with the most interesting technical insight
- Be extremely concise — HN readers have zero tolerance for fluff
- Focus on technical depth over breadth
- NO promotional language whatsoever — it will get flagged instantly
- Present as a technical discussion or interesting finding
- Use plain text, minimal formatting
- If linking to a product, frame it as "Show HN" with technical details
- Include data or benchmarks when relevant`,
  },
  quora: {
    name: "Quora",
    tone: "Authoritative expert answering a specific question. Helpful and thorough.",
    maxWords: 800,
    minWords: 200,
    format: "plain",
    connectionType: "manual",
    syndication: "summary_link",
    guidelines: `- Structure as a direct answer to a specific question
- Start with a concise 1-2 sentence answer, then elaborate
- Use personal expertise and experience to add credibility
- Include specific examples and data
- Break into numbered steps or bullet points when relevant
- Mention tools/products only when directly answering the question
- End with a brief additional insight or related tip
- Write with authority — Quora rewards expert voices`,
  },
  substack: {
    name: "Substack",
    tone: "Newsletter style. Personal, insightful, builds relationship with reader.",
    maxWords: 1500,
    minWords: 500,
    format: "markdown",
    connectionType: "manual",
    syndication: "full_canonical",
    guidelines: `- Write as if emailing a smart friend about an interesting topic
- Start with a personal hook or observation
- Mix analysis with personal experience
- Use a conversational but insightful tone
- Include "why this matters" framing
- Break complex ideas into digestible sections
- End with a clear takeaway or prediction
- Feel free to express opinions — newsletter readers want a point of view`,
  },
};

export const AUTO_PUBLISH_PLATFORMS = Object.entries(PLATFORM_SPECS)
  .filter(([, spec]) => spec.connectionType !== "manual")
  .map(([key]) => key);

export const MANUAL_PLATFORMS = Object.entries(PLATFORM_SPECS)
  .filter(([, spec]) => spec.connectionType === "manual")
  .map(([key]) => key);

export interface VariantInput {
  masterArticle: {
    title: string;
    content: string;
    pillarKeyword: string;
    supportingKeywords: string[];
    metaDescription: string;
  };
  platform: string;
  productContext: {
    name: string;
    url: string;
    summary: string;
  };
}

export interface GeneratedVariant {
  title: string;
  content: string;
  wordCount: number;
  format: "markdown" | "html" | "plain";
}

export async function adaptArticle(
  input: VariantInput
): Promise<GeneratedVariant> {
  const spec = PLATFORM_SPECS[input.platform];
  if (!spec) {
    throw new Error(`Unknown platform: ${input.platform}`);
  }

  const isSummaryLink = spec.syndication === "summary_link";

  const syndicationRules = isSummaryLink
    ? `- This is a SUMMARY that drives readers to the full article
- Extract the 2-3 most compelling insights from the original
- Keep it concise and engaging — just enough to hook the reader
- Naturally include a link to the full article: ${input.productContext.url}
- The link should feel organic, not forced (e.g. "I wrote more about this here" or "Full breakdown:")
- The product mention should feel like genuine community sharing`
    : `- This is a full, standalone piece adapted for the platform
- Preserve the core insights and value from the original
- Adapt the structure, tone, and length for the platform's audience
- The product mention should feel natural for the platform's culture`;

  const { text: adapted } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: `You are an expert content adapter who transforms SEO articles into platform-optimized versions. You understand the culture, expectations, and best practices of each publishing platform.

Your job is to take a master article and create a version specifically tailored for ${spec.name}.

Tone: ${spec.tone}
Word count: ${spec.minWords}-${spec.maxWords} words
Format: ${spec.format}

Platform-specific guidelines:
${spec.guidelines}

Syndication strategy:
${syndicationRules}

CRITICAL RULES:
- Output ONLY the adapted content, no meta-commentary
- Start with the title on the first line, then a blank line, then the content`,
    prompt: `Adapt this master article for ${spec.name}:

MASTER ARTICLE:
Title: ${input.masterArticle.title}
Primary keyword: ${input.masterArticle.pillarKeyword}
Supporting keywords: ${input.masterArticle.supportingKeywords.join(", ")}

${input.masterArticle.content}

---

Product context (mention naturally where appropriate):
- ${input.productContext.name} (${input.productContext.url}): ${input.productContext.summary}

Create the ${spec.name} version now.`,
  });

  const lines = adapted.split("\n");
  const title =
    lines[0]?.replace(/^#+ /, "").trim() || input.masterArticle.title;
  const content = lines.slice(1).join("\n").trim();

  const wordCount = content
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    title,
    content,
    wordCount,
    format: spec.format,
  };
}
