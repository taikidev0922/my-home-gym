-- Remove login/user features: posts become anonymous with per-post author info.
-- Nickname, icon, and SNS links move from profiles onto each post.

alter table gym_posts
  add column if not exists author_name text not null default '匿名',
  add column if not exists author_avatar_url text,
  add column if not exists instagram_url text,
  add column if not exists tiktok_url text,
  add column if not exists x_url text;

-- Backfill author info from the old profiles table.
-- Apply the same safety rules the app used: never surface email-like display
-- names, and drop gravatar/Auth0 CDN avatars.
update gym_posts
set
  author_name = case
    when p.display_name is null or btrim(p.display_name) = '' or p.display_name like '%@%' then '匿名'
    else btrim(p.display_name)
  end,
  author_avatar_url = case
    when p.avatar_url is null or btrim(p.avatar_url) = '' then null
    when p.avatar_url ilike '%gravatar%' or p.avatar_url ilike '%auth0.com%' then null
    else p.avatar_url
  end,
  instagram_url = nullif(btrim(coalesce(p.instagram_url, '')), ''),
  tiktok_url = nullif(btrim(coalesce(p.tiktok_url, '')), ''),
  x_url = nullif(btrim(coalesce(p.x_url, '')), '')
from profiles p
where p.id = gym_posts.user_id;

drop table if exists post_likes;

alter table gym_posts drop column if exists user_id;

drop table if exists profiles;

-- Anyone can file a deletion request for a post. Requests are written through
-- the service role only and reviewed by the site owner directly in the DB, so
-- RLS stays enabled with no public policies.
create table if not exists post_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references gym_posts(id) on delete cascade,
  reason text not null,
  contact text,
  created_at timestamptz not null default now()
);

alter table post_deletion_requests enable row level security;

create index if not exists post_deletion_requests_post_id_idx on post_deletion_requests (post_id);
