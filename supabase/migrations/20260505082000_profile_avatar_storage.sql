insert into storage.buckets (id, name, public)
values ('profile-avatars', 'profile-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Public profile avatars are readable" on storage.objects;
create policy "Public profile avatars are readable" on storage.objects for select using (
  bucket_id = 'profile-avatars'
);

drop policy if exists "Users upload own profile avatars" on storage.objects;
create policy "Users upload own profile avatars" on storage.objects for insert with check (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users update own profile avatars" on storage.objects;
create policy "Users update own profile avatars" on storage.objects for update using (
  bucket_id = 'profile-avatars' and auth.uid()::text = (storage.foldername(name))[1]
);
