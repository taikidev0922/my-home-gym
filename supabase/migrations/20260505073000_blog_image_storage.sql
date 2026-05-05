insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do nothing;

drop policy if exists "Public blog images are readable" on storage.objects;
create policy "Public blog images are readable" on storage.objects for select using (
  bucket_id = 'blog-images'
);
