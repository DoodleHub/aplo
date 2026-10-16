-- How a person likes their pages to look while they write: the paper behind the words and
-- the pen they're written in. Applies to all of their thoughts; defaults keep today's look.

alter table public.profiles
  add column paper text not null default 'plain'
    check (paper in ('plain', 'ruled', 'dotted', 'parchment')),
  add column pen text not null default 'sans'
    check (pen in ('sans', 'caveat', 'patrick', 'kalam'));
