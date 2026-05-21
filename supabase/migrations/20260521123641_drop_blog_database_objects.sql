drop policy if exists "Public blog images are readable" on storage.objects;

drop table if exists public.blog_keyword_candidates cascade;
drop table if exists public.blog_articles cascade;
drop table if exists public.amazon_associate_links cascade;
