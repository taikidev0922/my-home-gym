do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gym_posts'
      and column_name = 'area_sqm'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gym_posts'
      and column_name = 'area_tatami'
  ) then
    alter table public.gym_posts rename column area_sqm to area_tatami;
  end if;
end $$;
