"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useDemo } from "@/lib/demo/context";
import { useProjectCache } from "@/lib/project-cache";
import {
  Search,
  Target,
  PenTool,
  ArrowUpDown,
  Loader2,
  Filter,
  Layers,
  FileText,
  Shield,
  Globe,
  ExternalLink,
  Users,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */

interface Keyword {
  id: string;
  keyword: string;
  intent: string;
  relevance: string;
  category: string;
  searchVolume: number;
  cpc: number;
  competition: number;
  competitionLevel: string;
  trend: number[];
  opportunityScore: number;
  serpDifficulty: number | null;
  source: string;
  analysisId: string;
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
  latestAnalysisId: string | null;
  latestAnalysis: { id: string; site_title: string; created_at: string } | null;
  analysesLast30d: number;
  totalAnalyses: number;
}

type SortField =
  | "opportunityScore"
  | "searchVolume"
  | "competition"
  | "cpc"
  | "serpDifficulty";
type MainTab = "keywords" | "analysis";

/* ─── Style maps ─────────────────────────────────────────── */

const intentColors: Record<string, string> = {
  informational: "bg-blue-500/15 text-blue-400",
  commercial: "bg-amber-500/15 text-amber-400",
  transactional: "bg-green-500/15 text-green-400",
  navigational: "bg-purple-500/15 text-purple-400",
};

const intentTooltips: Record<string, string> = {
  informational: "User wants to learn or understand something. Best for blog posts and guides.",
  commercial: "User is researching before buying. Great for comparison articles and reviews.",
  transactional: "User is ready to take action (buy, sign up, download). High conversion potential.",
  navigational: "User is looking for a specific site or page. Low content opportunity.",
};

const categoryColors: Record<string, string> = {
  broad: "bg-cyan-500/15 text-cyan-400",
  niche: "bg-pink-500/15 text-pink-400",
  question: "bg-emerald-500/15 text-emerald-400",
  comparison: "bg-orange-500/15 text-orange-400",
};

const categoryTooltips: Record<string, string> = {
  broad: "Generic, high-level keyword with wide audience reach. Higher volume, more competition.",
  niche: "Specific keyword targeting a narrow audience. Lower volume but easier to rank for.",
  question: "Search query phrased as a question. Ideal for FAQ sections and how-to articles.",
  comparison: "User comparing products or solutions. Perfect for \"vs\" and \"best of\" articles.",
};

const sourceTooltips: Record<string, string> = {
  seed: "Discovered by AI analysis of your site content and structure.",
  expanded: "Found via DataForSEO keyword suggestions based on your seed keywords.",
  competitor: "Extracted from competitor sites during competitive analysis.",
};

const difficultyColors: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  hard: "text-red-400 bg-red-500/10",
};

/* ─── Main page ──────────────────────────────────────────── */

export default function ResearchPage() {
  const { id } = useParams<{ id: string }>();
  const { isDemo, basePath, fetchUrl, demoData, demoLoading } = useDemo();
  const { data: cachedData, loading: cacheLoading } = useProjectCache();

  const [project, setProject] = useState<Project | null>(null);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<MainTab>("keywords");

  // Keywords state
  const [kwTab, setKwTab] = useState<"keywords" | "clusters">("keywords");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("opportunityScore");
  const [sortAsc, setSortAsc] = useState(false);
  const [intentFilter, setIntentFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [volumeOnly, setVolumeOnly] = useState(false);

  const loadData = useCallback(async () => {
    if (isDemo) {
      if (demoLoading) return;
      if (demoData) {
        const p = demoData.project;
        setProject({
          id: p.projectId,
          name: p.name,
          slug: p.slug,
          url: p.url,
          latestAnalysisId: p.latestAnalysisId,
          latestAnalysis: p.latestAnalysis,
          analysesLast30d: p.analysesLast30d,
          totalAnalyses: p.totalAnalyses,
        });
        setKeywords(demoData.keywords);
        setClusters(demoData.clusters);
        if (demoData.analysis) setAnalysisResult(demoData.analysis);
      }
      setLoading(false);
      return;
    }
    if (cachedData) {
      const p = cachedData.project;
      setProject({
        id: p.projectId, name: p.name, slug: p.slug, url: p.url,
        latestAnalysisId: p.latestAnalysisId, latestAnalysis: p.latestAnalysis,
        analysesLast30d: p.analysesLast30d, totalAnalyses: p.totalAnalyses,
      });
      setKeywords(cachedData.keywords);
      setClusters(cachedData.clusters);
      if (cachedData.analysis) setAnalysisResult(cachedData.analysis);
      setLoading(false);
      return;
    }
    if (cacheLoading) return;
    try {
      const [projRes, kwRes] = await Promise.all([
        fetch(fetchUrl(`/api/projects/${id}`)),
        fetch(fetchUrl(`/api/keywords?projectId=${id}`)),
      ]);

      let proj: Project | null = null;
      if (projRes.ok) {
        const projData = await projRes.json();
        proj = {
          id: projData.projectId,
          name: projData.name,
          slug: projData.slug,
          url: projData.url,
          latestAnalysisId: projData.latestAnalysisId,
          latestAnalysis: projData.latestAnalysis,
          analysesLast30d: projData.analysesLast30d,
          totalAnalyses: projData.totalAnalyses,
        };
      }
      setProject(proj);

      if (kwRes.ok) {
        const kwData = await kwRes.json();
        setKeywords(kwData.keywords ?? []);
        setClusters(kwData.clusters ?? []);
      }

      if (proj?.latestAnalysisId) {
        const aRes = await fetch(fetchUrl(`/api/analysis/${proj.latestAnalysisId}`));
        if (aRes.ok) {
          setAnalysisResult(await aRes.json());
        }
      }
    } finally {
      setLoading(false);
    }
  }, [id, fetchUrl, isDemo, demoData, demoLoading, cachedData, cacheLoading]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function runAnalysis() {
    if (isDemo || !project?.url || analyzing) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(fetchUrl("/api/analyze"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: project.url }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Analysis failed");
      }
      const { analysisId } = await res.json();
      const aRes = await fetch(fetchUrl(`/api/analysis/${analysisId}`));
      if (aRes.ok) setAnalysisResult(await aRes.json());
      // Reload keywords
      const kwRes = await fetch(fetchUrl(`/api/keywords?projectId=${id}`));
      if (kwRes.ok) {
        const kwData = await kwRes.json();
        setKeywords(kwData.keywords ?? []);
        setClusters(kwData.clusters ?? []);
      }
    } catch (e) {
      setAnalyzeError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleSort(field: SortField) {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  }

  const filtered = keywords
    .filter((k) => {
      if (search && !k.keyword.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (intentFilter && k.intent !== intentFilter) return false;
      if (categoryFilter && k.category !== categoryFilter) return false;
      if (sourceFilter && k.source !== sourceFilter) return false;
      if (volumeOnly && k.searchVolume === 0) return false;
      return true;
    })
    .sort((a, b) => {
      const aVal = a[sortField] ?? -1;
      const bVal = b[sortField] ?? -1;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

  const withVolume = keywords.filter((k) => k.searchVolume > 0);
  const totalVolume = withVolume.reduce((s, k) => s + k.searchVolume, 0);
  const goldenKeywords = keywords.filter((k) => k.opportunityScore >= 20).length;
  const fromCompetitors = keywords.filter((k) => k.source === "competitor").length;

  const intents = [...new Set(keywords.map((k) => k.intent))];
  const categories = [...new Set(keywords.map((k) => k.category))];
  const sources = [...new Set(keywords.map((k) => k.source))];

  const hasAnalysis = !!analysisResult;

  /* ─── Loading skeleton ── */
  if (loading) {
    return <ResearchSkeleton />;
  }

  /* ─── Analyzing ── */
  if (analyzing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Loader2 className="h-5 w-5 animate-spin text-accent-light" />
        </div>
        <p className="text-sm font-medium">Analyzing your site...</p>
        <div className="mt-6 flex items-center gap-8 text-xs text-muted/60">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent-light" />
            Crawling
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent/40" />
            AI analysis
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent/20" />
            Keywords
          </span>
        </div>
        <p className="mt-4 text-xs text-muted/40">
          Usually takes 30–60 seconds
        </p>
      </div>
    );
  }

  /* ─── No analysis yet ── */
  if (!hasAnalysis && keywords.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Research</h1>
          <p className="mt-1 text-sm text-muted">
            Analyze your site to discover keywords and content opportunities.
          </p>
        </div>

        {analyzeError && (
          <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-sm text-red-400">{analyzeError}</p>
          </div>
        )}

        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Search className="h-7 w-7 text-accent-light" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No analysis yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted">
            Run an analysis on{" "}
            <span className="font-medium text-foreground">
              {project?.url ?? "your site"}
            </span>{" "}
            to discover keywords, competitors, and content opportunities.
          </p>
          <button
            onClick={runAnalysis}
            className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            <PenTool className="h-4 w-4" />
            Run Analysis
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StepCard
            step={1}
            icon={Globe}
            title="Crawl your site"
            description="We scan your pages, meta tags, and content structure"
          />
          <StepCard
            step={2}
            icon={Search}
            title="AI analysis"
            description="GPT identifies keywords, competitors, and content gaps"
          />
          <StepCard
            step={3}
            icon={Target}
            title="Keyword discovery"
            description="Real search volumes, CPC, and opportunity scores"
          />
        </div>
      </div>
    );
  }

  /* ─── Main research view ── */
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Research</h1>
          <p className="mt-1 text-sm text-muted">
            {keywords.length} keywords · {clusters.length} clusters ·{" "}
            {fromCompetitors} from competitors
          </p>
        </div>
        <AnalysisSchedule
          project={project}
          analyzing={analyzing}
          onReanalyze={runAnalysis}
        />
      </div>

      {/* Main tabs: Keywords vs Analysis */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setMainTab("keywords")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            mainTab === "keywords"
              ? "bg-accent/15 text-accent-light"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Target className="h-4 w-4" />
          Keywords & Clusters
        </button>
        <button
          onClick={() => setMainTab("analysis")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            mainTab === "analysis"
              ? "bg-accent/15 text-accent-light"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Globe className="h-4 w-4" />
          Site Analysis
        </button>
      </div>

      {/* Keywords tab */}
      {mainTab === "keywords" && (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted">Keywords</span>
              <p className="mt-2 text-2xl font-bold">{keywords.length}</p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted">Monthly Searches</span>
              <p className="mt-2 text-2xl font-bold">
                {totalVolume.toLocaleString()}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                across {withVolume.length} keywords
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted">Golden</span>
              <p className="mt-2 text-2xl font-bold text-amber-400">
                {goldenKeywords}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                opportunity &ge; 20
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <span className="text-sm text-muted">Clusters</span>
              <p className="mt-2 text-2xl font-bold">{clusters.length}</p>
              <p className="mt-0.5 text-xs text-muted">article topics</p>
            </div>
          </div>

          {/* Sub-tabs */}
          <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setKwTab("keywords")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                kwTab === "keywords"
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Target className="h-4 w-4" />
              Keywords ({filtered.length})
            </button>
            <button
              onClick={() => setKwTab("clusters")}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                kwTab === "clusters"
                  ? "bg-white/[0.06] text-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              Topic Clusters ({clusters.length})
            </button>
          </div>

          {kwTab === "keywords" && (
            <>
              {/* Filters */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative min-w-[240px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search keywords..."
                      className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted/50 focus:border-accent/50"
                    />
                  </div>
                  <button
                    onClick={() => setVolumeOnly(!volumeOnly)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      volumeOnly
                        ? "border-accent/50 bg-accent/10 text-accent-light"
                        : "border-border text-muted hover:text-foreground"
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5" />
                    Volume &gt; 0
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterGroup label="Intent" options={intents} current={intentFilter} onChange={setIntentFilter} />
                  <FilterGroup label="Category" options={categories} current={categoryFilter} onChange={setCategoryFilter} />
                  <FilterGroup label="Source" options={sources} current={sourceFilter} onChange={setSourceFilter} />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card text-left text-xs text-muted">
                        <th className="px-4 py-3 font-medium">Keyword</th>
                        <th className="px-4 py-3 font-medium">Cat.</th>
                        <th className="px-4 py-3 font-medium">Intent</th>
                        <th className="px-4 py-3 font-medium">Source</th>
                        <SortHeader field="opportunityScore" label="Opp." current={sortField} asc={sortAsc} onSort={handleSort} />
                        <SortHeader field="searchVolume" label="Volume" current={sortField} asc={sortAsc} onSort={handleSort} />
                        <SortHeader field="competition" label="Comp." current={sortField} asc={sortAsc} onSort={handleSort} />
                        <SortHeader field="serpDifficulty" label="SERP" current={sortField} asc={sortAsc} onSort={handleSort} />
                        <SortHeader field="cpc" label="CPC" current={sortField} asc={sortAsc} onSort={handleSort} />
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((kw) => (
                        <tr key={kw.id} className="border-b border-border transition hover:bg-card-hover">
                          <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                          <td className="px-4 py-3">
                            <Tooltip text={categoryTooltips[kw.category] ?? kw.category}>
                              <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${categoryColors[kw.category] ?? "bg-card text-muted"}`}>
                                {kw.category}
                              </span>
                            </Tooltip>
                          </td>
                          <td className="px-4 py-3">
                            <Tooltip text={intentTooltips[kw.intent] ?? kw.intent}>
                              <span className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${intentColors[kw.intent] ?? "bg-card text-muted"}`}>
                                {kw.intent}
                              </span>
                            </Tooltip>
                          </td>
                          <td className="px-4 py-3">
                            <SourceBadge source={kw.source} />
                          </td>
                          <td className="px-4 py-3">
                            <OpportunityBadge score={kw.opportunityScore} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{kw.searchVolume.toLocaleString()}</td>
                          <td className="px-4 py-3">
                            <CompetitionBar value={kw.competition} />
                          </td>
                          <td className="px-4 py-3">
                            {kw.serpDifficulty !== null ? (
                              <SerpBadge value={kw.serpDifficulty} />
                            ) : (
                              <span className="text-xs text-muted/40">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">${kw.cpc.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filtered.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted">
                    No keywords match your filters.
                  </div>
                )}
              </div>
              <p className="text-xs text-muted">
                Showing {filtered.length} of {keywords.length} keywords
              </p>
            </>
          )}

          {kwTab === "clusters" && <ClustersView clusters={clusters} />}
        </>
      )}

      {/* Analysis tab */}
      {mainTab === "analysis" && analysisResult && (
        <div className="space-y-6">
          {/* Site info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold">
                  {analysisResult.site.title}
                </h2>
                <a
                  href={analysisResult.site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-accent-light transition-colors hover:text-accent"
                >
                  {analysisResult.site.url}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent-light">
                  {keywords.length} keywords
                </span>
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  {analysisResult.competitors.length} competitors
                </span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {analysisResult.analysis.productSummary}
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-sm">
              <span className="text-muted/60">Audience:</span>
              <span className="text-muted">
                {analysisResult.analysis.targetAudience}
              </span>
            </div>
          </div>

          {/* Competitors */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <Users className="h-4 w-4 text-muted" />
              Competitors ({analysisResult.competitors.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {analysisResult.competitors.map((comp) => (
                <div
                  key={comp.url}
                  className="rounded-xl border border-border bg-card p-5 transition-colors hover:bg-card-hover"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">{comp.name}</h4>
                    <a
                      href={comp.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted transition-colors hover:text-accent-light"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                  <p className="mt-1 text-xs text-accent-light">{comp.url}</p>
                  <p className="mt-2.5 text-[13px] leading-relaxed text-muted">
                    {comp.reason}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Content angles */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4 text-muted" />
              Content Ideas ({analysisResult.analysis.contentAngles.length})
            </h3>
            <div className="space-y-2">
              {analysisResult.analysis.contentAngles.map((angle, i) => {
                const title = typeof angle === "string" ? angle : angle.title;
                const type = typeof angle === "string" ? null : angle.type;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 transition-colors hover:bg-card-hover"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-xs tabular-nums font-medium text-muted">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm">{title}</p>
                    {type && <span className="shrink-0 rounded-md bg-accent/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent-light">{type}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {mainTab === "analysis" && !analysisResult && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-20">
          <Globe className="mb-4 h-8 w-8 text-muted/40" />
          <h3 className="text-sm font-semibold">No analysis data</h3>
          <p className="mt-1 text-sm text-muted">
            Run an analysis to see site details and competitors.
          </p>
          <button
            onClick={runAnalysis}
            className="mt-4 flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            <PenTool className="h-4 w-4" />
            Run Analysis
          </button>
        </div>
      )}
    </div>
  );
}

/* ─── Clusters view ──────────────────────────────────────── */

function ClustersView({ clusters }: { clusters: Cluster[] }) {
  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card py-16">
        <Layers className="mb-3 h-8 w-8 text-muted" />
        <h3 className="mb-1 text-lg font-semibold">No clusters yet</h3>
        <p className="max-w-sm text-center text-sm text-muted">
          Run a new analysis to generate topic clusters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clusters.map((cluster) => (
        <div
          key={cluster.id}
          className="rounded-xl border border-border bg-card p-5 transition hover:border-accent/30"
        >
          <div className="mb-3 flex items-start justify-between">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${difficultyColors[cluster.difficulty] ?? "text-muted bg-card"}`}
            >
              {cluster.difficulty}
            </span>
            <span className="text-xs text-muted">
              {cluster.totalVolume.toLocaleString()} vol/mo
            </span>
          </div>
          <h3 className="mb-1 text-sm font-semibold leading-snug">
            {cluster.topic}
          </h3>
          <div className="mb-3 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-accent" />
            <p className="text-xs text-accent-light">{cluster.articleTitle}</p>
          </div>
          <div className="mb-3">
            <span className="text-xs font-medium text-foreground">Pillar: </span>
            <span className="text-xs text-muted">{cluster.pillarKeyword}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {cluster.supportingKeywords.slice(0, 6).map((kw) => (
              <span key={kw} className="rounded-md bg-card-hover px-2 py-0.5 text-xs text-muted">
                {kw}
              </span>
            ))}
            {cluster.supportingKeywords.length > 6 && (
              <span className="rounded-md bg-card-hover px-2 py-0.5 text-xs text-muted">
                +{cluster.supportingKeywords.length - 6} more
              </span>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${intentColors[cluster.searchIntent] ?? "bg-card text-muted"}`}
            >
              {cluster.searchIntent}
            </span>
            <span className="text-xs text-muted">
              {cluster.supportingKeywords.length + 1} keywords
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Analysis schedule ─────────────────────────────────── */

function AnalysisSchedule({
  project,
  analyzing,
  onReanalyze,
}: {
  project: Project | null;
  analyzing: boolean;
  onReanalyze: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!project?.latestAnalysis) return null;

  const lastDate = new Date(project.latestAnalysis.created_at);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + 1);

  const maxPerPeriod = 2;
  const used = project.analysesLast30d ?? 0;
  const remaining = Math.max(0, maxPerPeriod - used);
  const canReanalyze = remaining > 0;

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function handleConfirm() {
    setShowConfirm(false);
    onReanalyze();
  }

  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <p className="text-xs text-muted">
          Next analysis · <span className="text-foreground font-medium">{fmt(nextDate)}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted/60">
          {remaining > 0
            ? `${remaining} re-analysis remaining this month`
            : "Re-analysis limit reached this month"}
        </p>
      </div>
      {canReanalyze && (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={analyzing}
          className="flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-[13px] text-muted transition-colors hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? "animate-spin" : ""}`} />
          Re-analyze
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-border bg-[#0d1225] p-6 shadow-2xl">
            <div className="mb-1 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-semibold">Re-analyze this site?</h3>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This will use your only re-analysis for this month.
              Your current keywords and clusters will be replaced with fresh data.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-light"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Shared components ──────────────────────────────────── */

function StepCard({
  step,
  icon: Icon,
  title,
  description,
}: {
  step: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2.5">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent/10 text-xs font-semibold text-accent-light">
          {step}
        </span>
        <Icon className="h-4 w-4 text-muted/40" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted/60">
        {description}
      </p>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  current,
  onChange,
}: {
  label: string;
  options: string[];
  current: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <>
      <span className="text-xs text-muted">{label}:</span>
      <button
        onClick={() => onChange(null)}
        className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
          current === null ? "bg-accent/15 text-accent-light" : "text-muted hover:text-foreground"
        }`}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(current === opt ? null : opt)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
            current === opt ? "bg-accent/15 text-accent-light" : "text-muted hover:text-foreground"
          }`}
        >
          {opt}
        </button>
      ))}
      <span className="mx-1" />
    </>
  );
}

function SortHeader({
  field,
  label,
  current,
  asc,
  onSort,
}: {
  field: SortField;
  label: string;
  current: SortField;
  asc: boolean;
  onSort: (f: SortField) => void;
}) {
  return (
    <th className="cursor-pointer px-4 py-3 font-medium" onClick={() => onSort(field)}>
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${current === field ? "text-accent" : ""}`} />
      </span>
    </th>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);

  function show() {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: rect.left + rect.width / 2 });
  }

  return (
    <span
      ref={ref}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && (
        <span
          className="fixed z-[9999] w-[220px] rounded-lg border border-border bg-[#0d1225] px-3 py-2 text-xs font-normal leading-relaxed text-muted shadow-lg"
          style={{ top: pos.top, left: pos.left, transform: "translateX(-50%)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    seed: "text-muted",
    expanded: "text-cyan-400",
    competitor: "text-orange-400",
  };
  const tip = sourceTooltips[source];
  const badge = (
    <span className={`text-xs font-medium capitalize ${styles[source] ?? "text-muted"}`}>
      {source}
    </span>
  );
  return tip ? <Tooltip text={tip}>{badge}</Tooltip> : badge;
}

function OpportunityBadge({ score }: { score: number }) {
  let color = "text-muted bg-card";
  let tip = "No opportunity signal for this keyword.";
  if (score >= 50) {
    color = "text-green-400 bg-green-500/10";
    tip = "Excellent opportunity. High volume and low competition make this a top target.";
  } else if (score >= 20) {
    color = "text-amber-400 bg-amber-500/10";
    tip = "Good opportunity. Solid balance of search volume and achievable competition.";
  } else if (score > 0) {
    color = "text-orange-400 bg-orange-500/10";
    tip = "Low opportunity. Either high competition or low volume limits the potential.";
  }
  return (
    <Tooltip text={tip}>
      <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium ${color}`}>
        {score}
      </span>
    </Tooltip>
  );
}

function SerpBadge({ value }: { value: number }) {
  let color = "text-green-400 bg-green-500/10";
  let tip = "Low SERP difficulty. Few strong competitors in search results.";
  if (value >= 60) {
    color = "text-red-400 bg-red-500/10";
    tip = "High SERP difficulty. Dominated by big brands and authority sites.";
  } else if (value >= 30) {
    color = "text-amber-400 bg-amber-500/10";
    tip = "Moderate SERP difficulty. Some strong competitors but room to rank.";
  }
  return (
    <Tooltip text={tip}>
      <span className="flex items-center gap-1.5">
        <Shield className="h-3 w-3" />
        <span className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ${color}`}>
          {value}
        </span>
      </span>
    </Tooltip>
  );
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct < 30 ? "bg-green-500" : pct < 60 ? "bg-amber-500" : "bg-red-500";
  let tip = "Low ad competition. Few advertisers bidding on this keyword.";
  if (pct >= 60) tip = "High ad competition. Many advertisers are bidding, indicating commercial value.";
  else if (pct >= 30) tip = "Moderate ad competition. Some advertisers find this keyword valuable.";
  return (
    <Tooltip text={tip}>
      <span className="flex items-center gap-2">
        <span className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
          <span className={`block h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
        </span>
        <span className="font-mono text-xs text-muted">{pct}%</span>
      </span>
    </Tooltip>
  );
}

/* ─── Skeleton loader ─────────────────────────────────── */

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.06] ${className ?? ""}`} />;
}

function ResearchSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Shimmer className="h-7 w-40" />
          <Shimmer className="mt-2 h-4 w-64" />
        </div>
        <Shimmer className="h-9 w-28 rounded-lg" />
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        <Shimmer className="h-9 w-44 rounded-md" />
        <Shimmer className="h-9 w-36 rounded-md" />
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <Shimmer className="h-4 w-24" />
            <Shimmer className="mt-3 h-7 w-16" />
            <Shimmer className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        <Shimmer className="h-9 w-36 rounded-md" />
        <Shimmer className="h-9 w-40 rounded-md" />
      </div>

      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Shimmer className="h-10 flex-1 rounded-lg" />
          <Shimmer className="h-10 w-28 rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Shimmer key={i} className="h-7 w-16 rounded-md" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <div className="flex gap-4">
            {["w-32", "w-16", "w-20", "w-16", "w-12", "w-16", "w-16", "w-12", "w-12"].map((w, i) => (
              <Shimmer key={i} className={`h-4 ${w}`} />
            ))}
          </div>
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3.5">
            <Shimmer className="h-4 w-36" />
            <Shimmer className="h-5 w-14 rounded-md" />
            <Shimmer className="h-5 w-20 rounded-md" />
            <Shimmer className="h-4 w-16" />
            <Shimmer className="h-5 w-10 rounded-md" />
            <Shimmer className="h-4 w-14" />
            <Shimmer className="h-2 w-16 rounded-full" />
            <Shimmer className="h-4 w-10" />
            <Shimmer className="h-4 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}
