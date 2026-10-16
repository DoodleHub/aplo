<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# aplo

A calm, private journaling app. People write **thoughts** (entries), sort them into **corners** (categories), and can choose to share some anonymously in **Discover**. It's an installable PWA that keeps working offline.

Use the product's words in UI copy and names: "thought", "corner", "pen name", never "post", "folder" or "username". Visual language, tokens, components and voice are in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); read it before any UI work. The live component reference is at `/design-system`.

## Stack and commands

- Next.js 16 (App Router, `cacheComponents`, `partialPrefetching`), React 19, TypeScript, Tailwind CSS v4 (via `@tailwindcss/turbopack`), Supabase (`@supabase/ssr`, `@supabase/supabase-js`).
- No UI or state libraries. Primitives are hand-built in `components/ui/`. Ask before adding a dependency.
- `npm run dev` · `npm run build` · `npm run lint`. There is no test suite. Verify with `npx tsc --noEmit`, `npm run lint` and `npm run build`.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`.

## Layout

```
app/
  (auth)/            login, signup, server actions (actions.ts)
  (app)/             signed-in app; layout.tsx loads the journal and wraps everything in JournalProvider + AppShell
    page.tsx         home: hero prompt, corners, entries
    new/             new thought (editor opens in place; URL becomes /entry/<id> on first save)
    entry/[id]/      edit a thought
    c/[id]/          one corner
    favorites/, discover/
  design-system/     public living style guide
  manifest.ts, icon.svg, apple-icon.png
components/
  ui/                primitives: button, field (Input, Textarea, PasswordInput, Field), dialog, popover, menu, chip, segmented, switch, toast, skeleton
  journal/           feature composites; store.tsx (data) and app-shell.tsx (dialogs, drawer) are the hubs
  icons.tsx, brand.tsx, theme.tsx, pwa.tsx
lib/
  types.ts           domain types (Entry, Category, Template, Profile…) and isShared()
  journal.ts         server-only: getJournal(), the one round trip that loads a user's data
  local-db.ts        IndexedDB outbox + offline snapshot
  sync.ts            the outbox queue that sends writes to Supabase
  templates.ts       built-in templates, {date}/{weekday}/{time} tokens, nextBlank()
  page-style.ts, palette.ts   literal Tailwind class maps for paper/pen and corner colors
  supabase/          client.ts (browser), server.ts, proxy.ts (session refresh + auth redirects)
  database.types.ts  hand-maintained mirror of the schema
proxy.ts             Next 16 "proxy" (formerly middleware): runs lib/supabase/proxy.ts
public/sw.js         service worker; public/offline.html
supabase/migrations/ the schema, in order
```

## Features

- **Auth:** email and password through server actions. `lib/supabase/proxy.ts` refreshes the session and redirects signed-out users to `/login?next=…`. `/login`, `/signup` and `/design-system` are public.
- **Journal:** thoughts with a title, body, mood emoji, favorite flag, corner and visibility. Search runs on the client over loaded entries. The home page has a daily quote (`lib/quotes.ts`).
- **Corners:** name, emoji, one of six colors and `is_public`. New accounts get four starter corners from a database trigger.
- **Editor** (`components/journal/editor.tsx`):
  - autosaves (600ms debounce), with ⌘S to save now and ⌘Enter for Done
  - creates nothing until there's real writing; a mood, corner or untouched template alone doesn't count
  - page style: paper and pen, saved on the profile
- **Templates:** built-in ones in code, custom ones in `public.templates`.
  - A "Start with" strip on blank pages, a toolbar menu, and a studio dialog.
  - Tab jumps between blanks; Enter continues lists.
  - See the Templates section of DESIGN_SYSTEM.md.
- **Sharing and Discover:**
  - Visibility: an entry is `inherit` (follows its corner), `public` or `private`. Decide with `isShared()`; don't reimplement it.
  - Discover reads go only through the `discover_feed` / `discover_entry` RPCs. People appear by pen name and emoji, never by email.
- **Theme:** light, dark or system. It's set on `<html data-theme>` before first paint (`lib/theme.ts`). Dark mode uses the `dark:` variant and redefined tokens in `globals.css`.
- **PWA and offline:**
  - `sw.js` serves assets cache-first and pages and RSC data network-first.
  - Writes queue in IndexedDB and replay in order when the connection returns.
  - Sign-out clears the device copy (`clearDeviceCopy`).

## How data flows

1. `app/(app)/layout.tsx` calls `getJournal()` (server, per request via `connection()`) and passes everything into `JournalProvider`.
2. `components/journal/store.tsx` holds client state and exposes CRUD through `useJournal()`. Every mutation is **optimistic**: update state, then `sync.run(op)`, and roll back with a kind toast on error. Deleting a thought or a template offers Undo.
3. `lib/sync.ts` saves each op to the IndexedDB outbox before sending, sends one at a time, retries transient failures (offline, 401, 5xx) and merges consecutive updates to the same row. Creates are `upsert`s so a resend never duplicates.
4. On load, the store merges the newer of server data, the offline snapshot and the pending outbox (`applyOps`), then saves a snapshot of `categories`, `entries` and `templates`.

**Adding a synced table** touches all of these: the migration; `lib/database.types.ts`; the type in `lib/types.ts`; the select in `lib/journal.ts`; the `Table` union, `Snapshot` and `applyOps` in `lib/local-db.ts` (old snapshots won't have the new field, so make it optional); the state, CRUD and snapshot in `store.tsx`; and the prop in `app/(app)/layout.tsx`. Follow the `templates` table as the latest example.

Profile edits (pen name) go straight to Supabase, not through the outbox. Paper and pen changes do use the outbox.

## Supabase

- Project ref `kwfebwzqwoibszwtmouk` (see `.mcp.json`). It is the **live** database with real users; treat DDL and data writes as production changes.
- Tables in `public`: `categories`, `entries`, `profiles`, `templates`. Each has `user_id uuid default auth.uid()` (profiles key on `id`), RLS enabled, `anon` revoked, and four owner-only policies written as `(select auth.uid()) = user_id`. Copy that pattern for new tables.
- `entries` reference `categories(id, user_id)`, so an entry can't point at someone else's corner. Deleting a corner sets its entries' `category_id` to null.
- `updated_at` is kept by the `public.set_updated_at()` trigger.
- Sign-up triggers on `auth.users` (seed corners, create a profile with a random pen name) live in the `private` schema, which isn't exposed and has execute revoked.
- `discover_feed` / `discover_entry` are `SECURITY DEFINER` on purpose. They check for a signed-in caller and return only shareable columns, and the private names of corners are hidden. The advisor warns about them; that's expected. Any change to them must keep those guarantees.
- Columns have length and enum `check` constraints. Keep the client-side `maxLength`s and the unions in `lib/types.ts` in sync with them.
- Server code reads the user with `supabase.auth.getClaims()`, never `getSession()`.

### Database migrations

The remote migration history (`supabase_migrations.schema_migrations`) must always list exactly the versions in `supabase/migrations/`, or `supabase db push` will try to re-run migrations that are already applied, or skip ones that aren't.

- Every schema change gets a file: `supabase/migrations/<version>_<snake_name>.sql`. Never change the schema with `execute_sql` or the dashboard SQL editor alone.
- Supabase MCP `apply_migration` records the migration under **its own timestamp**, not the local file's. After applying, run `list_migrations` and rename the local file to the recorded version.
- If SQL was ever run by hand, record it: `supabase migration repair --status applied <version>`, or insert `(version, name)` into `supabase_migrations.schema_migrations`. Check that the change really is in the database first.
- After any change, confirm that the versions in `list_migrations` match `ls supabase/migrations`, update `lib/database.types.ts` (maintained by hand), and run the security advisors.

## Conventions and constraints

- **Next 16:**
  - Use `proxy.ts`, not `middleware.ts`.
  - With `cacheComponents`, dynamic work must sit under `<Suspense>`, and server data that depends on the request calls `await connection()`.
  - Route props use the global helpers (`LayoutProps<"/">`).
  - Check `node_modules/next/dist/docs/` before using any Next API.
- **Client and server:** almost all UI is client components reading `useJournal()`. Code that runs only on the server imports `server-only`. Ids are minted on the client with `crypto.randomUUID()`.
- **Hydration:** anything that depends on time, time zone or `window` must render the same on server and client. Use the server-provided `now` and `timeZone` from the store, `useSyncExternalStore`, or render a skeleton until mounted.
- **Tailwind v4:**
  - Tokens live in `app/globals.css` `@theme`.
  - Never build class names dynamically; map them through `lib/palette.ts` / `lib/page-style.ts`.
  - `cn()` only joins strings (there's no tailwind-merge), so don't pass two utilities for the same property. Add a prop such as `Dialog`'s `size` instead.
  - Prefer the canonical class names the IDE suggests (e.g. `max-h-120`, `wrap-break-word`).
- **UX bar:**
  - optimistic updates, no spinners where avoidable
  - keyboard support (Esc, arrows in radio groups, ⌘ shortcuts)
  - `aria-*` labels on icon buttons
  - `ease-soft` / `ease-spring` motion that's disabled under reduced motion
  - mobile-first layouts
- **Copy:** warm, brief, second person, curly quotes and apostrophes (’ “ ”). Errors are kind and say what to do next. No streaks, scores or guilt.
- **Privacy:** everything is private by default. Never expose emails, favorites or the names of private corners.
- **Style:** match the surrounding code. Comments explain *why*, briefly; JSDoc sits on exported helpers and props whose meaning isn't obvious.
