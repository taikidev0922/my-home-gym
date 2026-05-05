create table if not exists public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null,
  keyword text not null,
  category text not null default 'guide',
  image_url text,
  reading_minutes integer not null default 5,
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  article_source text not null default 'fallback',
  keyword_source text not null default 'seed',
  blocks jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.blog_keyword_candidates (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  source text not null default 'seed',
  category text,
  metrics jsonb not null default '{}'::jsonb,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  discovered_at timestamptz not null default now()
);

alter table public.blog_articles enable row level security;
alter table public.blog_keyword_candidates enable row level security;

drop policy if exists "Blog articles are publicly readable" on public.blog_articles;
create policy "Blog articles are publicly readable"
  on public.blog_articles for select
  to anon, authenticated
  using (true);

drop policy if exists "Blog keywords are publicly readable" on public.blog_keyword_candidates;
create policy "Blog keywords are publicly readable"
  on public.blog_keyword_candidates for select
  to anon, authenticated
  using (true);

create index if not exists blog_articles_published_at_idx on public.blog_articles (published_at desc);
create index if not exists blog_articles_keyword_idx on public.blog_articles (keyword);
create index if not exists blog_keyword_candidates_usage_idx on public.blog_keyword_candidates (usage_count, last_used_at nulls first);
