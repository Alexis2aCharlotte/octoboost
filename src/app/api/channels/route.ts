import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { verifyHashnodeKey } from "@/lib/hashnode";
import { isDemoRequest, createDemoClient, getDemoUserId } from "@/lib/demo/helpers";

export async function GET(req: NextRequest) {
  const isDemo = isDemoRequest(req);
  const supabase = isDemo ? createDemoClient() : await createClient();

  let userId: string;
  if (isDemo) {
    userId = getDemoUserId();
  } else {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;
  }

  const projectParam = req.nextUrl.searchParams.get("projectId");
  if (!projectParam) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 400 }
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, slug")
    .eq("user_id", userId);

  const isUuid = /^[0-9a-f]{8}-/i.test(projectParam);
  const project = (projects ?? []).find((p) =>
    isUuid ? p.id === projectParam : p.slug === projectParam
  );

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const { data: channels, error } = await supabase
    .from("channels")
    .select("id, project_id, platform_type, name, config, constraints, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    channels: (channels ?? []).map((c) => ({
      id: c.id,
      projectId: c.project_id,
      platformType: c.platform_type,
      name: c.name,
      config: c.config,
      constraints: c.constraints,
      createdAt: c.created_at,
    })),
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, platformType, name, config, constraints } =
    await req.json();

  if (!projectId || !platformType || !name) {
    return NextResponse.json(
      { error: "projectId, platformType, and name are required" },
      { status: 400 }
    );
  }

  const validPlatforms = [
    "devto",
    "hashnode",
    "medium",
    "reddit",
    "wordpress",
    "telegraph",
    "blogger",
    "indiehackers",
    "hackernews",
    "quora",
    "substack",
  ];
  if (!validPlatforms.includes(platformType)) {
    return NextResponse.json(
      { error: `Invalid platform. Must be one of: ${validPlatforms.join(", ")}` },
      { status: 400 }
    );
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  let finalConfig = config ?? {};
  if (platformType === "blogger") {
    const blogUrl = (finalConfig as Record<string, unknown>)?.blogUrl as string | undefined;
    if (!blogUrl?.trim()) {
      return NextResponse.json(
        { error: "Blogger requires blog URL (e.g. nicheshunter.blogspot.com)" },
        { status: 400 }
      );
    }
    const url = blogUrl.startsWith("http") ? blogUrl : `https://${blogUrl}`;
    finalConfig = { ...finalConfig, blogUrl: url };
  }
  if (platformType === "hashnode") {
    const apiKey = (finalConfig as Record<string, unknown>)?.apiKey as string;
    const publicationHost = (finalConfig as Record<string, unknown>)?.publicationHost as string | undefined;
    const publicationId = (finalConfig as Record<string, unknown>)?.publicationId as string | undefined;

    if (!apiKey) {
      return NextResponse.json({ error: "Hashnode requires an API key" }, { status: 400 });
    }
    if (!publicationHost && !publicationId) {
      return NextResponse.json(
        { error: "Hashnode requires publication host (e.g. niches-hunter.hashnode.dev) or publication ID" },
        { status: 400 }
      );
    }

    if (publicationHost && !publicationId) {
      const verify = await verifyHashnodeKey(apiKey, publicationHost);
      if (!verify.valid) {
        return NextResponse.json({ error: verify.error ?? "Invalid Hashnode credentials" }, { status: 400 });
      }
      if (!verify.publicationId) {
        return NextResponse.json(
          { error: "Publication not found. Check your blog URL (e.g. yourblog.hashnode.dev)" },
          { status: 400 }
        );
      }
      finalConfig = { ...finalConfig, apiKey, publicationId: verify.publicationId };
    }
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      project_id: projectId,
      platform_type: platformType,
      name,
      config: finalConfig,
      constraints: constraints ?? {},
    })
    .select("id, platform_type, name, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    id: channel.id,
    platformType: channel.platform_type,
    name: channel.name,
    createdAt: channel.created_at,
  });
}
