"use client";

import { useMemo, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { BUILT_IN_TEMPLATES } from "@/lib/templates";
import type { Template } from "@/lib/types";
import { Popover } from "@/components/ui/popover";
import { PlusIcon, TemplateIcon } from "@/components/icons";
import { useJournal } from "./store";

/** The person's own templates first, then the ready-made ones. */
export function useAllTemplates() {
  const { templates } = useJournal();
  return useMemo(() => [...templates, ...BUILT_IN_TEMPLATES], [templates]);
}

/**
 * A row of templates across the top of a blank page. Hovering one previews it on the page;
 * picking one fills the page in. It folds away once the writer starts writing.
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

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity,margin] duration-300 ease-soft",
        show ? "mt-5 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0",
      )}
      inert={!show}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <p className="text-eyebrow font-semibold uppercase text-muted">Start with</p>
          <button
            type="button"
            onClick={onManage}
            className="-mr-1.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-subtle transition-colors hover:bg-sage-50 hover:text-ink"
          >
            Manage
          </button>
        </div>
        <div
          role="radiogroup"
          aria-label="Templates"
          onPointerLeave={() => onPreview(null)}
          className="-mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 py-1 scrollbar-none mask-[linear-gradient(to_right,transparent,black_0.25rem,black_calc(100%-2rem),transparent)]"
        >
          <Chip selected={activeId === null} onClick={onClear} onPreview={() => onPreview(null)}>
            Blank
          </Chip>
          {all.map((template, i) => (
            <Chip
              key={template.id}
              selected={activeId === template.id}
              title={template.description || undefined}
              onClick={() => onApply(template)}
              onPreview={() => onPreview(template)}
              onLeave={() => onPreview(null)}
              style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}
            >
              <span aria-hidden="true">{template.emoji}</span>
              {template.name}
            </Chip>
          ))}
          <button
            type="button"
            onClick={onCreate}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-xl border border-dashed border-line-strong px-3 text-[0.82rem] font-medium text-subtle transition-[color,border-color,background-color] duration-200 hover:border-sage-400 hover:bg-sage-50 hover:text-ink"
          >
            <PlusIcon size={14} />
            Make your own
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({
  selected,
  onClick,
  onPreview,
  onLeave,
  title,
  style,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  onPreview: () => void;
  onLeave?: () => void;
  title?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={title}
      onClick={onClick}
      onPointerEnter={(e) => e.pointerType === "mouse" && onPreview()}
      onFocus={onPreview}
      onBlur={onLeave}
      style={style}
      className={cn(
        "inline-flex h-9 shrink-0 animate-fade-in items-center gap-1.5 rounded-xl border px-3 text-[0.82rem] font-medium transition-[color,background-color,border-color,transform,box-shadow] duration-200 ease-soft active:scale-[0.97]",
        selected
          ? "border-sage-300 bg-sage-100 text-ink shadow-soft"
          : "border-line bg-surface/70 text-muted hover:-translate-y-0.5 hover:border-line-strong hover:text-ink hover:shadow-soft",
      )}
    >
      {children}
    </button>
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
            "inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-muted transition-colors duration-200 hover:bg-sage-100 hover:text-ink sm:pr-3",
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
