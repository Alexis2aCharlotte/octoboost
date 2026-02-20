import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateApiKey } from "@/lib/custom-api";

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

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase
    .from("projects")
    .select("id, api_key")
    .eq("user_id", user.id);
  if (isUuid) query.eq("id", id);
  else query.eq("slug", id);

  const { data: project } = await query.single();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (project.api_key) {
    return NextResponse.json({ apiKey: project.api_key });
  }

  const apiKey = generateApiKey();
  await supabase.from("projects").update({ api_key: apiKey }).eq("id", project.id);

  return NextResponse.json({ apiKey });
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

  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const query = supabase
    .from("projects")
    .select("id")
    .eq("user_id", user.id);
  if (isUuid) query.eq("id", id);
  else query.eq("slug", id);

  const { data: project } = await query.single();
  if (!project)
    return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const apiKey = generateApiKey();
  await supabase.from("projects").update({ api_key: apiKey }).eq("id", project.id);

  return NextResponse.json({ apiKey });
}
