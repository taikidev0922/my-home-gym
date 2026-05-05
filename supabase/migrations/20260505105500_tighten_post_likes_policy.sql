drop policy if exists "Post likes are publicly readable" on public.post_likes;
create policy "Post likes are publicly readable"
  on public.post_likes for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.gym_posts
      where gym_posts.id = post_likes.post_id
        and gym_posts.published = true
    )
  );
