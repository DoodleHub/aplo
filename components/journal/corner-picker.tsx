"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { Category } from "@/lib/types";
import { Popover } from "@/components/ui/popover";
import { CheckIcon, ChevronDownIcon, CloseIcon, FolderIcon, GlobeIcon, PlusIcon } from "@/components/icons";
import { useJournal } from "./store";

/**
 * Where a thought lives. One quiet pill at the top of the page rather than a row of chips,
 * so it reads as a setting on the thought, not as something that fills the page (that's templates).
 */
export function CornerPicker({
  value,
  onChange,
  onCreate,
}: {
  value: Category | undefined;
  onChange: (categoryId: string | null) => void;
  /** Opens the new-corner dialog; the new corner should be picked once it's made. */
  onCreate: () => void;
}) {
  const { categories } = useJournal();

  return (
    <Popover
      role="menu"
      label="Corners"
      align="start"
      room={380}
      // Hug the pill: a full-width anchor would count clicks beside it as "inside" and keep the list open.
      className="w-fit max-w-full"
      panelClassName="w-68 max-w-[calc(100vw-2rem)]"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={value ? `Corner: ${value.name}. Change corner` : "Add to a corner"}
          className={cn(
            "inline-flex h-9 max-w-full min-w-0 items-center gap-1.5 rounded-full px-3 text-[0.82rem] font-medium transition-[color,background-color,border-color,box-shadow] duration-200 ease-soft",
            value
              ? cn(palette[value.color].chip, "text-ink ring-1 ring-inset hover:shadow-soft", palette[value.color].ring)
              : "border border-dashed border-line-strong text-subtle hover:border-sage-400 hover:bg-sage-50 hover:text-ink",
            props["aria-expanded"] && !value && "border-sage-400 bg-sage-50 text-ink",
          )}
        >
          {value ? (
            <span key={value.id} aria-hidden="true" className="animate-pop-in">
              {value.emoji}
            </span>
          ) : (
            <FolderIcon size={15} className="shrink-0" />
          )}
          <span className="truncate">{value ? value.name : "Add to a corner"}</span>
          <ChevronDownIcon
            size={14}
            className={cn("shrink-0 opacity-60 transition-transform duration-200", props["aria-expanded"] && "rotate-180")}
          />
        </button>
      )}
    >
      {(close) => (
        <CornerList
          categories={categories}
          value={value}
          onPick={(id) => {
            close();
            onChange(id);
          }}
          onCreate={() => {
            close();
            onCreate();
          }}
        />
      )}
    </Popover>
  );
}

function CornerList({
  categories,
  value,
  onPick,
  onCreate,
}: {
  categories: Category[];
  value: Category | undefined;
  onPick: (id: string | null) => void;
  onCreate: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  // Start on the current corner. Wait a frame: the panel is hidden until it has been placed.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const items = listRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]");
      const current = listRef.current?.querySelector<HTMLElement>("[aria-checked=true]");
      (current ?? items?.[0])?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
    const items = [...(listRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]") ?? [])];
    if (!items.length) return;
    e.preventDefault();
    const at = items.indexOf(document.activeElement as HTMLElement);
    const next =
      e.key === "Home" ? 0
      : e.key === "End" ? items.length - 1
      : (at + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  };

  const item =
    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-ink outline-none transition-colors hover:bg-sage-50 focus-visible:bg-sage-50";

  return (
    <div ref={listRef} onKeyDown={onKeyDown}>
      <p className="px-2.5 pt-2 pb-1 text-eyebrow font-semibold uppercase text-muted">Keep it in a corner</p>
      <div className="max-h-[min(16rem,45vh)] overflow-y-auto">
        {categories.length === 0 && (
          <p className="px-2.5 py-2 text-sm text-subtle">No corners yet. Make one for a certain kind of thought.</p>
        )}
        {categories.map((category) => {
          const selected = value?.id === category.id;
          return (
            <button
              key={category.id}
              type="button"
              role="menuitemradio"
              aria-checked={selected}
              onClick={() => onPick(category.id)}
              className={cn(item, selected && "bg-sage-50")}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base",
                  palette[category.color].chip,
                )}
              >
                {category.emoji}
              </span>
              <span className={cn("min-w-0 flex-1 truncate", selected && "font-medium")}>{category.name}</span>
              {category.is_public && (
                <>
                  <GlobeIcon size={14} className="shrink-0 text-subtle" />
                  <span className="sr-only">Shared in Discover</span>
                </>
              )}
              {selected && <CheckIcon size={16} className="shrink-0 text-sage-600" />}
            </button>
          );
        })}
      </div>
      <div className="mt-1 border-t border-line pt-1">
        {value && (
          <button type="button" role="menuitem" onClick={() => onPick(null)} className={item}>
            <CloseIcon size={16} className="mx-2 shrink-0 text-ink-soft" />
            Take it out of “{value.name}”
          </button>
        )}
        <button type="button" role="menuitem" onClick={onCreate} className={item}>
          <PlusIcon size={16} className="mx-2 shrink-0 text-ink-soft" />
          New corner
        </button>
      </div>
    </div>
  );
}
