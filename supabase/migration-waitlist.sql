-- Waitlist / Newsletter table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- Allow anonymous inserts (public waitlist, no auth required)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Only authenticated users (you) can read the list
CREATE POLICY "Authenticated users can read waitlist"
  ON waitlist
  FOR SELECT
  TO authenticated
  USING (true);

-- Index for quick duplicate check
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist (email);
