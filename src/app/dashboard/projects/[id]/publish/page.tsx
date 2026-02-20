"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Plug,
  Radio,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Hash,
  MessageSquare,
  Globe,
  Code2,
  Zap,
  ClipboardCopy,
  Flame,
  HelpCircle,
  Mail,
  ExternalLink,
  Key,
  X,
  Check,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Copy,
  Clock,
  CheckCircle2,
  RefreshCw,
  Shield,
  GitBranch,
  FolderOpen,
  ChevronDown,
  Settings,
} from "lucide-react";
import {
  generateSnippetNextjs,
  generateSnippetExpress,
  type SiteConnection,
} from "@/lib/custom-api";
import type { GitHubRepo, DirectoryEntry } from "@/lib/github";

/* ─── Types ──────────────────────────────────────────────── */

type PublishTab = "site" | "channels" | "schedule";

interface Channel {
  id: string;
  projectId: string;
  platformType: string;
  name: string;
  config: Record<string, unknown>;
  constraints: Record<string, unknown>;
  createdAt: string;
}

interface ScheduledVariant {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  published_at: string | null;
  published_url: string | null;
  channel_id: string;
  article_id: string;
  channels: { platform_type: string; name: string; config: Record<string, unknown>; project_id: string };
  articles: { title: string; pillar_keyword: string };
}

type ConnectionType = "api_key" | "oauth" | "manual";

interface PlatformInfo {
  label: string;
  icon: typeof BookOpen;
  color: string;
  bgColor: string;
  connectionType: ConnectionType;
  description: string;
  apiKeyUrl?: string;
}

/* ─── Platform metadata ──────────────────────────────────── */

const platformMeta: Record<string, PlatformInfo> = {
  devto: { label: "Dev.to", icon: Code2, color: "text-blue-400", bgColor: "bg-blue-500/10", connectionType: "api_key", description: "Developer community — dofollow backlinks, DA 85+", apiKeyUrl: "https://dev.to/settings/extensions" },
  hashnode: { label: "Hashnode", icon: Hash, color: "text-indigo-400", bgColor: "bg-indigo-500/10", connectionType: "api_key", description: "Developer blogging — dofollow backlinks, DA 80+", apiKeyUrl: "https://hashnode.com/settings/developer" },
  medium: { label: "Medium", icon: BookOpen, color: "text-green-400", bgColor: "bg-green-500/10", connectionType: "oauth", description: "Large audience — dofollow backlinks, DA 95" },
  reddit: { label: "Reddit", icon: MessageSquare, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "oauth", description: "Communities — Google indexes posts, DA 99" },
  wordpress: { label: "WordPress", icon: Globe, color: "text-cyan-400", bgColor: "bg-cyan-500/10", connectionType: "api_key", description: "Your own blog — full control, SEO canonical" },
  telegraph: { label: "Telegraph", icon: FileText, color: "text-sky-400", bgColor: "bg-sky-500/10", connectionType: "api_key", description: "Instant publishing — dofollow, DA 83", apiKeyUrl: "https://api.telegra.ph/createAccount?short_name=OctoBoost&author_name=YourName" },
  indiehackers: { label: "Indie Hackers", icon: Flame, color: "text-amber-400", bgColor: "bg-amber-500/10", connectionType: "manual", description: "SaaS community — 23% conversion rate" },
  hackernews: { label: "Hacker News", icon: Code2, color: "text-orange-300", bgColor: "bg-orange-500/10", connectionType: "manual", description: "Tech audience — traffic spikes, DA 90+" },
  quora: { label: "Quora", icon: HelpCircle, color: "text-red-400", bgColor: "bg-red-500/10", connectionType: "manual", description: "Q&A — featured snippets in Google, DA 93" },
  substack: { label: "Substack", icon: Mail, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "manual", description: "Newsletter — loyal audience, cross-posting" },
  blogger: { label: "Blogger", icon: BookOpen, color: "text-orange-500", bgColor: "bg-orange-500/10", connectionType: "oauth", description: "Google Blogspot — DA 89, gratuit" },
};

const schedulePlatformMeta: Record<string, { label: string; color: string; icon: string; connectionType: string }> = {
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

const autoPublishPlatforms = ["devto", "hashnode", "medium", "reddit", "wordpress", "telegraph", "blogger"];
const manualPlatforms = ["indiehackers", "hackernews", "quora", "substack"];

/* ─── Main page ──────────────────────────────────────────── */

export default function PublishPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<PublishTab>("site");
  const [realProjectId, setRealProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Site connection state
  const [connection, setConnection] = useState<SiteConnection | null>(null);
  const [endpointInput, setEndpointInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [snippetLang, setSnippetLang] = useState<"nextjs" | "express">("nextjs");
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // GitHub connection state
  const [ghRepos, setGhRepos] = useState<GitHubRepo[]>([]);
  const [ghLoadingRepos, setGhLoadingRepos] = useState(false);
  const [ghSelectedRepo, setGhSelectedRepo] = useState<string>("");
  const [ghDirs, setGhDirs] = useState<DirectoryEntry[]>([]);
  const [ghLoadingDirs, setGhLoadingDirs] = useState(false);
  const [ghSelectedDir, setGhSelectedDir] = useState<string>("");
  const [ghFileFormat, setGhFileFormat] = useState<"md" | "mdx">("mdx");
  const [ghSaving, setGhSaving] = useState(false);
  const [showCustomApi, setShowCustomApi] = useState(false);

  // Channels state
  const [channels, setChannels] = useState<Channel[]>([]);
  const [adding, setAdding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<{ platform: string; value: string; publicationHost?: string } | null>(null);
  const [bloggerBlogUrl, setBloggerBlogUrl] = useState<string | null>(null);

  // Schedule state
  const [variants, setVariants] = useState<ScheduledVariant[]>([]);
  const [monthOffset, setMonthOffset] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) return;
      const projData = await projRes.json();
      setRealProjectId(projData.projectId);

      const [connRes, chRes, schedRes] = await Promise.all([
        fetch(`/api/site-connection?projectId=${projData.projectId}`),
        fetch(`/api/channels?projectId=${projData.projectId}`),
        fetch(`/api/schedule?projectId=${projData.projectId}`),
      ]);

      if (connRes.ok) {
        const connData = await connRes.json();
        setConnection(connData.connection ?? null);
      }
      if (chRes.ok) {
        const chData = await chRes.json();
        setChannels(chData.channels ?? []);
      }
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setVariants(schedData.variants ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setSelectedDay(null);
    }
    if (selectedDay) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [selectedDay]);

  /* ── Site connection handlers ── */

  /* ── GitHub handlers ── */

  function handleConnectGitHub() {
    if (!realProjectId || !id) return;
    window.location.href = `/api/auth/github?projectId=${realProjectId}&projectSlug=${id}`;
  }

  async function handleLoadRepos() {
    if (!realProjectId || ghLoadingRepos) return;
    setGhLoadingRepos(true);
    try {
      const res = await fetch(`/api/github/repos?projectId=${realProjectId}`);
      if (res.ok) {
        const data = await res.json();
        setGhRepos(data.repos ?? []);
      }
    } finally {
      setGhLoadingRepos(false);
    }
  }

  async function handleSelectRepo(fullName: string) {
    setGhSelectedRepo(fullName);
    if (!realProjectId || !fullName) return;
    const [owner, repo] = fullName.split("/");
    const selectedRepo = ghRepos.find((r) => r.full_name === fullName);
    const branch = selectedRepo?.default_branch ?? "main";

    setGhLoadingDirs(true);
    try {
      const res = await fetch(
        `/api/github/tree?projectId=${realProjectId}&owner=${owner}&repo=${repo}&branch=${branch}`
      );
      if (res.ok) {
        const data = await res.json();
        setGhDirs(data.directories ?? []);
      }
    } finally {
      setGhLoadingDirs(false);
    }
  }

  async function handleSaveGitHubConfig() {
    if (!realProjectId || !ghSelectedRepo || ghSaving) return;
    setGhSaving(true);
    try {
      const [owner, repo] = ghSelectedRepo.split("/");
      const selectedRepo = ghRepos.find((r) => r.full_name === ghSelectedRepo);
      const branch = selectedRepo?.default_branch ?? "main";

      const res = await fetch("/api/site-connection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: realProjectId,
          action: "github-configure",
          repoOwner: owner,
          repoName: repo,
          branch,
          contentDir: ghSelectedDir || "",
          fileFormat: ghFileFormat,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnection(data.connection);
      }
    } finally {
      setGhSaving(false);
    }
  }

  useEffect(() => {
    if (connection?.type === "github" && connection.github_token && !connection.repo_name && ghRepos.length === 0) {
      handleLoadRepos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connection]);

  async function handleSaveEndpoint() {
    if (!realProjectId || !endpointInput.trim() || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/site-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: realProjectId, endpointUrl: endpointInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnection(data.connection);
        setEndpointInput("");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleTestConnection() {
    if (!realProjectId || testing) return;
    setTesting(true);
    try {
      const res = await fetch("/api/site-connection", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: realProjectId, action: "test" }),
      });
      if (res.ok) {
        const data = await res.json();
        setConnection(data.connection);
      }
    } finally {
      setTesting(false);
    }
  }

  async function handleDisconnect() {
    if (!realProjectId || !confirm("Disconnect your site?")) return;
    const res = await fetch("/api/site-connection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: realProjectId, action: "disconnect" }),
    });
    if (res.ok) {
      setConnection(null);
      setShowSecret(false);
    }
  }

  async function handleRegenerateSecret() {
    if (!realProjectId || !confirm("Regenerate secret? You'll need to update your endpoint.")) return;
    const res = await fetch("/api/site-connection", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: realProjectId, action: "regenerate-secret" }),
    });
    if (res.ok) {
      const data = await res.json();
      setConnection(data.connection);
    }
  }

  function copyToClipboard(text: string, type: "snippet" | "secret") {
    navigator.clipboard.writeText(text);
    if (type === "snippet") { setCopiedSnippet(true); setTimeout(() => setCopiedSnippet(false), 2000); }
    else { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }
  }

  /* ── Channel handlers ── */

  async function handleAddChannel(platformType: string, apiKey?: string, publicationHost?: string) {
    if (!realProjectId || adding) return;
    setAdding(platformType);
    const meta = platformMeta[platformType];
    try {
      const config: Record<string, string> = apiKey ? { apiKey } : {};
      if (platformType === "hashnode" && publicationHost) config.publicationHost = publicationHost.trim();
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: realProjectId, platformType, name: meta?.label ?? platformType, config }),
      });
      if (res.ok) { await loadData(); setApiKeyInput(null); }
      else { const err = await res.json(); alert(err.error ?? "Erreur"); }
    } finally { setAdding(null); }
  }

  async function handleDeleteChannel(channelId: string) {
    if (!confirm("Remove this channel?")) return;
    setDeleting(channelId);
    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (res.ok) setChannels((prev) => prev.filter((c) => c.id !== channelId));
    } finally { setDeleting(null); }
  }

  function handleRedditConnect(channelId: string) {
    window.location.href = `/api/auth/reddit?channelId=${channelId}&projectSlug=${id}`;
  }

  function handlePlatformClick(platformType: string) {
    const meta = platformMeta[platformType];
    if (!meta) return;
    if (meta.connectionType === "api_key") setApiKeyInput({ platform: platformType, value: "" });
    else if (platformType === "blogger") setBloggerBlogUrl("");
    else handleAddChannel(platformType);
  }

  function handleBloggerConnect() {
    if (!realProjectId || !bloggerBlogUrl?.trim()) return;
    setAdding("blogger");
    const meta = platformMeta.blogger;
    fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: realProjectId, platformType: "blogger", name: meta?.label ?? "Blogger", config: { blogUrl: bloggerBlogUrl.trim() } }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) window.location.href = `/api/auth/blogger?channelId=${data.id}&projectSlug=${id}`;
        else { alert(data.error ?? "Erreur"); setAdding(null); }
      })
      .catch(() => setAdding(null));
  }

  /* ── Schedule handlers ── */

  const handleCopyVariant = async (variant: ScheduledVariant) => {
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

  /* ── Derived data ── */

  const usedPlatforms = new Set(channels.map((c) => c.platformType));
  const autoChannels = channels.filter((c) => autoPublishPlatforms.includes(c.platformType));
  const manualChannels = channels.filter((c) => manualPlatforms.includes(c.platformType));
  const availableAuto = autoPublishPlatforms.filter((p) => !usedPlatforms.has(p));
  const availableManual = manualPlatforms.filter((p) => !usedPlatforms.has(p));

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
  const totalScheduled = variants.filter((v) => v.status === "scheduled").length;
  const totalPublished = variants.filter((v) => v.status === "published").length;
  const selectedVariants = selectedDay ? (variantsByDay.get(selectedDay) ?? []) : [];
  const selectedDate = selectedDay ? new Date(selectedDay + "T00:00:00") : null;

  const snippet = snippetLang === "nextjs"
    ? generateSnippetNextjs(connection?.secret ?? "YOUR_SECRET")
    : generateSnippetExpress();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Publish</h1>
        <p className="mt-1 text-sm text-muted">
          Connect your site, configure channels, and manage your publishing schedule.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {([
          { id: "site" as const, label: "My Site", icon: Plug, badge: connection?.status === "connected" ? "Connected" : undefined },
          { id: "channels" as const, label: "Channels", icon: Radio, badge: channels.length > 0 ? `${channels.length}` : undefined },
          { id: "schedule" as const, label: "Schedule", icon: Calendar, badge: totalScheduled > 0 ? `${totalScheduled}` : undefined },
        ]).map(({ id: tabId, label, icon: Icon, badge }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-[13px] transition-colors ${
              tab === tabId ? "bg-accent/15 font-medium text-accent-light" : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {badge && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                tab === tabId ? "bg-accent/20 text-accent-light" : "bg-white/[0.06] text-muted"
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════════ MY SITE TAB ════════ */}
      {tab === "site" && (
        <div className="space-y-6">

          {/* ── Connected state (GitHub or Custom API) ── */}
          {connection?.status === "connected" ? (
            <div className="space-y-6">
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-green-400">Site Connected</h2>
                      {connection.type === "github" ? (
                        <p className="text-xs text-muted">
                          GitHub &middot; {connection.repo_owner}/{connection.repo_name} &middot; /{connection.content_dir || "root"} &middot; .{connection.file_format}
                        </p>
                      ) : (
                        <p className="text-xs text-muted">{connection.endpoint_url}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleTestConnection} disabled={testing} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground disabled:opacity-50">
                      {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Test
                    </button>
                    <button onClick={handleDisconnect} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-500/50 hover:text-red-400">
                      <X className="h-3 w-3" />
                      Disconnect
                    </button>
                  </div>
                </div>
                {connection.last_tested_at && (
                  <p className="mt-2 text-xs text-muted/50">
                    Last tested: {new Date(connection.last_tested_at).toLocaleString("fr-FR")}
                  </p>
                )}
              </div>

              {connection.type === "github" && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <GitBranch className="h-4 w-4 text-accent-light" />
                    <h3 className="text-sm font-semibold">How it works</h3>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    When you publish an article, OctoBoost creates a <code className="rounded bg-white/[0.06] px-1 py-0.5">.{connection.file_format}</code> file
                    in <code className="rounded bg-white/[0.06] px-1 py-0.5">{connection.content_dir || "/"}</code> with
                    SEO frontmatter (title, description, tags, date). Your site auto-deploys via Vercel/Netlify.
                  </p>
                </div>
              )}

              {connection.type === "custom_api" && (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-4 w-4 text-accent-light" />
                    <h3 className="text-sm font-semibold">Secret Token</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border bg-[#0d1117] px-4 py-2.5 text-sm text-green-400/90">
                      {showSecret ? connection.secret : "ob_••••••••••••••••••••••••••••••••"}
                    </code>
                    <button onClick={() => setShowSecret(!showSecret)} className="rounded-lg border border-border px-3 py-2.5 text-xs text-muted transition hover:text-foreground">{showSecret ? "Hide" : "Show"}</button>
                    <button onClick={() => copyToClipboard(connection.secret ?? "", "secret")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs text-muted transition hover:text-foreground">
                      {copiedSecret ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}{copiedSecret ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : connection?.type === "github" && !connection.repo_name ? (
            /* ── GitHub connected but repo not selected yet ── */
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                    <CheckCircle2 className="h-5 w-5 text-accent-light" />
                  </div>
                  <div>
                    <h2 className="font-semibold">GitHub connected</h2>
                    <p className="text-xs text-muted">Signed in as <strong>{connection.repo_owner}</strong>. Now pick your repository.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 space-y-5">
                {/* Repo picker */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <FolderOpen className="h-4 w-4 text-accent-light" />
                    Repository
                  </label>
                  {ghLoadingRepos ? (
                    <div className="flex items-center gap-2 py-3 text-xs text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading your repos...
                    </div>
                  ) : (
                    <div className="relative">
                      <select
                        value={ghSelectedRepo}
                        onChange={(e) => handleSelectRepo(e.target.value)}
                        className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:outline-none"
                      >
                        <option value="">Select a repository...</option>
                        {ghRepos.map((r) => (
                          <option key={r.id} value={r.full_name}>
                            {r.full_name} {r.private ? "(private)" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    </div>
                  )}
                </div>

                {/* Folder picker */}
                {ghSelectedRepo && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                      <FolderOpen className="h-4 w-4 text-accent-light" />
                      Blog folder
                    </label>
                    <p className="mb-2 text-xs text-muted">Where should articles be saved? (e.g. content/blog, src/posts)</p>
                    {ghLoadingDirs ? (
                      <div className="flex items-center gap-2 py-3 text-xs text-muted">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading folders...
                      </div>
                    ) : (() => {
                      const suggested = ghDirs.filter((d) => d.suggested);
                      const others = ghDirs.filter((d) => !d.suggested);
                      return (
                        <div className="relative">
                          <select
                            value={ghSelectedDir}
                            onChange={(e) => setGhSelectedDir(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:outline-none"
                          >
                            <option value="">/ (root)</option>
                            {suggested.length > 0 && (
                              <optgroup label="Suggested (blog/content folders)">
                                {suggested.map((d) => (
                                  <option key={d.path} value={d.path}>{d.path}</option>
                                ))}
                              </optgroup>
                            )}
                            {others.length > 0 && (
                              <optgroup label={suggested.length > 0 ? "Other folders" : "All folders"}>
                                {others.map((d) => (
                                  <option key={d.path} value={d.path}>{d.path}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Format picker */}
                {ghSelectedRepo && (
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-accent-light" />
                      File format
                    </label>
                    <div className="flex gap-2">
                      {(["mdx", "md"] as const).map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setGhFileFormat(fmt)}
                          className={`rounded-lg px-4 py-2 text-xs font-medium transition ${
                            ghFileFormat === fmt
                              ? "bg-accent/15 text-accent-light ring-1 ring-accent/30"
                              : "bg-white/[0.04] text-muted hover:text-foreground"
                          }`}
                        >
                          .{fmt} {fmt === "mdx" ? "(Markdown + JSX)" : "(Markdown)"}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Save button */}
                {ghSelectedRepo && (
                  <button
                    onClick={handleSaveGitHubConfig}
                    disabled={ghSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                  >
                    {ghSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {ghSaving ? "Connecting..." : "Connect & Test"}
                  </button>
                )}

                <button onClick={handleDisconnect} className="text-xs text-muted/60 transition hover:text-red-400">
                  Disconnect GitHub
                </button>
              </div>
            </div>
          ) : (
            /* ── Not connected — show GitHub as primary option ── */
            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold">Publish articles directly on your blog</h2>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  OctoBoost generates SEO articles and pushes them straight to your site.
                  Connect your GitHub and articles will be committed as Markdown files —
                  your site auto-deploys. Zero code to write.
                </p>
              </div>

              {/* GitHub — primary */}
              <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06]">
                    <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  </div>
                  <div>
                    <h3 className="font-semibold">Connect with GitHub</h3>
                    <p className="text-xs text-muted">Recommended — 3 clicks, zero code</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">1</span>
                    Click &quot;Connect GitHub&quot; and authorize OctoBoost
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">2</span>
                    Pick your repo and the folder where articles should go
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">3</span>
                    Done — OctoBoost commits articles, your site auto-deploys
                  </div>
                </div>

                <button
                  onClick={handleConnectGitHub}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  Connect GitHub
                </button>
              </div>

              {/* Custom API — accordion */}
              <div className="rounded-xl border border-border bg-card">
                <button
                  onClick={() => setShowCustomApi(!showCustomApi)}
                  className="flex w-full items-center justify-between p-5 text-left"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-4 w-4 text-muted" />
                    <div>
                      <span className="text-sm font-medium text-muted">Advanced: Custom API endpoint</span>
                      <p className="text-xs text-muted/60">For custom setups — deploy your own webhook</p>
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted transition ${showCustomApi ? "rotate-180" : ""}`} />
                </button>

                {showCustomApi && (
                  <div className="border-t border-border p-5 space-y-4">
                    <div className="flex gap-2 mb-3">
                      {(["nextjs", "express"] as const).map((lang) => (
                        <button
                          key={lang}
                          onClick={() => setSnippetLang(lang)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            snippetLang === lang ? "bg-accent/15 text-accent-light" : "text-muted hover:text-foreground"
                          }`}
                        >
                          {lang === "nextjs" ? "Next.js" : "Express"}
                        </button>
                      ))}
                    </div>
                    <div className="relative">
                      <pre className="max-h-[250px] overflow-auto rounded-lg border border-border bg-[#0d1117] p-4 text-xs leading-relaxed text-green-400/90">
                        <code>{snippet}</code>
                      </pre>
                      <button
                        onClick={() => copyToClipboard(snippet, "snippet")}
                        className="absolute right-3 top-3 flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1 text-xs text-white/70 transition hover:bg-white/20"
                      >
                        {copiedSnippet ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedSnippet ? "Copied!" : "Copy"}
                      </button>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-xs text-muted">Endpoint URL</label>
                      <div className="flex gap-3">
                        <input
                          type="url"
                          value={endpointInput}
                          onChange={(e) => setEndpointInput(e.target.value)}
                          placeholder="https://yoursite.com/api/octoboost"
                          className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
                        />
                        <button
                          onClick={handleSaveEndpoint}
                          disabled={!endpointInput.trim() || saving}
                          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
                          Connect
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════ CHANNELS TAB ════════ */}
      {tab === "channels" && (
        <div className="space-y-6">
          {/* Blogger blog URL modal */}
          {bloggerBlogUrl !== null && !apiKeyInput && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10">
                    <BookOpen className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold">Blogger</p>
                    <p className="text-xs text-muted">Enter your blog URL to connect</p>
                  </div>
                </div>
                <button onClick={() => setBloggerBlogUrl(null)} className="text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 flex gap-3">
                <input type="text" placeholder="nicheshunter.blogspot.com" value={bloggerBlogUrl} onChange={(e) => setBloggerBlogUrl(e.target.value)} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" autoFocus />
                <button onClick={handleBloggerConnect} disabled={!bloggerBlogUrl?.trim() || adding !== null} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50">
                  {adding === "blogger" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Connect Google
                </button>
              </div>
            </div>
          )}

          {/* API Key modal */}
          {apiKeyInput && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {(() => {
                    const meta = platformMeta[apiKeyInput.platform];
                    const Icon = meta?.icon ?? Radio;
                    return (
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${meta?.bgColor}`}>
                        <Icon className={`h-5 w-5 ${meta?.color}`} />
                      </div>
                    );
                  })()}
                  <div>
                    <p className="font-semibold">{platformMeta[apiKeyInput.platform]?.label}</p>
                    <p className="text-xs text-muted">Enter your API key to enable auto-publish</p>
                  </div>
                </div>
                <button onClick={() => setApiKeyInput(null)} className="text-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
              <div className="mt-4 space-y-3">
                <div className="relative flex gap-3">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input type="password" placeholder="Paste your API key..." value={apiKeyInput.value} onChange={(e) => setApiKeyInput({ ...apiKeyInput, value: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" autoFocus />
                  </div>
                  <button
                    onClick={() => handleAddChannel(apiKeyInput.platform, apiKeyInput.value, apiKeyInput.platform === "hashnode" ? apiKeyInput.publicationHost : undefined)}
                    disabled={!apiKeyInput.value.trim() || adding !== null || (apiKeyInput.platform === "hashnode" && !apiKeyInput.publicationHost?.trim())}
                    className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                  >
                    {adding === apiKeyInput.platform ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Connect
                  </button>
                </div>
                {apiKeyInput.platform === "hashnode" && (
                  <div>
                    <label className="mb-1 block text-xs text-muted">Blog URL (publication host)</label>
                    <input type="text" placeholder="niches-hunter.hashnode.dev" value={apiKeyInput.publicationHost ?? ""} onChange={(e) => setApiKeyInput({ ...apiKeyInput, publicationHost: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" />
                  </div>
                )}
              </div>
              {platformMeta[apiKeyInput.platform]?.apiKeyUrl && (
                <a href={platformMeta[apiKeyInput.platform].apiKeyUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-light hover:underline">
                  <ExternalLink className="h-3 w-3" />
                  Get your API key from {platformMeta[apiKeyInput.platform]?.label}
                </a>
              )}
            </div>
          )}

          {/* Auto-publish section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-light" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-light">Auto-publish</h2>
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent-light">API</span>
            </div>
            <p className="text-xs text-muted">OctoBoost publishes directly to these platforms. One click, zero copy/paste.</p>

            {autoChannels.length > 0 && (
              <div className="space-y-2">
                {autoChannels.map((channel) => {
                  const meta = platformMeta[channel.platformType];
                  const Icon = meta?.icon ?? Radio;
                  const hasApiKey = !!(channel.config as Record<string, unknown>)?.apiKey;
                  return (
                    <div key={channel.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/20">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta?.bgColor ?? "bg-accent/10"}`}>
                        <Icon className={`h-5 w-5 ${meta?.color ?? "text-accent-light"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{channel.name}</p>
                        <p className="text-xs text-muted">{meta?.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {meta?.connectionType === "api_key" && (() => {
                          const cfg = channel.config as Record<string, unknown>;
                          const hasPub = channel.platformType === "hashnode" ? !!cfg?.publicationId : true;
                          const ready = hasApiKey && hasPub;
                          return (
                            <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${ready ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-400"}`}>
                              {ready ? "OK" : hasApiKey && !hasPub ? "No blog" : "No Key"}
                            </span>
                          );
                        })()}
                        {channel.platformType === "blogger" && (() => {
                          const cfg = channel.config as Record<string, unknown>;
                          const isConnected = !!cfg?.refreshToken;
                          return isConnected ? (
                            <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">Connected</span>
                          ) : (
                            <button onClick={() => { window.location.href = `/api/auth/blogger?channelId=${channel.id}&projectSlug=${id}`; }} className="rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20">
                              Connect Blogger
                            </button>
                          );
                        })()}
                        {channel.platformType === "reddit" && (() => {
                          const cfg = channel.config as Record<string, unknown>;
                          const isConnected = !!(cfg?.accessToken && cfg?.redditUsername);
                          return isConnected ? (
                            <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">u/{cfg.redditUsername as string}</span>
                          ) : (
                            <button onClick={() => handleRedditConnect(channel.id)} className="rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20">
                              Connect Reddit
                            </button>
                          );
                        })()}
                        {meta?.connectionType === "oauth" && channel.platformType !== "reddit" && channel.platformType !== "blogger" && (
                          <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">OAuth — Soon</span>
                        )}
                        <button onClick={() => handleDeleteChannel(channel.id)} disabled={deleting === channel.id} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">
                          {deleting === channel.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {availableAuto.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableAuto.map((p) => {
                  const meta = platformMeta[p];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <button key={p} onClick={() => handlePlatformClick(p)} disabled={adding !== null} className={`flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 ${meta.color}`}>
                      {adding === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                      <Plus className="h-3 w-3 text-muted" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Copy/Paste section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardCopy className="h-4 w-4 text-muted" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/70">Copy / Paste</h2>
              <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs text-muted">Manual</span>
            </div>
            <p className="text-xs text-muted">OctoBoost adapts the content for these platforms. You copy and paste it yourself.</p>

            {manualChannels.length > 0 && (
              <div className="space-y-2">
                {manualChannels.map((channel) => {
                  const meta = platformMeta[channel.platformType];
                  const Icon = meta?.icon ?? Radio;
                  return (
                    <div key={channel.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/20">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta?.bgColor ?? "bg-accent/10"}`}>
                        <Icon className={`h-5 w-5 ${meta?.color ?? "text-accent-light"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{channel.name}</p>
                        <p className="text-xs text-muted">{meta?.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs font-medium text-muted">Copy/Paste</span>
                        <button onClick={() => handleDeleteChannel(channel.id)} disabled={deleting === channel.id} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">
                          {deleting === channel.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {availableManual.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableManual.map((p) => {
                  const meta = platformMeta[p];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <button key={p} onClick={() => handleAddChannel(p)} disabled={adding !== null} className={`flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 ${meta.color}`}>
                      {adding === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                      <Plus className="h-3 w-3 text-muted" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════════ SCHEDULE TAB ════════ */}
      {tab === "schedule" && (
        <div className="space-y-6">
          <div className="flex items-center justify-end gap-3 text-sm">
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-3 py-1.5 text-blue-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{totalScheduled} scheduled</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-green-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{totalPublished} published</span>
            </div>
          </div>

          {/* Month nav */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3">
            <button onClick={() => setMonthOffset((m) => m - 1)} className="rounded-lg p-2 text-muted transition hover:bg-card-hover hover:text-foreground">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold capitalize">{monthLabel}</span>
              {monthOffset !== 0 && (
                <button onClick={() => setMonthOffset(0)} className="ml-2 rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent transition hover:bg-accent/20">
                  Today
                </button>
              )}
            </div>
            <button onClick={() => setMonthOffset((m) => m + 1)} className="rounded-lg p-2 text-muted transition hover:bg-card-hover hover:text-foreground">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Calendar heatmap */}
          <div className="relative rounded-xl border border-border bg-card p-6">
            <div className="mb-2 grid grid-cols-7 gap-2">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="text-center text-[11px] font-medium uppercase tracking-wider text-muted/60">{d}</div>
              ))}
            </div>
            <div className="space-y-2">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-2">
                  {week.map((day, di) => {
                    if (!day) return <div key={`empty-${di}`} className="aspect-square rounded-md" />;
                    const key = toDateKey(day);
                    const count = countByDay.get(key) ?? 0;
                    const today = isToday(day);
                    const isSelected = selectedDay === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedDay(isSelected ? null : key)}
                        className={`group relative aspect-square rounded-md transition-all ${getCellColor(count)} ${today ? "ring-2 ring-accent ring-offset-1 ring-offset-background" : ""} ${isSelected ? "ring-2 ring-white/50 ring-offset-1 ring-offset-background" : ""} ${count > 0 ? "cursor-pointer hover:scale-105 hover:brightness-125" : "cursor-default"}`}
                      >
                        <span className={`absolute inset-0 flex items-center justify-center text-xs ${count > 0 ? "font-medium text-white" : "text-muted/30"}`}>
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
            <div className="mt-4 flex items-center justify-end gap-1.5 text-[11px] text-muted/60">
              <span>Less</span>
              {[0, 1, 2, 3, 4].map((level) => (
                <div key={level} className={`h-3 w-3 rounded-sm ${getCellColor(level)}`} />
              ))}
              <span>More</span>
            </div>

            {/* Day popup */}
            {selectedDay && selectedDate && (
              <div ref={popupRef} className="absolute left-1/2 top-1/2 z-50 w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-border px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold">
                      {selectedDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                      {selectedVariants.length} publication{selectedVariants.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button onClick={() => setSelectedDay(null)} className="rounded-lg p-1 text-muted transition hover:bg-card-hover hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-4">
                  {selectedVariants.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted/60">No publications this day</p>
                  ) : (
                    <div className="space-y-3">
                      {selectedVariants.map((variant) => {
                        const platform = schedulePlatformMeta[variant.channels.platform_type];
                        const isManual = platform?.connectionType === "manual";
                        const isPublished = variant.status === "published";
                        return (
                          <div key={variant.id} className="rounded-xl border border-border bg-background/60 p-3.5 transition hover:border-border/80">
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm">{platform?.icon ?? "📄"}</span>
                              <span className="rounded-md px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: platform?.color ?? "#666" }}>
                                {platform?.label ?? variant.channels.platform_type}
                              </span>
                              {isPublished && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-green-400" />}
                              {!isPublished && !isManual && (
                                <div className="ml-auto flex items-center gap-1 text-[10px] text-blue-400">
                                  <Radio className="h-3 w-3" />Auto
                                </div>
                              )}
                            </div>
                            <p className="mb-1 text-sm font-medium leading-snug text-foreground/90">{variant.title}</p>
                            <p className="mb-3 text-xs text-muted/50">Article: {variant.articles.title}</p>
                            <div className="flex items-center gap-2">
                              {isPublished && variant.published_url ? (
                                <a href={variant.published_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition hover:bg-green-500/20">
                                  <ExternalLink className="h-3 w-3" />View
                                </a>
                              ) : isManual ? (
                                <button onClick={() => handleCopyVariant(variant)} className="flex items-center gap-1 rounded-lg bg-card-hover px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                  {copiedId === variant.id ? "Copied!" : "Copy content"}
                                </button>
                              ) : (
                                <span className="rounded-lg bg-blue-500/10 px-3 py-1.5 text-xs text-blue-400">Auto-publish scheduled</span>
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

          {variants.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted/30" />
              <p className="mt-3 text-sm text-muted">No variants scheduled</p>
              <p className="mt-1 text-xs text-muted/60">
                Generate variants from an article — they will be automatically scheduled here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Calendar helpers ───────────────────────────────────── */

function getMonthGrid(year: number, month: number): (Date | null)[][] {
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  let startDow = first.getDay();
  startDow = startDow === 0 ? 6 : startDow - 1;
  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= lastDay; d++) {
    currentWeek.push(new Date(year, month, d));
    if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
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
