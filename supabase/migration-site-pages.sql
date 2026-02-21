-- Migration: Add site_pages table for internal linking
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.site_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.projects ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  path text NOT NULL,
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_site_pages_project ON public.site_pages (project_id);

-- Avoid duplicates: one entry per URL per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_site_pages_project_url ON public.site_pages (project_id, url);

-- RLS
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own site pages"
  ON public.site_pages FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert own site pages"
  ON public.site_pages FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own site pages"
  ON public.site_pages FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid()));
