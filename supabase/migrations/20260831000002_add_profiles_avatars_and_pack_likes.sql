insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Avatar images are public"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'avatars');

create policy "Users upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create policy "Users delete their own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

create table public.pack_likes (
  user_id uuid not null references public.profiles (id) on delete cascade,
  pack_id text not null check (char_length(pack_id) between 1 and 160),
  created_at timestamptz not null default now(),
  primary key (user_id, pack_id)
);

create index pack_likes_pack_idx on public.pack_likes (pack_id);

alter table public.pack_likes enable row level security;

create policy "Pack likes are visible"
on public.pack_likes
for select
to anon, authenticated
using (true);

create policy "Users like packs as themselves"
on public.pack_likes
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users remove their own likes"
on public.pack_likes
for delete
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.get_pack_like_summary(requested_pack_ids text[])
returns table (
  pack_id text,
  like_count bigint,
  liked_by_user boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    requested.pack_id,
    count(likes.user_id)::bigint as like_count,
    coalesce(bool_or(likes.user_id = auth.uid()), false) as liked_by_user
  from unnest(requested_pack_ids) as requested(pack_id)
  left join public.pack_likes as likes on likes.pack_id = requested.pack_id
  group by requested.pack_id;
$$;

grant select on table public.pack_likes to anon, authenticated;
grant insert, delete on table public.pack_likes to authenticated;
revoke all on function public.get_pack_like_summary(text[]) from public;
grant execute on function public.get_pack_like_summary(text[]) to anon, authenticated;
