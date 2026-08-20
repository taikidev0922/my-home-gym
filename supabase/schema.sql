create table gym_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  scale text not null check (scale in ('compact', 'standard', 'serious')),
  area_tatami numeric not null,
  budget integer not null,
  summary text not null,
  tags text[] not null default '{}',
  author_name text not null default '匿名',
  author_avatar_url text,
  instagram_url text,
  tiktok_url text,
  x_url text,
  website_url text,
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

create table post_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references gym_posts(id) on delete cascade,
  reason text not null,
  contact text,
  created_at timestamptz not null default now()
);

alter table gym_posts enable row level security;
alter table gym_post_images enable row level security;
alter table gym_post_categories enable row level security;
alter table post_deletion_requests enable row level security;

insert into storage.buckets (id, name, public)
values
  ('gym-post-images', 'gym-post-images', true),
  ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

create policy "Published posts are readable" on gym_posts for select using (published = true);

create policy "Published images are readable" on gym_post_images for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.published = true)
);

create policy "Published categories are readable" on gym_post_categories for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_categories.post_id and gym_posts.published = true)
);

create policy "Public gym images are readable" on storage.objects for select using (bucket_id = 'gym-post-images');

create policy "Public profile avatars are readable" on storage.objects for select using (bucket_id = 'profile-avatars');

create extension if not exists pg_trgm with schema extensions;

create index gym_posts_published_created_at_idx on gym_posts (published, created_at desc);
create index gym_posts_scale_idx on gym_posts (scale);
create index gym_posts_budget_idx on gym_posts (budget);
create index gym_posts_area_tatami_idx on gym_posts (area_tatami);
create index gym_posts_title_trgm_idx on gym_posts using gin (title extensions.gin_trgm_ops);
create index gym_posts_summary_trgm_idx on gym_posts using gin (summary extensions.gin_trgm_ops);
create index gym_post_categories_category_post_id_idx on gym_post_categories (category, post_id);
create index post_deletion_requests_post_id_idx on post_deletion_requests (post_id);
