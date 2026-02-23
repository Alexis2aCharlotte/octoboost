DO $$
DECLARE
  v_src uuid;
  v_demo uuid := '8e1ee590-cb83-4a38-a8b8-29f233b70e7c';
  v_cnt integer;
BEGIN
  SELECT id INTO v_src FROM projects
  WHERE user_id = 'cebe7537-c6e4-4425-8854-37b734e60101'
    AND slug LIKE 'niches-hunter%' AND id != v_demo;

  IF v_src IS NULL THEN
    RAISE EXCEPTION 'Source not found';
  END IF;

  -- Cluster map
  CREATE TEMP TABLE _cm (o uuid, n uuid) ON COMMIT DROP;
  INSERT INTO _cm SELECT DISTINCT s.id, d.id
  FROM keyword_clusters s
  JOIN analyses sa ON sa.id = s.analysis_id AND sa.project_id = v_src
  JOIN keyword_clusters d ON d.pillar_keyword = s.pillar_keyword
  JOIN analyses da ON da.id = d.analysis_id AND da.project_id = v_demo;

  -- Channel map
  CREATE TEMP TABLE _chm (o uuid, n uuid) ON COMMIT DROP;
  INSERT INTO _chm SELECT DISTINCT s.id, d.id
  FROM channels s
  JOIN channels d ON d.platform_type = s.platform_type AND d.project_id = v_demo
  WHERE s.project_id = v_src;

  -- 1) Update existing articles
  UPDATE articles d SET
    status = s.status, content = s.content, outline = s.outline,
    word_count = s.word_count, meta_description = s.meta_description,
    canonical_url = s.canonical_url, scheduled_at = s.scheduled_at,
    model_used = s.model_used, updated_at = s.updated_at
  FROM articles s
  WHERE s.project_id = v_src AND d.project_id = v_demo AND d.title = s.title;

  -- 2) Update existing variants
  UPDATE article_variants dv SET
    status = sv.status, content = sv.content, title = sv.title,
    word_count = sv.word_count, published_url = sv.published_url,
    published_at = sv.published_at, scheduled_at = sv.scheduled_at,
    model_used = sv.model_used, updated_at = sv.updated_at
  FROM article_variants sv, articles sa, articles da, _chm
  WHERE sv.article_id = sa.id AND sa.project_id = v_src
    AND da.id = dv.article_id AND da.project_id = v_demo
    AND da.title = sa.title
    AND sv.channel_id = _chm.o AND dv.channel_id = _chm.n;

  -- 3) Insert missing variants for existing articles
  CREATE TEMP TABLE _mv AS
  SELECT sv.*
  FROM article_variants sv
  JOIN articles sa ON sa.id = sv.article_id AND sa.project_id = v_src
  JOIN articles da ON da.title = sa.title AND da.project_id = v_demo
  JOIN _chm ON _chm.o = sv.channel_id
  WHERE NOT EXISTS (
    SELECT 1 FROM article_variants dv
    WHERE dv.article_id = da.id AND dv.channel_id = _chm.n
  );

  UPDATE _mv SET id = gen_random_uuid();
  UPDATE _mv SET article_id = da.id
  FROM articles sa, articles da
  WHERE _mv.article_id = sa.id AND sa.project_id = v_src
    AND da.title = sa.title AND da.project_id = v_demo;
  UPDATE _mv SET channel_id = _chm.n FROM _chm WHERE _mv.channel_id = _chm.o;

  SELECT count(*) INTO v_cnt FROM _mv;
  INSERT INTO article_variants SELECT * FROM _mv;
  DROP TABLE _mv;
  RAISE NOTICE 'Missing variants inserted: %', v_cnt;

  -- 4) Insert new articles
  CREATE TEMP TABLE _na AS
  SELECT * FROM articles
  WHERE project_id = v_src
    AND title NOT IN (SELECT title FROM articles WHERE project_id = v_demo);

  SELECT count(*) INTO v_cnt FROM _na;
  RAISE NOTICE 'New articles to insert: %', v_cnt;

  IF v_cnt > 0 THEN
    CREATE TEMP TABLE _am (o uuid, n uuid) ON COMMIT DROP;
    INSERT INTO _am SELECT id, gen_random_uuid() FROM _na;

    CREATE TEMP TABLE _sa AS SELECT * FROM _na;
    UPDATE _sa SET id = _am.n FROM _am WHERE _sa.id = _am.o;
    UPDATE _sa SET project_id = v_demo;
    UPDATE _sa SET cluster_id = _cm.n FROM _cm WHERE _sa.cluster_id = _cm.o;
    INSERT INTO articles SELECT * FROM _sa;
    DROP TABLE _sa;

    -- Variants for new articles
    CREATE TEMP TABLE _nv AS
    SELECT av.* FROM article_variants av JOIN _am ON _am.o = av.article_id;
    UPDATE _nv SET id = gen_random_uuid();
    UPDATE _nv SET article_id = _am.n FROM _am WHERE _nv.article_id = _am.o;
    UPDATE _nv SET channel_id = _chm.n FROM _chm WHERE _nv.channel_id = _chm.o;
    INSERT INTO article_variants SELECT * FROM _nv;
    DROP TABLE _nv;
  END IF;

  DROP TABLE IF EXISTS _na;
  RAISE NOTICE 'SYNC COMPLETE';
END $$;
