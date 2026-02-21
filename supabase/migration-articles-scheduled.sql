-- Add scheduled_at column and extend status check to support scheduling for articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

ALTER TABLE public.articles
  DROP CONSTRAINT IF EXISTS articles_status_check;

ALTER TABLE public.articles
  ADD CONSTRAINT articles_status_check
    CHECK (status IN ('draft', 'ready', 'scheduled', 'published'));

CREATE INDEX IF NOT EXISTS idx_articles_scheduled_at ON public.articles (scheduled_at)
  WHERE scheduled_at IS NOT NULL;
