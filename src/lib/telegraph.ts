const TELEGRAPH_API = "https://api.telegra.ph";

type TelegraphNode = string | { tag: string; attrs?: Record<string, string>; children?: TelegraphNode[] };

/**
 * Convert markdown to Telegraph DOM Node format.
 * Handles: paragraphs, headings (##, ###), bold, italic, code, links, lists, hr.
 */
function markdownToTelegraphNodes(markdown: string): TelegraphNode[] {
  const nodes: TelegraphNode[] = [];
  const blocks = markdown.split(/\n\n+/);

  function parseInline(text: string): TelegraphNode[] {
    const result: TelegraphNode[] = [];
    let rest = text;

    while (rest.length > 0) {
      // [text](url)
      const linkMatch = rest.match(/^\[([^\]]*)\]\(([^)]+)\)/);
      if (linkMatch) {
        result.push({ tag: "a", attrs: { href: linkMatch[2] }, children: [linkMatch[1]] });
        rest = rest.slice(linkMatch[0].length);
        continue;
      }
      // **bold**
      const boldMatch = rest.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        result.push({ tag: "strong", children: [boldMatch[1]] });
        rest = rest.slice(boldMatch[0].length);
        continue;
      }
      // *italic*
      const emMatch = rest.match(/^\*([^*]+)\*/);
      if (emMatch) {
        result.push({ tag: "em", children: [emMatch[1]] });
        rest = rest.slice(emMatch[0].length);
        continue;
      }
      // `code`
      const codeMatch = rest.match(/^`([^`]+)`/);
      if (codeMatch) {
        result.push({ tag: "code", children: [codeMatch[1]] });
        rest = rest.slice(codeMatch[0].length);
        continue;
      }
      // plain text until next special
      const nextSpecial = rest.search(/\[|\*\*|\*|`/);
      const chunk = nextSpecial >= 0 ? rest.slice(0, nextSpecial) : rest;
      if (chunk) result.push(chunk);
      rest = nextSpecial >= 0 ? rest.slice(nextSpecial) : "";
    }
    return result;
  }

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // ## heading
    const h4Match = trimmed.match(/^##\s+(.+)$/m);
    if (h4Match) {
      nodes.push({ tag: "h4", children: parseInline(h4Match[1].trim()) });
      continue;
    }
    // # heading
    const h3Match = trimmed.match(/^#\s+(.+)$/m);
    if (h3Match) {
      nodes.push({ tag: "h3", children: parseInline(h3Match[1].trim()) });
      continue;
    }
    // ### heading
    const h4Match2 = trimmed.match(/^###\s+(.+)$/m);
    if (h4Match2) {
      nodes.push({ tag: "h4", children: parseInline(h4Match2[1].trim()) });
      continue;
    }
    // --- or *** (horizontal rule)
    if (/^---+$/.test(trimmed) || /^\*+$/.test(trimmed)) {
      nodes.push({ tag: "hr", children: [] });
      continue;
    }
    // - list items (single block can have multiple lines)
    const listLines = trimmed.split(/\n/).filter((line) => /^- /.test(line));
    if (listLines.length >= 1 && listLines.every((l) => l.startsWith("- "))) {
      const items = listLines.map((line) => ({
        tag: "li" as const,
        children: parseInline(line.replace(/^- /, "")),
      }));
      nodes.push({ tag: "ul", children: items });
      continue;
    }
    // default: paragraph
    nodes.push({ tag: "p", children: parseInline(trimmed.replace(/\n/g, " ")) });
  }

  return nodes.length > 0 ? nodes : [{ tag: "p", children: [markdown] }];
}

export async function verifyTelegraphToken(accessToken: string): Promise<{
  valid: boolean;
  shortName?: string;
  authorName?: string;
  pageCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch(
      `${TELEGRAPH_API}/getAccountInfo?access_token=${encodeURIComponent(accessToken)}&fields=${encodeURIComponent(JSON.stringify(["short_name", "author_name", "page_count"]))}`
    );
    const data = await res.json();

    if (!data.ok || !data.result) {
      return {
        valid: false,
        error: data.error ?? "Invalid token",
      };
    }

    return {
      valid: true,
      shortName: data.result.short_name,
      authorName: data.result.author_name,
      pageCount: data.result.page_count,
    };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function publishToTelegraph(
  accessToken: string,
  article: {
    title: string;
    bodyMarkdown: string;
    authorName?: string;
    authorUrl?: string;
  }
): Promise<{ url: string; path: string }> {
  const content = markdownToTelegraphNodes(article.bodyMarkdown);
  const params = new URLSearchParams();
  params.set("access_token", accessToken);
  params.set("title", article.title.slice(0, 256));
  params.set("content", JSON.stringify(content));
  if (article.authorName) params.set("author_name", article.authorName.slice(0, 128));
  if (article.authorUrl) params.set("author_url", article.authorUrl.slice(0, 512));

  const res = await fetch(`${TELEGRAPH_API}/createPage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();
  if (!data.ok || !data.result) {
    throw new Error(data.error ?? `Telegraph API error: ${JSON.stringify(data)}`);
  }

  const page = data.result;
  const url = page.url ?? `https://telegra.ph/${page.path}`;
  return { url, path: page.path };
}
