create extension if not exists pg_trgm with schema extensions;

create index if not exists gym_posts_published_created_at_idx
  on public.gym_posts (published, created_at desc);

create index if not exists gym_posts_scale_idx
  on public.gym_posts (scale);

create index if not exists gym_posts_budget_idx
  on public.gym_posts (budget);

create index if not exists gym_posts_area_tatami_idx
  on public.gym_posts (area_tatami);

create index if not exists gym_posts_title_trgm_idx
  on public.gym_posts using gin (title extensions.gin_trgm_ops);

create index if not exists gym_posts_summary_trgm_idx
  on public.gym_posts using gin (summary extensions.gin_trgm_ops);

create index if not exists gym_post_categories_category_post_id_idx
  on public.gym_post_categories (category, post_id);
