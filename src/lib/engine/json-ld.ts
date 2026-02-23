export interface ArticleJsonLdInput {
  title: string;
  description: string;
  content: string;
  slug: string;
  siteUrl: string;
  siteName: string;
  publishedAt: string;
  updatedAt?: string;
  pillarKeyword?: string;
  tags?: string[];
}

interface FaqEntry {
  question: string;
  answer: string;
}

function extractFaqFromContent(content: string): FaqEntry[] {
  const faqSectionMatch = content.match(
    /##\s*Frequently Asked Questions[\s\S]*?(?=\n##\s[^#]|\n##\s*$|$)/i
  );
  if (!faqSectionMatch) return [];

  const faqSection = faqSectionMatch[0];
  const entries: FaqEntry[] = [];

  const questionBlocks = faqSection.split(/###\s+/).slice(1);
  for (const block of questionBlocks) {
    const lines = block.trim().split("\n");
    const question = lines[0]?.replace(/\??\s*$/, "?").trim();
    const answer = lines
      .slice(1)
      .join(" ")
      .replace(/\s+/g, " ")
      .replace(/\*\*/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    if (question && answer) {
      entries.push({ question, answer });
    }
  }

  return entries;
}

export function generateArticleJsonLd(input: ArticleJsonLdInput): string {
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    description: input.description,
    author: {
      "@type": "Organization",
      name: input.siteName,
      url: input.siteUrl,
    },
    publisher: {
      "@type": "Organization",
      name: input.siteName,
      url: input.siteUrl,
    },
    datePublished: input.publishedAt,
    dateModified: input.updatedAt ?? input.publishedAt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${input.siteUrl.replace(/\/$/, "")}/${input.slug}`,
    },
    ...(input.tags && input.tags.length > 0
      ? { keywords: input.tags.join(", ") }
      : {}),
  };

  const faqEntries = extractFaqFromContent(input.content);

  const schemas = [
    `<script type="application/ld+json">\n${JSON.stringify(articleSchema, null, 2)}\n</script>`,
  ];

  if (faqEntries.length > 0) {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    schemas.push(
      `<script type="application/ld+json">\n${JSON.stringify(faqSchema, null, 2)}\n</script>`
    );
  }

  return schemas.join("\n\n");
}
