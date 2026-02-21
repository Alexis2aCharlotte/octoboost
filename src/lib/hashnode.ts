const HASHNODE_GQL = "https://gql.hashnode.com";

export interface HashnodePostStats {
  id: string;
  title: string;
  url: string;
  publishedAt: string;
  views: number;
  reactions: number;
  comments: number;
}

export async function fetchHashnodePostStats(
  apiKey: string,
  publicationHost: string
): Promise<HashnodePostStats[]> {
  const host = publicationHost.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const res = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        query PostsByPublication($host: String!, $first: Int!) {
          publication(host: $host) {
            posts(first: $first) {
              edges {
                node {
                  id
                  title
                  url
                  publishedAt
                  views
                  reactionCount
                  responseCount
                }
              }
            }
          }
        }
      `,
      variables: { host, first: 50 },
    }),
  });

  const data = await res.json();
  const edges = data?.data?.publication?.posts?.edges;
  if (!Array.isArray(edges)) return [];

  return edges.map((edge: { node: Record<string, unknown> }) => ({
    id: (edge.node.id as string) ?? "",
    title: (edge.node.title as string) ?? "",
    url: (edge.node.url as string) ?? "",
    publishedAt: (edge.node.publishedAt as string) ?? "",
    views: (edge.node.views as number) ?? 0,
    reactions: (edge.node.reactionCount as number) ?? 0,
    comments: (edge.node.responseCount as number) ?? 0,
  }));
}

export async function verifyHashnodeKey(
  apiKey: string,
  publicationHost?: string
): Promise<{
  valid: boolean;
  username?: string;
  publicationId?: string;
  publicationUrl?: string;
  error?: string;
}> {
  try {
    const res = await fetch(HASHNODE_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({
        query: `
          query Me {
            me {
              id
              username
            }
          }
        `,
      }),
    });

    const data = await res.json();
    if (data.errors?.length) {
      return {
        valid: false,
        error: data.errors[0]?.message ?? "Invalid token",
      };
    }
    if (!data.data?.me) {
      return { valid: false, error: "Invalid token" };
    }

    let publicationId: string | undefined;
    let publicationUrl: string | undefined;

    if (publicationHost) {
      const host = publicationHost.replace(/^https?:\/\//, "").replace(/\/$/, "");
      const pubRes = await fetch(HASHNODE_GQL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({
          query: `
            query Publication($host: String!) {
              publication(host: $host) {
                id
                url
              }
            }
          `,
          variables: { host },
        }),
      });
      const pubData = await pubRes.json();
      if (pubData.data?.publication) {
        publicationId = pubData.data.publication.id;
        publicationUrl = pubData.data.publication.url;
      }
    }

    return {
      valid: true,
      username: data.data.me.username,
      publicationId,
      publicationUrl,
    };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : "Unknown error",
    };
  }
}

export async function publishToHashnode(
  apiKey: string,
  publicationId: string,
  article: {
    title: string;
    bodyMarkdown: string;
    tags?: string[];
    canonicalUrl?: string;
  }
): Promise<{ url: string; id: string }> {
  const tagObjects = (article.tags ?? [])
    .slice(0, 5)
    .map((name) => {
      const slug = name.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      return slug.length > 0 ? { slug, name } : null;
    })
    .filter((t): t is { slug: string; name: string } => t !== null);

  const draftRes = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        mutation CreateDraft($input: CreateDraftInput!) {
          createDraft(input: $input) {
            draft {
              id
              title
            }
          }
        }
      `,
      variables: {
        input: {
          title: article.title,
          contentMarkdown: article.bodyMarkdown,
          publicationId,
          tags: tagObjects.length > 0 ? tagObjects : undefined,
          ...(article.canonicalUrl ? { originalArticleURL: article.canonicalUrl } : {}),
        },
      },
    }),
  });

  const draftData = await draftRes.json();
  if (draftData.errors?.length) {
    throw new Error(
      draftData.errors[0]?.message ?? `Hashnode API error: ${JSON.stringify(draftData.errors)}`
    );
  }
  const draftId = draftData.data?.createDraft?.draft?.id;
  if (!draftId) {
    throw new Error("Failed to create Hashnode draft");
  }

  const publishRes = await fetch(HASHNODE_GQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query: `
        mutation PublishDraft($input: PublishDraftInput!) {
          publishDraft(input: $input) {
            post {
              id
              url
              slug
            }
          }
        }
      `,
      variables: { input: { draftId } },
    }),
  });

  const publishData = await publishRes.json();
  if (publishData.errors?.length) {
    throw new Error(
      publishData.errors[0]?.message ??
        `Hashnode publish error: ${JSON.stringify(publishData.errors)}`
    );
  }
  const post = publishData.data?.publishDraft?.post;
  if (!post?.url) {
    throw new Error("Failed to publish Hashnode draft");
  }

  return { url: post.url, id: post.id };
}
