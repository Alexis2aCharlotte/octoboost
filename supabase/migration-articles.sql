-- Migration: Add articles table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cluster_id uuid REFERENCES public.keyword_clusters ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  slug text,
  content text NOT NULL,
  outline jsonb DEFAULT '[]'::jsonb,
  word_count integer DEFAULT 0,
  pillar_keyword text,
  supporting_keywords jsonb DEFAULT '[]'::jsonb,
  meta_description text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'published')),
  model_used text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_articles_cluster_id ON public.articles (cluster_id);
CREATE INDEX IF NOT EXISTS idx_articles_project_id ON public.articles (project_id);
CREATE INDEX IF NOT EXISTS idx_articles_status ON public.articles (status);

ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own articles"
  ON public.articles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own articles"
  ON public.articles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own articles"
  ON public.articles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own articles"
  ON public.articles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = articles.project_id
      AND projects.user_id = auth.uid()
    )
  );
