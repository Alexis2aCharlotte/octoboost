"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useDemo } from "@/lib/demo/context";
import Link from "next/link";
import {
  Loader2,
  Target,
  FileText,
  Send,
  Globe,
  BarChart3,
  CheckCircle2,
  Circle,
  ArrowRight,
  ExternalLink,
  Search,
  Layers,
  Megaphone,
  Plug,
  ChevronDown,
} from "lucide-react";

interface OverviewData {
  project: {
    id: string;
    slug: string;
    name: string;
    url: string;
    createdAt: string;
  };
  stats: {
    keywords: number;
    clusters: number;
    articles: number;
    articlesPublished: number;
    channels: number;
    variantsPublished: number;
    variantsTotal: number;
  };
  pipeline: {
    siteConnected: boolean;
    analysisComplete: boolean;
    keywordsFound: boolean;
    articlesGenerated: boolean;
    channelsConfigured: boolean;
    published: boolean;
  };
  recentArticles: {
    id: string;
    title: string;
    status: string;
    wordCount: number;
    createdAt: string;
  }[];
  recentPublished: {
    id: string;
    title: string;
    publishedUrl: string | null;
    publishedAt: string | null;
    platform: string;
  }[];
}

const platformLabels: Record<string, string> = {
  devto: "Dev.to",
  hashnode: "Hashnode",
  medium: "Medium",
  reddit: "Reddit",
  wordpress: "WordPress",
  telegraph: "Telegraph",
  blogger: "Blogger",
};

export default function ProjectOverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { isDemo, basePath, fetchUrl, demoData, demoLoading } = useDemo();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [pipelineOpen, setPipelineOpen] = useState(false);

  const load = useCallback(async () => {
    if (isDemo) {
      if (demoLoading) return;
      if (demoData) setData(demoData.overview);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(fetchUrl(`/api/projects/${id}/overview`));
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [id, fetchUrl, isDemo, demoData, demoLoading]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <p className="text-sm text-muted">Project not found</p>
        <Link
          href={basePath}
          className="mt-3 text-sm text-accent-light hover:underline"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { project, stats, recentArticles, recentPublished } = data;
  const pipeline = isDemo
    ? { ...data.pipeline, siteConnected: true }
    : data.pipeline;

  const pipelineSteps = [
    {
      done: pipeline.siteConnected,
      label: "Connect your site",
      href: `${basePath}/projects/${id}/publish`,
      icon: Plug,
    },
    {
      done: pipeline.analysisComplete,
      label: "Analyze your site",
      href: `${basePath}/projects/${id}/research`,
      icon: Search,
    },
    {
      done: pipeline.keywordsFound,
      label: "Discover keywords",
      href: `${basePath}/projects/${id}/research`,
      icon: Target,
    },
    {
      done: pipeline.articlesGenerated,
      label: "Generate articles",
      href: `${basePath}/projects/${id}/articles`,
      icon: FileText,
    },
    {
      done: pipeline.channelsConfigured,
      label: "Configure channels",
      href: `${basePath}/projects/${id}/publish`,
      icon: Megaphone,
    },
    {
      done: pipeline.published,
      label: "Publish content",
      href: `${basePath}/projects/${id}/publish`,
      icon: Send,
    },
  ];

  const completedSteps = pipelineSteps.filter((s) => s.done).length;
  const allDone = completedSteps === pipelineSteps.length;
  const nextStep = pipelineSteps.find((s) => !s.done);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {project.name || project.url}
          </h1>
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-base text-accent-light transition-colors hover:text-accent"
          >
            {project.url}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        {nextStep && (
          <Link
            href={nextStep.href}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-base font-medium text-white transition-colors hover:bg-accent-light"
          >
            <nextStep.icon className="h-4 w-4" />
            {nextStep.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* Pipeline progress */}
      <div className="rounded-xl border border-border bg-card">
        <button
          onClick={() => setPipelineOpen(!pipelineOpen)}
          className="flex w-full items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            {allDone ? (
              <CheckCircle2 className="h-4.5 w-4.5 text-green-400" />
            ) : (
              <div className="relative h-4.5 w-4.5">
                <Circle className="h-4.5 w-4.5 text-muted/30" />
              </div>
            )}
            <span className="text-base font-semibold">Setup Pipeline</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${allDone ? "text-green-400" : "text-muted"}`}>
              {completedSteps}/{pipelineSteps.length} completed
            </span>
            {!allDone && (
              <div className="h-1.5 w-24 rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${(completedSteps / pipelineSteps.length) * 100}%` }}
                />
              </div>
            )}
            <ChevronDown className={`h-4 w-4 text-muted transition ${pipelineOpen ? "rotate-180" : ""}`} />
          </div>
        </button>

        {pipelineOpen && (
          <div className="border-t border-border px-4 pb-4 pt-3">
            <div className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
              {pipelineSteps.map((step) => (
                <Link
                  key={step.label}
                  href={step.href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    step.done
                      ? "text-muted/70"
                      : "text-foreground hover:bg-white/[0.04]"
                  }`}
                >
                  {step.done ? (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
                  ) : (
                    <Circle className="h-3.5 w-3.5 shrink-0 text-muted/30" />
                  )}
                  {step.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Keywords"
          value={stats.keywords}
          href={`${basePath}/projects/${id}/research`}
        />
        <StatCard
          icon={Layers}
          label="Clusters"
          value={stats.clusters}
          href={`${basePath}/projects/${id}/research`}
        />
        <StatCard
          icon={FileText}
          label="Articles"
          value={stats.articles}
          sub={
            stats.articlesPublished > 0
              ? `${stats.articlesPublished} published`
              : undefined
          }
          href={`${basePath}/projects/${id}/articles`}
        />
        <StatCard
          icon={Send}
          label="Published"
          value={stats.variantsPublished}
          sub={
            stats.variantsTotal > 0
              ? `of ${stats.variantsTotal} variants`
              : undefined
          }
          href={`${basePath}/projects/${id}/publish`}
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickAction
          href={`${basePath}/projects/${id}/research`}
          icon={Search}
          label="Research"
          description="Analyze site & discover keywords"
        />
        <QuickAction
          href={`${basePath}/projects/${id}/articles`}
          icon={FileText}
          label="Articles"
          description="Generate SEO content"
        />
        <QuickAction
          href={`${basePath}/projects/${id}/publish`}
          icon={Send}
          label="Publish"
          description="Connect site & distribute"
        />
      </div>

      {/* Recent content */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent articles */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Recent Articles</h3>
            <Link
              href={`${basePath}/projects/${id}/articles`}
              className="text-sm text-accent-light hover:underline"
            >
              View all
            </Link>
          </div>
          {recentArticles.length === 0 ? (
            <div className="px-5 py-8 text-center text-base text-muted/60">
              No articles yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentArticles.map((article) => (
                <div
                  key={article.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <FileText className="h-4 w-4 shrink-0 text-muted/40" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base">{article.title}</p>
                    <p className="text-sm text-muted/50">
                      {article.wordCount.toLocaleString()} words
                    </p>
                  </div>
                  <StatusBadge status={article.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent published */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold">Recent Publications</h3>
            <Link
              href={`${basePath}/projects/${id}/publish`}
              className="text-sm text-accent-light hover:underline"
            >
              View all
            </Link>
          </div>
          {recentPublished.length === 0 ? (
            <div className="px-5 py-8 text-center text-base text-muted/60">
              No publications yet
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentPublished.map((pub) => (
                <div
                  key={pub.id}
                  className="flex items-center gap-3 px-5 py-3"
                >
                  <Globe className="h-4 w-4 shrink-0 text-muted/40" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base">{pub.title}</p>
                    <p className="text-sm text-muted/50">
                      {platformLabels[pub.platform] ?? pub.platform}
                      {pub.publishedAt &&
                        ` · ${new Date(pub.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                    </p>
                  </div>
                  {pub.publishedUrl && (
                    <a
                      href={pub.publishedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted/40 transition-colors hover:text-accent-light"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  sub?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="h-4 w-4 text-muted/40" />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-sm text-muted/50">{sub}</p>}
    </Link>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-accent-light" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-base font-medium">{label}</p>
          <ArrowRight className="h-3 w-3 text-muted/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted" />
        </div>
        <p className="mt-0.5 text-sm text-muted/60">{description}</p>
      </div>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    draft: "bg-zinc-500/10 text-zinc-400",
    ready: "bg-blue-500/10 text-blue-400",
    published: "bg-green-500/10 text-green-400",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-xs font-medium ${colors[status] ?? colors.draft}`}
    >
      {status}
    </span>
  );
}
