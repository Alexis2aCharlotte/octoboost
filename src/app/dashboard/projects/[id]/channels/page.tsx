"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
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
} from "lucide-react";

interface Channel {
  id: string;
  projectId: string;
  platformType: string;
  name: string;
  config: Record<string, unknown>;
  constraints: Record<string, unknown>;
  createdAt: string;
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

const platformMeta: Record<string, PlatformInfo> = {
  devto: {
    label: "Dev.to",
    icon: Code2,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    connectionType: "api_key",
    description: "Developer community — dofollow backlinks, DA 85+",
    apiKeyUrl: "https://dev.to/settings/extensions",
  },
  hashnode: {
    label: "Hashnode",
    icon: Hash,
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/10",
    connectionType: "api_key",
    description: "Developer blogging — dofollow backlinks, DA 80+",
    apiKeyUrl: "https://hashnode.com/settings/developer",
  },
  medium: {
    label: "Medium",
    icon: BookOpen,
    color: "text-green-400",
    bgColor: "bg-green-500/10",
    connectionType: "oauth",
    description: "Large audience — dofollow backlinks, DA 95",
  },
  reddit: {
    label: "Reddit",
    icon: MessageSquare,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    connectionType: "oauth",
    description: "Communities — Google indexes posts, DA 99",
  },
  wordpress: {
    label: "WordPress",
    icon: Globe,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    connectionType: "api_key",
    description: "Your own blog — full control, SEO canonical",
  },
  telegraph: {
    label: "Telegraph",
    icon: FileText,
    color: "text-sky-400",
    bgColor: "bg-sky-500/10",
    connectionType: "api_key",
    description: "Instant publishing — dofollow, DA 83, gratuit",
    apiKeyUrl: "https://api.telegra.ph/createAccount?short_name=OctoBoost&author_name=YourName",
  },
  indiehackers: {
    label: "Indie Hackers",
    icon: Flame,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    connectionType: "manual",
    description: "SaaS community — 23% conversion rate",
  },
  hackernews: {
    label: "Hacker News",
    icon: Code2,
    color: "text-orange-300",
    bgColor: "bg-orange-500/10",
    connectionType: "manual",
    description: "Tech audience — traffic spikes, DA 90+",
  },
  quora: {
    label: "Quora",
    icon: HelpCircle,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    connectionType: "manual",
    description: "Q&A — featured snippets in Google, DA 93",
  },
  substack: {
    label: "Substack",
    icon: Mail,
    color: "text-orange-400",
    bgColor: "bg-orange-500/10",
    connectionType: "manual",
    description: "Newsletter — loyal audience, cross-posting",
  },
  blogger: {
    label: "Blogger",
    icon: BookOpen,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    connectionType: "oauth",
    description: "Google Blogspot — DA 89, gratuit",
  },
};

const autoPublishPlatforms = ["devto", "hashnode", "medium", "reddit", "wordpress", "telegraph", "blogger"];
const manualPlatforms = ["indiehackers", "hackernews", "quora", "substack"];

export default function ProjectChannelsPage() {
  const { id } = useParams<{ id: string }>();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [realProjectId, setRealProjectId] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [apiKeyInput, setApiKeyInput] = useState<{ platform: string; value: string; publicationHost?: string } | null>(null);
  const [bloggerBlogUrl, setBloggerBlogUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const projRes = await fetch(`/api/projects/${id}`);
      if (!projRes.ok) return;
      const projData = await projRes.json();
      setRealProjectId(projData.projectId);

      const chRes = await fetch(`/api/channels?projectId=${projData.projectId}`);
      if (chRes.ok) {
        const chData = await chRes.json();
        setChannels(chData.channels ?? []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleAdd(platformType: string, apiKey?: string, publicationHost?: string) {
    if (!realProjectId || adding) return;
    setAdding(platformType);

    const meta = platformMeta[platformType];
    try {
      const config: Record<string, string> = apiKey ? { apiKey } : {};
      if (platformType === "hashnode" && publicationHost) {
        config.publicationHost = publicationHost.trim();
      }
      const res = await fetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: realProjectId,
          platformType,
          name: meta?.label ?? platformType,
          config,
        }),
      });

      if (res.ok) {
        await loadData();
        setApiKeyInput(null);
      } else {
        const err = await res.json();
        alert(err.error ?? "Erreur");
      }
    } finally {
      setAdding(null);
    }
  }

  async function handleDelete(channelId: string) {
    if (!confirm("Remove this channel?")) return;
    setDeleting(channelId);

    try {
      const res = await fetch(`/api/channels/${channelId}`, { method: "DELETE" });
      if (res.ok) {
        setChannels((prev) => prev.filter((c) => c.id !== channelId));
      }
    } finally {
      setDeleting(null);
    }
  }

  function handleRedditConnect(channelId: string) {
    window.location.href = `/api/auth/reddit?channelId=${channelId}&projectSlug=${id}`;
  }

  function handlePlatformClick(platformType: string) {
    const meta = platformMeta[platformType];
    if (!meta) return;

    if (meta.connectionType === "api_key") {
      setApiKeyInput({ platform: platformType, value: "" });
    } else if (platformType === "blogger") {
      setBloggerBlogUrl("");
    } else if (platformType === "reddit") {
      handleAdd(platformType);
    } else {
      handleAdd(platformType);
    }
  }

  function handleBloggerConnect() {
    if (!realProjectId || !bloggerBlogUrl?.trim()) return;
    setAdding("blogger");
    const meta = platformMeta.blogger;
    fetch("/api/channels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: realProjectId,
        platformType: "blogger",
        name: meta?.label ?? "Blogger",
        config: { blogUrl: bloggerBlogUrl.trim() },
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.id) {
          window.location.href = `/api/auth/blogger?channelId=${data.id}&projectSlug=${id}`;
        } else {
          alert(data.error ?? "Erreur");
          setAdding(null);
        }
      })
      .catch(() => setAdding(null));
  }

  const usedPlatforms = new Set(channels.map((c) => c.platformType));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  const autoChannels = channels.filter((c) => autoPublishPlatforms.includes(c.platformType));
  const manualChannels = channels.filter((c) => manualPlatforms.includes(c.platformType));
  const availableAuto = autoPublishPlatforms.filter((p) => !usedPlatforms.has(p));
  const availableManual = manualPlatforms.filter((p) => !usedPlatforms.has(p));

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Channels
        </h1>
        <p className="mt-1 text-sm text-muted">
          {channels.length} connected · {autoChannels.length} auto-publish · {manualChannels.length} copy/paste
        </p>
      </div>

      {/* Blogger Blog URL Modal */}
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
            <button onClick={() => setBloggerBlogUrl(null)} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <input
              type="text"
              placeholder="nicheshunter.blogspot.com"
              value={bloggerBlogUrl}
              onChange={(e) => setBloggerBlogUrl(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleBloggerConnect}
              disabled={!bloggerBlogUrl?.trim() || adding !== null}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
            >
              {adding === "blogger" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Connect Google
            </button>
          </div>
        </div>
      )}

      {/* API Key Input Modal */}
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
            <button onClick={() => setApiKeyInput(null)} className="text-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="password"
                  placeholder="Paste your API key..."
                  value={apiKeyInput.value}
                  onChange={(e) => setApiKeyInput({ ...apiKeyInput, value: e.target.value })}
                  className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
                  autoFocus
                />
              </div>
              <button
                onClick={() =>
                  handleAdd(
                    apiKeyInput.platform,
                    apiKeyInput.value,
                    apiKeyInput.platform === "hashnode" ? apiKeyInput.publicationHost : undefined
                  )
                }
                disabled={!apiKeyInput.value.trim() || adding !== null || (apiKeyInput.platform === "hashnode" && !apiKeyInput.publicationHost?.trim())}
                className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
              >
                {adding === apiKeyInput.platform ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Connect
              </button>
            </div>
            {apiKeyInput.platform === "hashnode" && (
              <div>
                <label className="mb-1 block text-xs text-muted">Blog URL (publication host)</label>
                <input
                  type="text"
                  placeholder="niches-hunter.hashnode.dev"
                  value={apiKeyInput.publicationHost ?? ""}
                  onChange={(e) =>
                    setApiKeyInput({ ...apiKeyInput, publicationHost: e.target.value })
                  }
                  className="w-full rounded-lg border border-border bg-card py-2.5 px-4 text-sm text-foreground placeholder:text-muted/50 focus:border-accent/50 focus:outline-none"
                />
              </div>
            )}
          </div>
          {platformMeta[apiKeyInput.platform]?.apiKeyUrl && (
            <a
              href={platformMeta[apiKeyInput.platform].apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs text-accent-light hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
              Get your API key from {platformMeta[apiKeyInput.platform]?.label}
            </a>
          )}
        </div>
      )}

      {/* ─── Auto-publish Section ────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-accent-light" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-accent-light">
            Auto-publish
          </h2>
          <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs text-accent-light">
            API
          </span>
        </div>
        <p className="text-xs text-muted">
          OctoBoost publishes directly to these platforms. One click, zero copy/paste.
        </p>

        {autoChannels.length > 0 && (
          <div className="space-y-2">
            {autoChannels.map((channel) => {
              const meta = platformMeta[channel.platformType];
              const Icon = meta?.icon ?? Radio;
              const hasApiKey = !!(channel.config as Record<string, unknown>)?.apiKey;
              return (
                <div
                  key={channel.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/20"
                >
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
                          {ready ? (channel.platformType === "hashnode" ? "OK" : "API Key") : hasApiKey && !hasPub ? "No blog" : "No Key"}
                        </span>
                      );
                    })()}
                    {channel.platformType === "blogger" && (() => {
                      const cfg = channel.config as Record<string, unknown>;
                      const isConnected = !!cfg?.refreshToken;
                      return isConnected ? (
                        <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                          Connecté
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            window.location.href = `/api/auth/blogger?channelId=${channel.id}&projectSlug=${id}`;
                          }}
                          className="rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20"
                        >
                          Connecter Blogger
                        </button>
                      );
                    })()}
                    {channel.platformType === "reddit" && (() => {
                      const cfg = channel.config as Record<string, unknown>;
                      const isConnected = !!(cfg?.accessToken && cfg?.redditUsername);
                      return isConnected ? (
                        <span className="rounded-md bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
                          u/{cfg.redditUsername as string}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRedditConnect(channel.id)}
                          className="rounded-md bg-orange-500/10 px-2.5 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20"
                        >
                          Connecter Reddit
                        </button>
                      );
                    })()}
                    {meta?.connectionType === "oauth" && channel.platformType !== "reddit" && (
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                        OAuth — Soon
                      </span>
                    )}
                    <button
                      onClick={() => handleDelete(channel.id)}
                      disabled={deleting === channel.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    >
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
                <button
                  key={p}
                  onClick={() => handlePlatformClick(p)}
                  disabled={adding !== null}
                  className={`flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 ${meta.color}`}
                >
                  {adding === p ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                  <Plus className="h-3 w-3 text-muted" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── Copy/Paste Section ──────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardCopy className="h-4 w-4 text-muted" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted/70">
            Copy / Paste
          </h2>
          <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs text-muted">
            Manual
          </span>
        </div>
        <p className="text-xs text-muted">
          OctoBoost adapts the content for these platforms. You copy and paste it yourself.
        </p>

        {manualChannels.length > 0 && (
          <div className="space-y-2">
            {manualChannels.map((channel) => {
              const meta = platformMeta[channel.platformType];
              const Icon = meta?.icon ?? Radio;
              return (
                <div
                  key={channel.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition hover:border-accent/20"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${meta?.bgColor ?? "bg-accent/10"}`}>
                    <Icon className={`h-5 w-5 ${meta?.color ?? "text-accent-light"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{channel.name}</p>
                    <p className="text-xs text-muted">{meta?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs font-medium text-muted">
                      Copy/Paste
                    </span>
                    <button
                      onClick={() => handleDelete(channel.id)}
                      disabled={deleting === channel.id}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted transition hover:border-red-500/50 hover:text-red-400 disabled:opacity-50"
                    >
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
                <button
                  key={p}
                  onClick={() => handleAdd(p)}
                  disabled={adding !== null}
                  className={`flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm transition hover:border-accent/50 hover:bg-accent/5 disabled:opacity-50 ${meta.color}`}
                >
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
  );
}
