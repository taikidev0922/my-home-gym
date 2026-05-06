alter table public.blog_articles
  add column if not exists tags text[] not null default '{}'::text[];

update public.blog_articles
set tags = array_remove(array[
  nullif(keyword, ''),
  case category
    when 'guide' then '作り方'
    when 'rack' then 'パワーラック'
    when 'dumbbell' then '可変式ダンベル'
    when 'bench' then 'ベンチ'
    when 'floor' then '床材・防音'
    when 'compact' then '省スペース'
    else null
  end
], null)
where tags = '{}'::text[];

create index if not exists blog_articles_category_idx on public.blog_articles (category);
create index if not exists blog_articles_tags_idx on public.blog_articles using gin (tags);
