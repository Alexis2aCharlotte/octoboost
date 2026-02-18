-- Migration: Schedule system
-- Run this in Supabase SQL Editor

ALTER TABLE public.article_variants ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

-- Update status constraint to include 'scheduled'
ALTER TABLE public.article_variants DROP CONSTRAINT IF EXISTS article_variants_status_check;
ALTER TABLE public.article_variants ADD CONSTRAINT article_variants_status_check
  CHECK (status IN ('draft', 'scheduled', 'ready', 'published'));

CREATE INDEX IF NOT EXISTS idx_variants_scheduled_at ON public.article_variants (scheduled_at);
