"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Globe,
  Plus,
  ChevronRight,
  Loader2,
  Sparkles,
  Trash2,
  Target,
  FileText,
  Layers,
} from "lucide-react";

interface Project {
  id: string;
  name: string;
  slug: string;
  url: string;
  created_at: string;
  latestAnalysisId: string | null;
  latestAnalysis: {
    id: string;
    site_title: string;
    created_at: string;
  } | null;
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data) => setProjects(data.projects ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim() || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim() }),
      });
      const data = await res.json();
      if (data.analysisId) {
        const projRes = await fetch("/api/projects");
        const projData = await projRes.json();
        const proj = (projData.projects ?? []).find(
          (p: Project) => p.latestAnalysisId === data.analysisId
        );
        if (proj) {
          router.push(`/dashboard/projects/${proj.slug || proj.id}/keywords`);
        } else {
          window.location.reload();
        }
      }
    } catch {
      // silent
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDelete(projectId: string) {
    if (
      !confirm(
        "Delete this project and all its data (keywords, articles, clusters)?"
      )
    )
      return;
    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent-light" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">
          Select a project to manage its keywords, articles, and publishing.
        </p>
      </div>

      {/* Add new site */}
      <form
        onSubmit={handleAnalyze}
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background text-muted">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="url"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          placeholder="Add a new site — https://yoursite.com"
          required
          disabled={analyzing}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={analyzing}
          className="flex shrink-0 items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-light disabled:opacity-50"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              Analyze
            </>
          )}
        </button>
      </form>

      {/* Projects */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
            <Sparkles className="h-7 w-7 text-accent-light" />
          </div>
          <h3 className="mb-1 text-lg font-semibold">No projects yet</h3>
          <p className="mb-6 max-w-sm text-center text-sm text-muted">
            Enter your website URL above to run your first analysis.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">
            Your projects ({projects.length})
          </h2>
          {projects.map((project) => (
            <div
              key={project.id}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-5 transition hover:border-accent/30"
            >
              <Link
                href={`/dashboard/projects/${project.slug || project.id}/keywords`}
                className="flex flex-1 items-center gap-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <Globe className="h-6 w-6 text-accent-light" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {project.name || project.url}
                  </p>
                  <p className="text-xs text-muted">{project.url}</p>
                </div>
                {project.latestAnalysis && (
                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Target className="h-3.5 w-3.5" />
                      Keywords
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      Articles
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="h-3.5 w-3.5" />
                      Clusters
                    </span>
                  </div>
                )}
              </Link>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(project.id)}
                  className="rounded-lg p-2 text-muted opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  title="Delete project"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
