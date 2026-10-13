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
      supabase
        .from("categories")
        .insert(category)
        .then(({ error }) => {
          if (!error) return;
          setCategories((all) => all.filter((c) => c.id !== category.id));
          fail("We couldn’t create that corner. Please try again.", error);
        });
      return category;
    },
    [categories, supabase, fail],
  );

  const updateCategory = useCallback<JournalApi["updateCategory"]>(
    (id, input) => {
      const previous = categories.find((c) => c.id === id);
      if (!previous) return;
      const patch = input.name ? { ...input, name: input.name.trim() } : input;
      setCategories((all) => all.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      supabase
        .from("categories")
        .update(patch)
        .eq("id", id)
        .then(({ error }) => {
          if (!error) return;
          setCategories((all) => all.map((c) => (c.id === id ? previous : c)));
          fail("We couldn’t update that corner.", error);
        });
    },
    [categories, supabase, fail],
  );

  const deleteCategory = useCallback<JournalApi["deleteCategory"]>(
    (id) => {
      const previousCategories = categories;
      const previousEntries = entries;
      setCategories((all) => all.filter((c) => c.id !== id));
      setEntries((all) => all.map((e) => (e.category_id === id ? { ...e, category_id: null } : e)));
      supabase
        .from("categories")
        .delete()
        .eq("id", id)
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
    [categories, entries, supabase, fail, toast],
  );

  const createEntry = useCallback<JournalApi["createEntry"]>(
    (entry) => {
      setEntries((all) => [entry, ...all.filter((e) => e.id !== entry.id)].sort(byNewest));
      const request = Promise.resolve(
        supabase.from("entries").insert({
          id: entry.id,
          category_id: entry.category_id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          is_favorite: entry.is_favorite,
          created_at: entry.created_at,
        }),
      ).then(({ error }) => {
        pendingCreates.current.delete(entry.id);
        if (!error) return true;
        setEntries((all) => all.filter((e) => e.id !== entry.id));
        fail("We couldn’t save that thought. Please try again.", error);
        return false;
      });
      pendingCreates.current.set(entry.id, request);
      return request;
    },
    [supabase, fail],
  );

  const updateEntry = useCallback<JournalApi["updateEntry"]>(
    async (id, patch) => {
      setEntries((all) =>
        all.map((e) => (e.id === id ? { ...e, ...patch, updated_at: new Date().toISOString() } : e)),
      );
      const pending = pendingCreates.current.get(id);
      if (pending && !(await pending)) return false;
      const { error } = await supabase.from("entries").update(patch).eq("id", id);
      if (error) {
        fail("We couldn’t save your latest changes.", error);
        return false;
      }
      return true;
    },
    [supabase, fail],
  );

  const toggleFavorite = useCallback<JournalApi["toggleFavorite"]>(
    (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      const next = !entry.is_favorite;
      setEntries((all) => all.map((e) => (e.id === id ? { ...e, is_favorite: next } : e)));
      supabase
        .from("entries")
        .update({ is_favorite: next })
        .eq("id", id)
        .then(({ error }) => {
          if (!error) return;
          setEntries((all) => all.map((e) => (e.id === id ? { ...e, is_favorite: !next } : e)));
          fail("We couldn’t update your favorites.", error);
        });
    },
    [entries, supabase, fail],
  );

  const deleteEntry = useCallback<JournalApi["deleteEntry"]>(
    (id) => {
      const entry = entries.find((e) => e.id === id);
      if (!entry) return;
      setEntries((all) => all.filter((e) => e.id !== id));
      supabase
        .from("entries")
        .delete()
        .eq("id", id)
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
              supabase
                .from("entries")
                .insert(entry)
                .then(({ error: restoreError }) => {
                  if (!restoreError) return;
                  setEntries((all) => all.filter((e) => e.id !== id));
                  fail("We couldn’t bring that thought back.", restoreError);
                });
            },
          });
        });
    },
    [entries, supabase, fail, toast],
  );

  const api = useMemo<JournalApi>(
    () => ({
      user,
      timeZone,
      now,
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
