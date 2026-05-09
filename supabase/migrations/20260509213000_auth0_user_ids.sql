drop policy if exists "Users upsert own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;

drop policy if exists "Users read own posts" on public.gym_posts;
drop policy if exists "Users create own posts" on public.gym_posts;
drop policy if exists "Users update own posts" on public.gym_posts;

drop policy if exists "Users read images for own posts" on public.gym_post_images;
drop policy if exists "Users create images for own posts" on public.gym_post_images;

drop policy if exists "Users read categories for own posts" on public.gym_post_categories;
drop policy if exists "Users create categories for own posts" on public.gym_post_categories;
drop policy if exists "Users delete categories for own posts" on public.gym_post_categories;

drop policy if exists "Users create own likes" on public.post_likes;
drop policy if exists "Users delete own likes" on public.post_likes;

drop policy if exists "Users upload post images" on storage.objects;
drop policy if exists "Users update post images" on storage.objects;
drop policy if exists "Users upload own gym images" on storage.objects;
drop policy if exists "Users update own gym images" on storage.objects;
drop policy if exists "Users upload own profile avatars" on storage.objects;
drop policy if exists "Users update own profile avatars" on storage.objects;

alter table public.gym_posts drop constraint if exists gym_posts_user_id_fkey;
alter table public.post_likes drop constraint if exists post_likes_user_id_fkey;
alter table public.profiles drop constraint if exists profiles_id_fkey;

alter table public.profiles
  alter column id type text using id::text;

alter table public.gym_posts
  alter column user_id type text using user_id::text;

alter table public.post_likes
  alter column user_id type text using user_id::text;

alter table public.gym_posts
  add constraint gym_posts_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;

alter table public.post_likes
  add constraint post_likes_user_id_fkey
  foreign key (user_id) references public.profiles(id) on delete cascade;
