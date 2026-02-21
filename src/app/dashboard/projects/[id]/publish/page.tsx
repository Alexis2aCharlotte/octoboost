"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { useConfirm } from "@/components/ConfirmDialog";
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
  Copy,
  Clock,
  CheckCircle2,
  RefreshCw,
  GitBranch,
  FolderOpen,
  ChevronDown,
} from "lucide-react";
import {
  generateSnippetFetchUtil,
  generateSnippetUsageExample,
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
  profilePlaceholder?: string;
}

/* ─── Platform metadata ──────────────────────────────────── */

const platformMeta: Record<string, PlatformInfo> = {
  devto: { label: "Dev.to", icon: Code2, color: "text-blue-400", bgColor: "bg-blue-500/10", connectionType: "api_key", description: "Developer community — dofollow backlinks, DA 85+", apiKeyUrl: "https://dev.to/settings/extensions" },
  hashnode: { label: "Hashnode", icon: Hash, color: "text-indigo-400", bgColor: "bg-indigo-500/10", connectionType: "api_key", description: "Developer blogging — dofollow backlinks, DA 80+", apiKeyUrl: "https://hashnode.com/settings/developer" },
  medium: { label: "Medium", icon: BookOpen, color: "text-green-400", bgColor: "bg-green-500/10", connectionType: "manual", description: "Large audience — dofollow backlinks, DA 95", profilePlaceholder: "https://medium.com/@yourprofile" },
  reddit: { label: "Reddit", icon: MessageSquare, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "manual", description: "Communities — Google indexes posts, DA 99", profilePlaceholder: "https://reddit.com/user/yourprofile" },
  wordpress: { label: "WordPress", icon: Globe, color: "text-cyan-400", bgColor: "bg-cyan-500/10", connectionType: "api_key", description: "Your own blog — full control, SEO canonical", apiKeyUrl: "https://developer.wordpress.org/advanced-administration/security/application-passwords/" },
  telegraph: { label: "Telegraph", icon: FileText, color: "text-sky-400", bgColor: "bg-sky-500/10", connectionType: "api_key", description: "Instant publishing — dofollow, DA 83", apiKeyUrl: "https://api.telegra.ph/createAccount?short_name=OctoBoost&author_name=YourName" },
  indiehackers: { label: "Indie Hackers", icon: Flame, color: "text-amber-400", bgColor: "bg-amber-500/10", connectionType: "manual", description: "SaaS community — 23% conversion rate", profilePlaceholder: "https://indiehackers.com/yourprofile" },
  hackernews: { label: "Hacker News", icon: Code2, color: "text-orange-300", bgColor: "bg-orange-500/10", connectionType: "manual", description: "Tech audience — traffic spikes, DA 90+", profilePlaceholder: "https://news.ycombinator.com/user?id=yourprofile" },
  quora: { label: "Quora", icon: HelpCircle, color: "text-red-400", bgColor: "bg-red-500/10", connectionType: "manual", description: "Q&A — featured snippets in Google, DA 93", profilePlaceholder: "https://quora.com/profile/yourprofile" },
  substack: { label: "Substack", icon: Mail, color: "text-orange-400", bgColor: "bg-orange-500/10", connectionType: "manual", description: "Newsletter — loyal audience, cross-posting", profilePlaceholder: "https://yourprofile.substack.com" },
  blogger: { label: "Blogger", icon: BookOpen, color: "text-orange-500", bgColor: "bg-orange-500/10", connectionType: "oauth", description: "Google Blogspot — DA 89, gratuit" },
};

const schedulePlatformMeta: Record<string, { label: string; color: string; icon: string; connectionType: string }> = {
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

const autoPublishPlatforms = ["devto", "hashnode", "wordpress", "telegraph", "blogger"];
const manualPlatforms = ["medium", "reddit", "indiehackers", "hackernews", "quora", "substack"];

/* ─── Main page ──────────────────────────────────────────── */

export default function PublishPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { confirm } = useConfirm();
  const [tab, setTab] = useState<PublishTab | null>(null);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Site connection state
  const [connection, setConnection] = useState<SiteConnection | null>(null);
  
  const [snippetTab, setSnippetTab] = useState<"util" | "usage">("util");
  const [showSecret, setShowSecret] = useState(false);
  const [showIntegration, setShowIntegration] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // API key state
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [apiKeyLoading, setApiKeyLoading] = useState(false);
  const [copiedApiKey, setCopiedApiKey] = useState(false);

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
  const [profileUrlInput, setProfileUrlInput] = useState<{ platform: string; value: string } | null>(null);
  const [wpInput, setWpInput] = useState<{ siteUrl: string; username: string; appPassword: string } | null>(null);

  // Schedule state
  const [variants, setVariants] = useState<ScheduledVariant[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) return;
      const projData = await projRes.json();
      setRealProjectId(projData.projectId);

      const [connRes, chRes, schedRes, keyRes] = await Promise.all([
        fetch(`/api/site-connection?projectId=${projData.projectId}`),
        fetch(`/api/channels?projectId=${projData.projectId}`),
        fetch(`/api/schedule?projectId=${projData.projectId}`),
        fetch(`/api/projects/${projData.projectId}/api-key`),
      ]);

      let conn: SiteConnection | null = null;
      let key: string | null = null;

      if (connRes.ok) {
        const connData = await connRes.json();
        conn = connData.connection ?? null;
        setConnection(conn);
      }
      if (keyRes.ok) {
        const keyData = await keyRes.json();
        key = keyData.apiKey ?? null;
        setApiKey(key);
      }
      if (chRes.ok) {
        const chData = await chRes.json();
        setChannels(chData.channels ?? []);
      }
      if (schedRes.ok) {
        const schedData = await schedRes.json();
        setVariants(schedData.variants ?? []);
      }

      setTab((prev) => prev ?? ((conn?.status === "connected" || key) ? "schedule" : "site"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);


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

  async function handleDisconnect() {
    if (!realProjectId || !(await confirm({ message: "Disconnect your site?", destructive: true }))) return;
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

  function copyToClipboard(text: string, type: "snippet" | "secret" | "apikey") {
    navigator.clipboard.writeText(text);
    if (type === "snippet") { setCopiedSnippet(true); setTimeout(() => setCopiedSnippet(false), 2000); }
    else if (type === "apikey") { setCopiedApiKey(true); setTimeout(() => setCopiedApiKey(false), 2000); }
    else { setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }
  }

  async function handleRegenerateApiKey() {
    if (!realProjectId || !(await confirm({ message: "Regenerate API key? The old key will stop working.", destructive: true }))) return;
    setApiKeyLoading(true);
    try {
      const res = await fetch(`/api/projects/${realProjectId}/api-key`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setApiKey(data.apiKey);
      }
    } finally {
      setApiKeyLoading(false);
    }
  }

  /* ── Channel handlers ── */

  async function handleAddChannel(platformType: string, opts?: { apiKey?: string; publicationHost?: string; profileUrl?: string }) {
    if (!realProjectId || adding) return;
    setAdding(platformType);
    const meta = platformMeta[platformType];
    try {
      const config: Record<string, string> = {};
      if (opts?.apiKey) config.apiKey = opts.apiKey;
      if (platformType === "hashnode" && opts?.publicationHost) config.publicationHost = opts.publicationHost.trim();
      if (opts?.profileUrl) config.profileUrl = opts.profileUrl.trim();
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: realProjectId, platformType, name: meta?.label ?? platformType, config }),
      });
      if (res.ok) { await loadData(); setApiKeyInput(null); setProfileUrlInput(null); }
      else { const err = await res.json(); toast(err.error ?? "Error"); }
    } finally { setAdding(null); }
  }

  async function handleDeleteChannel(channelId: string) {
    if (!(await confirm({ message: "Remove this channel?", destructive: true }))) return;
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
    if (platformType === "wordpress") setWpInput({ siteUrl: "", username: "", appPassword: "" });
    else if (meta.connectionType === "api_key") setApiKeyInput({ platform: platformType, value: "" });
    else if (platformType === "blogger") setBloggerBlogUrl("");
    else if (meta.connectionType === "manual") setProfileUrlInput({ platform: platformType, value: "" });
    else handleAddChannel(platformType);
  }

  async function handleWordPressConnect() {
    if (!realProjectId || !wpInput || !wpInput.siteUrl.trim() || !wpInput.username.trim() || !wpInput.appPassword.trim()) return;
    setAdding("wordpress");
    try {
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: realProjectId,
          platformType: "wordpress",
          name: "WordPress",
          config: {
            siteUrl: wpInput.siteUrl.trim().replace(/\/+$/, ""),
            username: wpInput.username.trim(),
            apiKey: wpInput.appPassword.trim(),
          },
        }),
      });
      if (res.ok) {
        await loadData();
        setWpInput(null);
      } else {
        const err = await res.json();
        toast(err.error ?? "Error");
      }
    } finally {
      setAdding(null);
    }
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
        else { toast(data.error ?? "Error"); setAdding(null); }
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

  const variantsByDay = new Map<string, ScheduledVariant[]>();
  for (const v of variants) {
    if (!v.scheduled_at) continue;
    const key = v.scheduled_at.slice(0, 10);
    const arr = variantsByDay.get(key) ?? [];
    arr.push(v);
    variantsByDay.set(key, arr);
  }
  const sortedDays = [...variantsByDay.keys()].sort();
  const totalScheduled = variants.filter((v) => v.status === "scheduled").length;
  const totalPublished = variants.filter((v) => v.status === "published").length;

  const snippet = snippetTab === "util"
    ? generateSnippetFetchUtil(apiKey ?? "YOUR_API_KEY")
    : generateSnippetUsageExample(apiKey ?? "YOUR_API_KEY");

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
        <h1 className="text-3xl font-bold tracking-tight">Publish</h1>
        <p className="mt-1 text-base text-muted">
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
            onClick={() => setTab(tabId as PublishTab)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm transition-colors ${
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
      {tab !== null && tab === "site" && (
        <div className="space-y-6">

          {/* ── Connected status banner ── */}
          {apiKey && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-green-400">Site connected</p>
                    <p className="text-sm text-muted">Your API key is active. Published articles are available on your site.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="rounded-lg border border-border bg-[#0d1117] px-3 py-1.5 text-xs text-green-400/80 font-mono">
                    {apiKey.slice(0, 8)}{"•".repeat(16)}
                  </code>
                  <button onClick={() => copyToClipboard(apiKey, "apikey")} className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition hover:text-foreground">
                    {copiedApiKey ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              {/* Compact endpoints */}
              <div className="mt-4 flex flex-wrap gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-[#0d1117] px-3 py-1.5 text-xs">
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-blue-400">GET</span>
                  <code className="text-muted">/api/public/articles</code>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-[#0d1117] px-3 py-1.5 text-xs">
                  <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-blue-400">GET</span>
                  <code className="text-muted">/api/public/articles/[slug]</code>
                </div>
              </div>
            </div>
          )}

          {/* ── Setup section (expanded if no key, accordion if connected) ── */}
          <div className="rounded-xl border border-border bg-card">
            {apiKey ? (
              <button
                onClick={() => setShowIntegration(!showIntegration)}
                className="flex w-full items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-3">
                  <Code2 className="h-4 w-4 text-muted" />
                  <div>
                    <span className="text-sm font-medium text-muted">Integration details</span>
                    <p className="text-xs text-muted/60">API key, code snippets, and setup instructions</p>
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted transition ${showIntegration ? "rotate-180" : ""}`} />
              </button>
            ) : (
              <div className="p-6 pb-0">
                <h2 className="text-xl font-semibold">Integrate OctoBoost on your site</h2>
                <p className="mt-2 text-base text-muted leading-relaxed">
                  Use your API key to fetch published articles directly from OctoBoost.
                  Copy the snippets below into your project.
                </p>
              </div>
            )}

            {(!apiKey || showIntegration) && (
              <div className={`space-y-5 ${apiKey ? "border-t border-border p-5" : "p-6 pt-5"}`}>
                {/* API Key display */}
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-sm font-medium">
                    <Key className="h-4 w-4 text-accent-light" />
                    API Key
                  </label>
                  {apiKey ? (
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg border border-border bg-[#0d1117] px-4 py-2.5 text-sm text-green-400/90 font-mono">
                        {apiKey}
                      </code>
                      <button onClick={() => copyToClipboard(apiKey, "apikey")} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs text-muted transition hover:text-foreground">
                        {copiedApiKey ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copiedApiKey ? "Copied!" : "Copy"}
                      </button>
                      <button onClick={handleRegenerateApiKey} disabled={apiKeyLoading} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-xs text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50">
                        {apiKeyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2 text-xs text-muted">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading API key...
                    </div>
                  )}
                </div>

                {/* API Endpoints */}
                <div className="rounded-lg border border-border bg-[#0d1117] p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted/70 uppercase tracking-wider">Endpoints</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-blue-400">GET</span>
                      <code className="text-green-400/80">https://octoboost.app/api/public/articles?key=YOUR_KEY</code>
                    </div>
                    <p className="pl-11 text-xs text-muted/50">Returns all published articles (title, slug, metaDescription, tags)</p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded bg-blue-500/20 px-1.5 py-0.5 font-mono text-blue-400">GET</span>
                      <code className="text-green-400/80">https://octoboost.app/api/public/articles/[slug]?key=YOUR_KEY</code>
                    </div>
                    <p className="pl-11 text-xs text-muted/50">Returns a single article with full markdown content</p>
                  </div>
                </div>

                {/* Snippet tabs */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Code2 className="h-4 w-4 text-accent-light" />
                    <span className="text-sm font-medium">Integration snippets</span>
                    <div className="ml-auto flex gap-1">
                      {([
                        { id: "util" as const, label: "lib/octoboost.ts" },
                        { id: "usage" as const, label: "Usage example" },
                      ]).map(({ id: tabId, label }) => (
                        <button
                          key={tabId}
                          onClick={() => setSnippetTab(tabId)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                            snippetTab === tabId ? "bg-accent/15 text-accent-light" : "text-muted hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="relative">
                    <pre className="max-h-[350px] overflow-auto rounded-lg border border-border bg-[#0d1117] p-4 text-xs leading-relaxed text-green-400/90">
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
                </div>

                {/* How it works */}
                <div className="rounded-lg border border-border bg-white/[0.02] p-4">
                  <p className="mb-3 text-xs font-semibold text-muted/70 uppercase tracking-wider">How it works</p>
                  <div className="space-y-2 text-xs text-muted leading-relaxed">
                    <div className="flex items-start gap-2">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">1</span>
                      Copy <code className="rounded bg-white/[0.06] px-1 py-0.5">lib/octoboost.ts</code> into your project
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">2</span>
                      Import and merge OctoBoost articles with your existing blog posts
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-[10px] font-bold text-accent-light">3</span>
                      Click &quot;Publish&quot; on OctoBoost and articles appear on your site
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── GitHub Push — accordion (advanced) ── */}
          <div className="rounded-xl border border-border bg-card">
            <button
              onClick={() => setShowCustomApi(!showCustomApi)}
              className="flex w-full items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <GitBranch className="h-4 w-4 text-muted" />
                <div>
                  <span className="text-sm font-medium text-muted">Advanced: Push to GitHub</span>
                  <p className="text-xs text-muted/60">For static sites (Astro, Hugo, Jekyll) — commits Markdown files to your repo</p>
                </div>
              </div>
              <ChevronDown className={`h-4 w-4 text-muted transition ${showCustomApi ? "rotate-180" : ""}`} />
            </button>

            {showCustomApi && (
              <div className="border-t border-border p-5 space-y-5">
                {connection?.type === "github" && connection.status === "connected" ? (
                  <div className="flex items-center justify-between rounded-lg border border-green-500/30 bg-green-500/5 p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                      <div>
                        <p className="text-sm font-medium text-green-400">GitHub connected</p>
                        <p className="text-xs text-muted">{connection.repo_owner}/{connection.repo_name} · /{connection.content_dir || "root"} · .{connection.file_format}</p>
                      </div>
                    </div>
                    <button onClick={handleDisconnect} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-red-500/50 hover:text-red-400">
                      <X className="h-3 w-3" /> Disconnect
                    </button>
                  </div>
                ) : connection?.type === "github" && !connection.repo_name ? (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted">GitHub connected — pick your repository:</p>
                      <button onClick={handleDisconnect} className="flex items-center gap-1.5 text-xs text-muted hover:text-red-400"><X className="h-3 w-3" /> Disconnect</button>
                    </div>
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium"><FolderOpen className="h-4 w-4 text-accent-light" /> Repository</label>
                      {ghLoadingRepos ? (
                        <div className="flex items-center gap-2 py-3 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading repos...</div>
                      ) : (
                        <div className="relative">
                          <select value={ghSelectedRepo} onChange={(e) => handleSelectRepo(e.target.value)} className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:outline-none">
                            <option value="">Select a repository...</option>
                            {ghRepos.map((r) => (<option key={r.id} value={r.full_name}>{r.full_name} {r.private ? "(private)" : ""}</option>))}
                          </select>
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        </div>
                      )}
                    </div>
                    {ghSelectedRepo && (
                      <>
                        <div>
                          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium"><FolderOpen className="h-4 w-4 text-accent-light" /> Blog folder</label>
                          {ghLoadingDirs ? (
                            <div className="flex items-center gap-2 py-3 text-xs text-muted"><Loader2 className="h-4 w-4 animate-spin" /> Loading folders...</div>
                          ) : (() => {
                            const suggested = ghDirs.filter((d) => d.suggested);
                            const others = ghDirs.filter((d) => !d.suggested);
                            return (
                              <div className="relative">
                                <select value={ghSelectedDir} onChange={(e) => setGhSelectedDir(e.target.value)} className="w-full appearance-none rounded-lg border border-border bg-background px-4 py-2.5 pr-10 text-sm focus:border-accent/50 focus:outline-none">
                                  <option value="">/ (root)</option>
                                  {suggested.length > 0 && (<optgroup label="Suggested">{suggested.map((d) => (<option key={d.path} value={d.path}>{d.path}</option>))}</optgroup>)}
                                  {others.length > 0 && (<optgroup label={suggested.length > 0 ? "Other" : "All"}>{others.map((d) => (<option key={d.path} value={d.path}>{d.path}</option>))}</optgroup>)}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                              </div>
                            );
                          })()}
                        </div>
                        <div>
                          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-accent-light" /> File format</label>
                          <div className="flex gap-2">
                            {(["mdx", "md"] as const).map((fmt) => (
                              <button key={fmt} onClick={() => setGhFileFormat(fmt)} className={`rounded-lg px-4 py-2 text-xs font-medium transition ${ghFileFormat === fmt ? "bg-accent/15 text-accent-light ring-1 ring-accent/30" : "bg-white/[0.04] text-muted hover:text-foreground"}`}>
                                .{fmt} {fmt === "mdx" ? "(MDX)" : "(Markdown)"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={handleSaveGitHubConfig} disabled={ghSaving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50">
                          {ghSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          {ghSaving ? "Connecting..." : "Connect & Test"}
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted leading-relaxed">
                      Connect your GitHub to push articles as Markdown/MDX files directly to your repository. Best for static sites that auto-deploy on push.
                    </p>
                    <button onClick={handleConnectGitHub} className="flex w-full items-center justify-center gap-2 rounded-lg bg-foreground px-5 py-3 text-sm font-medium text-background transition hover:opacity-90">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                      Connect GitHub
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

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
                <input type="text" placeholder="yourURL.example.com" value={bloggerBlogUrl} onChange={(e) => setBloggerBlogUrl(e.target.value)} className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" autoFocus />
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
                    onClick={() => handleAddChannel(apiKeyInput.platform, { apiKey: apiKeyInput.value, publicationHost: apiKeyInput.platform === "hashnode" ? apiKeyInput.publicationHost : undefined })}
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
                    <input type="text" placeholder="yourURL.hashnode.dev" value={apiKeyInput.publicationHost ?? ""} onChange={(e) => setApiKeyInput({ ...apiKeyInput, publicationHost: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" />
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

          {/* Profile URL input for manual platforms */}
          {profileUrlInput && (
            <div className="rounded-xl border border-accent/30 bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                {(() => { const Icon = platformMeta[profileUrlInput.platform]?.icon ?? Radio; return <Icon className={`h-5 w-5 ${platformMeta[profileUrlInput.platform]?.color ?? ""}`} />; })()}
                <span className="text-sm font-semibold">{platformMeta[profileUrlInput.platform]?.label}</span>
                <button onClick={() => setProfileUrlInput(null)} className="ml-auto rounded-lg p-1 text-muted transition hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="mb-3 text-xs text-muted">Paste your profile URL so you can access it directly from OctoBoost.</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
                  <input
                    type="url"
                    placeholder={platformMeta[profileUrlInput.platform]?.profilePlaceholder ?? "https://..."}
                    value={profileUrlInput.value}
                    onChange={(e) => setProfileUrlInput({ ...profileUrlInput, value: e.target.value })}
                    className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
                    autoFocus
                  />
                </div>
                <button
                  onClick={() => handleAddChannel(profileUrlInput.platform, { profileUrl: profileUrlInput.value })}
                  disabled={adding !== null}
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
                >
                  {adding === profileUrlInput.platform ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Add
                </button>
              </div>
            </div>
          )}

          {/* WordPress config input */}
          {wpInput && (
            <div className="rounded-xl border border-accent/30 bg-card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Globe className={`h-5 w-5 ${platformMeta.wordpress?.color ?? ""}`} />
                <span className="text-sm font-semibold">WordPress</span>
                <button onClick={() => setWpInput(null)} className="ml-auto rounded-lg p-1 text-muted transition hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs text-muted">Site URL</label>
                  <input type="url" placeholder="https://yourblog.com" value={wpInput.siteUrl} onChange={(e) => setWpInput({ ...wpInput, siteUrl: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" autoFocus />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Username</label>
                  <input type="text" placeholder="admin" value={wpInput.username} onChange={(e) => setWpInput({ ...wpInput, username: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" />
                </div>
                <div>
                  <label className="mb-1 block text-xs text-muted">Application Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted/50" />
                    <input type="password" placeholder="xxxx xxxx xxxx xxxx xxxx xxxx" value={wpInput.appPassword} onChange={(e) => setWpInput({ ...wpInput, appPassword: e.target.value })} className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={handleWordPressConnect} disabled={!wpInput.siteUrl.trim() || !wpInput.username.trim() || !wpInput.appPassword.trim() || adding !== null} className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50">
                    {adding === "wordpress" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Connect
                  </button>
                  <a href="https://developer.wordpress.org/advanced-administration/security/application-passwords/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-accent-light hover:underline">
                    <ExternalLink className="h-3 w-3" />
                    How to get an Application Password
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Auto-publish section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent-light" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-light">Auto-publish</h2>
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent-light">API</span>
            </div>
            <p className="text-sm text-muted">OctoBoost publishes directly to these platforms. One click, zero copy/paste.</p>

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
                        <p className="text-sm text-muted">{meta?.description}</p>
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
            <p className="text-sm text-muted">OctoBoost adapts the content for these platforms. You copy and paste it yourself.</p>

            {manualChannels.length > 0 && (
              <div className="space-y-2">
                {manualChannels.map((channel) => {
                  const meta = platformMeta[channel.platformType];
                  const Icon = meta?.icon ?? Radio;
                  const cfg = channel.config as Record<string, unknown>;
                  const profileUrl = cfg?.profileUrl as string | undefined;
                  return (
                    <div key={channel.id} className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/20">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta?.bgColor ?? "bg-accent/10"}`}>
                        <Icon className={`h-5 w-5 ${meta?.color ?? "text-accent-light"}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{channel.name}</p>
                        <p className="text-sm text-muted">{meta?.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {profileUrl ? (
                          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent-light transition hover:bg-accent/20">
                            <ExternalLink className="h-3 w-3" />
                            Open profile
                          </a>
                        ) : (
                          <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs font-medium text-muted">Copy/Paste</span>
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

            {availableManual.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {availableManual.map((p) => {
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

          {/* Timeline */}
          {variants.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <Calendar className="mx-auto h-10 w-10 text-muted/30" />
              <p className="mt-3 text-sm text-muted">No variants scheduled</p>
              <p className="mt-1 text-xs text-muted/60">
                Generate variants from an article — they will be automatically scheduled here.
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {sortedDays.map((dayKey) => {
                const dayVariants = variantsByDay.get(dayKey) ?? [];
                return (
                  <div key={dayKey}>
                    <div className="flex items-center gap-3 py-3">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/15">
                        <div className="h-2 w-2 rounded-full bg-accent" />
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {timelineLabel(dayKey)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                      <span className="rounded-md bg-card-hover px-2 py-0.5 text-[10px] font-medium text-muted">
                        {dayVariants.length}
                      </span>
                    </div>
                    <div className="ml-2.5 border-l border-border pb-2 pl-5">
                      <div className="space-y-2">
                        {dayVariants.map((variant) => {
                          const platform = schedulePlatformMeta[variant.channels.platform_type];
                          const isManual = platform?.connectionType === "manual";
                          const isPublished = variant.status === "published";
                          const time = new Date(variant.scheduled_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
                          return (
                            <div key={variant.id} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition hover:border-accent/20">
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
                                <button onClick={() => handleCopyVariant(variant)} className="flex items-center gap-1 rounded-md bg-card-hover px-2 py-1 text-[11px] font-medium text-muted transition hover:text-foreground">
                                  <Copy className="h-3 w-3" />
                                  {copiedId === variant.id ? "Copied!" : "Copy"}
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-1 text-[11px] font-medium text-blue-400">
                                  <Radio className="h-3 w-3" />Auto
                                </span>
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
        </div>
      )}
    </div>
  );
}

/* ─── Timeline helpers ────────────────────────────────────── */

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
