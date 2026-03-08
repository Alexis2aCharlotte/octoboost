/**
 * Extracts FAQ Q&A pairs from article HTML (markdown converted to HTML).
 * Looks for "Frequently Asked Questions" or "FAQ" H2 section, then parses each H3 as question + following content as answer.
 */
export function extractFAQFromHtml(
  html: string
): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];

  const faqSectionMatch = html.match(
    /<h2[^>]*>[\s\S]*?(?:Frequently Asked Questions|FAQ)[\s\S]*?<\/h2>([\s\S]*?)(?=<h2|$)/i
  );

  if (!faqSectionMatch) return faqs;

  const faqBlock = faqSectionMatch[1];
  const h3Regex = /<h3[^>]*>([\s\S]*?)<\/h3>\s*([\s\S]*?)(?=<h3|$)/g;
  let match;

  while ((match = h3Regex.exec(faqBlock)) !== null) {
    const question = match[1].replace(/<[^>]+>/g, "").trim();
    const answer = match[2]
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }

  return faqs;
}

/**
 * Builds schema.org FAQPage JSON-LD for rich results in Google search.
 */
export function buildFAQSchema(
  faqs: { question: string; answer: string }[]
): Record<string, unknown> | null {
  if (faqs.length === 0) return null;

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };
}
