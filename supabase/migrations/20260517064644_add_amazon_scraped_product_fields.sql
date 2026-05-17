alter table public.amazon_associate_links
  add column if not exists asin text not null default '',
  add column if not exists source_url text not null default '',
  add column if not exists price_text text not null default '',
  add column if not exists rating_text text not null default '',
  add column if not exists review_count_text text not null default '',
  add column if not exists brand text not null default '',
  add column if not exists seller_text text not null default '',
  add column if not exists availability_text text not null default '',
  add column if not exists dimensions_text text not null default '',
  add column if not exists weight_text text not null default '',
  add column if not exists feature_bullets text[] not null default '{}',
  add column if not exists product_description text not null default '',
  add column if not exists spec_table jsonb not null default '{}'::jsonb,
  add column if not exists detail_sections jsonb not null default '{}'::jsonb,
  add column if not exists scraped_facts jsonb not null default '{}'::jsonb,
  add column if not exists raw_scraped_json jsonb not null default '{}'::jsonb,
  add column if not exists scraped_at timestamp with time zone;

create index if not exists amazon_associate_links_asin_idx
  on public.amazon_associate_links (asin)
  where asin <> '';
