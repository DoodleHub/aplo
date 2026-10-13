"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { shortDate } from "@/lib/format";
import { SearchIcon } from "@/components/icons";
import { useJournal } from "./store";

const MAX_RESULTS = 8;

export function Search({ className }: { className?: string }) {
  const router = useRouter();
  const { entries, categoryById, timeZone } = useJournal();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return entries
      .filter((entry) => {
        const category = entry.category_id ? categoryById.get(entry.category_id) : undefined;
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.content.toLowerCase().includes(q) ||
          category?.name.toLowerCase().includes(q)
        );
      })
      .slice(0, MAX_RESULTS);
  }, [entries, categoryById, q]);

  // ⌘K / Ctrl+K or "/" focuses search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/entry/${id}`);
  };

  const showPanel = open && q.length > 0;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <SearchIcon
        size={16}
        className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-soft"
      />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls={listId}
        aria-activedescendant={showPanel && results[active] ? `${listId}-${active}` : undefined}
        aria-label="Search your thoughts"
        placeholder="Search your thoughts"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            go(results[active].id);
          } else if (e.key === "Escape") {
            if (query) setQuery("");
            else inputRef.current?.blur();
            setOpen(false);
          }
        }}
        className="peer h-12 w-full rounded-2xl border border-line bg-surface pr-14 pl-10 text-base text-ink lg:text-[0.95rem] shadow-soft outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-soft/80 hover:border-line-strong focus:border-sage-400 focus:ring-4 focus:ring-sage-200/70 [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="pointer-events-none absolute top-1/2 right-3.5 hidden -translate-y-1/2 rounded-md border border-line bg-canvas px-1.5 py-0.5 font-sans text-[0.7rem] text-subtle transition-opacity peer-focus:opacity-0 md:block">
        ⌘K
      </kbd>

      {showPanel && (
        <div className="absolute top-full right-0 z-40 mt-2 w-full min-w-[19rem] animate-pop-in overflow-hidden rounded-2xl border border-line bg-surface p-1.5 shadow-pop sm:w-[26rem]">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No thoughts match “{query.trim()}” yet.
            </p>
          ) : (
            <ul id={listId} role="listbox" aria-label="Search results">
              {results.map((entry, i) => {
                const category = entry.category_id ? categoryById.get(entry.category_id) : undefined;
                return (
                  <li
                    key={entry.id}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    onPointerEnter={() => setActive(i)}
                    onClick={() => go(entry.id)}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 transition-colors",
                      i === active && "bg-sage-50",
                    )}
                  >
                    <span className="mt-0.5 text-base leading-none">{category?.emoji ?? "📝"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-ink">
                          <Highlight text={entry.title.trim() || "Untitled thought"} query={q} />
                        </span>
                        <span className="shrink-0 text-xs text-subtle">{shortDate(entry.created_at, timeZone)}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-muted">
                        <Highlight text={snippet(entry.content, q)} query={q} />
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function snippet(text: string, q: string) {
  const index = text.toLowerCase().indexOf(q);
  if (index < 30) return text;
  return "…" + text.slice(index - 24);
}

function Highlight({ text, query }: { text: string; query: string }) {
  if (!query) return text;
  const index = text.toLowerCase().indexOf(query);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-sm bg-cat-sand-chip px-0.5 text-ink">{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
}
