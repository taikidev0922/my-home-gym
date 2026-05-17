create table if not exists public.amazon_associate_links (
  slot_key text primary key,
  category text not null,
  rank integer not null check (rank > 0),
  legacy_product_id text,
  genre text,
  product_name text not null,
  maker text not null,
  affiliate_url text not null,
  image_url text not null,
  keywords text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint amazon_associate_links_slot_key_format check (slot_key = category || '-' || rank::text),
  constraint amazon_associate_links_category_rank_unique unique (category, rank)
);

create index if not exists amazon_associate_links_active_category_rank_idx
  on public.amazon_associate_links (is_active, category, rank);

alter table public.amazon_associate_links enable row level security;

drop policy if exists "Anyone can read active amazon associate links." on public.amazon_associate_links;
create policy "Anyone can read active amazon associate links."
  on public.amazon_associate_links
  for select
  using (is_active = true);

grant select on table public.amazon_associate_links to anon, authenticated;
grant select, insert, update, delete on table public.amazon_associate_links to service_role;
