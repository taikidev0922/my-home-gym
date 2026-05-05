drop policy if exists "Users read own posts" on gym_posts;
create policy "Users read own posts" on gym_posts for select using (auth.uid() = user_id);

drop policy if exists "Users read images for own posts" on gym_post_images;
create policy "Users read images for own posts" on gym_post_images for select using (
  exists (select 1 from gym_posts where gym_posts.id = gym_post_images.post_id and gym_posts.user_id = auth.uid())
);

drop policy if exists "Users read gear for own posts" on gear_items;
create policy "Users read gear for own posts" on gear_items for select using (
  exists (select 1 from gym_posts where gym_posts.id = gear_items.post_id and gym_posts.user_id = auth.uid())
);
