-- Migration: Publish system — new platforms + canonical_url
-- Run this in Supabase SQL Editor

-- Add canonical_url to articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS canonical_url text;

-- Update platform_type constraint to include new platforms and remove linkedin
ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_platform_type_check;
ALTER TABLE public.channels ADD CONSTRAINT channels_platform_type_check
  CHECK (platform_type IN (
    'devto', 'hashnode', 'medium', 'reddit', 'wordpress',
    'indiehackers', 'hackernews', 'quora', 'substack'
  ));
