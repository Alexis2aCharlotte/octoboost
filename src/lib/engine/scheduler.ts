import { SupabaseClient } from "@supabase/supabase-js";

const MAX_PER_DAY_TOTAL = 2;
const MAX_PER_DAY_PER_PLATFORM = 1;
const MAX_MAIN_PER_WEEK = 2;

function getISOWeek(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

interface ScheduleSnapshot {
  totalByDay: Map<string, number>;
  platformByDay: Set<string>;
  mainByWeek: Map<string, number>;
}

async function loadScheduleSnapshot(
  supabase: SupabaseClient,
  projectId: string,
  platformType: string
): Promise<ScheduleSnapshot> {
  const { data: variantRows } = await supabase
    .from("article_variants")
    .select("scheduled_at, channels!inner(platform_type, project_id)")
    .eq("channels.project_id", projectId)
    .not("scheduled_at", "is", null)
    .in("status", ["scheduled", "published"]);

  const { data: articleRows } = await supabase
    .from("articles")
    .select("scheduled_at")
    .eq("project_id", projectId)
    .not("scheduled_at", "is", null)
    .in("status", ["scheduled", "published"]);

  const totalByDay = new Map<string, number>();
  const platformByDay = new Set<string>();
  const mainByWeek = new Map<string, number>();

  for (const v of variantRows ?? []) {
    if (!v.scheduled_at) continue;
    const day = v.scheduled_at.slice(0, 10);
    totalByDay.set(day, (totalByDay.get(day) ?? 0) + 1);
    const pt = (v.channels as unknown as { platform_type: string }).platform_type;
    if (pt === platformType) {
      platformByDay.add(day);
    }
  }

  for (const a of articleRows ?? []) {
    if (!a.scheduled_at) continue;
    const day = a.scheduled_at.slice(0, 10);
    totalByDay.set(day, (totalByDay.get(day) ?? 0) + 1);
    const week = getISOWeek(day);
    mainByWeek.set(week, (mainByWeek.get(week) ?? 0) + 1);
  }

  return { totalByDay, platformByDay, mainByWeek };
}

export async function computeNextSlot(
  supabase: SupabaseClient,
  projectId: string,
  platformType: string,
  isMainArticle = false
): Promise<string> {
  const { totalByDay, platformByDay, mainByWeek } = await loadScheduleSnapshot(
    supabase,
    projectId,
    platformType
  );

  const now = new Date();
  const candidate = new Date(now);
  candidate.setDate(candidate.getDate() + 1);
  candidate.setHours(10, 0, 0, 0);

  for (let i = 0; i < 90; i++) {
    const dayStr = candidate.toISOString().slice(0, 10);
    const dayTotal = totalByDay.get(dayStr) ?? 0;

    if (dayTotal >= MAX_PER_DAY_TOTAL) {
      candidate.setDate(candidate.getDate() + 1);
      continue;
    }

    if (!isMainArticle && platformByDay.has(dayStr)) {
      candidate.setDate(candidate.getDate() + 1);
      continue;
    }

    if (isMainArticle) {
      const week = getISOWeek(dayStr);
      const weekMain = mainByWeek.get(week) ?? 0;
      if (weekMain >= MAX_MAIN_PER_WEEK) {
        candidate.setDate(candidate.getDate() + 1);
        continue;
      }
    }

    return candidate.toISOString();
  }

  return candidate.toISOString();
}

export async function validateSlot(
  supabase: SupabaseClient,
  projectId: string,
  date: string,
  isMainArticle: boolean,
  platformType?: string,
  excludeVariantId?: string
): Promise<{ valid: boolean; reason?: string }> {
  const { data: variantRows } = await supabase
    .from("article_variants")
    .select("id, scheduled_at, channels!inner(platform_type, project_id)")
    .eq("channels.project_id", projectId)
    .not("scheduled_at", "is", null)
    .in("status", ["scheduled", "published"]);

  const { data: articleRows } = await supabase
    .from("articles")
    .select("id, scheduled_at")
    .eq("project_id", projectId)
    .not("scheduled_at", "is", null)
    .in("status", ["scheduled", "published"]);

  const dayStr = date.slice(0, 10);
  let dayTotal = 0;
  let platformOnDay = false;

  for (const v of variantRows ?? []) {
    if (!v.scheduled_at || (excludeVariantId && v.id === excludeVariantId)) continue;
    const vDay = v.scheduled_at.slice(0, 10);
    if (vDay === dayStr) {
      dayTotal++;
      if (platformType) {
        const pt = (v.channels as unknown as { platform_type: string }).platform_type;
        if (pt === platformType) platformOnDay = true;
      }
    }
  }

  for (const a of articleRows ?? []) {
    if (!a.scheduled_at) continue;
    if (a.scheduled_at.slice(0, 10) === dayStr) dayTotal++;
  }

  if (dayTotal >= MAX_PER_DAY_TOTAL) {
    return { valid: false, reason: `Maximum ${MAX_PER_DAY_TOTAL} publications per day reached` };
  }

  if (platformType && platformOnDay) {
    return { valid: false, reason: `This platform already has a publication on this day` };
  }

  if (isMainArticle) {
    const week = getISOWeek(dayStr);
    let weekMain = 0;
    for (const a of articleRows ?? []) {
      if (!a.scheduled_at) continue;
      if (getISOWeek(a.scheduled_at.slice(0, 10)) === week) weekMain++;
    }
    if (weekMain >= MAX_MAIN_PER_WEEK) {
      return { valid: false, reason: `Maximum ${MAX_MAIN_PER_WEEK} blog articles per week reached` };
    }
  }

  return { valid: true };
}
