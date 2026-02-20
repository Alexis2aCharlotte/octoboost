-- Migration: Add site_connection to projects + canonical_url to articles
-- Run this in Supabase SQL Editor

-- Site connection config (custom API endpoint, WordPress, etc.)
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS site_connection jsonb DEFAULT null;

-- Canonical URL for published articles (points to the user's own site)
ALTER TABLE public.articles
ADD COLUMN IF NOT EXISTS canonical_url text DEFAULT null;

-- Example site_connection structure:
-- {
--   "type": "custom_api",
--   "endpoint_url": "https://mysite.com/api/octoboost",
--   "secret": "ob_xxx...",
--   "status": "connected",
--   "last_tested_at": "2026-02-20T...",
--   "last_error": null
-- }
