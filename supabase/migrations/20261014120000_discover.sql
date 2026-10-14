-- aplo: sharing and Discover
-- Corners can be shared; each entry can follow its corner, be shared on its own, or stay
-- private. Shared thoughts are read through the discover_* functions below, which expose
-- only what's safe to show (never emails, favorites or the names of private corners).
-- Everything stays private unless its owner says otherwise.

-- ---------------------------------------------------------------------------
-- Visibility
-- ---------------------------------------------------------------------------

alter table public.categories
  add column is_public boolean not null default false;

alter table public.entries
  add column visibility text not null default 'inherit'
    check (visibility in ('inherit', 'public', 'private'));

-- The Discover feed: newest first, skipping thoughts that can never be shown.
create index entries_discover_idx on public.entries (created_at desc, id desc)
  where visibility <> 'private';

-- ---------------------------------------------------------------------------
-- Profiles: the pen name and emoji shown next to shared thoughts
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 40),
  emoji text not null default '🌿' check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

create policy "Users can read their profile" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "Users can create their profile" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Users can update their profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- A gentle, anonymous pen name, e.g. "Quiet Fern".
create function private.random_pen_name()
returns text
language sql
volatile
set search_path = ''
as $$
  select
    (array['Quiet', 'Gentle', 'Wandering', 'Sleepy', 'Bright', 'Soft', 'Hidden', 'Morning',
           'Little', 'Patient', 'Hopeful', 'Curious', 'Tender', 'Drifting', 'Golden', 'Misty'])
      [1 + floor(random() * 16)::int]
    || ' ' ||
    (array['Fern', 'Willow', 'Sparrow', 'Pebble', 'Moss', 'Meadow', 'Otter', 'Clover',
           'Heron', 'Maple', 'Brook', 'Lantern', 'Acorn', 'Finch', 'Thistle', 'Tide'])
      [1 + floor(random() * 16)::int];
$$;

create function private.random_profile_emoji()
returns text
language sql
volatile
set search_path = ''
as $$
  select (array['🌿', '🌙', '🍃', '🌷', '☁️', '🐚', '🦊', '🐢', '🌻', '🍄', '🕊️', '🐝'])
    [1 + floor(random() * 12)::int];
$$;

create function private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, emoji)
  values (new.id, private.random_pen_name(), private.random_profile_emoji())
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke execute on function private.random_pen_name(), private.random_profile_emoji(), private.create_profile()
  from public, anon, authenticated;

create trigger on_auth_user_created_create_profile
  after insert on auth.users
  for each row execute function private.create_profile();

-- Existing accounts get a pen name, too.
insert into public.profiles (id, display_name, emoji)
select id, private.random_pen_name(), private.random_profile_emoji()
from auth.users
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Discover
-- These run as their owner so they can read other people's shared rows, so each one checks
-- for a signed-in caller and returns only shareable columns of shareable rows.
-- ---------------------------------------------------------------------------

-- Newest shared thoughts, a page at a time. Pass the last row's created_at and id to continue.
create function public.discover_feed(
  p_mood text default null,
  p_before timestamptz default null,
  p_before_id uuid default null,
  p_limit integer default 24
)
returns table (
  id uuid,
  title text,
  excerpt text,
  mood text,
  word_count integer,
  created_at timestamptz,
  category_name text,
  category_emoji text,
  category_color text,
  author_name text,
  author_emoji text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id,
    e.title,
    left(e.content, 480),
    e.mood,
    case when btrim(e.content) = '' then 0
         else coalesce(array_length(regexp_split_to_array(btrim(e.content), '\s+'), 1), 0) end,
    e.created_at,
    case when c.is_public then c.name end,
    case when c.is_public then c.emoji end,
    case when c.is_public then c.color end,
    coalesce(p.display_name, 'A quiet soul'),
    coalesce(p.emoji, '🌿'),
    e.user_id = (select auth.uid())
  from public.entries e
  left join public.categories c on c.id = e.category_id
  left join public.profiles p on p.id = e.user_id
  where (select auth.uid()) is not null
    and e.visibility <> 'private'
    and (e.visibility = 'public' or c.is_public)
    and (btrim(e.title) <> '' or btrim(e.content) <> '')
    and (p_mood is null or e.mood = p_mood)
    and (p_before is null or (e.created_at, e.id) < (p_before, p_before_id))
  order by e.created_at desc, e.id desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- One shared thought, in full. Returns no row if it isn't (or is no longer) shared.
create function public.discover_entry(p_id uuid)
returns table (
  id uuid,
  title text,
  content text,
  mood text,
  created_at timestamptz,
  category_name text,
  category_emoji text,
  category_color text,
  author_name text,
  author_emoji text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    e.id,
    e.title,
    e.content,
    e.mood,
    e.created_at,
    case when c.is_public then c.name end,
    case when c.is_public then c.emoji end,
    case when c.is_public then c.color end,
    coalesce(p.display_name, 'A quiet soul'),
    coalesce(p.emoji, '🌿'),
    e.user_id = (select auth.uid())
  from public.entries e
  left join public.categories c on c.id = e.category_id
  left join public.profiles p on p.id = e.user_id
  where (select auth.uid()) is not null
    and e.id = p_id
    and e.visibility <> 'private'
    and (e.visibility = 'public' or c.is_public);
$$;

revoke execute on function public.discover_feed(text, timestamptz, uuid, integer), public.discover_entry(uuid)
  from public, anon;
grant execute on function public.discover_feed(text, timestamptz, uuid, integer), public.discover_entry(uuid)
  to authenticated;
