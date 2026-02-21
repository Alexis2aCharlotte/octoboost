-- Add key_tools column to analyses table
-- Stores extracted tools/features from the site as JSONB array
-- Each entry: { "name": "Feature Name", "description": "What it does" }

ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS key_tools jsonb DEFAULT '[]'::jsonb;
