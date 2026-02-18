-- Migration: Add slug column to projects
-- Run this in Supabase SQL Editor

-- 1. Add slug column
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS slug text;

-- 2. Backfill existing projects with a slug derived from name or url
UPDATE public.projects
SET slug = lower(
  regexp_replace(
    regexp_replace(
      regexp_replace(
        coalesce(name, regexp_replace(url, '^https?://(www\.)?', '')),
        '[^a-zA-Z0-9]+', '-', 'g'
      ),
      '^-+|-+$', '', 'g'
    ),
    '^(.{0,60}).*$', '\1'
  )
)
WHERE slug IS NULL;

-- 3. Add unique index per user (each user's slugs must be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_user_slug ON public.projects (user_id, slug);
