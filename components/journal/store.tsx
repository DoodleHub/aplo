"use client";

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { applyOps, loadOutbox, loadSnapshot, saveSnapshot } from "@/lib/local-db";
import { createSyncQueue } from "@/lib/sync";
import { useToast } from "@/components/ui/toast";
import type { Category, CategoryInput, Entry, EntryPatch } from "@/lib/types";

export type JournalUser = { id: string; email: string };

type JournalApi = {
  user: JournalUser;
  timeZone: string;
  /** Request time from the server, so "today" renders the same on server and client. */
  now: string;
  categories: Category[];
  entries: Entry[];
  /** Writes not yet confirmed by the server, e.g. made while offline. */
  pendingWrites: number;
  categoryById: Map<string, Category>;
  countByCategory: Map<string, number>;
  createCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, input: Partial<CategoryInput>) => void;
  deleteCategory: (id: string) => void;
  createEntry: (entry: Entry) => Promise<boolean>;
  updateEntry: (id: string, patch: EntryPatch) => Promise<boolean>;
  toggleFavorite: (id: string) => void;
  deleteEntry: (id: string) => void;
};

const JournalContext = createContext<JournalApi | null>(null);

const TZ_COOKIE = "tz";

const noopSubscribe = () => () => {};
const getLocalTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const byNewest = (a: Entry, b: Entry) => b.created_at.localeCompare(a.created_at);

export function JournalProvider({
  user,
  initialCategories,
  initialEntries,
  initialTimeZone,
  now,
  children,
}: {
  user: JournalUser;
  now: string;
  initialCategories: Category[];
  initialEntries: Entry[];
  initialTimeZone: string;
  children: ReactNode;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [entries, setEntries] = useState(initialEntries);
  const timeZone = useSyncExternalStore(
    noopSubscribe,
    getLocalTimeZone,
    () => initialTimeZone,
  );
  const pendingCreates = useRef(new Map<string, Promise<boolean>>());
  const [sync] = useState(() => createSyncQueue(supabase, user.id));
  const pendingWrites = useSyncExternalStore(sync.subscribe, sync.pending, () => 0);

  // Server time of the newest server data in `categories`/`entries`.
  const basedOn = useRef(now);
  const [restored, setRestored] = useState(false);

  // Bring back what this device knows that the server-rendered page doesn't: writes still in
  // the outbox, or — when this page was served from the offline cache — the newer journal copy.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadSnapshot(user.id), loadOutbox(user.id)]).then(([snapshot, outbox]) => {
      if (cancelled) return;
      if (snapshot && snapshot.basedOn >= now) {
        basedOn.current = snapshot.basedOn;
        setCategories(snapshot.categories);
        setEntries(snapshot.entries);
      } else if (outbox.length) {
        const local = applyOps({ categories: initialCategories, entries: initialEntries }, outbox);
        setCategories(local.categories);
        setEntries(local.entries.sort(byNewest));
      }
      sync.resume(outbox);
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, now, initialCategories, initialEntries, sync]);

  // Keep a copy of the journal on this device so it can be read offline.
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(
      () => saveSnapshot({ userId: user.id, basedOn: basedOn.current, categories, entries }),
      400,
    );
    return () => clearTimeout(timer);
  }, [restored, user.id, categories, entries]);

  // Dates render in the reader's timezone; remember it so the server can match next time.
  useEffect(() => {
    if (timeZone !== initialTimeZone) {
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [timeZone, initialTimeZone]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const countByCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      if (entry.category_id) counts.set(entry.category_id, (counts.get(entry.category_id) ?? 0) + 1);
    }
    return counts;
  }, [entries]);

  const fail = useCallback(
    (message: string, error: unknown) => {
      console.error(message, error);
      toast.show(message);
    },
    [toast],
  );

  useEffect(
    () => sync.onLateError((_, error) => fail("We couldn’t sync a change you made offline.", error)),
    [sync, fail],
  );

  const createCategory = useCallback<JournalApi["createCategory"]>(
    (input) => {
      const category: Category = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        emoji: input.emoji,
        color: input.color,
        position: Math.max(-1, ...categories.map((c) => c.position)) + 1,
        created_at: new Date().toISOString(),
      };
      setCategories((all) => [...all, category]);
      sync
        .run({ table: "categories", kind: "upsert", row: category })
        .then(({ error }) => {
          if (!error) return;
          setCategories((all) => all.filter((c) => c.id !== category.id));
          fail("We couldn’t create that corner. Please try again.", error);
        });
      return category;
    },
    [categories, sync, fail],
  );

  const updateCategory = useCallback<JournalApi["updateCategory"]>(
    (id, input) => {
      const previous = categories.find((c) => c.id === id);
      if (!previous) return;
      const patch = input.name ? { ...input, name: input.name.trim() } : input;
      setCategories((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      sync
        .run({ table: "categories", kind: "update", key: id, patch })
        .then(({ error }) => {
          if (!error) return;
          setCategories((all) => all.map((c) => (c.id === id ? previous : c)));
          fail("We couldn’t update that corner.", error);
        });
    },
    [categories, sync, fail],
  );

  const deleteCategory = useCallback<JournalApi["deleteCategory"]>(
    (id) => {
      const previousCategories = categories;
      const previousEntries = entries;
      setCategories((all) => all.filter((c) => c.id !== id));
      setEntries((all) => all.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)));
      sync
        .run({ table: "categories", kind: "delete", key: id })
        .then(({ error }) => {
          if (error) {
            setCategories(previousCategories);
            setEntries(previousEntries);
            fail("We couldn’t remove that corner.", error);
          } else {
            toast.show("Corner removed. Its thoughts are still in your journal.");
          }
        });
    },
    [categories, entries, sync, fail, toast],
  );

  const createEntry = useCallback<JournalApi["createEntry"]>(
    (entry) => {
      setEntries((all) => [entry, ...all.filter((e) => e.id !== entry.id)].sort(byNewest));
      const request = sync
        .run({ table: "entries", kind: "upsert", row: entry })
        .then(({ error }) => {
          pendingCreates.current.delete(entry.id);
          if (!error) return true;
          setEntries((all) => all.filter((e) => e.id !== entry.id));
          fail("We couldn’t save that thought. Please try again.", error);
          return false;
        });
      pendingCreates.current.set(entry.id, request);
      return request;
    },
    [sync, fail],
  );

  const updateEntry = useCallback<JournalApi["updateEntry"]>(
    async (id, patch) => {
      setEntries((all) =>
        all.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e)),
      );
      const pending = pendingCreates.current.get(id);
      if (pending && !(await pending)) return false;
      const { error } = await sync.run({ table: "entries", kind: "update", key: id, patch });
      if (error) {
        fail("We couldn’t save your latest changes.", error);
        return false;
      }
      return true;
    },
    [sync, fail],
  );

  const toggleFavorite = useCallback<JournalApi["toggleFavorite"]>(
    (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      const next = !entry.is_favorite;
      setEntries((all) => all.map((e) => (e.id === id ? { ...e, is_favorite: next } : e)));
      sync
        .run({ table: "entries", kind: "update", key: id, patch: { is_favorite: next } })
        .then(({ error }) => {
          if (!error) return;
          setEntries((all) => all.map((e) => (e.id === id ? { ...e, is_favorite: !next } : e)));
          fail("We couldn’t update your favorites.", error);
        });
    },
    [entries, sync, fail],
  );

  const deleteEntry = useCallback<JournalApi["deleteEntry"]>(
    (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      setEntries((all) => all.filter((e) => e.id !== id));
      sync
        .run({ table: "entries", kind: "delete", key: id })
        .then(({ error }) => {
          if (error) {
            setEntries((all) => [entry, ...all].sort(byNewest));
            fail("We couldn’t delete that thought.", error);
            return;
          }
          toast.show("Thought deleted.", {
            label: "Undo",
            onClick: () => {
              setEntries((all) => [entry, ...all].sort(byNewest));
              sync
                .run({ table: "entries", kind: "upsert", row: entry })
                .then(({ error: restoreError }) => {
                  if (!restoreError) return;
                  setEntries((all) => all.filter((e) => e.id !== id));
                  fail("We couldn’t bring that thought back.", restoreError);
                });
            },
          });
        });
    },
    [entries, sync, fail, toast],
  );

  const api = useMemo<JournalApi>(
    () => ({
      user,
      timeZone,
      now,
      pendingWrites,
      categories,
      entries,
      categoryById,
      countByCategory,
      createCategory,
      updateCategory,
      deleteCategory,
      createEntry,
      updateEntry,
      toggleFavorite,
      deleteEntry,
    }),
    [
      user,
      timeZone,
      now,
      pendingWrites,
      categories,
      entries,
      categoryById,
      countByCategory,
      createCategory,
      updateCategory,
      deleteCategory,
      createEntry,
      updateEntry,
      toggleFavorite,
      deleteEntry,
    ],
  );

  return <JournalContext value={api}>{children}</JournalContext>;
}

export function useJournal() {
  const ctx = use(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within JournalProvider");
  return ctx;
}
