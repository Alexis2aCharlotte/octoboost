"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
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
  RefreshCw,
  Megaphone,
  ArrowRight,
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
    contentAngles: (string | { title: string; type: string })[];
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
  return (
    <Suspense>
      <AnalyzeContent />
    </Suspense>
  );
}

function AnalyzeContent() {
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
  const [tab, setTab] = useState<"keywords" | "competitors" | "ideas">("keywords");

  const project = projects.find((p) => p.id === id || p.slug === id);

  const loadProjects = useCallback(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setProjectsLoading(false));
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  useEffect(() => {
    if (project?.url && !newUrl && !urlParam) setNewUrl(project.url);
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
    if (analysisIdParam) loadAnalysis(analysisIdParam);
    else if (urlParam) runAnalysis(decodeURIComponent(urlParam));
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

  if (!id) return null;

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Loader2 className="h-5 w-5 animate-spin text-accent-light" />
        </div>
        <p className="text-sm font-medium">{loadingStep}</p>
        <div className="mt-6 flex items-center gap-8 text-xs text-muted/60">
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent-light" />Crawling site</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent/40" />AI analysis</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-accent/20" />Keywords</span>
        </div>
        <p className="mt-4 text-xs text-muted/40">Usually takes 30–60 seconds</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-danger/10">
          <AlertCircle className="h-5 w-5 text-danger" />
        </div>
        <p className="text-sm font-medium">Analysis failed</p>
        <p className="mt-1.5 max-w-md text-center text-sm text-muted">{error}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => setError(null)} className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground">Back</button>
          <button onClick={() => runAnalysis(urlParam || project?.url || "")} className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light">Retry</button>
        </div>
      </div>
    );
  }

  /* ── List view — Project hub ── */
  if (showList) {
    const hasAnalysis = !!project?.latestAnalysisId;
    const analysisDate = project?.latestAnalysis?.created_at
      ? new Date(project.latestAnalysis.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : null;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Analyze</h1>
            <p className="mt-1 text-sm text-muted">
              {hasAnalysis ? "Your site analysis overview" : "Run your first analysis"}
            </p>
          </div>
          {hasAnalysis && (
            <button
              onClick={() => runAnalysis(project?.url || "")}
              className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-[13px] text-muted transition-colors hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Re-analyze
            </button>
          )}
        </div>

        {projectsLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted" />
          </div>
        ) : !project ? (
          <EmptyState
            icon={Globe}
            title="Project not found"
            description="This project may have been deleted or you don't have access."
            action={<Link href="/dashboard" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light">Back to Dashboard</Link>}
          />
        ) : hasAnalysis ? (
          <>
            {/* Site card */}
            <Link
              href={`/dashboard/projects/${id}/analyze?analysisId=${project.latestAnalysisId}`}
              className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10">
                <Globe className="h-5 w-5 text-accent-light" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{project.name || project.url}</p>
                <p className="mt-0.5 text-xs text-muted">{project.url}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted/60">Last analyzed</p>
                <p className="text-[13px] text-muted">{analysisDate}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted/30" />
            </Link>

            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-3">
              <QuickAction
                href={`/dashboard/projects/${id}/keywords`}
                icon={Target}
                label="Keywords"
                description="View discovered keywords & opportunities"
              />
              <QuickAction
                href={`/dashboard/projects/${id}/articles`}
                icon={FileText}
                label="Articles"
                description="Generate & manage SEO articles"
              />
              <QuickAction
                href={`/dashboard/projects/${id}/channels`}
                icon={Megaphone}
                label="Channels"
                description="Configure publishing platforms"
              />
            </div>

            {/* New analysis */}
            <div className="space-y-2">
              <p className="text-[13px] font-medium text-muted/60">Run a new analysis</p>
              <form
                onSubmit={handleAddUrl}
                className="flex gap-3 rounded-xl border border-border bg-card p-3"
              >
                <div className="flex flex-1 items-center gap-2.5 rounded-lg bg-background px-3">
                  <Search className="h-4 w-4 text-muted/40" />
                  <input
                    type="url"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder={project?.url || "https://yourURL.example.com"}
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/30"
                  />
                </div>
                <button type="submit" className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light">
                  <Plus className="h-4 w-4" />
                  Analyze
                </button>
              </form>
            </div>
          </>
        ) : (
          /* No analysis yet — onboarding */
          <div className="space-y-6">
            <form
              onSubmit={handleAddUrl}
              className="flex gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="flex flex-1 items-center gap-2.5 rounded-lg bg-background px-3">
                <Search className="h-4 w-4 text-muted/40" />
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder={project?.url || "https://yourURL.example.com"}
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted/30"
                />
              </div>
              <button type="submit" className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-light">
                <Plus className="h-4 w-4" />
                Analyze
              </button>
            </form>

            {/* Steps explanation */}
            <div className="grid gap-3 sm:grid-cols-3">
              <StepCard step={1} icon={Globe} title="Crawl your site" description="We scan your pages, meta tags, and content structure" />
              <StepCard step={2} icon={Sparkles} title="AI analysis" description="GPT identifies keywords, competitors, and content gaps" />
              <StepCard step={3} icon={Target} title="Keyword discovery" description="Real search volumes, CPC, and opportunity scores" />
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ── Results view ── */
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link href={`/dashboard/projects/${id}/analyze`} className="inline-flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-foreground">
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Link>
        {cached && (
          <div className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1 text-xs text-accent-light">
            <CheckCircle2 className="h-3 w-3" />
            Cached result
          </div>
        )}
      </div>

      {/* Site info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold">{result!.site.title}</h1>
            <a href={result!.site.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-accent-light transition-colors hover:text-accent">
              {result!.site.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-light">{result!.keywords.length} keywords</span>
            <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">{result!.competitors.length} competitors</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">{result!.analysis.productSummary}</p>
        <div className="mt-3 flex items-center gap-1.5 text-sm">
          <span className="text-muted/60">Audience:</span>
          <span className="text-muted">{result!.analysis.targetAudience}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard label="Keywords" value={result!.keywords.length.toString()} icon={Search} />
        <StatCard label="Avg. Volume" value={result!.keywords.length > 0 ? Math.round(result!.keywords.reduce((s, k) => s + k.searchVolume, 0) / result!.keywords.length).toLocaleString() : "—"} icon={TrendingUp} />
        <StatCard label="Competitors" value={result!.competitors.length.toString()} icon={Users} />
        <StatCard label="Content ideas" value={result!.analysis.contentAngles.length.toString()} icon={Sparkles} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        {([
          { id: "keywords", label: "Keywords", icon: Target },
          { id: "competitors", label: "Competitors", icon: Users },
          { id: "ideas", label: "Ideas", icon: FileText },
        ] as const).map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] transition-colors ${tab === tabId ? "bg-white/[0.06] font-medium text-foreground" : "text-muted hover:text-foreground"}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Keywords */}
      {tab === "keywords" && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-[13px] font-medium">All keywords</h3>
            <div className="flex gap-0.5">
              {([["opportunityScore", "Opportunity"], ["searchVolume", "Volume"], ["competition", "Competition"], ["cpc", "CPC"]] as [SortField, string][]).map(([field, label]) => (
                <button key={field} onClick={() => setSortBy(field)} className={`rounded-md px-2.5 py-1 text-xs transition-colors ${sortBy === field ? "bg-white/[0.06] font-medium text-foreground" : "text-muted hover:text-foreground"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div className="divide-y divide-border">
            {sortedKeywords.map((kw, i) => (
              <div key={kw.keyword} className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-card-hover">
                <div className="flex items-center gap-3">
                  <span className="w-5 text-right text-xs tabular-nums text-muted/40">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium">{kw.keyword}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <IntentBadge intent={kw.intent} />
                      <RelevanceDot relevance={kw.relevance} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                  <div><p className="text-sm tabular-nums font-medium">{kw.searchVolume.toLocaleString()}</p><p className="text-[11px] text-muted/50">vol/mo</p></div>
                  <div><p className="text-sm tabular-nums font-medium">{(kw.competition * 100).toFixed(0)}%</p><p className="text-[11px] text-muted/50">comp.</p></div>
                  <div><p className="text-sm tabular-nums font-medium">${kw.cpc.toFixed(2)}</p><p className="text-[11px] text-muted/50">CPC</p></div>
                  <div className="w-14"><OpportunityBar score={kw.opportunityScore} /></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitors */}
      {tab === "competitors" && (
        <div className="grid gap-3 md:grid-cols-2">
          {result!.competitors.map((comp) => (
            <div key={comp.url} className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">{comp.name}</h3>
                <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-muted transition-colors hover:text-accent-light"><ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
              <p className="mt-1 text-xs text-accent-light">{comp.url}</p>
              <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{comp.reason}</p>
            </div>
          ))}
        </div>
      )}

      {/* Ideas */}
      {tab === "ideas" && (
        <div className="space-y-2">
          {result!.analysis.contentAngles.map((angle, i) => {
            const title = typeof angle === "string" ? angle : angle.title;
            const type = typeof angle === "string" ? null : angle.type;
            return (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 transition-colors hover:bg-card-hover">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-xs tabular-nums font-medium text-muted">{i + 1}</span>
                <p className="flex-1 text-sm">{title}</p>
                {type && <span className="shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-light">{type}</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function QuickAction({ href, icon: Icon, label, description }: { href: string; icon: React.ComponentType<{ className?: string }>; label: string; description: string }) {
  return (
    <Link href={href} className="group flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-card-hover">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10">
        <Icon className="h-4 w-4 text-accent-light" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{label}</p>
          <ArrowRight className="h-3 w-3 text-muted/30 transition-transform group-hover:translate-x-0.5 group-hover:text-muted" />
        </div>
        <p className="mt-0.5 text-xs text-muted/60">{description}</p>
      </div>
    </Link>
  );
}

function StepCard({ step, icon: Icon, title, description }: { step: number; icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-xs font-semibold text-accent-light">{step}</span>
        <Icon className="h-4 w-4 text-muted/40" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted/60">{description}</p>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[13px] text-muted">{label}</span>
        <Icon className="h-4 w-4 text-muted/40" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, action }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10"><Icon className="h-5 w-5 text-accent-light" /></div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-center text-[13px] text-muted">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const colors: Record<string, string> = { informational: "bg-blue-500/10 text-blue-400", commercial: "bg-amber-500/10 text-amber-400", transactional: "bg-emerald-500/10 text-emerald-400", navigational: "bg-zinc-500/10 text-zinc-400" };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${colors[intent] ?? colors.informational}`}>{intent}</span>;
}

function RelevanceDot({ relevance }: { relevance: string }) {
  const colors: Record<string, string> = { high: "bg-emerald-400", medium: "bg-amber-400", low: "bg-zinc-500" };
  return <span className="flex items-center gap-1 text-[11px] text-muted"><span className={`h-1.5 w-1.5 rounded-full ${colors[relevance]}`} />{relevance}</span>;
}

function OpportunityBar({ score }: { score: number }) {
  const pct = Math.min((score / 500) * 100, 100);
  return (
    <div>
      <div className="mb-0.5 text-right text-xs tabular-nums font-medium text-accent-light">{score}</div>
      <div className="h-1 w-full rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-accent-light" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
