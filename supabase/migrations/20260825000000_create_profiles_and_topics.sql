create type public.topic_language as enum ('en', 'zh');
create type public.topic_visibility as enum ('private', 'public');
create type public.topic_status as enum ('draft', 'published', 'archived');
create type public.topic_app_type as enum ('normal', 'edition', 'premium');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  subtitle text not null default '' check (char_length(subtitle) <= 240),
  language public.topic_language not null,
  app_type public.topic_app_type not null default 'normal',
  player_groups text[] not null default '{}',
  visibility public.topic_visibility not null default 'private',
  status public.topic_status not null default 'draft',
  start_screen jsonb not null,
  navigation jsonb not null,
  end_screen jsonb not null,
  categories jsonb not null,
  questions jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint topics_player_groups_not_empty check (cardinality(player_groups) > 0),
  constraint topics_player_groups_supported check (
    player_groups <@ array[
      'solo',
      'couple',
      'friends',
      'strangers',
      'family',
      'party',
      'dating',
      'partners'
    ]::text[]
  ),
  constraint topics_start_screen_object check (jsonb_typeof(start_screen) = 'object'),
  constraint topics_navigation_object check (jsonb_typeof(navigation) = 'object'),
  constraint topics_end_screen_object check (jsonb_typeof(end_screen) = 'object'),
  constraint topics_categories_object check (jsonb_typeof(categories) = 'object'),
  constraint topics_questions_array check (jsonb_typeof(questions) = 'array'),
  constraint topics_publish_state check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

create index topics_owner_updated_idx on public.topics (owner_id, updated_at desc);
create index topics_public_language_updated_idx
  on public.topics (language, updated_at desc)
  where visibility = 'public' and status = 'published';

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create function public.set_topic_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();

  if tg_op = 'INSERT' then
    new.version = 1;
  else
    new.version = old.version + 1;
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at = now();
    elsif old.status <> 'published' then
      new.published_at = now();
    end if;
  else
    new.published_at = null;
  end if;

  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger topics_set_revision
before insert or update on public.topics
for each row execute function public.set_topic_revision();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(
      left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''), 80),
      ''
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.topics enable row level security;

create policy "Profiles are visible"
on public.profiles
for select
to anon, authenticated
using (true);

create policy "Users create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "Users update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users delete their own profile"
on public.profiles
for delete
to authenticated
using ((select auth.uid()) = id);

create policy "Published public topics and owned topics are readable"
on public.topics
for select
to anon, authenticated
using (
  (visibility = 'public' and status = 'published')
  or owner_id = (select auth.uid())
);

create policy "Users create their own topics"
on public.topics
for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Users update their own topics"
on public.topics
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Users delete their own topics"
on public.topics
for delete
to authenticated
using (owner_id = (select auth.uid()));

grant select on table public.profiles to anon, authenticated;
grant insert, delete on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.topics to anon, authenticated;
grant insert, delete on table public.topics to authenticated;
grant update (
  title,
  subtitle,
  language,
  app_type,
  player_groups,
  visibility,
  status,
  start_screen,
  navigation,
  end_screen,
  categories,
  questions
) on table public.topics to authenticated;
