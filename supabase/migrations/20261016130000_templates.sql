-- aplo: writing templates
-- A template is a starting shape for a thought: an optional title and a body of gentle
-- prompts. The built-in ones live in the app (lib/templates.ts); these are the ones people
-- write for themselves. Always private to their owner.

create table public.templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  emoji text not null default '📝' check (char_length(emoji) between 1 and 16),
  description text not null default '' check (char_length(description) <= 120),
  title text not null default '' check (char_length(title) <= 200),
  content text not null default '' check (char_length(content) <= 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index templates_user_id_created_at_idx on public.templates (user_id, created_at);

create trigger templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

alter table public.templates enable row level security;

revoke all on public.templates from anon;
grant select, insert, update, delete on public.templates to authenticated;

create policy "Users can read their templates" on public.templates
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their templates" on public.templates
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their templates" on public.templates
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their templates" on public.templates
  for delete to authenticated
  using ((select auth.uid()) = user_id);
