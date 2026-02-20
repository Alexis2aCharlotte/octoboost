/**
 * GitHub App integration — Push articles as MD/MDX files to a user's repo.
 * Uses GitHub App installation flow (user selects repos during install).
 * Tokens expire → refresh via client_id/client_secret + refresh_token.
 */

export interface GitHubSiteConnection {
  type: "github";
  github_token: string;
  github_refresh_token?: string;
  github_token_expires_at?: string;
  installation_id?: number;
  repo_owner: string;
  repo_name: string;
  branch: string;
  content_dir: string;
  file_format: "md" | "mdx";
  status: "connected" | "disconnected" | "error";
  last_error?: string;
  connected_at?: string;
}

/**
 * Refresh an expired GitHub App user-to-server token.
 */
export async function refreshGitHubToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
} | null> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  return data;
}

/**
 * Get a valid token, refreshing if expired. Returns null if refresh fails.
 */
export async function getValidToken(
  conn: GitHubSiteConnection
): Promise<{ token: string; updated?: Partial<GitHubSiteConnection> } | null> {
  if (conn.github_token_expires_at) {
    const expiresAt = new Date(conn.github_token_expires_at).getTime();
    const now = Date.now();
    if (now < expiresAt - 60_000) {
      return { token: conn.github_token };
    }
  } else {
    return { token: conn.github_token };
  }

  if (!conn.github_refresh_token) return null;

  const refreshed = await refreshGitHubToken(conn.github_refresh_token);
  if (!refreshed) return null;

  return {
    token: refreshed.access_token,
    updated: {
      github_token: refreshed.access_token,
      github_refresh_token: refreshed.refresh_token,
      github_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
    },
  };
}

export interface GitHubRepo {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  private: boolean;
  default_branch: string;
  description: string | null;
  html_url: string;
  pushed_at: string | null;
}

export interface GitHubTreeEntry {
  path: string;
  type: "blob" | "tree";
}

interface ArticlePayload {
  title: string;
  slug: string;
  content: string;
  metaDescription?: string;
  tags?: string[];
  date?: string;
}

const GITHUB_API = "https://api.github.com";

function headers(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function getGitHubUser(token: string): Promise<{ login: string; avatar_url: string }> {
  const res = await fetch(`${GITHUB_API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(`GitHub user fetch failed: ${res.status}`);
  return res.json();
}

export async function listRepos(token: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = [];
  let page = 1;

  while (page <= 5) {
    const res = await fetch(
      `${GITHUB_API}/user/repos?sort=pushed&per_page=30&page=${page}&affiliation=owner,collaborator`,
      { headers: headers(token) }
    );
    if (!res.ok) break;
    const data = await res.json();
    if (data.length === 0) break;

    for (const r of data) {
      repos.push({
        id: r.id,
        full_name: r.full_name,
        name: r.name,
        owner: r.owner.login,
        private: r.private,
        default_branch: r.default_branch,
        description: r.description,
        html_url: r.html_url,
        pushed_at: r.pushed_at,
      });
    }
    page++;
  }

  return repos;
}

const IGNORED_DIR_PATTERNS = [
  /^\./, /node_modules/, /\.next/, /\.git/, /\.vercel/, /\.turbo/,
  /\bapi\b/, /\bauth\b/, /\bcomponents?/, /\bhooks?/, /\blib\b/, /\butils?\b/,
  /\bstyles?\b/, /\btypes?\b/, /\bconfig/, /\bpublic\b/, /\b__/,
  /\bactions?\b/, /\bcontexts?\b/, /\bproviders?\b/, /\bservices?\b/,
  /\bmiddleware/, /\bschemas?\b/, /\bsupabase\b/, /\bdist\b/, /\bbuild\b/,
];

const SUGGESTED_DIR_PATTERNS = [
  /blog/i, /posts?/i, /articles?/i, /content/i, /writing/i,
  /pages.*blog/i, /data.*blog/i, /src\/content/i, /collections?/i,
  /mdx?/i, /_posts/i,
];

export interface DirectoryEntry {
  path: string;
  suggested: boolean;
}

export async function listDirectories(
  token: string,
  owner: string,
  repo: string,
  branch: string
): Promise<DirectoryEntry[]> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers: headers(token) }
  );
  if (!res.ok) return [];

  const data = await res.json();
  const dirs: DirectoryEntry[] = [];

  for (const entry of data.tree ?? []) {
    if (entry.type !== "tree") continue;
    const p = entry.path as string;

    const ignored = IGNORED_DIR_PATTERNS.some((rx) => rx.test(p));
    if (ignored) continue;

    const suggested = SUGGESTED_DIR_PATTERNS.some((rx) => rx.test(p));
    dirs.push({ path: p, suggested });
  }

  dirs.sort((a, b) => {
    if (a.suggested && !b.suggested) return -1;
    if (!a.suggested && b.suggested) return 1;
    return a.path.localeCompare(b.path);
  });

  return dirs;
}

function generateFrontmatter(payload: ArticlePayload, format: "md" | "mdx"): string {
  const date = payload.date ?? new Date().toISOString().split("T")[0];
  const lines = [
    "---",
    `title: "${payload.title.replace(/"/g, '\\"')}"`,
    `description: "${(payload.metaDescription ?? "").replace(/"/g, '\\"')}"`,
    `date: "${date}"`,
    `slug: "${payload.slug}"`,
  ];

  if (payload.tags && payload.tags.length > 0) {
    lines.push(`tags: [${payload.tags.map((t) => `"${t}"`).join(", ")}]`);
  }

  if (format === "mdx") {
    lines.push(`draft: false`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function buildFileContent(payload: ArticlePayload, format: "md" | "mdx"): string {
  const frontmatter = generateFrontmatter(payload, format);
  return `${frontmatter}\n\n${payload.content}\n`;
}

/**
 * Push (create or update) a file to a GitHub repo via the Contents API.
 * Returns the commit URL and the file's HTML URL.
 */
export async function pushFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<{ url: string; commitUrl: string }> {
  const encodedContent = Buffer.from(content).toString("base64");

  const existingRes = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
    { headers: headers(token) }
  );

  let sha: string | undefined;
  if (existingRes.ok) {
    const existing = await existingRes.json();
    sha = existing.sha;
  }

  const body: Record<string, string> = {
    message: commitMessage,
    content: encodedContent,
    branch,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${filePath}`,
    {
      method: "PUT",
      headers: { ...headers(token), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`GitHub push failed (${res.status}): ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  return {
    url: data.content?.html_url ?? `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`,
    commitUrl: data.commit?.html_url ?? "",
  };
}

/**
 * Publish an article to the user's GitHub repo.
 * Builds the file with frontmatter, pushes it, returns the URL.
 */
export async function publishArticleToGitHub(
  conn: GitHubSiteConnection,
  payload: ArticlePayload
): Promise<{ success: boolean; url: string }> {
  const fileContent = buildFileContent(payload, conn.file_format);
  const dir = conn.content_dir.replace(/^\/|\/$/g, "");
  const filePath = dir ? `${dir}/${payload.slug}.${conn.file_format}` : `${payload.slug}.${conn.file_format}`;
  const commitMessage = `feat(blog): add "${payload.title}"`;

  const result = await pushFile(
    conn.github_token,
    conn.repo_owner,
    conn.repo_name,
    conn.branch,
    filePath,
    fileContent,
    commitMessage
  );

  return { success: true, url: result.url };
}

/**
 * Test the GitHub connection by checking repo access.
 */
export async function testGitHubConnection(
  token: string,
  owner: string,
  repo: string
): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
      headers: headers(token),
    });

    if (res.status === 404) return { valid: false, error: "Repository not found or no access" };
    if (res.status === 401) return { valid: false, error: "GitHub token is invalid or expired" };
    if (!res.ok) return { valid: false, error: `GitHub API error: ${res.status}` };

    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : "Connection failed" };
  }
}
