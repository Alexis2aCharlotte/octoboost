-- =============================================================
-- OctoBoost — Seed Demo Data
-- Duplicates Niches Hunter project from your account to demo user
-- Uses temp tables + SELECT * to avoid hardcoding column names
-- =============================================================

DO $$
DECLARE
  v_old_user_id uuid := 'cebe7537-c6e4-4425-8854-37b734e60101'; -- Alexis
  v_new_user_id uuid := 'c2724b38-35c3-4017-84ea-4d0a6f98067f'; -- demo@octoboost.com
  v_old_project_id uuid;
  v_new_project_id uuid := gen_random_uuid();
  rec record;
BEGIN

  -- ─── Find the Niches Hunter project ──────────────────────
  SELECT id INTO v_old_project_id
    FROM projects
   WHERE user_id = v_old_user_id
     AND slug LIKE 'niches-hunter%';

  IF v_old_project_id IS NULL THEN
    RAISE EXCEPTION 'Project niches-hunter not found for user %', v_old_user_id;
  END IF;

  RAISE NOTICE 'Source project: %', v_old_project_id;

  -- ─── ID mapping tables ──────────────────────────────────
  CREATE TEMP TABLE _map_analyses (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_clusters (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_articles (old_id uuid, new_id uuid) ON COMMIT DROP;
  CREATE TEMP TABLE _map_channels (old_id uuid, new_id uuid) ON COMMIT DROP;

  -- ─── 1. Copy project ───────────────────────────────────
  CREATE TEMP TABLE _tmp AS SELECT * FROM projects WHERE id = v_old_project_id;
  UPDATE _tmp SET id = v_new_project_id, user_id = v_new_user_id, api_key = NULL;
  INSERT INTO projects SELECT * FROM _tmp;
  DROP TABLE _tmp;

  -- Fix the slug to be clean for the demo
  UPDATE projects SET slug = 'niches-hunter' WHERE id = v_new_project_id;

  RAISE NOTICE '✅ Project copied → %', v_new_project_id;

  -- ─── 2. Copy analyses ──────────────────────────────────
  FOR rec IN SELECT id FROM analyses WHERE project_id = v_old_project_id LOOP
    INSERT INTO _map_analyses VALUES (rec.id, gen_random_uuid());
  END LOOP;

  CREATE TEMP TABLE _tmp AS
    SELECT a.* FROM analyses a JOIN _map_analyses m ON m.old_id = a.id;
  UPDATE _tmp SET
    id = m.new_id,
    project_id = v_new_project_id
    FROM _map_analyses m WHERE _tmp.id = m.old_id;
  INSERT INTO analyses SELECT * FROM _tmp;
  DROP TABLE _tmp;

  RAISE NOTICE '✅ Analyses copied: %', (SELECT count(*) FROM _map_analyses);

  -- ─── 3. Copy keywords ─────────────────────────────────
  CREATE TEMP TABLE _tmp AS
    SELECT k.* FROM keywords k JOIN _map_analyses m ON m.old_id = k.analysis_id;
  UPDATE _tmp SET
    id = gen_random_uuid(),
    analysis_id = m.new_id
    FROM _map_analyses m WHERE _tmp.analysis_id = m.old_id;
  INSERT INTO keywords SELECT * FROM _tmp;
  RAISE NOTICE '✅ Keywords copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 4. Copy keyword_clusters ──────────────────────────
  FOR rec IN
    SELECT kc.id FROM keyword_clusters kc
    JOIN _map_analyses m ON m.old_id = kc.analysis_id
  LOOP
    INSERT INTO _map_clusters VALUES (rec.id, gen_random_uuid());
  END LOOP;

  CREATE TEMP TABLE _tmp AS
    SELECT kc.* FROM keyword_clusters kc JOIN _map_clusters mc ON mc.old_id = kc.id;
  UPDATE _tmp SET
    id = mc.new_id,
    analysis_id = ma.new_id
    FROM _map_clusters mc, _map_analyses ma
    WHERE _tmp.id = mc.old_id AND _tmp.analysis_id = ma.old_id;
  INSERT INTO keyword_clusters SELECT * FROM _tmp;
  RAISE NOTICE '✅ Clusters copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 5. Copy competitors ──────────────────────────────
  CREATE TEMP TABLE _tmp AS
    SELECT c.* FROM competitors c JOIN _map_analyses m ON m.old_id = c.analysis_id;
  UPDATE _tmp SET
    id = gen_random_uuid(),
    analysis_id = m.new_id
    FROM _map_analyses m WHERE _tmp.analysis_id = m.old_id;
  INSERT INTO competitors SELECT * FROM _tmp;
  RAISE NOTICE '✅ Competitors copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 6. Copy articles ─────────────────────────────────
  FOR rec IN
    SELECT a.id FROM articles a WHERE a.project_id = v_old_project_id
  LOOP
    INSERT INTO _map_articles VALUES (rec.id, gen_random_uuid());
  END LOOP;

  CREATE TEMP TABLE _tmp AS
    SELECT a.* FROM articles a JOIN _map_articles ma ON ma.old_id = a.id;
  UPDATE _tmp SET
    id = ma.new_id,
    project_id = v_new_project_id,
    cluster_id = mc.new_id
    FROM _map_articles ma, _map_clusters mc
    WHERE _tmp.id = ma.old_id AND _tmp.cluster_id = mc.old_id;
  INSERT INTO articles SELECT * FROM _tmp;
  RAISE NOTICE '✅ Articles copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 7. Copy channels ─────────────────────────────────
  FOR rec IN
    SELECT id FROM channels WHERE project_id = v_old_project_id
  LOOP
    INSERT INTO _map_channels VALUES (rec.id, gen_random_uuid());
  END LOOP;

  CREATE TEMP TABLE _tmp AS
    SELECT c.* FROM channels c JOIN _map_channels mc ON mc.old_id = c.id;
  UPDATE _tmp SET
    id = mc.new_id,
    project_id = v_new_project_id
    FROM _map_channels mc WHERE _tmp.id = mc.old_id;
  INSERT INTO channels SELECT * FROM _tmp;
  RAISE NOTICE '✅ Channels copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 8. Copy article_variants ──────────────────────────
  CREATE TEMP TABLE _tmp AS
    SELECT av.* FROM article_variants av
    JOIN _map_articles ma ON ma.old_id = av.article_id;
  UPDATE _tmp SET
    id = gen_random_uuid(),
    article_id = ma.new_id,
    channel_id = mc.new_id
    FROM _map_articles ma, _map_channels mc
    WHERE _tmp.article_id = ma.old_id AND _tmp.channel_id = mc.old_id;
  INSERT INTO article_variants SELECT * FROM _tmp;
  RAISE NOTICE '✅ Variants copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── 9. Copy site_pages (if any) ──────────────────────
  CREATE TEMP TABLE _tmp AS
    SELECT * FROM site_pages WHERE project_id = v_old_project_id;
  UPDATE _tmp SET
    id = gen_random_uuid(),
    project_id = v_new_project_id;
  INSERT INTO site_pages SELECT * FROM _tmp;
  RAISE NOTICE '✅ Site pages copied: %', (SELECT count(*) FROM _tmp);
  DROP TABLE _tmp;

  -- ─── Summary ──────────────────────────────────────────
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE '  DEMO SEED COMPLETE';
  RAISE NOTICE '  DEMO_PROJECT_ID = %', v_new_project_id;
  RAISE NOTICE '  DEMO_PROJECT_SLUG = niches-hunter';
  RAISE NOTICE '══════════════════════════════════════';

END $$;
