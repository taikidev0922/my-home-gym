create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  instagram_url text,
  tiktok_url text,
  x_url text,
  created_at timestamptz not null default now()
);

create table gym_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  scale text not null check (scale in ('compact', 'standard', 'serious')),
  area_tatami numeric not null,
  budget integer not null,
  summary text not null,
  tags text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table gym_post_images (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references gym_posts(id) on delete cascade,
  storage_path text not null,
  alt text not null,
  sort_order integer not null default 0
);

create table gym_post_categories (
  post_id uuid not null references gym_posts(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, category)
);

create table post_likes (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references gym_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table blog_articles (
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

create table blog_keyword_candidates (
  id uuid primary key default gen_random_uuid(),
  keyword text not null unique,
  source text not null default 'seed',
  category text,
  metrics jsonb not null default '{}'::jsonb,
  usage_count integer not null default 0,
  last_used_at timestamptz,
  discovered_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table gym_posts enable row level security;
alter table gym_post_images enable row level security;
alter table gym_post_categories enable row level security;
alter table post_likes enable row level security;
alter table blog_articles enable row level security;
alter table blog_keyword_candidates enable row level security;

insert into storage.buckets (id, name, public)
values
  ('gym-post-images', 'gym-post-images', true),
  ('profile-avatars', 'profile-avatars', true),
  ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

create policy "Public profiles are readable" on profiles for select using (true);
create policy "Users upsert own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users update own profile" on profiles for update using (auth.uid() = id);

create policy "Published posts are readable" on gym_posts for select using (published = true);
create policy "Users read own posts" on gym_posts for select using (auth.uid() = user_id);
create policy "Users create own posts" on gym_posts for insert with check (auth.uid() = user_id);
create policy "Users update own posts" on gym_posts for update using (auth.uid() = user_id);

create policy "Published images are readable" on gym_post_images for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.published = true)
);
create policy "Users read images for own posts" on gym_post_images for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.user_id = auth.uid())
);
create policy "Users create images for own posts" on gym_post_images for insert with check (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.user_id = auth.uid())
);

create policy "Published categories are readable" on gym_post_categories for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_categories.post_id and gym_posts.published = true)
);
create policy "Users read categories for own posts" on gym_post_categories for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_categories.post_id and gym_posts.user_id = auth.uid())
);
create policy "Users create categories for own posts" on gym_post_categories for insert with check (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_categories.post_id and gym_posts.user_id = auth.uid())
);

create policy "Post likes are publicly readable" on post_likes for select using (
  exists (select 1 from gym_posts where gym_posts.id = post_likes.post_id and gym_posts.published = true)
);
create policy "Users create own likes" on post_likes for insert with check (auth.uid() = user_id);
create policy "Users delete own likes" on post_likes for delete using (auth.uid() = user_id);

create policy "Blog articles are publicly readable" on blog_articles for select using (true);
create policy "Blog keywords are publicly readable" on blog_keyword_candidates for select using (true);

create policy "Public gym images are readable" on storage.objects for select using (bucket_id = 'gym-post-images');
create policy "Users upload own gym images" on storage.objects for insert with check (
  bucket_id = 'gym-post-images' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users update own gym images" on storage.objects for update using (
  bucket_id = 'gym-post-images' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Public profile avatars are readable" on storage.objects for select using (bucket_id = 'profile-avatars');
create policy "Users upload own profile avatars" on storage.objects for insert with check (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
create policy "Users update own profile avatars" on storage.objects for update using (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Public blog images are readable" on storage.objects for select using (bucket_id = 'blog-images');

create extension if not exists pg_trgm with schema extensions;

create index gym_posts_published_created_at_idx on gym_posts (published, created_at desc);
create index gym_posts_scale_idx on gym_posts (scale);
create index gym_posts_budget_idx on gym_posts (budget);
create index gym_posts_area_tatami_idx on gym_posts (area_tatami);
create index gym_posts_title_trgm_idx on gym_posts using gin (title extensions.gin_trgm_ops);
create index gym_posts_summary_trgm_idx on gym_posts using gin (summary extensions.gin_trgm_ops);
create index gym_post_categories_category_post_id_idx on gym_post_categories (category, post_id);
create index blog_articles_published_at_idx on blog_articles (published_at desc);
create index blog_articles_keyword_idx on blog_articles (keyword);
create index blog_keyword_candidates_usage_idx on blog_keyword_candidates (usage_count, last_used_at nulls first);
