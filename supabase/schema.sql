create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  instagram_url text,
  youtube_url text,
  x_url text,
  created_at timestamptz not null default now()
);

create table gym_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  slug text unique not null,
  location text,
  scale text not null check (scale in ('compact', 'standard', 'serious')),
  area_sqm numeric not null,
  budget integer not null,
  monthly_maintenance integer not null default 0,
  summary text not null,
  highlights text[] not null default '{}',
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

create table gear_items (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references gym_posts(id) on delete cascade,
  name text not null,
  maker text,
  category text,
  price integer,
  product_url text
);

create table favorites (
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid not null references gym_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table profiles enable row level security;
alter table gym_posts enable row level security;
alter table gym_post_images enable row level security;
alter table gear_items enable row level security;
alter table favorites enable row level security;

create policy "Public profiles are readable" on profiles for select using (true);
create policy "Published posts are readable" on gym_posts for select using (published = true);
create policy "Published images are readable" on gym_post_images for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.published = true)
);
create policy "Published gear is readable" on gear_items for select using (
  exists (select 1 from gym_posts where gym_posts.id = gear_items.post_id and gym_posts.published = true)
);
create policy "Users manage own favorites" on favorites for all using (auth.uid() = user_id);
