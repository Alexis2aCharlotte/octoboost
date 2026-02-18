"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Search,
  Target,
  TrendingUp,
  Sparkles,
  ArrowUpDown,
  Loader2,
  Zap,
  Filter,
  Layers,
  FileText,
  Shield,
} from "lucide-react";

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

type SortField = "opportunityScore" | "searchVolume" | "competition" | "cpc" | "serpDifficulty";
type Tab = "keywords" | "clusters";

const intentColors: Record<string, string> = {
  informational: "bg-blue-500/15 text-blue-400",
  commercial: "bg-amber-500/15 text-amber-400",
  transactional: "bg-green-500/15 text-green-400",
  navigational: "bg-purple-500/15 text-purple-400",
};

const categoryColors: Record<string, string> = {
  broad: "bg-cyan-500/15 text-cyan-400",
  niche: "bg-pink-500/15 text-pink-400",
  question: "bg-emerald-500/15 text-emerald-400",
  comparison: "bg-orange-500/15 text-orange-400",
};

const difficultyColors: Record<string, string> = {
  easy: "text-green-400 bg-green-500/10",
  medium: "text-amber-400 bg-amber-500/10",
  hard: "text-red-400 bg-red-500/10",
};

export default function ProjectKeywordsPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("keywords");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("opportunityScore");
  const [sortAsc, setSortAsc] = useState(false);
  const [intentFilter, setIntentFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [volumeOnly, setVolumeOnly] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function load() {
      try {
        const res = await fetch(`/api/keywords?projectId=${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setKeywords(data.keywords ?? []);
        setClusters(data.clusters ?? []);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
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
  const avgVolume =
    withVolume.length > 0 ? Math.round(totalVolume / withVolume.length) : 0;
  const goldenKeywords = keywords.filter(
    (k) => k.opportunityScore >= 20
  ).length;
  const fromCompetitors = keywords.filter(
    (k) => k.source === "competitor"
  ).length;
  const withSerp = keywords.filter((k) => k.serpDifficulty !== null).length;

  const intents = [...new Set(keywords.map((k) => k.intent))];
  const categories = [...new Set(keywords.map((k) => k.category))];
  const sources = [...new Set(keywords.map((k) => k.source))];

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (keywords.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keywords</h1>
          <p className="mt-1 text-sm text-muted">
            All keywords discovered across your analyses.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Search className="h-7 w-7 text-accent-light" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No keywords yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted">
            Run an analysis on the Analyze page to discover keywords for your
            site.
          </p>
          <a
            href={id ? `/dashboard/projects/${id}/analyze` : "/dashboard/analyze"}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-light"
          >
            Go to Analyze
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Keywords</h1>
        <p className="mt-1 text-sm text-muted">
          {keywords.length} keywords · {clusters.length} topic clusters ·{" "}
          {fromCompetitors} from competitors · {withSerp} with SERP data
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Total</span>
            <Target className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold">{keywords.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">With Volume</span>
            <TrendingUp className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold">{withVolume.length}</p>
          <p className="mt-0.5 text-xs text-muted">
            avg. {avgVolume.toLocaleString()}/mo
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Golden</span>
            <Sparkles className="h-4 w-4 text-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400">
            {goldenKeywords}
          </p>
          <p className="mt-0.5 text-xs text-muted">opportunity &ge; 20</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Clusters</span>
            <Layers className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold">{clusters.length}</p>
          <p className="mt-0.5 text-xs text-muted">article topics</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Competitor</span>
            <Zap className="h-4 w-4 text-muted" />
          </div>
          <p className="mt-2 text-2xl font-bold">{fromCompetitors}</p>
          <p className="mt-0.5 text-xs text-muted">stolen keywords</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-card p-1">
        <button
          onClick={() => setTab("keywords")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "keywords"
              ? "bg-accent/15 text-accent-light"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Target className="h-4 w-4" />
          Keywords ({filtered.length})
        </button>
        <button
          onClick={() => setTab("clusters")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "clusters"
              ? "bg-accent/15 text-accent-light"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Layers className="h-4 w-4" />
          Topic Clusters ({clusters.length})
        </button>
      </div>

      {tab === "keywords" && (
        <KeywordsTab
          keywords={filtered}
          allKeywords={keywords}
          search={search}
          setSearch={setSearch}
          volumeOnly={volumeOnly}
          setVolumeOnly={setVolumeOnly}
          intentFilter={intentFilter}
          setIntentFilter={setIntentFilter}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          sortField={sortField}
          sortAsc={sortAsc}
          handleSort={handleSort}
          intents={intents}
          categories={categories}
          sources={sources}
        />
      )}

      {tab === "clusters" && <ClustersTab clusters={clusters} />}
    </div>
  );
}

// ─── Keywords Tab ───────────────────────────────────────────

function KeywordsTab({
  keywords,
  allKeywords,
  search,
  setSearch,
  volumeOnly,
  setVolumeOnly,
  intentFilter,
  setIntentFilter,
  categoryFilter,
  setCategoryFilter,
  sourceFilter,
  setSourceFilter,
  sortField,
  sortAsc,
  handleSort,
  intents,
  categories,
  sources,
}: {
  keywords: Keyword[];
  allKeywords: Keyword[];
  search: string;
  setSearch: (v: string) => void;
  volumeOnly: boolean;
  setVolumeOnly: (v: boolean) => void;
  intentFilter: string | null;
  setIntentFilter: (v: string | null) => void;
  categoryFilter: string | null;
  setCategoryFilter: (v: string | null) => void;
  sourceFilter: string | null;
  setSourceFilter: (v: string | null) => void;
  sortField: SortField;
  sortAsc: boolean;
  handleSort: (f: SortField) => void;
  intents: string[];
  categories: string[];
  sources: string[];
}) {
  return (
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
          <FilterGroup
            label="Intent"
            options={intents}
            current={intentFilter}
            onChange={setIntentFilter}
          />
          <FilterGroup
            label="Category"
            options={categories}
            current={categoryFilter}
            onChange={setCategoryFilter}
          />
          <FilterGroup
            label="Source"
            options={sources}
            current={sourceFilter}
            onChange={setSourceFilter}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
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
              {keywords.map((kw) => (
                <tr
                  key={kw.id}
                  className="border-b border-border/50 transition hover:bg-card/80"
                >
                  <td className="px-4 py-3 font-medium">{kw.keyword}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        categoryColors[kw.category] ?? "bg-card text-muted"
                      }`}
                    >
                      {kw.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                        intentColors[kw.intent] ?? "bg-card text-muted"
                      }`}
                    >
                      {kw.intent}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <SourceBadge source={kw.source} />
                  </td>
                  <td className="px-4 py-3">
                    <OpportunityBadge score={kw.opportunityScore} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    {kw.searchVolume.toLocaleString()}
                  </td>
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
                  <td className="px-4 py-3 font-mono text-xs">
                    ${kw.cpc.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {keywords.length === 0 && (
          <div className="py-10 text-center text-sm text-muted">
            No keywords match your filters.
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Showing {keywords.length} of {allKeywords.length} keywords
      </p>
    </>
  );
}

// ─── Clusters Tab ───────────────────────────────────────────

function ClustersTab({ clusters }: { clusters: Cluster[] }) {
  if (clusters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16">
        <Layers className="mb-3 h-8 w-8 text-muted" />
        <h3 className="mb-1 text-lg font-semibold">No clusters yet</h3>
        <p className="max-w-sm text-center text-sm text-muted">
          Run a new analysis to generate topic clusters. Each cluster becomes an
          article to write.
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
              className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                difficultyColors[cluster.difficulty] ?? "text-muted bg-card"
              }`}
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
            <span className="text-xs font-medium text-foreground">
              Pillar:{" "}
            </span>
            <span className="text-xs text-muted">{cluster.pillarKeyword}</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {cluster.supportingKeywords.slice(0, 6).map((kw) => (
              <span
                key={kw}
                className="rounded-md bg-card-hover px-2 py-0.5 text-xs text-muted"
              >
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
              className={`rounded-md px-2 py-0.5 text-xs font-medium capitalize ${
                intentColors[cluster.searchIntent] ?? "bg-card text-muted"
              }`}
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

// ─── Shared components ──────────────────────────────────────

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
          current === null
            ? "bg-accent/15 text-accent-light"
            : "text-muted hover:text-foreground"
        }`}
      >
        All
      </button>
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(current === opt ? null : opt)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition ${
            current === opt
              ? "bg-accent/15 text-accent-light"
              : "text-muted hover:text-foreground"
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
    <th
      className="cursor-pointer px-4 py-3 font-medium"
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${current === field ? "text-accent" : ""}`}
        />
      </span>
    </th>
  );
}

function SourceBadge({ source }: { source: string }) {
  const styles: Record<string, string> = {
    seed: "text-muted",
    expanded: "text-cyan-400",
    competitor: "text-orange-400",
  };
  return (
    <span className={`text-xs font-medium capitalize ${styles[source] ?? "text-muted"}`}>
      {source}
    </span>
  );
}

function OpportunityBadge({ score }: { score: number }) {
  let color = "text-muted bg-card";
  if (score >= 50) color = "text-green-400 bg-green-500/10";
  else if (score >= 20) color = "text-amber-400 bg-amber-500/10";
  else if (score > 0) color = "text-orange-400 bg-orange-500/10";
  return (
    <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-medium ${color}`}>
      {score}
    </span>
  );
}

function SerpBadge({ value }: { value: number }) {
  let color = "text-green-400 bg-green-500/10";
  if (value >= 60) color = "text-red-400 bg-red-500/10";
  else if (value >= 30) color = "text-amber-400 bg-amber-500/10";
  return (
    <div className="flex items-center gap-1.5">
      <Shield className="h-3 w-3" />
      <span className={`rounded-md px-1.5 py-0.5 font-mono text-xs font-medium ${color}`}>
        {value}
      </span>
    </div>
  );
}

function CompetitionBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct < 30 ? "bg-green-500" : pct < 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-xs text-muted">{pct}%</span>
    </div>
  );
}
