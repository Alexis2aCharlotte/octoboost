import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: profile } = await supabase
    .from("profiles")
    .select("plan, status, interval, current_period_end")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    await supabase
      .from("profiles")
      .upsert({ user_id: user.id, email: user.email }, { onConflict: "user_id" });
    const res = await supabase
      .from("profiles")
      .select("plan, status, interval, current_period_end")
      .eq("user_id", user.id)
      .single();
    profile = res.data;
  }

  return NextResponse.json({
    plan: profile?.plan ?? "free",
    status: profile?.status ?? "active",
    interval: profile?.interval ?? null,
    periodEnd: profile?.current_period_end ?? null,
  });
}
