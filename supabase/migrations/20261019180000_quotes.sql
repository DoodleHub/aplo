-- aplo: the quote wall
-- Words someone wants to keep close, pinned anywhere on a canvas they can pan and zoom.
-- x/y are the card's top-left corner in canvas units; z orders overlapping cards (higher
-- sits on top). Always private to their owner.

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(btrim(text)) between 1 and 500),
  author text not null default '' check (char_length(author) <= 80),
  color text not null default 'sage' check (color in ('sage', 'sand', 'lilac', 'sky', 'rose', 'stone')),
  x double precision not null default 0 check (x between -100000 and 100000),
  y double precision not null default 0 check (y between -100000 and 100000),
  z integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_user_id_created_at_idx on public.quotes (user_id, created_at);

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;

revoke all on public.quotes from anon;
grant select, insert, update, delete on public.quotes to authenticated;

create policy "Users can read their quotes" on public.quotes
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their quotes" on public.quotes
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their quotes" on public.quotes
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their quotes" on public.quotes
  for delete to authenticated
  using ((select auth.uid()) = user_id);
