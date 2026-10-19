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
import type {
  Category,
  CategoryInput,
  Entry,
  EntryPatch,
  Profile,
  Template,
  TemplateInput,
  WritingStyle,
} from "@/lib/types";

export type JournalUser = { id: string; email: string };

type JournalApi = {
  user: JournalUser;
  /** The pen name shown next to this person's shared thoughts. */
  profile: Profile;
  timeZone: string;
  /** Request time from the server, so "today" renders the same on server and client. */
  now: string;
  categories: Category[];
  entries: Entry[];
  /** The person's own templates, oldest first. Built-in ones live in lib/templates.ts. */
  templates: Template[];
  /** Writes not yet confirmed by the server, e.g. made while offline. */
  pendingWrites: number;
  categoryById: Map<string, Category>;
  countByCategory: Map<string, number>;
  /** Thoughts that aren’t in any corner. They gather in Unsorted. */
  unsortedCount: number;
  createCategory: (input: CategoryInput) => Category;
  updateCategory: (id: string, input: Partial<CategoryInput>) => void;
  deleteCategory: (id: string) => void;
  createEntry: (entry: Entry) => Promise<boolean>;
  updateEntry: (id: string, patch: EntryPatch) => Promise<boolean>;
  toggleFavorite: (id: string) => void;
  deleteEntry: (id: string) => void;
  createTemplate: (input: TemplateInput) => Template;
  updateTemplate: (id: string, input: Partial<TemplateInput>) => void;
  deleteTemplate: (id: string) => void;
  updateProfile: (profile: Pick<Profile, "display_name" | "emoji">) => Promise<boolean>;
  /** Changes the paper or pen used for every thought. Works offline. */
  setWritingStyle: (patch: Partial<WritingStyle>) => void;
};

const JournalContext = createContext<JournalApi | null>(null);

const TZ_COOKIE = "tz";

const noopSubscribe = () => () => {};
const getLocalTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

const byNewest = (a: Entry, b: Entry) => b.created_at.localeCompare(a.created_at);
const byOldest = (a: Template, b: Template) => a.created_at.localeCompare(b.created_at);

export function JournalProvider({
  user,
  initialProfile,
  initialCategories,
  initialEntries,
  initialTemplates,
  initialTimeZone,
  now,
  children,
}: {
  user: JournalUser;
  initialProfile: Profile;
  now: string;
  initialCategories: Category[];
  initialEntries: Entry[];
  initialTemplates: Template[];
  initialTimeZone: string;
  children: ReactNode;
}) {
  const supabase = createClient();
  const toast = useToast();
  const [categories, setCategories] = useState(initialCategories);
  const [entries, setEntries] = useState(initialEntries);
  const [templates, setTemplates] = useState(initialTemplates);
  const [profile, setProfile] = useState(initialProfile);
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
        if (snapshot.templates) setTemplates(snapshot.templates);
      } else if (outbox.length) {
        const local = applyOps(
          { categories: initialCategories, entries: initialEntries, templates: initialTemplates },
          outbox,
        );
        setCategories(local.categories);
        setEntries(local.entries.sort(byNewest));
        setTemplates(local.templates.sort(byOldest));
      }
      // A paper or pen picked offline, still waiting to sync.
      const style = outbox.flatMap((op) => (op.table === "profiles" && op.kind === "update" ? [op.patch] : []));
      if (style.length) setProfile((p) => Object.assign({ ...p }, ...style));
      sync.resume(outbox);
      setRestored(true);
    });
    return () => {
      cancelled = true;
    };
  }, [user.id, now, initialCategories, initialEntries, initialTemplates, sync]);

  // Keep a copy of the journal on this device so it can be read offline.
  useEffect(() => {
    if (!restored) return;
    const timer = setTimeout(
      () => saveSnapshot({ userId: user.id, basedOn: basedOn.current, categories, entries, templates }),
      400,
    );
    return () => clearTimeout(timer);
  }, [restored, user.id, categories, entries, templates]);

  // Dates render in the reader's timezone; remember it so the server can match next time.
  useEffect(() => {
    if (timeZone !== initialTimeZone) {
      document.cookie = `${TZ_COOKIE}=${encodeURIComponent(timeZone)}; path=/; max-age=31536000; samesite=lax`;
    }
  }, [timeZone, initialTimeZone]);

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const [countByCategory, unsortedCount] = useMemo(() => {
    const counts = new Map<string, number>();
    let unsorted = 0;
    for (const entry of entries) {
      const id = entry.category_id;
      if (id && categoryById.has(id)) counts.set(id, (counts.get(id) ?? 0) + 1);
      else unsorted++;
    }
    return [counts, unsorted] as const;
  }, [entries, categoryById]);

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
        description: input.description.trim(),
        is_public: input.is_public,
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
      const patch = {
        ...input,
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.description !== undefined && { description: input.description.trim() }),
      };
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

  const createTemplate = useCallback<JournalApi["createTemplate"]>(
    (input) => {
      const at = new Date().toISOString();
      const template: Template = { id: crypto.randomUUID(), ...trimTemplate(input), created_at: at, updated_at: at };
      setTemplates((all) => [...all, template]);
      sync
        .run({ table: "templates", kind: "upsert", row: template })
        .then(({ error }) => {
          if (!error) return;
          setTemplates((all) => all.filter((t) => t.id !== template.id));
          fail("We couldn’t save that template. Please try again.", error);
        });
      return template;
    },
    [sync, fail],
  );

  const updateTemplate = useCallback<JournalApi["updateTemplate"]>(
    (id, input) => {
      const previous = templates.find((t) => t.id === id);
      if (!previous) return;
      const patch = trimTemplate(input);
      setTemplates((all) => all.map((t) => (t.id === id ? { ...t, ...patch, updated_at: new Date().toISOString() } : t)));
      sync
        .run({ table: "templates", kind: "update", key: id, patch })
        .then(({ error }) => {
          if (!error) return;
          setTemplates((all) => all.map((t) => (t.id === id ? previous : t)));
          fail("We couldn’t update that template.", error);
        });
    },
    [templates, sync, fail],
  );

  const deleteTemplate = useCallback<JournalApi["deleteTemplate"]>(
    (id) => {
      const template = templates.find((t) => t.id === id);
      if (!template) return;
      const restore = () => setTemplates((all) => [...all.filter((t) => t.id !== id), template].sort(byOldest));
      setTemplates((all) => all.filter((t) => t.id !== id));
      sync
        .run({ table: "templates", kind: "delete", key: id })
        .then(({ error }) => {
          if (error) {
            restore();
            fail("We couldn’t remove that template.", error);
            return;
          }
          toast.show(`“${template.name}” removed.`, {
            label: "Undo",
            onClick: () => {
              restore();
              sync
                .run({ table: "templates", kind: "upsert", row: template })
                .then(({ error: restoreError }) => {
                  if (!restoreError) return;
                  setTemplates((all) => all.filter((t) => t.id !== id));
                  fail("We couldn’t bring that template back.", restoreError);
                });
            },
          });
        });
    },
    [templates, sync, fail, toast],
  );

  // Sent straight away rather than through the outbox: it's rare, and only matters online.
  const updateProfile = useCallback<JournalApi["updateProfile"]>(
    async (next) => {
      const previous = profile;
      const trimmed = { display_name: next.display_name.trim(), emoji: next.emoji };
      setProfile((p) => ({ ...p, ...trimmed }));
      const { error } = await supabase.from("profiles").upsert({ id: user.id, ...trimmed });
      if (!error) return true;
      setProfile((p) => ({ ...p, display_name: previous.display_name, emoji: previous.emoji }));
      fail("We couldn’t update your profile. Please try again.", error);
      return false;
    },
    [profile, supabase, user.id, fail],
  );

  const setWritingStyle = useCallback<JournalApi["setWritingStyle"]>(
    (patch) => {
      const previous = { paper: profile.paper, pen: profile.pen };
      setProfile((p) => ({ ...p, ...patch }));
      sync
        .run({ table: "profiles", kind: "update", key: user.id, patch })
        .then(({ error }) => {
          if (!error) return;
          setProfile((p) => ({ ...p, ...previous }));
          fail("We couldn’t save your page style.", error);
        });
    },
    [profile.paper, profile.pen, sync, user.id, fail],
  );

  const api = useMemo<JournalApi>(
    () => ({
      user,
      profile,
      timeZone,
      now,
      pendingWrites,
      categories,
      entries,
      templates,
      categoryById,
      countByCategory,
      unsortedCount,
      createCategory,
      updateCategory,
      deleteCategory,
      createEntry,
      updateEntry,
      toggleFavorite,
      deleteEntry,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      updateProfile,
      setWritingStyle,
    }),
    [
      user,
      profile,
      timeZone,
      now,
      pendingWrites,
      categories,
      entries,
      templates,
      categoryById,
      countByCategory,
      unsortedCount,
      createCategory,
      updateCategory,
      deleteCategory,
      createEntry,
      updateEntry,
      toggleFavorite,
      deleteEntry,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      updateProfile,
      setWritingStyle,
    ],
  );

  return <JournalContext value={api}>{children}</JournalContext>;
}

function trimTemplate<T extends Partial<TemplateInput>>(input: T): T {
  const out = { ...input };
  if (out.name !== undefined) out.name = out.name.trim();
  if (out.description !== undefined) out.description = out.description.trim();
  if (out.title !== undefined) out.title = out.title.trim();
  return out;
}

export function useJournal() {
  const ctx = use(JournalContext);
  if (!ctx) throw new Error("useJournal must be used within JournalProvider");
  return ctx;
}

/** True when a thought isn’t in any corner, including one whose corner is gone. */
export function isUnsorted(entry: Pick<Entry, "category_id">, categoryById: Map<string, Category>) {
  return !entry.category_id || !categoryById.has(entry.category_id);
}
