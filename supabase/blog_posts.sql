-- Table blog_posts
create table if not exists public.blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text,
  content text not null,
  cover_image text,
  category text,
  tags text[],
  author text not null default 'OctoBoost',
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  meta_title text,
  meta_description text,
  views integer not null default 0
);

-- Index pour les requêtes fréquentes
create index if not exists idx_blog_posts_published on public.blog_posts (published, published_at desc);
create index if not exists idx_blog_posts_slug on public.blog_posts (slug);
create index if not exists idx_blog_posts_category on public.blog_posts (category);

-- RLS : lecture publique pour les articles publiés
alter table public.blog_posts enable row level security;

create policy "Public can read published posts"
  on public.blog_posts for select
  using (published = true);

create policy "Service role can do everything"
  on public.blog_posts for all
  using (true)
  with check (true);

-- Trigger pour updated_at automatique
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row
  execute function public.set_updated_at();
