-- aplo: resizable quotes
-- How big a quote sits on the wall, as a multiple of its natural size.

alter table public.quotes
  add column scale real not null default 1 check (scale between 0.5 and 3);
