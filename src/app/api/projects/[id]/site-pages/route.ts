import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { crawlSitePages } from "@/lib/engine/sitemap";

export const maxDuration = 60;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: pages } = await supabase
    .from("site_pages")
    .select("url, path, title, description, updated_at")
    .eq("project_id", project.id)
    .order("path");

  return NextResponse.json({ pages: pages ?? [] });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id, url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (!project.url)
    return NextResponse.json({ error: "Project has no URL" }, { status: 400 });

  const pages = await crawlSitePages(project.url);

  if (pages.length === 0) {
    return NextResponse.json(
      { error: "No sitemap found or no pages to crawl", pages: [] },
      { status: 200 }
    );
  }

  // Clear old pages and insert new ones
  await supabase.from("site_pages").delete().eq("project_id", project.id);

  const rows = pages.map((p) => ({
    project_id: project.id,
    url: p.url,
    path: p.path,
    title: p.title,
    description: p.description,
  }));

  const { error } = await supabase.from("site_pages").insert(rows);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ pages, count: pages.length });
}
