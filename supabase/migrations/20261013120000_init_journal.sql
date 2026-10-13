-- aplo: journal schema
-- Categories ("little corners") and entries ("thoughts"), owned per user and protected by RLS.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  emoji text not null default '🌱' check (char_length(emoji) between 1 and 16),
  color text not null default 'sage'
    check (color in ('sage', 'sand', 'lilac', 'sky', 'rose', 'stone')),
  position integer not null default 0,
  created_at timestamptz not null default now(),
  -- lets entries reference (id, user_id) so an entry can never point at another user's category
  unique (id, user_id)
);

create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid,
  title text not null default '' check (char_length(title) <= 200),
  content text not null default '' check (char_length(content) <= 100000),
  mood text check (mood is null or char_length(mood) between 1 and 16),
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (category_id, user_id)
    references public.categories (id, user_id)
    on delete set null (category_id)
);

create index categories_user_id_position_idx on public.categories (user_id, position);
create index entries_user_id_created_at_idx on public.entries (user_id, created_at desc);
create index entries_category_id_idx on public.entries (category_id) where category_id is not null;
create index entries_user_id_favorite_idx on public.entries (user_id) where is_favorite;

-- ---------------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger entries_set_updated_at
  before update on public.entries
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.entries enable row level security;

revoke all on public.categories, public.entries from anon;
grant select, insert, update, delete on public.categories, public.entries to authenticated;

create policy "Users can read their categories" on public.categories
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their categories" on public.categories
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their categories" on public.categories
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their categories" on public.categories
  for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their entries" on public.entries
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their entries" on public.entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their entries" on public.entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their entries" on public.entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- ---------------------------------------------------------------------------
-- Starter corners for new accounts
-- Lives in a non-exposed schema; it only runs from the auth.users trigger.
-- ---------------------------------------------------------------------------

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, emoji, color, position)
  values
    (new.id, 'Daily life', '🌱', 'sage', 0),
    (new.id, 'Gratitude', '☀️', 'sand', 1),
    (new.id, 'Personal growth', '🌷', 'lilac', 2),
    (new.id, 'Dreams & ideas', '☁️', 'sky', 3);
  return new;
end;
$$;

revoke execute on function private.seed_default_categories() from public, anon, authenticated;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function private.seed_default_categories();
