-- Migration: Add Telegraph platform
-- Run this in Supabase SQL Editor

ALTER TABLE public.channels DROP CONSTRAINT IF EXISTS channels_platform_type_check;
ALTER TABLE public.channels ADD CONSTRAINT channels_platform_type_check
  CHECK (platform_type IN (
    'devto', 'hashnode', 'medium', 'reddit', 'wordpress',
    'indiehackers', 'hackernews', 'quora', 'substack',
    'telegraph'
  ));
