const HASHNODE_GQL = "https://gql.hashnode.com";

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
