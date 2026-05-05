create table if not exists public.gym_post_categories (
  post_id uuid not null references public.gym_posts(id) on delete cascade,
  category text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, category)
);

do $$
begin
  if to_regclass('public.gear_items') is not null then
    insert into public.gym_post_categories (post_id, category)
    select distinct post_id, category
    from public.gear_items
    where category is not null and category <> ''
    on conflict (post_id, category) do nothing;
  end if;
end $$;

create table if not exists public.post_likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.gym_posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

do $$
begin
  if to_regclass('public.favorites') is not null then
    insert into public.post_likes (user_id, post_id, created_at)
    select user_id, post_id, created_at
    from public.favorites
    on conflict (user_id, post_id) do nothing;
  end if;
end $$;

alter table public.gym_post_categories enable row level security;
alter table public.post_likes enable row level security;

drop policy if exists "Published categories are readable" on public.gym_post_categories;
create policy "Published categories are readable"
  on public.gym_post_categories for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gym_posts
      where gym_posts.id = gym_post_categories.post_id
        and gym_posts.published = true
    )
  );

drop policy if exists "Users read categories for own posts" on public.gym_post_categories;
create policy "Users read categories for own posts"
  on public.gym_post_categories for select
  to authenticated
  using (
    exists (
      select 1 from public.gym_posts
      where gym_posts.id = gym_post_categories.post_id
        and gym_posts.user_id = auth.uid()
    )
  );

drop policy if exists "Users create categories for own posts" on public.gym_post_categories;
create policy "Users create categories for own posts"
  on public.gym_post_categories for insert
  to authenticated
  with check (
    exists (
      select 1 from public.gym_posts
      where gym_posts.id = gym_post_categories.post_id
        and gym_posts.user_id = auth.uid()
    )
  );

drop policy if exists "Users delete categories for own posts" on public.gym_post_categories;
create policy "Users delete categories for own posts"
  on public.gym_post_categories for delete
  to authenticated
  using (
    exists (
      select 1 from public.gym_posts
      where gym_posts.id = gym_post_categories.post_id
        and gym_posts.user_id = auth.uid()
    )
  );

drop policy if exists "Post likes are publicly readable" on public.post_likes;
create policy "Post likes are publicly readable"
  on public.post_likes for select
  to anon, authenticated
  using (true);

drop policy if exists "Users create own likes" on public.post_likes;
create policy "Users create own likes"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users delete own likes" on public.post_likes;
create policy "Users delete own likes"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);

drop table if exists public.gear_items cascade;
drop table if exists public.favorites cascade;
drop table if exists public.product_rankings cascade;

alter table public.gym_posts
  drop column if exists location,
  drop column if exists monthly_maintenance,
  drop column if exists highlights;
