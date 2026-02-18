import { SupabaseClient } from "@supabase/supabase-js";

const MAX_PER_DAY_TOTAL = 3;
const MAX_PER_DAY_PER_PLATFORM = 1;

export async function computeNextSlot(
  supabase: SupabaseClient,
  projectId: string,
  platformType: string
): Promise<string> {
  const { data: allScheduled } = await supabase
    .from("article_variants")
    .select("scheduled_at, channels!inner(platform_type, project_id)")
    .eq("channels.project_id", projectId)
    .not("scheduled_at", "is", null)
    .in("status", ["scheduled", "published"]);

  const totalByDay = new Map<string, number>();
  const platformByDay = new Set<string>();

  for (const v of allScheduled ?? []) {
    if (!v.scheduled_at) continue;
    const day = v.scheduled_at.slice(0, 10);
    totalByDay.set(day, (totalByDay.get(day) ?? 0) + 1);
    const pt = (v.channels as unknown as { platform_type: string }).platform_type;
    if (pt === platformType) {
      platformByDay.add(day);
    }
  }

  const now = new Date();
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(10, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const dayStr = candidate.toISOString().slice(0, 10);
    const dayTotal = totalByDay.get(dayStr) ?? 0;

    if (dayTotal < MAX_PER_DAY_TOTAL && !platformByDay.has(dayStr)) {
      return candidate.toISOString();
    }
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.toISOString();
}
