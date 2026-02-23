"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useDemo } from "@/lib/demo/context";
import { useProjectCache } from "@/lib/project-cache";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
import {
  FileText,
  Loader2,
  PenTool,
  Send,
  Target,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  PenLine,
  Clock,
  Eye,
  ArrowLeft,
  Copy,
  Trash2,
  Radio,
  BookOpen,
  Code2,
  MessageSquare,
  Hash,
  Globe,
  Plus,
  X,
  Zap,
  ClipboardCopy,
  ExternalLink,
  CalendarClock,
} from "lucide-react";
import PublishDialog from "@/components/PublishDialog";
import DateTimePicker from "@/components/DateTimePicker";

interface GeneratingInfo {
  clusterId: string;
  startedAt: number;
  estimatedSeconds: number;
}

interface Cluster {
  id: string;
  topic: string;
  articleTitle: string;
  pillarKeyword: string;
  supportingKeywords: string[];
  searchIntent: string;
  difficulty: string;
  totalVolume: number;
  avgCompetition: number;
}

interface Article {
  id: string;
  clusterId: string;
  title: string;
  slug: string;
  wordCount: number;
  pillarKeyword: string;
  metaDescription: string;
  status: string;
  modelUsed: string;
  createdAt: string;
}

interface ArticleFull {
  id: string;
  title: string;
  content: string;
  outline: string[];
  wordCount: number;
  metaDescription: string;
  status: string;
}

interface Channel {
  id: string;
  platformType: string;
  name: string;
}

interface Variant {
  id: string;
  channelId: string;
  title: string;
  wordCount: number;
  format: string;
  status: string;
  platformType: string;
  channelName: string;
  scheduledAt: string | null;
  createdAt: string;
}

interface VariantFull {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  format: string;
  status: string;
  platformType: string;
  channelName: string;
  masterTitle: string;
}

const platformMeta: Record<string, { label: string; icon: typeof BookOpen; color: string; bgColor: string; connectionType: string }> = {
  devto: { label: "Dev.to", icon: Code2, color: "text-blue-400", bgColor: "bg-blue-500/10", connectionType: "api_key" },
  hashnode: { label: "Hashnode", icon: Hash, color: "text-indigo-400", bgColor: "bg-indigo-500/10", connectionType: "api_key" },
  medium: { label: "Medium", icon: BookOpen, color: "text-green-400", bgColor: "bg-green-500/10", connectionType: "manual" },
  reddit: { label: "Reddit", icon: MessageSquare, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "manual" },
  wordpress: { label: "WordPress", icon: Globe, color: "text-cyan-400", bgColor: "bg-cyan-500/10", connectionType: "api_key" },
  telegraph: { label: "Telegraph", icon: FileText, color: "text-sky-400", bgColor: "bg-sky-500/10", connectionType: "api_key" },
  blogger: { label: "Blogger", icon: BookOpen, color: "text-orange-500", bgColor: "bg-orange-500/10", connectionType: "oauth" },
  indiehackers: { label: "Indie Hackers", icon: FileText, color: "text-amber-400", bgColor: "bg-amber-500/10", connectionType: "manual" },
  hackernews: { label: "Hacker News", icon: Code2, color: "text-orange-300", bgColor: "bg-orange-500/10", connectionType: "manual" },
  quora: { label: "Quora", icon: FileText, color: "text-red-400", bgColor: "bg-red-500/10", connectionType: "manual" },
  substack: { label: "Substack", icon: Send, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "manual" },
};

type View = "list" | "preview" | "variant";

const difficultyColors: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  hard: "text-red-400 bg-red-500/10",
};

const intentColors: Record<string, string> = {
  informational: "bg-blue-500/15 text-blue-400",
  commercial: "bg-amber-500/15 text-amber-400",
  transactional: "bg-green-500/15 text-green-400",
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: "Draft", color: "text-amber-400 bg-amber-500/10", icon: PenLine },
  ready: { label: "Ready", color: "text-blue-400 bg-blue-500/10", icon: CheckCircle2 },
  scheduled: { label: "Scheduled", color: "text-blue-400 bg-blue-500/10", icon: CalendarClock },
  published: { label: "Published", color: "text-green-400 bg-green-500/10", icon: Send },
};

export default function ArticlesPage() {
  const { id } = useParams<{ id: string }>();
  const { isDemo, basePath, fetchUrl, demoData, demoLoading } = useDemo();
  const { data: cachedData, loading: cacheLoading } = useProjectCache();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);

  const [view, setView] = useState<View>("list");
  const [previewArticle, setPreviewArticle] = useState<ArticleFull | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const [channels, setChannels] = useState<Channel[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantPreview, setVariantPreview] = useState<VariantFull | null>(null);
  const [generatingVariant, setGeneratingVariant] = useState<string | null>(null);
  const [showChannelPicker, setShowChannelPicker] = useState<false | "auto" | "manual">(false);

  const [publishingToSite, setPublishingToSite] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const [publishDialogVariant, setPublishDialogVariant] = useState<Variant | null>(null);
  const [publishAllLoading, setPublishAllLoading] = useState(false);
  const [publishAllProgress, setPublishAllProgress] = useState({ done: 0, total: 0 });
  const [showSitePublishMenu, setShowSitePublishMenu] = useState(false);
  const [schedulingSite, setSchedulingSite] = useState(false);
  const [siteScheduleDate, setSiteScheduleDate] = useState("");

  const [persistentGenerating, setPersistentGenerating] = useState<GeneratingInfo | null>(null);
  const initialLoadDone = useRef(false);

  const loadData = useCallback(async () => {
    if (isDemo) {
      if (demoLoading) return;
      if (demoData) {
        setClusters(demoData.clusters);
        setRealProjectId(demoData.project.projectId);
        setArticles(demoData.articles);
        setChannels(demoData.channels);
      }
      setLoading(false);
      return;
    }
    if (cachedData) {
      setClusters(cachedData.clusters);
      setArticles(cachedData.articles);
      setChannels(cachedData.channels);
      setRealProjectId(cachedData.project?.projectId ?? null);
      setLoading(false);
      return;
    }
    if (cacheLoading) return;
    try {
      const [kwRes, projRes, artRes, chRes] = await Promise.all([
        fetch(fetchUrl(`/api/keywords?projectId=${id}`)),
        fetch(fetchUrl(`/api/projects/${id}`)),
        fetch(fetchUrl(`/api/articles?projectId=${id}`)),
        fetch(fetchUrl(`/api/channels?projectId=${id}`)),
      ]);

      if (kwRes.ok) {
        const kwData = await kwRes.json();
        setClusters(kwData.clusters ?? []);
      }

      if (projRes.ok) {
        const projData = await projRes.json();
        setRealProjectId(projData.projectId);
      }

      if (artRes.ok) {
        const artData = await artRes.json();
        setArticles(artData.articles ?? []);
      }

      if (chRes.ok) {
        const chData = await chRes.json();
        setChannels(chData.channels ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id, fetchUrl, isDemo, demoData, demoLoading, cachedData, cacheLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Restore persistent generation state from localStorage
  useEffect(() => {
    if (loading || initialLoadDone.current) return;
    initialLoadDone.current = true;
    const key = `octoboost_gen_${id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return;
    try {
      const data: GeneratingInfo = JSON.parse(raw);
      const articleExists = articles.some((a) => a.clusterId === data.clusterId);
      const elapsed = (Date.now() - data.startedAt) / 1000;
      if (articleExists || elapsed > 300) {
        localStorage.removeItem(key);
      } else {
        setPersistentGenerating(data);
      }
    } catch {
      localStorage.removeItem(key);
    }
  }, [loading, id, articles]);

  // Poll for article completion when there's a persistent generation and no active fetch
  useEffect(() => {
    if (!persistentGenerating || generatingId) return;
    const interval = setInterval(async () => {
      await loadData();
    }, 5000);
    return () => clearInterval(interval);
  }, [persistentGenerating, generatingId, loadData]);

  // Clear persistent generation when article appears
  useEffect(() => {
    if (!persistentGenerating) return;
    const exists = articles.some((a) => a.clusterId === persistentGenerating.clusterId);
    if (exists) {
      localStorage.removeItem(`octoboost_gen_${id}`);
      setPersistentGenerating(null);
    }
  }, [articles, persistentGenerating, id]);

  const articleByCluster = new Map(articles.map((a) => [a.clusterId, a]));

  async function handleGenerate(clusterId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (!realProjectId || generatingId) return;
    setGeneratingId(clusterId);

    const estimatedSeconds = Math.floor(Math.random() * 61) + 120;
    const genInfo: GeneratingInfo = { clusterId, startedAt: Date.now(), estimatedSeconds };
    localStorage.setItem(`octoboost_gen_${id}`, JSON.stringify(genInfo));
    setPersistentGenerating(genInfo);

    try {
      const res = await fetch(fetchUrl("/api/articles/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterId, projectId: realProjectId }),
      });

      if (res.status === 409) {
        const data = await res.json();
        if (data.articleId) {
          await openPreview(data.articleId);
        }
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Generation failed");
        return;
      }

      const data = await res.json();
      localStorage.removeItem(`octoboost_gen_${id}`);
      setPersistentGenerating(null);
      await loadData();
      await openPreview(data.articleId);
    } catch {
      // Don't clear localStorage on error — server may still be generating
    } finally {
      setGeneratingId(null);
    }
  }

  async function openPreview(articleId: string) {
    setPreviewLoading(true);
    setView("preview");
    setVariantPreview(null);
    setVariants([]);
    try {
      const [artRes] = await Promise.all([
        fetch(fetchUrl(`/api/articles/${articleId}`)),
        loadVariants(articleId),
      ]);
      if (artRes.ok) {
        setPreviewArticle(await artRes.json());
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDelete(articleId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (!(await confirm({ message: "Delete this article?", destructive: true }))) return;
    const res = await fetch(fetchUrl(`/api/articles/${articleId}`), { method: "DELETE" });
    if (res.ok) {
      setArticles((prev) => prev.filter((a) => a.id !== articleId));
      if (previewArticle?.id === articleId) {
        setView("list");
        setPreviewArticle(null);
      }
    }
  }

  async function loadVariants(articleId: string) {
    try {
      const res = await fetch(fetchUrl(`/api/articles/variants?articleId=${articleId}`));
      if (res.ok) {
        const data = await res.json();
        setVariants(data.variants ?? []);
      }
    } catch {
      // silent
    }
  }

  async function handleGenerateVariant(articleId: string, channelId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (generatingVariant) return;
    setGeneratingVariant(channelId);

    try {
      const res = await fetch(fetchUrl("/api/articles/variants/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, channelId }),
      });

      if (res.status === 409) {
        const data = await res.json();
        if (data.variantId) {
          await openVariantPreview(data.variantId);
        }
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        toast(data.error || "Variant generation failed");
        return;
      }

      const data = await res.json();
      await loadVariants(articleId);
      await openVariantPreview(data.variantId);
    } catch {
      toast("Something went wrong");
    } finally {
      setGeneratingVariant(null);
      setShowChannelPicker(false as const);
    }
  }

  async function openVariantPreview(variantId: string) {
    setPreviewLoading(true);
    setView("variant");
    try {
      const res = await fetch(fetchUrl(`/api/articles/variants/${variantId}`));
      if (res.ok) {
        setVariantPreview(await res.json());
      }
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleDeleteVariant(variantId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (!(await confirm({ message: "Delete this variant?", destructive: true }))) return;
    const res = await fetch(fetchUrl(`/api/articles/variants/${variantId}`), { method: "DELETE" });
    if (res.ok) {
      setVariants((prev) => prev.filter((v) => v.id !== variantId));
      if (variantPreview?.id === variantId) {
        setView("preview");
        setVariantPreview(null);
      }
    }
  }

  function handleCopy() {
    const source = view === "variant" && variantPreview ? variantPreview : previewArticle;
    if (!source) return;
    const full = `# ${source.title}\n\n${source.content}`;
    navigator.clipboard.writeText(full);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handlePublishToSite(articleId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (publishingToSite) return;
    setPublishingToSite(true);
    try {
      const res = await fetch(fetchUrl(`/api/articles/${articleId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "published" }),
      });
      if (res.ok) {
        await loadData();
        if (previewArticle) setPreviewArticle({ ...previewArticle, status: "published" });
      } else {
        const data = await res.json();
        toast(data.error ?? "Publication failed");
      }
    } catch {
      toast("Something went wrong");
    } finally {
      setPublishingToSite(false);
    }
  }

  function startEditing() {
    if (!previewArticle) return;
    setEditTitle(previewArticle.title);
    setEditContent(previewArticle.content);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    setEditContent("");
    setEditTitle("");
  }

  async function handleSaveEdit() {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    if (!previewArticle || saving) return;
    setSaving(true);
    try {
      const res = await fetch(fetchUrl(`/api/articles/${previewArticle.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: editTitle, content: editContent }),
      });
      if (res.ok) {
        const newWordCount = editContent.split(/\s+/).filter((w) => w.length > 0).length;
        setPreviewArticle({ ...previewArticle, title: editTitle, content: editContent, wordCount: newWordCount });
        setEditing(false);
      } else {
        const data = await res.json();
        toast(data.error ?? "Save failed");
      }
    } catch {
      toast("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublishVariantNow(variantId: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    const res = await fetch(fetchUrl("/api/publish"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantId }),
    });
    if (res.ok) {
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, status: "published" } : v))
      );
    } else {
      const data = await res.json();
      toast(data.error ?? "Publication failed");
      throw new Error(data.error);
    }
  }

  async function handleRescheduleVariant(variantId: string, scheduledAt: string) {
    const res = await fetch(fetchUrl(`/api/variants/${variantId}/schedule`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledAt }),
    });
    if (res.ok) {
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, scheduledAt, status: "scheduled" } : v))
      );
    } else {
      const data = await res.json();
      toast(data.error ?? "Reschedule failed");
      throw new Error(data.error);
    }
  }

  async function handleScheduleToSite(articleId: string, scheduledAt: string) {
    if (isDemo) { toast("This feature is disabled in demo mode"); return; }
    setSchedulingSite(true);
    try {
      const res = await fetch(fetchUrl(`/api/articles/${articleId}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "scheduled", scheduled_at: scheduledAt }),
      });
      if (res.ok) {
        await loadData();
        if (previewArticle) setPreviewArticle({ ...previewArticle, status: "scheduled" });
        setShowSitePublishMenu(false);
      } else {
        const data = await res.json();
        toast(data.error ?? "Schedule failed");
      }
    } catch {
      toast("Something went wrong");
    } finally {
      setSchedulingSite(false);
    }
  }

  async function handlePublishAll() {
    const unpublished = variants.filter(
      (v) => v.status !== "published" && platformMeta[v.platformType]?.connectionType !== "manual"
    );
    if (unpublished.length === 0) return;
    if (!(await confirm({ message: `Publish ${unpublished.length} variant(s) now?` }))) return;

    setPublishAllLoading(true);
    setPublishAllProgress({ done: 0, total: unpublished.length });

    for (const v of unpublished) {
      try {
        await handlePublishVariantNow(v.id);
      } catch {
        // continue with next
      }
      setPublishAllProgress((prev) => ({ ...prev, done: prev.done + 1 }));
    }

    setPublishAllLoading(false);
  }

  const totalVolume = clusters.reduce((s, c) => s + c.totalVolume, 0);
  const easyCount = clusters.filter((c) => c.difficulty === "easy").length;
  const generatedCount = articles.length;

  const generated = clusters.filter((c) => articleByCluster.has(c.id));
  const ideas = clusters.filter((c) => !articleByCluster.has(c.id));

  if (loading) {
    return <ArticlesSkeleton />;
  }

  // ─── Variant Preview ─────────────────────────────────────────

  if (view === "variant") {
    if (previewLoading || !variantPreview) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      );
    }

    const vMeta = platformMeta[variantPreview.platformType];
    const VIcon = vMeta?.icon ?? Radio;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setView("preview"); setVariantPreview(null); }}
            className="flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to master article
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied!" : "Copy Markdown"}
            </button>
            <button
              onClick={() => handleDeleteVariant(variantPreview.id)}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${vMeta?.color ?? "text-muted"} ${vMeta?.bgColor ?? "bg-card-hover"}`}>
                  <VIcon className="h-3 w-3" />
                  {vMeta?.label ?? variantPreview.platformType}
                </span>
                <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusConfig[variantPreview.status]?.color ?? "text-muted bg-card"}`}>
                  {statusConfig[variantPreview.status]?.label ?? variantPreview.status}
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-bold leading-snug">
                {variantPreview.title}
              </h1>
              <p className="mt-2 text-xs text-muted">
                Adapted from: {variantPreview.masterTitle}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-accent/10 px-3 py-1.5 font-mono text-sm text-accent-light">
              {variantPreview.wordCount} words
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card px-8 py-10 sm:px-12">
          <div
            className="prose prose-invert prose-lg max-w-none
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
              prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-3
              prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-base
              prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-muted
              prose-li:text-[15px] prose-li:text-muted prose-li:leading-[1.7]
              prose-ul:my-4 prose-ol:my-4
              prose-strong:text-foreground prose-strong:font-semibold
              prose-a:text-accent-light prose-a:no-underline hover:prose-a:underline
              prose-blockquote:border-accent/50 prose-blockquote:text-muted/80"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(variantPreview.content) }}
          />
        </div>
      </div>
    );
  }

  // ─── Article Preview ──────────────────────────────────────────

  if (view === "preview") {
    if (previewLoading || !previewArticle) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => { setView("list"); setPreviewArticle(null); setVariants([]); cancelEditing(); }}
            className="flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to articles
          </button>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  {saving ? "Saving..." : "Save"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
                >
                  <PenLine className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-accent/50 hover:text-foreground"
                >
                  {copied ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy Markdown"}
                </button>
                <button
                  onClick={() => handleDelete(previewArticle.id)}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted transition hover:border-red-500/50 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-start justify-between">
            <div>
              <span className={`inline-block rounded-md px-2.5 py-1 text-xs font-medium ${statusConfig[previewArticle.status]?.color ?? "text-muted bg-card"}`}>
                {previewArticle.status === "published"
                  ? "Published on your website"
                  : (statusConfig[previewArticle.status]?.label ?? previewArticle.status)}
              </span>
              <h1 className="mt-3 text-2xl font-bold leading-snug">
                {previewArticle.title}
              </h1>
              <p className="mt-2 text-base text-muted">
                {previewArticle.metaDescription}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-accent/10 px-3 py-1.5 font-mono text-sm text-accent-light">
              {previewArticle.wordCount} words
            </span>
          </div>

          {previewArticle.outline.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">
                Outline
              </p>
              <div className="flex flex-wrap gap-2">
                {previewArticle.outline.map((h, i) => (
                  <span key={i} className="rounded-md bg-card-hover px-2.5 py-1 text-xs text-muted">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Distribution Section ─────────────────────── */}

        {/* Publish to website (draft/ready only) */}
        {previewArticle.status !== "published" && previewArticle.status !== "scheduled" && (
          <div className="relative rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Globe className="h-4 w-4 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Your website</p>
                <p className="text-xs text-muted">Publish or schedule this article for your site</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePublishToSite(previewArticle.id)}
                  disabled={publishingToSite}
                  className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {publishingToSite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                  Now
                </button>
                <button
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(10, 0, 0, 0);
                    setSiteScheduleDate(tomorrow.toISOString().slice(0, 16));
                    setShowSitePublishMenu(!showSitePublishMenu);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
                >
                  <CalendarClock className="h-3 w-3" />
                  Schedule
                </button>
              </div>
            </div>
            {showSitePublishMenu && (
              <div className="mt-3 space-y-3 rounded-lg bg-card-hover p-3">
                <label className="block text-[11px] font-medium text-muted">Publication date & time</label>
                <DateTimePicker value={siteScheduleDate} onChange={setSiteScheduleDate} />
                <button
                  onClick={() => handleScheduleToSite(previewArticle.id, new Date(siteScheduleDate).toISOString())}
                  disabled={schedulingSite || !siteScheduleDate}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-blue-600 disabled:opacity-50"
                >
                  {schedulingSite ? <Loader2 className="h-3 w-3 animate-spin" /> : <CalendarClock className="h-3 w-3" />}
                  Confirm Schedule
                </button>
              </div>
            )}
          </div>
        )}
        {previewArticle.status === "scheduled" && (
          <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarClock className="h-4 w-4 text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-400">Scheduled for your website</p>
              <p className="text-xs text-muted">Will be automatically published by the scheduler</p>
            </div>
            <button
              onClick={() => handlePublishToSite(previewArticle.id)}
              disabled={publishingToSite}
              className="flex items-center gap-2 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
            >
              {publishingToSite ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Publish Now
            </button>
          </div>
        )}

        {channels.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center">
            <Radio className="mx-auto mb-3 h-6 w-6 text-muted" />
            <p className="text-sm text-muted">
              No channels configured yet.{" "}
              <Link
                href={`${basePath}/projects/${id}/channels`}
                className="text-accent-light underline-offset-2 hover:underline"
              >
                Add channels
              </Link>{" "}
              to distribute this article.
            </p>
          </div>
        ) : (
          <>
            {/* Auto-publish variants */}
            {(() => {
              const autoChannelsList = channels.filter((c) => {
                const m = platformMeta[c.platformType];
                return m && m.connectionType !== "manual";
              });
              if (autoChannelsList.length === 0) return null;

              const autoVariants = variants.filter((v) => {
                const m = platformMeta[v.platformType];
                return m && m.connectionType !== "manual";
              });
              const autoVariantChannelIds = new Set(autoVariants.map((v) => v.channelId));
              const availableAutoChannels = autoChannelsList.filter((c) => !autoVariantChannelIds.has(c.id));

              return (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-accent-light" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-light">
                        Auto-publish ({autoVariants.length}/{autoChannelsList.length})
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      {autoVariants.filter((v) => v.status !== "published").length > 0 && (
                        <button
                          onClick={handlePublishAll}
                          disabled={publishAllLoading}
                          className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                        >
                          {publishAllLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              {publishAllProgress.done}/{publishAllProgress.total}
                            </>
                          ) : (
                            <>
                              <Zap className="h-3 w-3" />
                              Publish All
                            </>
                          )}
                        </button>
                      )}
                      {availableAutoChannels.length > 0 && (
                        <button
                          onClick={() => setShowChannelPicker(showChannelPicker === "auto" ? false : "auto")}
                          className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent-light transition hover:bg-accent/20"
                        >
                          {showChannelPicker === "auto" ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                          {showChannelPicker === "auto" ? "Cancel" : "Generate"}
                        </button>
                      )}
                    </div>
                  </div>

                  {showChannelPicker === "auto" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableAutoChannels.map((ch) => {
                        const meta = platformMeta[ch.platformType];
                        const Icon = meta?.icon ?? Radio;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => handleGenerateVariant(previewArticle.id, ch.id)}
                            disabled={generatingVariant !== null}
                            className={`flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/10 disabled:opacity-50 ${meta?.color ?? "text-muted"}`}
                          >
                            {generatingVariant === ch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                            {ch.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {autoVariants.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {autoVariants.map((v) => {
                        const meta = platformMeta[v.platformType];
                        const Icon = meta?.icon ?? Radio;
                        return (
                          <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border bg-card-hover p-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta?.bgColor ?? "bg-accent/10"}`}>
                              <Icon className={`h-4 w-4 ${meta?.color ?? "text-accent-light"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{v.title}</p>
                              <p className="text-xs text-muted">{meta?.label} · {v.wordCount} words</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {v.status === "published" ? (
                                <span className="flex items-center gap-1 rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
                                  <ExternalLink className="h-3 w-3" />
                                  Published
                                </span>
                              ) : v.scheduledAt ? (
                                <button
                                  onClick={() => setPublishDialogVariant(v)}
                                  className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20"
                                >
                                  <CalendarClock className="h-3 w-3" />
                                  {new Date(v.scheduledAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </button>
                              ) : (
                                <button
                                  onClick={() => setPublishDialogVariant(v)}
                                  className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition hover:bg-accent-light"
                                >
                                  <Zap className="h-3 w-3" />
                                  Publish
                                </button>
                              )}
                              <button
                                onClick={() => openVariantPreview(v.id)}
                                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">Click &quot;Generate&quot; to create variants for auto-publishing.</p>
                  )}
                </div>
              );
            })()}

            {/* Copy/Paste variants */}
            {(() => {
              const manualChannelsList = channels.filter((c) => {
                const m = platformMeta[c.platformType];
                return m && m.connectionType === "manual";
              });
              if (manualChannelsList.length === 0) return null;

              const manualVariants = variants.filter((v) => {
                const m = platformMeta[v.platformType];
                return m && m.connectionType === "manual";
              });
              const manualVariantChannelIds = new Set(manualVariants.map((v) => v.channelId));
              const availableManualChannels = manualChannelsList.filter((c) => !manualVariantChannelIds.has(c.id));

              return (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ClipboardCopy className="h-4 w-4 text-muted" />
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/70">
                        Copy / Paste ({manualVariants.length}/{manualChannelsList.length})
                      </h2>
                    </div>
                    {availableManualChannels.length > 0 && (
                      <button
                        onClick={() => setShowChannelPicker(showChannelPicker === "manual" ? false : "manual")}
                        className="flex items-center gap-1.5 rounded-lg bg-card-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-accent/10 hover:text-foreground"
                      >
                        {showChannelPicker === "manual" ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                        {showChannelPicker === "manual" ? "Cancel" : "Generate"}
                      </button>
                    )}
                  </div>

                  {showChannelPicker === "manual" && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {availableManualChannels.map((ch) => {
                        const meta = platformMeta[ch.platformType];
                        const Icon = meta?.icon ?? Radio;
                        return (
                          <button
                            key={ch.id}
                            onClick={() => handleGenerateVariant(previewArticle.id, ch.id)}
                            disabled={generatingVariant !== null}
                            className={`flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/10 disabled:opacity-50 ${meta?.color ?? "text-muted"}`}
                          >
                            {generatingVariant === ch.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                            {ch.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {manualVariants.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {manualVariants.map((v) => {
                        const meta = platformMeta[v.platformType];
                        const Icon = meta?.icon ?? Radio;
                        return (
                          <div key={v.id} className="flex items-center gap-3 rounded-lg border border-border bg-card-hover p-3">
                            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta?.bgColor ?? "bg-accent/10"}`}>
                              <Icon className={`h-4 w-4 ${meta?.color ?? "text-accent-light"}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium">{v.title}</p>
                              <p className="text-xs text-muted">{meta?.label} · {v.wordCount} words</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={async () => {
                                  const res = await fetch(fetchUrl(`/api/articles/variants/${v.id}`));
                                  if (res.ok) {
                                    const data = await res.json();
                                    navigator.clipboard.writeText(`# ${data.title}\n\n${data.content}`);
                                    setCopied(true);
                                    setTimeout(() => setCopied(false), 2000);
                                  }
                                }}
                                className="flex items-center gap-1.5 rounded-lg bg-card-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-accent/10 hover:text-foreground"
                              >
                                <Copy className="h-3 w-3" />
                                Copy
                              </button>
                              <button
                                onClick={() => openVariantPreview(v.id)}
                                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:border-accent/50 hover:text-foreground"
                              >
                                <Eye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteVariant(v.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs text-muted">Click &quot;Generate&quot; to create adapted versions for manual posting.</p>
                  )}
                </div>
              );
            })()}
          </>
        )}

        {editing ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-accent/30 bg-card p-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted/60">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#080c18] px-4 py-2.5 text-lg font-bold outline-none placeholder:text-muted/40 focus:border-accent/50"
              />
            </div>
            <div className="rounded-xl border border-accent/30 bg-card p-4">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted/60">Content (Markdown)</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full rounded-lg border border-border bg-[#080c18] px-4 py-3 font-mono text-sm leading-relaxed text-muted outline-none placeholder:text-muted/40 focus:border-accent/50"
                style={{ minHeight: "60vh" }}
              />
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card px-8 py-10 sm:px-12">
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground
                prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-xl prose-h2:border-b prose-h2:border-border prose-h2:pb-3
                prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-base
                prose-p:text-[15px] prose-p:leading-[1.8] prose-p:text-muted
                prose-li:text-[15px] prose-li:text-muted prose-li:leading-[1.7]
                prose-ul:my-4 prose-ol:my-4
                prose-strong:text-foreground prose-strong:font-semibold
                prose-a:text-accent-light prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-accent/50 prose-blockquote:text-muted/80"
              dangerouslySetInnerHTML={{ __html: markdownToHtml(previewArticle.content) }}
            />
          </div>
        )}

        {publishDialogVariant && (
          <PublishDialog
            variantId={publishDialogVariant.id}
            variantTitle={publishDialogVariant.title}
            platform={platformMeta[publishDialogVariant.platformType]?.label ?? publishDialogVariant.platformType}
            scheduledAt={publishDialogVariant.scheduledAt}
            onPublishNow={handlePublishVariantNow}
            onReschedule={handleRescheduleVariant}
            onClose={() => setPublishDialogVariant(null)}
          />
        )}
      </div>
    );
  }

  // ─── Empty state ──────────────────────────────────────────────

  if (clusters.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
          <p className="mt-1 text-base text-muted">
            Articles are generated from keyword clusters.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <FileText className="h-7 w-7 text-accent-light" />
          </div>
          <h3 className="mb-1 text-xl font-semibold">No articles yet</h3>
          <p className="mb-6 max-w-sm text-center text-base text-muted">
            Run an analysis first to generate keyword clusters.
          </p>
          <Link
            href={`${basePath}/projects/${id}/analyze`}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            Go to Analyze
          </Link>
        </div>
      </div>
    );
  }

  // ─── Articles List ────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Articles</h1>
        <p className="mt-1 text-base text-muted">
          {clusters.length} article ideas · {generatedCount} generated ·{" "}
          {easyCount > 0 && (
            <span className="text-green-400">{easyCount} easy to rank</span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-sm text-muted">Ideas</span>
          <p className="mt-2 text-2xl font-bold">{clusters.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-sm text-muted">Generated</span>
          <p className="mt-2 text-2xl font-bold text-accent-light">{generatedCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-sm text-muted">Monthly Searches</span>
          <p className="mt-2 text-2xl font-bold">{totalVolume.toLocaleString()}</p>
          <p className="mt-0.5 text-xs text-muted">across {clusters.length} topics</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <span className="text-sm text-muted">Easy Wins</span>
          <p className="mt-2 text-2xl font-bold text-green-400">{easyCount}</p>
        </div>
      </div>

      {/* Generated articles */}
      {generated.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent-light">
            <FileText className="h-4 w-4" />
            Generated ({generated.length})
          </h2>
          {generated.map((cluster) => (
            <ArticleCard
              key={cluster.id}
              cluster={cluster}
              article={articleByCluster.get(cluster.id)}
              isExpanded={expandedId === cluster.id}
              isGenerating={generatingId === cluster.id}
              generatingInfo={null}
              onToggle={() => setExpandedId(expandedId === cluster.id ? null : cluster.id)}
              onGenerate={() => handleGenerate(cluster.id)}
              onPreview={(aid) => openPreview(aid)}
              onDelete={(aid) => handleDelete(aid)}
            />
          ))}
        </div>
      )}

      {/* Ideas to generate */}
      {ideas.length > 0 && (
        <div className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted/60">
            <PenTool className="h-4 w-4" />
            To Generate ({ideas.length})
          </h2>
          {ideas.map((cluster) => (
            <ArticleCard
              key={cluster.id}
              cluster={cluster}
              article={undefined}
              isExpanded={expandedId === cluster.id}
              isGenerating={generatingId === cluster.id}
              generatingInfo={
                persistentGenerating?.clusterId === cluster.id ? persistentGenerating : null
              }
              onToggle={() => setExpandedId(expandedId === cluster.id ? null : cluster.id)}
              onGenerate={() => handleGenerate(cluster.id)}
              onPreview={() => {}}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Article Card Component ─────────────────────────────────────

function ArticleCard({
  cluster,
  article,
  isExpanded,
  isGenerating,
  generatingInfo,
  onToggle,
  onGenerate,
  onPreview,
  onDelete,
}: {
  cluster: Cluster;
  article: Article | undefined;
  isExpanded: boolean;
  isGenerating: boolean;
  generatingInfo: GeneratingInfo | null;
  onToggle: () => void;
  onGenerate: () => void;
  onPreview: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const showGenerating = isGenerating || !!generatingInfo;
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!showGenerating) { setElapsed(0); return; }
    const start = generatingInfo?.startedAt ?? Date.now();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [showGenerating, generatingInfo?.startedAt]);

  const estimatedSeconds = generatingInfo?.estimatedSeconds ?? 150;
  const progress = Math.min(elapsed / estimatedSeconds, 0.95);
  const remainingSeconds = Math.max(estimatedSeconds - elapsed, 0);
  const remainingMin = Math.floor(remainingSeconds / 60);
  const remainingSec = remainingSeconds % 60;

  return (
    <div className={`overflow-hidden rounded-xl border bg-card transition ${
      showGenerating
        ? "border-accent/40 ring-1 ring-accent/20"
        : article
          ? "border-accent/20 hover:border-accent/20"
          : "border-border hover:border-accent/20"
    }`}>
      {showGenerating && (
        <div className="relative h-1 bg-accent/10">
          <div
            className="absolute inset-y-0 left-0 bg-accent/60 transition-all duration-1000 ease-linear"
            style={{ width: `${progress * 100}%` }}
          />
          <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        </div>
      )}

      <button
        onClick={onToggle}
        className="flex w-full items-center gap-4 p-5 text-left"
      >
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-sm font-bold ${
          showGenerating
            ? "bg-accent/20"
            : article
              ? "bg-accent/20 text-accent-light"
              : "bg-accent/10 text-accent-light"
        }`}>
          {showGenerating ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent-light" />
          ) : article ? (
            <FileText className="h-5 w-5" />
          ) : (
            <PenTool className="h-5 w-5" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">
            {article?.title ?? cluster.articleTitle}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${difficultyColors[cluster.difficulty] ?? "text-muted bg-card"}`}>
              {cluster.difficulty}
            </span>
            <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${intentColors[cluster.searchIntent] ?? "bg-card text-muted"}`}>
              {cluster.searchIntent}
            </span>
            <span className="text-xs text-muted">
              {cluster.totalVolume.toLocaleString()} vol/mo
            </span>
            <span className="text-xs text-muted">
              {cluster.supportingKeywords.length + 1} keywords
            </span>
            {article && (
              <span className="text-xs text-muted">· {article.wordCount} words</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {showGenerating ? (
            <div className="text-right">
              <p className="text-xs font-medium text-accent-light">Generating...</p>
              <p className="text-[10px] text-muted">
                {remainingSeconds > 0
                  ? `~${remainingMin}m ${String(remainingSec).padStart(2, "0")}s left`
                  : "Almost done..."}
              </p>
            </div>
          ) : article ? (
            <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${statusConfig[article.status]?.color ?? "text-muted bg-card-hover"}`}>
              {statusConfig[article.status]?.label ?? article.status}
            </span>
          ) : (
            <span className="rounded-md bg-card-hover px-2.5 py-1 text-xs font-medium text-muted">
              Idea
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">Topic</p>
              <p className="text-sm">{cluster.topic}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">Pillar Keyword</p>
              <div className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5 text-accent" />
                <span className="text-sm font-medium">{cluster.pillarKeyword}</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted/60">Supporting Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {cluster.supportingKeywords.map((kw) => (
                <span key={kw} className="rounded-md bg-card-hover px-2.5 py-1 text-xs text-muted">{kw}</span>
              ))}
            </div>
          </div>

          <div className="mt-5 flex gap-3">
            {article ? (
              <button
                onClick={() => onPreview(article.id)}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
              >
                <Eye className="h-4 w-4" />
                View Article
              </button>
            ) : showGenerating ? (
              <div className="flex items-center gap-3 rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-accent-light" />
                <div>
                  <span className="font-medium text-accent-light">Writing article with AI...</span>
                  <span className="ml-2 text-xs text-muted">
                    {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} elapsed
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={onGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
              >
                <PenTool className="h-4 w-4" />
                Generate Article
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Minimal markdown to HTML ───────────────────────────────────

function markdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Headings
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, "<oli>$1</oli>");
  html = html.replace(/((?:<oli>.*<\/oli>\n?)+)/g, (match) => {
    const items = match.replace(/<\/?oli>/g, (t) => t === "<oli>" ? "<li>" : "</li>");
    return `<ol>${items}</ol>`;
  });

  // Unordered lists
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, "<ul>$1</ul>");

  // Horizontal rules
  html = html.replace(/^---$/gm, "<hr/>");

  // Paragraphs
  html = html
    .split("\n\n")
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return "";
      if (/^<(h[1-6]|ul|ol|blockquote|hr)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, "<br/>")}</p>`;
    })
    .join("\n");

  return html;
}

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`} />;
}

function ArticlesSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Shimmer className="h-7 w-32" />
          <Shimmer className="mt-2 h-4 w-48" />
        </div>
        <Shimmer className="h-10 w-36 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="mt-3 h-7 w-12" />
          </div>
        ))}
      </div>

      {/* Article cards */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Shimmer className="h-5 w-3/4" />
                <Shimmer className="h-4 w-1/2" />
                <div className="flex items-center gap-3 pt-1">
                  <Shimmer className="h-5 w-16 rounded-md" />
                  <Shimmer className="h-5 w-20 rounded-md" />
                  <Shimmer className="h-4 w-24" />
                </div>
              </div>
              <Shimmer className="h-8 w-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
