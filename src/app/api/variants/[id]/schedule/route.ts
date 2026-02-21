import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSlot } from "@/lib/engine/scheduler";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: variantId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scheduledAt } = await req.json();

  if (!scheduledAt) {
    return NextResponse.json({ error: "scheduledAt is required" }, { status: 400 });
  }

  const { data: variant } = await supabase
    .from("article_variants")
    .select("id, status, channels!inner(platform_type, project_id)")
    .eq("id", variantId)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const variantChannels = variant.channels as unknown as {
    platform_type: string;
    project_id: string;
  };

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", variantChannels.project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (variant.status === "published") {
    return NextResponse.json({ error: "Cannot reschedule a published variant" }, { status: 409 });
  }

  const validation = await validateSlot(
    supabase,
    variantChannels.project_id,
    scheduledAt,
    false,
    variantChannels.platform_type,
    variantId
  );

  if (!validation.valid) {
    return NextResponse.json({ error: validation.reason }, { status: 422 });
  }

  const { error } = await supabase
    .from("article_variants")
    .update({
      scheduled_at: scheduledAt,
      status: "scheduled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, scheduledAt });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: variantId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  if (!date) {
    return NextResponse.json({ error: "date query param is required" }, { status: 400 });
  }

  const { data: variant } = await supabase
    .from("article_variants")
    .select("channels!inner(platform_type, project_id)")
    .eq("id", variantId)
    .single();

  if (!variant) {
    return NextResponse.json({ error: "Variant not found" }, { status: 404 });
  }

  const variantChannels = variant.channels as unknown as {
    platform_type: string;
    project_id: string;
  };

  const validation = await validateSlot(
    supabase,
    variantChannels.project_id,
    date,
    false,
    variantChannels.platform_type,
    variantId
  );

  return NextResponse.json(validation);
}
