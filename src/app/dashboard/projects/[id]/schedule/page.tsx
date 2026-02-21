"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import {
  Calendar,
  Copy,
  Radio,
  Clock,
  CheckCircle2,
  Loader2,
  ExternalLink,
  X,
  Globe,
  Zap,
  CalendarClock,
  AlertCircle,
  Check,
} from "lucide-react";
import DateTimePicker from "@/components/DateTimePicker";

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

interface ScheduledArticle {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  canonical_url: string | null;
}

type ScheduleItem =
  | { type: "variant"; data: ScheduledVariant }
  | { type: "article"; data: ScheduledArticle };

const platformMeta: Record<
  string,
  { label: string; color: string; icon: string; connectionType: string }
> = {
  devto: { label: "Dev.to", color: "#3B49DF", icon: "🔷", connectionType: "api_key" },
  hashnode: { label: "Hashnode", color: "#2962FF", icon: "📘", connectionType: "api_key" },
  medium: { label: "Medium", color: "#00AB6C", icon: "📝", connectionType: "manual" },
  reddit: { label: "Reddit", color: "#FF4500", icon: "🔶", connectionType: "manual" },
  wordpress: { label: "WordPress", color: "#21759B", icon: "🌐", connectionType: "api_key" },
  telegraph: { label: "Telegraph", color: "#0088CC", icon: "📄", connectionType: "api_key" },
  blogger: { label: "Blogger", color: "#F57C00", icon: "📝", connectionType: "oauth" },
  indiehackers: { label: "Indie Hackers", color: "#1F6FEB", icon: "🚀", connectionType: "manual" },
  hackernews: { label: "Hacker News", color: "#FF6600", icon: "📰", connectionType: "manual" },
  quora: { label: "Quora", color: "#B92B27", icon: "❓", connectionType: "manual" },
  substack: { label: "Substack", color: "#FF6719", icon: "📧", connectionType: "manual" },
};

function timelineLabel(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (d.getTime() === now.getTime()) return "Today";
  if (d.getTime() === tomorrow.getTime()) return "Tomorrow";
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function SchedulePage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [variants, setVariants] = useState<ScheduledVariant[]>([]);
  const [scheduledArticles, setScheduledArticles] = useState<ScheduledArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);

  const [rescheduleItem, setRescheduleItem] = useState<ScheduleItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleValidation, setRescheduleValidation] = useState<{ valid: boolean; reason?: string } | null>(null);
  const [rescheduleValidating, setRescheduleValidating] = useState(false);
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) return;
      const projData = await projRes.json();
      setRealProjectId(projData.projectId);

      const res = await fetch(`/api/schedule?projectId=${projData.projectId}`);
      const data = await res.json();
      setVariants(data.variants ?? []);
      setScheduledArticles(data.articles ?? []);
    } catch {
      console.error("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  /* ── Group items by day ── */

  const itemsByDay = new Map<string, ScheduleItem[]>();

  for (const v of variants) {
    if (!v.scheduled_at) continue;
    const key = v.scheduled_at.slice(0, 10);
    const arr = itemsByDay.get(key) ?? [];
    arr.push({ type: "variant", data: v });
    itemsByDay.set(key, arr);
  }

  for (const a of scheduledArticles) {
    if (!a.scheduled_at) continue;
    const key = a.scheduled_at.slice(0, 10);
    const arr = itemsByDay.get(key) ?? [];
    arr.push({ type: "article", data: a });
    itemsByDay.set(key, arr);
  }

  const sortedDays = [...itemsByDay.keys()].sort();
  const totalScheduled = variants.filter((v) => v.status === "scheduled").length + scheduledArticles.filter((a) => a.status === "scheduled").length;
  const totalPublished = variants.filter((v) => v.status === "published").length + scheduledArticles.filter((a) => a.status === "published").length;

  /* ── Handlers ── */

  const handleCopy = async (variant: ScheduledVariant) => {
    try {
      const res = await fetch(`/api/articles/variants/${variant.id}`);
      const data = await res.json();
      await navigator.clipboard.writeText(data.content ?? variant.title);
    } catch {
      await navigator.clipboard.writeText(variant.title);
    }
    setCopiedId(variant.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function handlePublishVariantNow(variantId: string) {
    setPublishingId(variantId);
    try {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variantId }),
      });
      if (res.ok) {
        await fetchSchedule();
      } else {
        const data = await res.json();
        toast(data.error ?? "Publication failed");
      }
    } catch {
      toast("Something went wrong");
    } finally {
      setPublishingId(null);
    }
  }

  async function handlePublishArticleNow(articleId: string) {
    setPublishingId(articleId);
    try {
      const res = await fetch(`/api/articles/${articleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        await fetchSchedule();
      } else {
        const data = await res.json();
        toast(data.error ?? "Publication failed");
      }
    } catch {
      toast("Something went wrong");
    } finally {
      setPublishingId(null);
    }
  }

  async function handleValidateReschedule(dateValue: string) {
    setRescheduleDate(dateValue);
    setRescheduleValidation(null);
    if (!dateValue || !rescheduleItem) return;

    setRescheduleValidating(true);
    try {
      if (rescheduleItem.type === "variant") {
        const isoDate = new Date(dateValue).toISOString();
        const res = await fetch(`/api/variants/${rescheduleItem.data.id}/schedule?date=${encodeURIComponent(isoDate)}`);
        const data = await res.json();
        setRescheduleValidation(data);
      } else {
        setRescheduleValidation({ valid: true });
      }
    } catch {
      setRescheduleValidation({ valid: false, reason: "Validation failed" });
    } finally {
      setRescheduleValidating(false);
    }
  }

  async function handleSaveReschedule() {
    if (!rescheduleItem || !rescheduleDate || !rescheduleValidation?.valid) return;
    setRescheduleSaving(true);

    try {
      const isoDate = new Date(rescheduleDate).toISOString();

      if (rescheduleItem.type === "variant") {
        const res = await fetch(`/api/variants/${rescheduleItem.data.id}/schedule`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduledAt: isoDate }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error ?? "Reschedule failed");
          return;
        }
      } else {
        const res = await fetch(`/api/articles/${rescheduleItem.data.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scheduled_at: isoDate, status: "scheduled" }),
        });
        if (!res.ok) {
          const data = await res.json();
          toast(data.error ?? "Reschedule failed");
          return;
        }
      }

      await fetchSchedule();
      setRescheduleItem(null);
    } catch {
      toast("Something went wrong");
    } finally {
      setRescheduleSaving(false);
    }
  }

  function openReschedule(item: ScheduleItem) {
    const scheduledAt = item.data.scheduled_at;
    const defaultDate = scheduledAt
      ? new Date(scheduledAt).toISOString().slice(0, 16)
      : (() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(10, 0, 0, 0);
          return tomorrow.toISOString().slice(0, 16);
        })();

    setRescheduleItem(item);
    setRescheduleDate(defaultDate);
    setRescheduleValidation(null);
    handleValidateReschedule(defaultDate);
  }

  /* ── Render ── */

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-muted">
            Publication schedule for your articles and variants
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
            <Clock className="h-3.5 w-3.5" />
            <span>{totalScheduled} scheduled</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-green-400">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>{totalPublished} published</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : sortedDays.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted/30" />
          <p className="mt-3 text-sm text-muted">No scheduled publications</p>
          <p className="mt-1 text-xs text-muted/60">
            Generate variants from an article — they will be automatically scheduled here.
          </p>
        </div>
      ) : (
        <div className="space-y-0">
          {sortedDays.map((dayKey) => {
            const items = itemsByDay.get(dayKey) ?? [];
            return (
              <div key={dayKey}>
                {/* Day header */}
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                    <div className="h-2 w-2 rounded-full bg-accent" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">
                    {timelineLabel(dayKey)}
                  </span>
                  <div className="h-px flex-1 bg-border" />
                  <span className="rounded-md bg-card-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                    {items.length}
                  </span>
                </div>

                {/* Items */}
                <div className="ml-2.5 border-l border-border pb-2 pl-5">
                  <div className="space-y-2">
                    {items.map((item) => {
                      if (item.type === "article") {
                        const article = item.data;
                        const isPublished = article.status === "published";
                        const time = new Date(article.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                        return (
                          <div key={`art-${article.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-accent/20">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 text-xs">
                              <Globe className="h-3.5 w-3.5 text-accent" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">{article.title}</p>
                                <span className="shrink-0 rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-semibold text-accent">BLOG</span>
                              </div>
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-muted">{time}</span>
                            {isPublished ? (
                              article.canonical_url ? (
                                <a href={article.canonical_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-400 transition hover:bg-green-500/20">
                                  <ExternalLink className="h-3 w-3" />View
                                </a>
                              ) : (
                                <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-400">
                                  <CheckCircle2 className="h-3 w-3" />Done
                                </span>
                              )
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handlePublishArticleNow(article.id)}
                                  disabled={publishingId === article.id}
                                  className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                                >
                                  {publishingId === article.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                                  Now
                                </button>
                                <button
                                  onClick={() => openReschedule(item)}
                                  className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:border-accent/50 hover:text-foreground"
                                >
                                  <CalendarClock className="h-3 w-3" />
                                  Move
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      }

                      const variant = item.data;
                      const platform = platformMeta[variant.channels.platform_type];
                      const isManual = platform?.connectionType === "manual";
                      const isPublished = variant.status === "published";
                      const time = new Date(variant.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

                      return (
                        <div key={`var-${variant.id}`} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-accent/20">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-xs"
                            style={{ backgroundColor: (platform?.color ?? "#666") + "20", color: platform?.color ?? "#666" }}
                          >
                            {platform?.icon ?? "📄"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{variant.title}</p>
                            <p className="truncate text-[11px] text-muted/50">{variant.articles.title}</p>
                          </div>
                          <span className="shrink-0 font-mono text-[11px] text-muted">{time}</span>
                          {isPublished ? (
                            variant.published_url ? (
                              <a href={variant.published_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-400 transition hover:bg-green-500/20">
                                <ExternalLink className="h-3 w-3" />View
                              </a>
                            ) : (
                              <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-[11px] font-medium text-green-400">
                                <CheckCircle2 className="h-3 w-3" />Done
                              </span>
                            )
                          ) : isManual ? (
                            <button onClick={() => handleCopy(variant)} className="flex items-center gap-1 rounded-md bg-card-hover px-2 py-1 text-[11px] font-medium text-muted transition hover:text-foreground">
                              <Copy className="h-3 w-3" />
                              {copiedId === variant.id ? "Copied!" : "Copy"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handlePublishVariantNow(variant.id)}
                                disabled={publishingId === variant.id}
                                className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                              >
                                {publishingId === variant.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                                Now
                              </button>
                              <button
                                onClick={() => openReschedule(item)}
                                className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted transition hover:border-accent/50 hover:text-foreground"
                              >
                                <CalendarClock className="h-3 w-3" />
                                Move
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reschedule modal */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold">Reschedule</h3>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {rescheduleItem.data.title}
                </p>
              </div>
              <button
                onClick={() => setRescheduleItem(null)}
                className="rounded-lg p-1.5 text-muted transition hover:bg-card-hover hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">
                  New publication date
                </label>
                <DateTimePicker
                  value={rescheduleDate}
                  onChange={handleValidateReschedule}
                />
              </div>

              {rescheduleValidating && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Validating...
                </div>
              )}

              {rescheduleValidation && !rescheduleValidating && (
                <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                  rescheduleValidation.valid
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}>
                  {rescheduleValidation.valid ? (
                    <Check className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  {rescheduleValidation.valid ? "This slot is available" : rescheduleValidation.reason}
                </div>
              )}

              <div className="rounded-lg bg-card-hover px-3 py-2 text-[11px] text-muted/70">
                Max 2 publications per day · Max 2 blog articles per week · 1 per platform per day
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setRescheduleItem(null)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:bg-card-hover hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReschedule}
                  disabled={!rescheduleValidation?.valid || rescheduleSaving}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {rescheduleSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarClock className="h-3.5 w-3.5" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
