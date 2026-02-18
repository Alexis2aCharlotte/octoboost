-- OctoBoost Database Schema
-- Run this in Supabase SQL Editor (supabase.com/dashboard > SQL Editor)

-- ============================================
-- TABLES
-- ============================================

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text,
  slug text,
  url text not null,
  created_at timestamptz default now()
);

create unique index idx_projects_user_slug on public.projects (user_id, slug);

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  site_title text,
  site_description text,
  product_summary text,
  target_audience text,
  content_angles jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

create table public.keywords (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses on delete cascade not null,
  keyword text not null,
  intent text,
  relevance text,
  category text default 'broad',
  search_volume integer default 0,
  cpc numeric default 0,
  competition numeric default 0,
  competition_level text,
  trend jsonb default '[]'::jsonb,
  opportunity_score integer default 0,
  serp_difficulty integer,
  source text default 'seed'
);

create table public.keyword_clusters (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses on delete cascade not null,
  topic text not null,
  article_title text not null,
  pillar_keyword text not null,
  supporting_keywords jsonb default '[]'::jsonb,
  search_intent text,
  difficulty text,
  total_volume integer default 0,
  avg_competition numeric default 0,
  created_at timestamptz default now()
);

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid references public.analyses on delete cascade not null,
  name text,
  url text,
  reason text
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  cluster_id uuid references public.keyword_clusters on delete cascade not null,
  project_id uuid references public.projects on delete cascade not null,
  title text not null,
  slug text,
  content text not null,
  outline jsonb default '[]'::jsonb,
  word_count integer default 0,
  pillar_keyword text,
  supporting_keywords jsonb default '[]'::jsonb,
  meta_description text,
  status text default 'draft' check (status in ('draft', 'ready', 'published')),
  model_used text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  platform_type text not null check (platform_type in ('devto', 'hashnode', 'medium', 'reddit', 'wordpress', 'telegraph', 'blogger', 'indiehackers', 'hackernews', 'quora', 'substack')),
  name text not null,
  config jsonb default '{}'::jsonb,
  constraints jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table public.article_variants (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles on delete cascade not null,
  channel_id uuid references public.channels on delete cascade not null,
  title text not null,
  content text not null,
  format text default 'markdown' check (format in ('markdown', 'html', 'plain')),
  word_count integer default 0,
  status text default 'draft' check (status in ('draft', 'ready', 'scheduled', 'published')),
  published_url text,
  published_at timestamptz,
  model_used text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index idx_variants_article_channel on public.article_variants (article_id, channel_id);

-- ============================================
-- INDEXES
-- ============================================

create index idx_projects_user_id on public.projects (user_id);
create index idx_analyses_project_id on public.analyses (project_id);
create index idx_keywords_analysis_id on public.keywords (analysis_id);
create index idx_keywords_opportunity on public.keywords (opportunity_score desc);
create index idx_keywords_source on public.keywords (source);
create index idx_clusters_analysis_id on public.keyword_clusters (analysis_id);
create index idx_competitors_analysis_id on public.competitors (analysis_id);
create index idx_articles_cluster_id on public.articles (cluster_id);
create index idx_articles_project_id on public.articles (project_id);
create index idx_articles_status on public.articles (status);
create index idx_channels_project_id on public.channels (project_id);
create index idx_variants_article_id on public.article_variants (article_id);
create index idx_variants_channel_id on public.article_variants (channel_id);
create index idx_variants_status on public.article_variants (status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.keywords enable row level security;
alter table public.keyword_clusters enable row level security;
alter table public.competitors enable row level security;
alter table public.articles enable row level security;
alter table public.channels enable row level security;
alter table public.article_variants enable row level security;

-- Projects: users can only access their own
create policy "Users can view own projects"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "Users can insert own projects"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on public.projects for delete
  using (auth.uid() = user_id);

-- Analyses: access via project ownership
create policy "Users can view own analyses"
  on public.analyses for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = analyses.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own analyses"
  on public.analyses for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = analyses.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own analyses"
  on public.analyses for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = analyses.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Keywords: access via analysis → project ownership
create policy "Users can view own keywords"
  on public.keywords for select
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keywords.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own keywords"
  on public.keywords for insert
  with check (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keywords.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own keywords"
  on public.keywords for delete
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keywords.analysis_id
      and projects.user_id = auth.uid()
    )
  );

-- Clusters: access via analysis → project ownership
create policy "Users can view own clusters"
  on public.keyword_clusters for select
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keyword_clusters.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own clusters"
  on public.keyword_clusters for insert
  with check (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keyword_clusters.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own clusters"
  on public.keyword_clusters for delete
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = keyword_clusters.analysis_id
      and projects.user_id = auth.uid()
    )
  );

-- Competitors: access via analysis → project ownership
create policy "Users can view own competitors"
  on public.competitors for select
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = competitors.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own competitors"
  on public.competitors for insert
  with check (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = competitors.analysis_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own competitors"
  on public.competitors for delete
  using (
    exists (
      select 1 from public.analyses
      join public.projects on projects.id = analyses.project_id
      where analyses.id = competitors.analysis_id
      and projects.user_id = auth.uid()
    )
  );

-- Articles: access via project ownership
create policy "Users can view own articles"
  on public.articles for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = articles.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own articles"
  on public.articles for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = articles.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own articles"
  on public.articles for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = articles.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own articles"
  on public.articles for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = articles.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Channels: access via project ownership
create policy "Users can view own channels"
  on public.channels for select
  using (
    exists (
      select 1 from public.projects
      where projects.id = channels.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own channels"
  on public.channels for insert
  with check (
    exists (
      select 1 from public.projects
      where projects.id = channels.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own channels"
  on public.channels for update
  using (
    exists (
      select 1 from public.projects
      where projects.id = channels.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own channels"
  on public.channels for delete
  using (
    exists (
      select 1 from public.projects
      where projects.id = channels.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Article variants: access via article → project ownership
create policy "Users can view own variants"
  on public.article_variants for select
  using (
    exists (
      select 1 from public.articles
      join public.projects on projects.id = articles.project_id
      where articles.id = article_variants.article_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can insert own variants"
  on public.article_variants for insert
  with check (
    exists (
      select 1 from public.articles
      join public.projects on projects.id = articles.project_id
      where articles.id = article_variants.article_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can update own variants"
  on public.article_variants for update
  using (
    exists (
      select 1 from public.articles
      join public.projects on projects.id = articles.project_id
      where articles.id = article_variants.article_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own variants"
  on public.article_variants for delete
  using (
    exists (
      select 1 from public.articles
      join public.projects on projects.id = articles.project_id
      where articles.id = article_variants.article_id
      and projects.user_id = auth.uid()
    )
  );
