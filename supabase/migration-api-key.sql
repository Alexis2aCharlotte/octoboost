-- Migration: Add api_key to projects for public API access
-- Run this in Supabase SQL Editor

-- Public API key (used by user's site to fetch published articles)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS api_key text DEFAULT null;

-- Create unique index for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_api_key ON public.projects (api_key) WHERE api_key IS NOT NULL;
