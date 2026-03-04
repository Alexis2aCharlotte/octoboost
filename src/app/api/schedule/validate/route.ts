import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSlot, computeNextSlot } from "@/lib/engine/scheduler";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const date = searchParams.get("date");
  const isMain = searchParams.get("isMain") === "true";
  const platformType = searchParams.get("platformType") ?? undefined;
  const excludeVariantId = searchParams.get("excludeVariantId") ?? undefined;
  const excludeArticleId = searchParams.get("excludeArticleId") ?? undefined;

  if (!projectId || !date) {
    return NextResponse.json(
      { error: "projectId and date are required" },
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

  const result = await validateSlot(supabase, projectId, date, isMain, platformType, excludeVariantId, excludeArticleId);

  if (!result.valid) {
    const suggested = await computeNextSlot(supabase, projectId, platformType ?? "site", isMain);
    return NextResponse.json({ ...result, suggestedSlot: suggested });
  }

  return NextResponse.json(result);
}
