-- aplo: favorites in Discover
-- People can keep other people's shared thoughts close. A favorite is private to whoever
-- made it: authors never learn who favorited their thoughts, or how many did. Your own
-- thoughts keep using entries.is_favorite.

create table public.discover_favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, entry_id)
);

-- Listing newest first, and the cascade when a thought is deleted.
create index discover_favorites_user_created_idx on public.discover_favorites (user_id, created_at desc, entry_id desc);
create index discover_favorites_entry_idx on public.discover_favorites (entry_id);

alter table public.discover_favorites enable row level security;

revoke all on public.discover_favorites from anon;
grant select, insert, delete on public.discover_favorites to authenticated;

create policy "Users can read their discover favorites" on public.discover_favorites
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can add discover favorites" on public.discover_favorites
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

-- No update: a favorite is added or removed, and an update could swap entry_id past the check below.
create policy "Users can remove their discover favorites" on public.discover_favorites
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Only someone else's thought that is shared right now can be favorited. This runs as its
-- owner so it can see the entry, and tells the caller nothing beyond yes or no.
create function private.check_discover_favorite()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from public.entries e
    left join public.categories c on c.id = e.category_id
    where e.id = new.entry_id
      and e.user_id <> new.user_id
      and e.visibility <> 'private'
      and (e.visibility = 'public' or c.is_public)
  ) then
    raise exception 'This thought can’t be favorited' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.check_discover_favorite() from public, anon, authenticated;

create trigger discover_favorites_check
  before insert on public.discover_favorites
  for each row execute function private.check_discover_favorite();

-- ---------------------------------------------------------------------------
-- Discover functions now say whether the caller has favorited each thought. The return type
-- changes, so they're recreated. Same guarantees as before: a signed-in caller, shareable
-- rows only, and private corner names hidden.
-- ---------------------------------------------------------------------------

drop function public.discover_feed(text, timestamptz, uuid, integer);
drop function public.discover_entry(uuid);

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
  is_mine boolean,
  is_favorite boolean
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
    e.user_id = (select auth.uid()),
    case when e.user_id = (select auth.uid()) then e.is_favorite
         else exists (
           select 1 from public.discover_favorites f
           where f.user_id = (select auth.uid()) and f.entry_id = e.id
         ) end
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
  is_mine boolean,
  is_favorite boolean
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
    e.user_id = (select auth.uid()),
    case when e.user_id = (select auth.uid()) then e.is_favorite
         else exists (
           select 1 from public.discover_favorites f
           where f.user_id = (select auth.uid()) and f.entry_id = e.id
         ) end
  from public.entries e
  left join public.categories c on c.id = e.category_id
  left join public.profiles p on p.id = e.user_id
  where (select auth.uid()) is not null
    and e.id = p_id
    and e.visibility <> 'private'
    and (e.visibility = 'public' or c.is_public);
$$;

-- The caller's favorites from Discover, most recently favorited first. A thought its author
-- has made private again drops out (and comes back if it's shared again). Pass the last
-- row's favorited_at and id to continue.
create function public.discover_favorite_feed(
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
  is_mine boolean,
  is_favorite boolean,
  favorited_at timestamptz
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
    false,
    true,
    f.created_at
  from public.discover_favorites f
  join public.entries e on e.id = f.entry_id
  left join public.categories c on c.id = e.category_id
  left join public.profiles p on p.id = e.user_id
  where (select auth.uid()) is not null
    and f.user_id = (select auth.uid())
    and e.user_id <> f.user_id
    and e.visibility <> 'private'
    and (e.visibility = 'public' or c.is_public)
    and (p_before is null or (f.created_at, f.entry_id) < (p_before, p_before_id))
  order by f.created_at desc, f.entry_id desc
  limit least(greatest(p_limit, 1), 50);
$$;

revoke execute on function
  public.discover_feed(text, timestamptz, uuid, integer),
  public.discover_entry(uuid),
  public.discover_favorite_feed(timestamptz, uuid, integer)
  from public, anon;
grant execute on function
  public.discover_feed(text, timestamptz, uuid, integer),
  public.discover_entry(uuid),
  public.discover_favorite_feed(timestamptz, uuid, integer)
  to authenticated;
