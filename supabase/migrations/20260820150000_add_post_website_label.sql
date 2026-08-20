-- Display name for the post's free-form link. Falls back to the hostname
-- when it is not set.
alter table gym_posts
  add column if not exists website_label text;
