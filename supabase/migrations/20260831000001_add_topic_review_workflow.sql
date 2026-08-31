create schema if not exists private;

alter table public.profiles
  add column is_admin boolean not null default false;

alter table public.topics
  add column reviewed_at timestamptz,
  add column reviewed_by uuid references public.profiles (id) on delete set null,
  add column rejection_reason text check (
    rejection_reason is null or char_length(rejection_reason) <= 500
  );

create index topics_pending_review_idx
  on public.topics (updated_at asc)
  where status = 'pending_review';

create or replace function public.set_topic_revision()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and old.status = 'pending_review'
    and new.status = 'pending_review'
    and (
      new.title is distinct from old.title
      or new.subtitle is distinct from old.subtitle
      or new.language is distinct from old.language
      or new.app_type is distinct from old.app_type
      or new.player_groups is distinct from old.player_groups
      or new.start_screen is distinct from old.start_screen
      or new.end_screen is distinct from old.end_screen
      or new.categories is distinct from old.categories
      or new.questions is distinct from old.questions
    )
  then
    raise exception 'Withdraw this topic before editing a pending submission.';
  end if;

  new.updated_at = now();

  if tg_op = 'INSERT' then
    new.version = 1;
  else
    new.version = old.version + 1;
  end if;

  if new.status = 'published' then
    if tg_op = 'INSERT' or old.status <> 'published' then
      new.published_at = now();
    end if;
  else
    new.published_at = null;
  end if;

  if new.status = 'pending_review' and (tg_op = 'INSERT' or old.status <> 'pending_review') then
    new.reviewed_at = null;
    new.reviewed_by = null;
    new.rejection_reason = null;
  end if;

  return new;
end;
$$;

create or replace function private.is_topic_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select profile.is_admin from public.profiles as profile where profile.id = user_id),
    false
  );
$$;

create or replace function public.is_current_user_topic_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_topic_admin(auth.uid());
$$;

create or replace function public.review_topic(
  topic_id uuid,
  decision text,
  reason text default null
)
returns public.topics
language plpgsql
security definer
set search_path = ''
as $$
declare
  reviewed_topic public.topics;
begin
  if not private.is_topic_admin(auth.uid()) then
    raise exception 'Only topic administrators can review submissions.';
  end if;

  if decision not in ('approve', 'reject') then
    raise exception 'Review decision must be approve or reject.';
  end if;

  if decision = 'reject' and nullif(trim(reason), '') is null then
    raise exception 'A rejection reason is required.';
  end if;

  update public.topics
  set
    status = case
      when decision = 'approve' then 'published'::public.topic_status
      else 'rejected'::public.topic_status
    end,
    visibility = case
      when decision = 'approve' then 'public'::public.topic_visibility
      else 'private'::public.topic_visibility
    end,
    reviewed_at = now(),
    reviewed_by = auth.uid(),
    rejection_reason = case
      when decision = 'reject' then nullif(trim(reason), '')
      else null
    end
  where id = topic_id
    and status = 'pending_review'
  returning * into reviewed_topic;

  if not found then
    raise exception 'The topic is no longer awaiting review.';
  end if;

  return reviewed_topic;
end;
$$;

drop policy if exists "Users create their own profile" on public.profiles;
create policy "Users create their own profile"
on public.profiles
for insert
to authenticated
with check ((select auth.uid()) = id and is_admin = false);

drop policy if exists "Published public topics and owned topics are readable" on public.topics;
create policy "Community topics, owned topics, and review queue are readable"
on public.topics
for select
to anon, authenticated
using (
  (visibility = 'public' and status = 'published')
  or owner_id = (select auth.uid())
  or private.is_topic_admin((select auth.uid()))
);

drop policy if exists "Users create their own topics" on public.topics;
create policy "Users create private drafts"
on public.topics
for insert
to authenticated
with check (
  owner_id = (select auth.uid())
  and visibility = 'private'
  and status = 'draft'
);

drop policy if exists "Users update their own topics" on public.topics;
create policy "Users update their own unpublished topics"
on public.topics
for update
to authenticated
using (owner_id = (select auth.uid()))
with check (
  owner_id = (select auth.uid())
  and visibility = 'private'
  and status in ('draft', 'pending_review', 'rejected', 'archived')
);

revoke select on table public.profiles from anon, authenticated;
grant select (id, display_name, avatar_url, created_at, updated_at)
  on table public.profiles to anon, authenticated;

revoke all on function private.is_topic_admin(uuid) from public;
revoke all on function public.is_current_user_topic_admin() from public;
revoke all on function public.review_topic(uuid, text, text) from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_topic_admin(uuid) to anon, authenticated;
grant execute on function public.is_current_user_topic_admin() to authenticated;
grant execute on function public.review_topic(uuid, text, text) to authenticated;
