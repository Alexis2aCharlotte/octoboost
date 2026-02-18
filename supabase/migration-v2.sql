-- OctoBoost SEO Engine V2 Migration
-- Run this in Supabase SQL Editor

-- 1. Add serp_difficulty to keywords
ALTER TABLE public.keywords ADD COLUMN IF NOT EXISTS serp_difficulty integer;

-- 2. Add category and source columns (if not already present from V1)
ALTER TABLE public.keywords ADD COLUMN IF NOT EXISTS category text DEFAULT 'broad';
ALTER TABLE public.keywords ADD COLUMN IF NOT EXISTS source text DEFAULT 'seed';

-- 3. Create keyword_clusters table
CREATE TABLE IF NOT EXISTS public.keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses on delete cascade not null,
  topic text not null,
  article_title text not null,
  pillar_keyword text not null,
  supporting_keywords jsonb default '[]'::jsonb,
  search_intent text,
  difficulty text,
  total_volume integer default 0,
  avg_competition numeric default 0,
  created_at timestamptz default now()
);

-- 4. New indexes
CREATE INDEX IF NOT EXISTS idx_keywords_opportunity ON public.keywords (opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_keywords_source ON public.keywords (source);
CREATE INDEX IF NOT EXISTS idx_clusters_analysis_id ON public.keyword_clusters (analysis_id);

-- 5. RLS for keyword_clusters
ALTER TABLE public.keyword_clusters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clusters"
  ON public.keyword_clusters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      JOIN public.projects ON projects.id = analyses.project_id
      WHERE analyses.id = keyword_clusters.analysis_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own clusters"
  ON public.keyword_clusters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.analyses
      JOIN public.projects ON projects.id = analyses.project_id
      WHERE analyses.id = keyword_clusters.analysis_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own clusters"
  ON public.keyword_clusters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.analyses
      JOIN public.projects ON projects.id = analyses.project_id
      WHERE analyses.id = keyword_clusters.analysis_id
      AND projects.user_id = auth.uid()
    )
  );
