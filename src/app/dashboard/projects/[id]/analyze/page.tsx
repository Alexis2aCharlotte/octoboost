"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  TrendingUp,
  Target,
  Users,
  ExternalLink,
  Loader2,
  AlertCircle,
  Sparkles,
  FileText,
  CheckCircle2,
  Plus,
  Globe,
  ChevronLeft,
  ChevronRight,
  Trash2,
} from "lucide-react";

interface Keyword {
  keyword: string;
  intent: string;
  relevance: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  trend: number[];
  opportunityScore: number;
}

interface Competitor {
  name: string;
  url: string;
  reason: string;
}

interface AnalysisResult {
  site: { url: string; title: string; description: string };
  analysis: {
    productSummary: string;
    targetAudience: string;
    contentAngles: string[];
  };
  competitors: Competitor[];
  keywords: Keyword[];
}

interface Project {
  id: string;
  name: string;
  slug: string;
  url: string;
  created_at: string;
  latestAnalysisId: string | null;
  latestAnalysis: { id: string; site_title: string; created_at: string } | null;
}

type SortField = "opportunityScore" | "searchVolume" | "competition" | "cpc";

export default function ProjectAnalyzePage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const searchParams = useSearchParams();
  const urlParam = searchParams.get("url") ?? "";
  const analysisIdParam = searchParams.get("analysisId") ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const [newUrl, setNewUrl] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [sortBy, setSortBy] = useState<SortField>("opportunityScore");
  const [tab, setTab] = useState<"keywords" | "competitors" | "ideas">(
    "keywords"
  );

  const project = projects.find((p) => p.id === id || p.slug === id);

  const loadProjects = useCallback(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setProjectsLoading(false));
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useEffect(() => {
    if (project?.url && !newUrl && !urlParam) {
      setNewUrl(project.url);
    }
  }, [project?.url]);

  const loadAnalysis = useCallback(async (analysisId: string) => {
    const res = await fetch(`/api/analysis/${analysisId}`);
    if (!res.ok) throw new Error("Failed to load analysis");
    const data: AnalysisResult = await res.json();
    setResult(data);
  }, []);

  const runAnalysis = useCallback(
    async (targetUrl: string) => {
      setLoading(true);
      setError(null);
      setCached(false);
      setLoadingStep("Analyzing...");

      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: targetUrl }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Analysis failed");
        }

        const { analysisId, cached: wasCached } = await res.json();
        setCached(wasCached);
        setLoadingStep("Loading...");
        await loadAnalysis(analysisId);
        loadProjects();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [loadAnalysis, loadProjects]
  );

  useEffect(() => {
    if (analysisIdParam) {
      loadAnalysis(analysisIdParam);
    } else if (urlParam) {
      runAnalysis(decodeURIComponent(urlParam));
    }
  }, [analysisIdParam, urlParam]);

  const showResults = result !== null;
  const showList = !showResults && !loading;

  const sortedKeywords = result?.keywords
    ? [...result.keywords].sort((a, b) => {
        if (sortBy === "competition") return a.competition - b.competition;
        return (b[sortBy] as number) - (a[sortBy] as number);
      })
    : [];

  function handleAddUrl(e: React.FormEvent) {
    e.preventDefault();
    const url = newUrl.trim() || project?.url || "";
    if (!url) return;
    setNewUrl("");
    runAnalysis(url);
  }

  if (!id) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-accent-light" />
        <p className="text-sm font-medium">{loadingStep}</p>
        <p className="mt-1 text-xs text-muted">
          Crawl → Analyse IA → Enrichissement keywords
        </p>
        <p className="mt-4 text-xs text-muted">30-60 secondes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <AlertCircle className="mb-4 h-8 w-8 text-red-400" />
        <p className="mb-2 font-medium">Analysis failed</p>
        <p className="mb-6 max-w-md text-center text-sm text-muted">{error}</p>
        <div className="flex gap-3">
          <button
            onClick={() => setError(null)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition hover:text-foreground"
          >
            Back
          </button>
          <button
            onClick={() =>
              runAnalysis(urlParam || project?.url || "")
            }
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (showList) {
    return (
      <div className="mx-auto max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analyze</h1>
          <p className="mt-1 text-sm text-muted">
            Add a URL to run keyword & competitor analysis for this project
          </p>
        </div>

        <form
          onSubmit={handleAddUrl}
          className="flex gap-3 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3">
            <Search className="h-4 w-4 text-muted" />
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={project?.url || "https://yoursite.com"}
              className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            <Plus className="h-4 w-4" />
            Analyze
          </button>
        </form>

        {projectsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted" />
          </div>
        ) : !project ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Globe className="h-7 w-7 text-accent-light" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Project not found</h3>
            <p className="mb-6 max-w-sm text-center text-sm text-muted">
              This project may have been deleted or you don&apos;t have access.
            </p>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : project.latestAnalysisId ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-muted">
              Latest analysis for this project
            </h3>
            <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition hover:border-accent/30">
              <Link
                href={`/dashboard/projects/${id}/analyze?analysisId=${project.latestAnalysisId}`}
                className="flex flex-1 items-center gap-3"
              >
                <Globe className="h-5 w-5 text-muted" />
                <div>
                  <p className="font-medium">
                    {project.name || project.url}
                  </p>
                  <p className="text-xs text-muted">{project.url}</p>
                </div>
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (
                      !confirm(
                        "Delete this project and all its data (keywords, competitors, clusters)?"
                      )
                    )
                      return;
                    const res = await fetch(`/api/projects/${project.id}`, {
                      method: "DELETE",
                    });
                    if (res.ok) {
                      setProjects((prev) =>
                        prev.filter((p) => p.id !== project.id)
                      );
                    }
                  }}
                  className="rounded-lg p-2 text-muted transition hover:bg-red-500/10 hover:text-red-400"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
              <Globe className="h-7 w-7 text-accent-light" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">No analyses yet</h3>
            <p className="mb-6 max-w-sm text-center text-sm text-muted">
              Enter a URL above to run your first analysis for this project
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <Link
        href={`/dashboard/projects/${id}/analyze`}
        className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to analyses
      </Link>

      {cached && (
        <div className="flex items-center gap-2 rounded-lg bg-accent/10 px-4 py-2 text-sm text-accent-light">
          <CheckCircle2 className="h-4 w-4" />
          Loaded from cache (less than 24h old). Re-analyze to refresh.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{result!.site.title}</h1>
            <a
              href={result!.site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-1 text-sm text-accent-light"
            >
              {result!.site.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent-light">
              {result!.keywords.length} keywords
            </span>
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
              {result!.competitors.length} competitors
            </span>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          {result!.analysis.productSummary}
        </p>
        <p className="mt-2 text-sm">
          <span className="text-muted">Audience:</span>{" "}
          {result!.analysis.targetAudience}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Keywords"
          value={result!.keywords.length.toString()}
          icon={Search}
        />
        <StatCard
          label="Avg. Volume"
          value={
            result!.keywords.length > 0
              ? Math.round(
                  result!.keywords.reduce((s, k) => s + k.searchVolume, 0) /
                    result!.keywords.length
                ).toLocaleString()
              : "—"
          }
          icon={TrendingUp}
        />
        <StatCard
          label="Competitors"
          value={result!.competitors.length.toString()}
          icon={Users}
        />
        <StatCard
          label="Article Ideas"
          value={result!.analysis.contentAngles.length.toString()}
          icon={Sparkles}
        />
      </div>

      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {(
          [
            { id: "keywords", label: "Keywords", icon: Target },
            { id: "competitors", label: "Concurrents", icon: Users },
            { id: "ideas", label: "Ideas", icon: FileText },
          ] as const
        ).map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm transition ${
              tab === tabId
                ? "bg-accent/10 font-medium text-accent-light"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "keywords" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium">Keywords</h3>
            <div className="flex gap-1">
              {(
                [
                  ["opportunityScore", "Opportunity"],
                  ["searchVolume", "Volume"],
                  ["competition", "Competition"],
                  ["cpc", "CPC"],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <button
                  key={field}
                  onClick={() => setSortBy(field)}
                  className={`rounded-md px-2.5 py-1 text-xs transition ${
                    sortBy === field
                      ? "bg-accent/10 text-accent-light"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {sortedKeywords.map((kw, i) => (
              <div
                key={kw.keyword}
                className="flex items-center justify-between px-4 py-3 transition hover:bg-card-hover"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-right text-xs text-muted">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{kw.keyword}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <IntentBadge intent={kw.intent} />
                      <RelevanceDot relevance={kw.relevance} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-sm font-medium">
                      {kw.searchVolume.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted">vol/mo</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {(kw.competition * 100).toFixed(0)}%
                    </p>
                    <p className="text-xs text-muted">competition</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      ${kw.cpc.toFixed(2)}
                    </p>
                    <p className="text-xs text-muted">CPC</p>
                  </div>
                  <div className="w-16">
                    <OpportunityBar score={kw.opportunityScore} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "competitors" && (
        <div className="grid gap-4 md:grid-cols-2">
          {result!.competitors.map((comp) => (
            <div
              key={comp.url}
              className="rounded-xl border border-border bg-card p-5 transition hover:border-accent/30"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{comp.name}</h3>
                <a
                  href={comp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted transition hover:text-accent-light"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
              <p className="mt-1 text-xs text-accent-light">{comp.url}</p>
              <p className="mt-2 text-sm text-muted">{comp.reason}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "ideas" && (
        <div className="space-y-2">
          {result!.analysis.contentAngles.map((angle, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-accent/30"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-xs font-medium text-accent-light">
                {i + 1}
              </span>
              <p className="text-sm">{angle}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <Icon className="h-4 w-4 text-muted" />
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = {
    informational: "bg-blue-500/10 text-blue-400",
    commercial: "bg-amber-500/10 text-amber-400",
    transactional: "bg-emerald-500/10 text-emerald-400",
    navigational: "bg-zinc-500/10 text-zinc-400",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs ${colors[intent] ?? colors.informational}`}
    >
      {intent}
    </span>
  );
}

function RelevanceDot({ relevance }: { relevance: string }) {
  const colors: Record<string, string> = {
    high: "bg-emerald-400",
    medium: "bg-amber-400",
    low: "bg-zinc-500",
  };
  return (
    <span className="flex items-center gap-1 text-xs text-muted">
      <span className={`h-1.5 w-1.5 rounded-full ${colors[relevance]}`} />
      {relevance}
    </span>
  );
}

function OpportunityBar({ score }: { score: number }) {
  const maxScore = 500;
  const pct = Math.min((score / maxScore) * 100, 100);
  return (
    <div>
      <div className="mb-0.5 text-right text-xs font-medium text-accent-light">
        {score}
      </div>
      <div className="h-1.5 w-full rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent-light"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
