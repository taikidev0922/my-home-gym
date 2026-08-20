-- Optional free-form link (personal site, YouTube, blog, ...) shown next to
-- the post author's SNS links.
alter table gym_posts
  add column if not exists website_url text;
