-- Migration: Channels & Article Variants
-- Run this in Supabase SQL Editor

-- ============================================
-- TABLES
-- ============================================

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects on delete cascade not null,
  platform_type text not null check (platform_type in ('medium', 'devto', 'reddit', 'linkedin', 'hashnode', 'wordpress')),
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

-- Unique constraint: one variant per article per channel
create unique index idx_variants_article_channel on public.article_variants (article_id, channel_id);

-- ============================================
-- INDEXES
-- ============================================

create index idx_channels_project_id on public.channels (project_id);
create index idx_variants_article_id on public.article_variants (article_id);
create index idx_variants_channel_id on public.article_variants (channel_id);
create index idx_variants_status on public.article_variants (status);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.channels enable row level security;
alter table public.article_variants enable row level security;

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
