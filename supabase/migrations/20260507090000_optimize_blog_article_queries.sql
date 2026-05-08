create index if not exists blog_articles_published_slug_idx
  on public.blog_articles (published_at desc, slug);

create index if not exists blog_articles_category_published_idx
  on public.blog_articles (category, published_at desc, slug);

create index if not exists blog_articles_slug_published_idx
  on public.blog_articles (slug, published_at desc);

create index if not exists blog_articles_tags_published_idx
  on public.blog_articles using gin (tags);

create index if not exists blog_keyword_candidates_category_usage_idx
  on public.blog_keyword_candidates (category, usage_count, last_used_at nulls first);
