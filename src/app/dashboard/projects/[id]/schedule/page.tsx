"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Radio,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  X,
} from "lucide-react";

interface ScheduledVariant {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  published_at: string | null;
  published_url: string | null;
  channel_id: string;
  article_id: string;
  channels: {
    platform_type: string;
    name: string;
    config: Record<string, unknown>;
    project_id: string;
  };
  articles: {
    title: string;
    pillar_keyword: string;
  };
}

const platformMeta: Record<
  string,
  { label: string; color: string; icon: string; connectionType: string }
> = {
  devto: { label: "Dev.to", color: "#3B49DF", icon: "🔷", connectionType: "api_key" },
  hashnode: { label: "Hashnode", color: "#2962FF", icon: "📘", connectionType: "api_key" },
  medium: { label: "Medium", color: "#00AB6C", icon: "📝", connectionType: "oauth" },
  reddit: { label: "Reddit", color: "#FF4500", icon: "🔶", connectionType: "oauth" },
  wordpress: { label: "WordPress", color: "#21759B", icon: "🌐", connectionType: "api_key" },
  telegraph: { label: "Telegraph", color: "#0088CC", icon: "📄", connectionType: "api_key" },
  blogger: { label: "Blogger", color: "#F57C00", icon: "📝", connectionType: "oauth" },
  indiehackers: { label: "Indie Hackers", color: "#1F6FEB", icon: "🚀", connectionType: "manual" },
  hackernews: { label: "Hacker News", color: "#FF6600", icon: "📰", connectionType: "manual" },
  quora: { label: "Quora", color: "#B92B27", icon: "❓", connectionType: "manual" },
  substack: { label: "Substack", color: "#FF6719", icon: "📧", connectionType: "manual" },
};

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = first.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startDow).fill(null);

  for (let d = 1; d <= lastDay; d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) currentWeek.push(null);
    weeks.push(currentWeek);
  }

  return weeks;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function getCellColor(count: number): string {
  if (count === 0) return "bg-[#1a1a2e]";
  if (count === 1) return "bg-emerald-900/60";
  if (count === 2) return "bg-emerald-700/70";
  if (count === 3) return "bg-emerald-500/80";
  return "bg-emerald-400";
}

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const [variants, setVariants] = useState<ScheduledVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthOffset, setMonthOffset] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) return;
      const projData = await projRes.json();

      const res = await fetch(`/api/schedule?projectId=${projData.projectId}`);
      const data = await res.json();
      setVariants(data.variants ?? []);
    } catch {
      console.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setSelectedDay(null);
      }
    }
    if (selectedDay) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedDay]);

  const countByDay = new Map<string, number>();
  const variantsByDay = new Map<string, ScheduledVariant[]>();
  for (const v of variants) {
    if (!v.scheduled_at) continue;
    const key = v.scheduled_at.slice(0, 10);
    countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    const arr = variantsByDay.get(key) ?? [];
    arr.push(v);
    variantsByDay.set(key, arr);
  }

  const now = new Date();
  const viewDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();
  const weeks = getMonthGrid(viewYear, viewMonth);

  const monthLabel = viewDate.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  const handleCopy = async (variant: ScheduledVariant) => {
    try {
      const res = await fetch(`/api/articles/variants/${variant.id}`);
      const data = await res.json();
      await navigator.clipboard.writeText(data.content ?? variant.title);
      setCopiedId(variant.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      await navigator.clipboard.writeText(variant.title);
      setCopiedId(variant.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const totalScheduled = variants.filter((v) => v.status === "scheduled").length;
  const totalPublished = variants.filter((v) => v.status === "published").length;

  const selectedVariants = selectedDay ? (variantsByDay.get(selectedDay) ?? []) : [];
  const selectedDate = selectedDay
    ? new Date(selectedDay + "T00:00:00")
    : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-muted">
            Planning de publication de vos variantes
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{totalScheduled} planifiée{totalScheduled > 1 ? "s" : ""}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{totalPublished} publiée{totalPublished > 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
        <button
          onClick={() => setMonthOffset((m) => m - 1)}
          className="rounded-lg p-2 text-muted transition hover:bg-card-hover hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold capitalize">{monthLabel}</span>
          {monthOffset !== 0 && (
            <button
              onClick={() => setMonthOffset(0)}
              className="ml-2 rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent transition hover:bg-accent/20"
            >
              Aujourd&apos;hui
            </button>
          )}
        </div>
        <button
          onClick={() => setMonthOffset((m) => m + 1)}
          className="rounded-lg p-2 text-muted transition hover:bg-card-hover hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <div className="relative rounded-xl border border-border bg-card p-6">
          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 gap-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium uppercase tracking-wider text-muted/60">
                {d}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div className="space-y-2">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-2">
                {week.map((day, di) => {
                  if (!day) {
                    return <div key={`empty-${di}`} className="aspect-square rounded-md" />;
                  }

                  const key = toDateKey(day);
                  const count = countByDay.get(key) ?? 0;
                  const today = isToday(day);
                  const isSelected = selectedDay === key;

                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedDay(isSelected ? null : key)}
                      className={`group relative aspect-square rounded-md transition-all ${getCellColor(count)} ${
                        today ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""
                      } ${isSelected ? "ring-2 ring-white/50 ring-offset-1 ring-offset-background" : ""} ${
                        count > 0 ? "cursor-pointer hover:scale-105 hover:brightness-125" : "cursor-default"
                      }`}
                    >
                      <span className={`absolute inset-0 flex items-center justify-center text-xs ${
                        count > 0 ? "font-medium text-white" : "text-muted/30"
                      }`}>
                        {day.getDate()}
                      </span>
                      {count > 0 && (
                        <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white opacity-0 transition group-hover:opacity-100">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted/60">
            <span>Moins</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-3 w-3 rounded-sm ${getCellColor(level)}`}
              />
            ))}
            <span>Plus</span>
          </div>

          {/* Popup */}
          {selectedDay && selectedDate && (
            <div
              ref={popupRef}
              className="absolute left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl shadow-black/40"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold">
                    {selectedDate.toLocaleDateString("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </span>
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                    {selectedVariants.length} publication{selectedVariants.length > 1 ? "s" : ""}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="rounded-lg p-1 text-muted transition hover:bg-card-hover hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[320px] overflow-y-auto p-4">
                {selectedVariants.length === 0 ? (
                  <p className="py-6 text-center text-sm text-muted/60">
                    Aucune publication ce jour
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedVariants.map((variant) => {
                      const platform = platformMeta[variant.channels.platform_type];
                      const isManual = platform?.connectionType === "manual";
                      const isPublished = variant.status === "published";

                      return (
                        <div
                          key={variant.id}
                          className="rounded-xl border border-border bg-background/60 p-3.5 transition hover:border-border/80"
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="text-sm">{platform?.icon ?? "📄"}</span>
                            <span
                              className="rounded-md px-2 py-0.5 text-[11px] font-medium text-white"
                              style={{ backgroundColor: platform?.color ?? "#666" }}
                            >
                              {platform?.label ?? variant.channels.platform_type}
                            </span>
                            {isPublished && (
                              <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-green-400" />
                            )}
                            {!isPublished && !isManual && (
                              <div className="ml-auto flex items-center gap-1 text-[10px] text-blue-400">
                                <Radio className="h-3 w-3" />
                                Auto
                              </div>
                            )}
                          </div>

                          <p className="mb-1 text-sm font-medium leading-snug text-foreground/90">
                            {variant.title}
                          </p>
                          <p className="mb-3 text-xs text-muted/50">
                            Article : {variant.articles.title}
                          </p>

                          <div className="flex items-center gap-2">
                            {isPublished && variant.published_url ? (
                              <a
                                href={variant.published_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/20"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Voir la publication
                              </a>
                            ) : isManual ? (
                              <button
                                onClick={() => handleCopy(variant)}
                                className="flex items-center gap-1 rounded-lg bg-card-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                                {copiedId === variant.id ? "Copié !" : "Copier le contenu"}
                              </button>
                            ) : (
                              <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">
                                Publication automatique prévue
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {!loading && variants.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted/30" />
          <p className="mt-3 text-sm text-muted">Aucune variante planifiée</p>
          <p className="mt-1 text-xs text-muted/60">
            Générez des variantes depuis un article — elles seront automatiquement planifiées ici.
          </p>
        </div>
      )}
    </div>
  );
}
