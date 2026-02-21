-- Enable required extensions for scheduled publishing
-- Run this in Supabase SQL Editor (requires superuser/service_role)

-- pg_cron: schedule recurring jobs inside PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- pg_net: make HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule the publish-scheduled job to run every 10 minutes
--
-- IMPORTANT: Replace <YOUR_VERCEL_URL> below with your actual deployment URL
-- Examples: octoboost.vercel.app, yourdomain.com, etc.
--
-- The CRON_SECRET below matches the one in your .env.local
-- If you deploy to Vercel, also add CRON_SECRET to your Vercel environment variables

SELECT cron.schedule(
  'publish-scheduled-variants',
  '*/10 * * * *',
  $$
  SELECT extensions.http_post(
    url := 'https://<YOUR_VERCEL_URL>/api/cron/publish-scheduled',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 49d01aade9c63a6ee7452b1282074d1775b8c85743b5908d87dab4c87b9117dc'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To check job execution history:
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;

-- To remove the job if needed:
-- SELECT cron.unschedule('publish-scheduled-variants');
