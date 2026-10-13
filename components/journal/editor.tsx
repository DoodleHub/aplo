"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { fullDateTime, wordCount } from "@/lib/format";
import { MOODS, palette } from "@/lib/palette";
import type { Entry } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { ArrowLeftIcon, CheckIcon, HeartIcon, MoreIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { useJournal } from "./store";

const PROMPTS = [
  "What’s on your mind?",
  "What made you smile today?",
  "What’s one thing you’d like to let go of?",
  "Describe a small moment you want to remember.",
  "What are you grateful for right now?",
  "How are you, really?",
  "What would you tell a friend feeling this way?",
];

const SAVE_DELAY = 600;

type Draft = Pick<Entry, "title" | "content" | "mood" | "category_id" | "is_favorite">;
type Status = "idle" | "saving" | "saved" | "error";

export function Editor({
  id,
  entry,
  defaultCategoryId,
}: {
  id: string;
  /** Undefined while this is a brand-new, unsaved entry. */
  entry?: Entry;
  defaultCategoryId?: string | null;
}) {
  const router = useRouter();
  const { categories, categoryById, createEntry, updateEntry, deleteEntry, timeZone } = useJournal();
  const { openCategoryDialog } = useShell();

  const [draft, setDraft] = useState<Draft>(() => ({
    title: entry?.title ?? "",
    content: entry?.content ?? "",
    mood: entry?.mood ?? null,
    category_id: entry ? entry.category_id : (defaultCategoryId ?? null),
    is_favorite: entry?.is_favorite ?? false,
  }));
  const [status, setStatus] = useState<Status>(entry ? "saved" : "idle");
  const [createdAt] = useState(() => entry?.created_at ?? new Date().toISOString());

  const [exists, setExists] = useState(Boolean(entry));
  const persisted = useRef(Boolean(entry));
  const dirty = useRef(false);
  const latest = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    const current = latest.current;

    if (!persisted.current) {
      // Don't create empty entries just because a mood or corner was picked.
      if (!current.title.trim() && !current.content.trim()) return;
      dirty.current = false;
      persisted.current = true;
      setStatus("saving");
      const ok = await createEntry({ id, ...current, created_at: createdAt, updated_at: createdAt });
      if (!ok) {
        persisted.current = false;
        dirty.current = true;
        setStatus("error");
        return;
      }
      setExists(true);
      window.history.replaceState(null, "", `/entry/${id}`);
    } else {
      dirty.current = false;
      setStatus("saving");
      if (!(await updateEntry(id, current))) {
        dirty.current = true;
        setStatus("error");
        return;
      }
    }
    if (!dirty.current) setStatus("saved");
  }, [id, createdAt, createEntry, updateEntry]);

  const change = (patch: Partial<Draft>, immediate = false) => {
    setDraft((d) => ({ ...d, ...patch }));
    latest.current = { ...latest.current, ...patch };
    dirty.current = true;
    if (persisted.current) setStatus("saving");
    clearTimeout(timer.current);
    if (immediate) save();
    else timer.current = setTimeout(save, SAVE_DELAY);
  };

  // Flush pending changes when leaving the page.
  useEffect(() => () => void save(), [save]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) {
        save();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [save]);

  // Grow textareas with their content.
  useLayoutEffect(() => {
    for (const el of [titleRef.current, contentRef.current]) {
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [draft.title, draft.content]);

  useEffect(() => {
    if (!entry) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backHref = draft.category_id && categoryById.has(draft.category_id) ? `/c/${draft.category_id}` : "/";

  const finish = async () => {
    await save();
    router.push(backHref);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        save();
      } else if (e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const words = wordCount(draft.content);
  const prompt = PROMPTS[id.charCodeAt(0) % PROMPTS.length];

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-5 flex items-center gap-2">
        <Link
          href={backHref}
          className="-ml-2 inline-flex h-10 items-center gap-2 rounded-xl px-3 text-[0.95rem] text-muted transition-colors hover:bg-sage-100 hover:text-ink"
        >
          <ArrowLeftIcon size={18} />
          Back
        </Link>
        <SaveStatus status={status} />
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={draft.is_favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={draft.is_favorite}
            onClick={() => change({ is_favorite: !draft.is_favorite }, true)}
            className={cn("h-10 w-10", draft.is_favorite && "text-heart hover:text-heart")}
          >
            <HeartIcon
              key={String(draft.is_favorite)}
              size={21}
              filled={draft.is_favorite}
              className={draft.is_favorite ? "animate-heart" : ""}
            />
          </IconButton>
          {exists ? (
            <Menu
              items={[
                {
                  label: "Delete thought",
                  icon: <TrashIcon size={17} />,
                  tone: "danger",
                  onSelect: () => {
                    clearTimeout(timer.current);
                    dirty.current = false;
                    deleteEntry(id);
                    router.push(backHref);
                  },
                },
              ]}
              trigger={(props) => (
                <IconButton label="More options" className="h-10 w-10" {...props}>
                  <MoreIcon size={20} />
                </IconButton>
              )}
            />
          ) : null}
          <Button size="sm" className="ml-2 h-10 rounded-xl px-4" onClick={finish}>
            Done
          </Button>
        </div>
      </div>

      <article className="rounded-3xl border border-line bg-surface px-5 py-6 shadow-soft sm:px-10 sm:py-9">
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {categories.map((category) => {
            const selected = draft.category_id === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => change({ category_id: selected ? null : category.id }, true)}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[0.82rem] font-medium transition-all duration-200 ease-soft",
                  selected
                    ? cn(palette[category.color].chip, "text-ink ring-1 ring-inset", palette[category.color].ring)
                    : "text-muted hover:bg-sage-50 hover:text-ink",
                )}
              >
                <span className={cn("transition-[filter]", !selected && "grayscale-[60%]")}>{category.emoji}</span>
                {category.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openCategoryDialog()}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[0.82rem] text-subtle transition-colors hover:bg-sage-50 hover:text-ink"
          >
            <PlusIcon size={14} />
            New
          </button>
        </div>

        <textarea
          ref={titleRef}
          rows={1}
          value={draft.title}
          onChange={(e) => change({ title: e.target.value.replace(/\n/g, "") })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              contentRef.current?.focus();
            }
          }}
          maxLength={200}
          placeholder="Give it a little title"
          aria-label="Title"
          className="mt-6 block w-full resize-none overflow-hidden bg-transparent font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] text-ink outline-none placeholder:text-faint sm:text-[2.1rem]"
        />
        <p className="mt-2 text-sm text-subtle" suppressHydrationWarning>
          {fullDateTime(createdAt, timeZone)}
        </p>

        <textarea
          ref={contentRef}
          value={draft.content}
          onChange={(e) => change({ content: e.target.value })}
          placeholder={prompt}
          aria-label="Your thoughts"
          className="mt-6 block min-h-[38vh] w-full resize-none overflow-hidden bg-transparent text-[1.05rem] leading-[1.85] text-ink outline-none placeholder:text-faint"
        />

        <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium text-subtle">How are you feeling?</p>
            <div className="-ml-1 flex flex-wrap gap-0.5">
              {MOODS.map((mood) => {
                const selected = draft.mood === mood.emoji;
                return (
                  <button
                    key={mood.emoji}
                    type="button"
                    title={mood.label}
                    aria-label={mood.label}
                    aria-pressed={selected}
                    onClick={() => change({ mood: selected ? null : mood.emoji }, true)}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all duration-200 ease-spring",
                      selected
                        ? "scale-110 bg-sage-100 ring-1 ring-sage-300"
                        : "opacity-60 grayscale-[40%] hover:scale-110 hover:opacity-100 hover:grayscale-0",
                    )}
                  >
                    {mood.emoji}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="shrink-0 text-sm tabular-nums text-subtle">
            {words} {words === 1 ? "word" : "words"}
          </p>
        </div>
      </article>

      <p className="mt-4 hidden text-center text-xs text-faint sm:block">
        Saves as you write · <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> when
        you’re done
      </p>
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  if (status === "idle") return null;
  return (
    <span
      key={status}
      className={cn(
        "inline-flex animate-fade-in items-center gap-1.5 text-xs",
        status === "error" ? "text-danger" : "text-subtle",
      )}
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-400" /> Saving…
        </>
      )}
      {status === "saved" && (
        <>
          <CheckIcon size={14} className="text-sage-500" /> Saved
        </>
      )}
      {status === "error" && "Not saved — we’ll retry as you type"}
    </span>
  );
}
