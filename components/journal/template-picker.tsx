"use client";

import { useMemo, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { Popover } from "@/components/ui/popover";
import { CheckIcon, PlusIcon, TemplateIcon } from "@/components/icons";
import { useJournal } from "./store";

/** The person's own templates first, then the ready-made ones. */
export function useAllTemplates() {
  const { templates } = useJournal();
  return useMemo(() => [...templates, ...BUILT_IN_TEMPLATES], [templates]);
}

/** The quiet second line on a template card: its description, or else the first prompt in it. */
function summary(template: Template) {
  if (template.description) return template.description;
  const line = template.content.split("\n").find((l) => l.trim());
  return line?.replace(/^\s*(?:[-*•]|\d+[.)]|\[[ x]\])\s*/, "") || "Your own template";
}

/**
 * Cards across the top of a blank page, each a ready-made shape for the page. They look like
 * little pages with a line of what's inside, so they never read as corner chips. Hovering one
 * previews it on the page; picking one fills the page in. It folds away once the writer starts.
 */
export function TemplateStrip({
  show,
  activeId,
  onApply,
  onClear,
  onPreview,
  onCreate,
  onManage,
}: {
  show: boolean;
  /** The template currently on the page, untouched. Null for a blank page. */
  activeId: string | null;
  onApply: (template: Template) => void;
  onClear: () => void;
  onPreview: (template: Template | null) => void;
  onCreate: () => void;
  onManage: () => void;
}) {
  const all = useAllTemplates();

  // Left and right walk the row, like the arrow keys in any other picker.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const cards = [...e.currentTarget.querySelectorAll<HTMLElement>("button")];
    const at = cards.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    e.preventDefault();
    const next = cards[at + (e.key === "ArrowRight" ? 1 : -1)];
    next?.focus();
    next?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const link =
    "rounded-md px-1.5 py-0.5 text-xs font-medium text-subtle transition-colors hover:bg-sage-50 hover:text-ink";

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-soft",
        show ? "mt-6 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
      )}
      inert={!show}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex min-w-0 items-center gap-2">
          <TemplateIcon size={16} className="shrink-0 text-subtle" />
          <p className="min-w-0 flex-1 truncate text-[0.82rem] font-medium text-muted">
            Start from a template
            <span className="text-subtle max-sm:hidden"> · or just write</span>
          </p>
          <div className="-mr-1.5 flex shrink-0 items-center">
            {activeId && (
              <button type="button" onClick={onClear} className={cn(link, "animate-fade-in")}>
                Clear
              </button>
            )}
            <button type="button" onClick={onManage} className={link}>
              Manage
            </button>
          </div>
        </div>
        <div
          role="group"
          aria-label="Templates"
          onKeyDown={onKeyDown}
          onPointerLeave={() => onPreview(null)}
          className="-mx-1 mt-2.5 flex snap-x scroll-px-1 gap-2 overflow-x-auto px-1 pt-1 pb-2 scrollbar-none mask-[linear-gradient(to_right,transparent,black_0.25rem,black_calc(100%-2.5rem),transparent)]"
        >
          {all.map((template, i) => {
            const selected = activeId === template.id;
            return (
              <button
                key={template.id}
                type="button"
                aria-pressed={selected}
                onClick={() => (selected ? onClear() : onApply(template))}
                onPointerEnter={(e) => e.pointerType === "mouse" && onPreview(template)}
                onFocus={() => onPreview(template)}
                onBlur={() => onPreview(null)}
                style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
                className={cn(
                  "group/card relative flex w-38 shrink-0 animate-fade-in snap-start flex-col items-start rounded-2xl border p-3 text-left transition-[background-color,border-color,transform,box-shadow] duration-200 ease-soft active:scale-[0.98] sm:w-44",
                  selected
                    ? "border-sage-300 bg-sage-50 shadow-soft ring-1 ring-sage-300 ring-inset"
                    : "border-line bg-surface/70 hover:-translate-y-0.5 hover:border-line-strong hover:bg-surface hover:shadow-soft",
                )}
              >
                <span className="flex w-full items-start justify-between">
                  <span
                    aria-hidden="true"
                    className="text-xl leading-none transition-transform duration-200 ease-spring group-hover/card:-rotate-6 group-hover/card:scale-110"
                  >
                    {template.emoji}
                  </span>
                  {selected && <CheckIcon size={15} className="animate-pop-in text-sage-600" />}
                </span>
                <span className="mt-2.5 block w-full truncate text-[0.85rem] font-medium text-ink">
                  {template.name}
                </span>
                <span className="mt-0.5 line-clamp-2 min-h-8 text-xs leading-4 text-subtle">{summary(template)}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onCreate}
            className="flex w-32 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong p-3 text-[0.82rem] font-medium text-subtle transition-[color,border-color,background-color] duration-200 hover:border-sage-400 hover:bg-sage-50 hover:text-ink"
          >
            <PlusIcon size={18} />
            Make your own
          </button>
        </div>
      </div>
    </div>
  );
}

/** Toolbar button: use a template on any page, or save this page as one. */
export function TemplateMenu({
  onApply,
  onSaveAsTemplate,
  onManage,
  canSave,
}: {
  onApply: (template: Template) => void;
  onSaveAsTemplate: () => void;
  onManage: () => void;
  canSave: boolean;
}) {
  const { templates } = useJournal();

  const item =
    "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-sm text-ink transition-colors hover:bg-sage-50 focus-visible:bg-sage-50 disabled:pointer-events-none disabled:opacity-45";

  const row = (template: Template, close: () => void) => (
    <button
      key={template.id}
      type="button"
      role="menuitem"
      className={item}
      onClick={() => {
        close();
        onApply(template);
      }}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sage-50 text-base">
        {template.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium">{template.name}</span>
        {template.description && <span className="block truncate text-xs text-subtle">{template.description}</span>}
      </span>
    </button>
  );

  return (
    <Popover
      role="menu"
      label="Templates"
      room={460}
      panelClassName="w-[19rem] max-w-[calc(100vw-2rem)]"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label="Templates"
          title="Templates"
          className={cn(
            "inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-sage-100 hover:text-ink sm:px-2.5 sm:pr-3",
            props["aria-expanded"] && "bg-sage-100 text-ink",
          )}
        >
          <TemplateIcon size={20} />
          <span className="hidden sm:inline">Templates</span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="max-h-[min(22rem,55vh)] overflow-y-auto">
            {templates.length > 0 && (
              <>
                <p className="px-2.5 pt-2 pb-1 text-eyebrow font-semibold uppercase text-muted">Yours</p>
                {templates.map((t) => row(t, close))}
              </>
            )}
            <p className="px-2.5 pt-2 pb-1 text-eyebrow font-semibold uppercase text-muted">Ready-made</p>
            {BUILT_IN_TEMPLATES.map((t) => row(t, close))}
          </div>
          <div className="mt-1 border-t border-line pt-1">
            <button
              type="button"
              role="menuitem"
              className={item}
              disabled={!canSave}
              onClick={() => {
                close();
                onSaveAsTemplate();
              }}
            >
              <PlusIcon size={17} className="mx-[0.4rem] shrink-0 text-ink-soft" />
              Save this page as a template
            </button>
            <button
              type="button"
              role="menuitem"
              className={item}
              onClick={() => {
                close();
                onManage();
              }}
            >
              <TemplateIcon size={17} className="mx-[0.4rem] shrink-0 text-ink-soft" />
              Manage templates
            </button>
          </div>
        </>
      )}
    </Popover>
  );
}
