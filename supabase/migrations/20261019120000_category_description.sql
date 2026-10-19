-- A line about what a corner is for, shown under its name. Optional; private to its owner
-- and never returned by the Discover functions.

alter table public.categories
  add column description text not null default '' check (char_length(description) <= 120);
