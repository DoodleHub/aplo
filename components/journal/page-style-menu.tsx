"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { papers, pens } from "@/lib/page-style";
import { PAPERS, PENS, type Paper, type Pen } from "@/lib/types";
import { Popover } from "@/components/ui/popover";
import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { useJournal } from "./store";

/**
 * Paper and pen for the editor. Changes show on the page straight away, behind the open
 * panel, and are kept for every thought from then on.
 */
export function PageStyleMenu() {
  const { profile, setWritingStyle } = useJournal();
  const { paper, pen } = profile;

  return (
    <Popover
      role="dialog"
      label="Page style"
      room={440}
      panelClassName="w-[20rem] max-w-[calc(100vw-2rem)] p-4"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Page style: ${papers[paper].label} paper, ${pens[pen].label} handwriting`}
          title="Page style"
          className={cn(
            "group inline-flex h-10 items-center gap-2 rounded-xl px-2 text-sm font-medium text-muted transition-colors duration-200 hover:bg-sage-100 hover:text-ink sm:px-2.5 sm:pr-3",
            props["aria-expanded"] && "bg-sage-100 text-ink",
          )}
        >
          <PageSwatch paper={paper} pen={pen} />
          <span className="hidden sm:inline">Page</span>
          <ChevronDownIcon
            size={14}
            className={cn("opacity-60 transition-transform max-sm:hidden duration-200 ease-soft", props["aria-expanded"] && "rotate-180")}
          />
        </button>
      )}
    >
      {() => (
        <>
          <p className="font-display text-[1.05rem] font-semibold tracking-[-0.02em] text-ink">Your page</p>
          <p className="mt-0.5 text-xs text-subtle">Kept for every thought you write.</p>

          <Section label="Paper">
            <RadioGroup label="Paper" className="grid grid-cols-4 gap-2">
              {PAPERS.map((option) => (
                <PaperOption
                  key={option}
                  paper={option}
                  pen={pen}
                  selected={paper === option}
                  onSelect={() => setWritingStyle({ paper: option })}
                />
              ))}
            </RadioGroup>
          </Section>

          <Section label="Handwriting">
            <RadioGroup label="Handwriting" className="-mx-1.5 space-y-0.5">
              {PENS.map((option) => (
                <PenOption
                  key={option}
                  pen={option}
                  selected={pen === option}
                  onSelect={() => setWritingStyle({ pen: option })}
                />
              ))}
            </RadioGroup>
          </Section>
        </>
      )}
    </Popover>
  );
}

/**
 * A thumbnail of the page as it is now: its paper, its lines and the handwriting on it.
 * Reads as "this is your page" at a glance, and shows what a change did before the panel closes.
 */
function PageSwatch({ paper, pen }: { paper: Paper; pen: Pen }) {
  return (
    <span
      key={`${paper}-${pen}`}
      aria-hidden="true"
      className={cn(
        "relative block h-7 w-6 shrink-0 animate-pop-in overflow-hidden rounded-[0.4rem] border shadow-sm transition-transform duration-200 ease-soft group-hover:-rotate-3 group-active:scale-95",
        papers[paper].page,
      )}
    >
      <span
        className={cn("absolute inset-0", papers[paper].lines)}
        style={papers[paper].lines ? { backgroundSize: paper === "dotted" ? "0.3rem 0.3rem" : "100% 0.4rem" } : undefined}
      />
      <span className={cn("absolute inset-0 flex items-center justify-center text-[0.7rem] leading-none text-ink-soft", pens[pen].family)}>
        Aa
      </span>
    </span>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-eyebrow font-semibold uppercase text-muted">{label}</p>
      {children}
    </div>
  );
}

/** Arrow keys move between options and pick them, like native radio buttons. */
function RadioGroup({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const radios = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
    const next = radios[(radios.indexOf(e.target as HTMLButtonElement) + step + radios.length) % radios.length];
    next?.focus();
    next?.click();
  };
  return (
    <div role="radiogroup" aria-label={label} onKeyDown={onKeyDown} className={className}>
      {children}
    </div>
  );
}

function PaperOption({
  paper,
  pen,
  selected,
  onSelect,
}: {
  paper: Paper;
  pen: Pen;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className="group flex flex-col items-center gap-1.5 rounded-xl outline-offset-4"
    >
      <span
        className={cn(
          "relative block h-16 w-full overflow-hidden rounded-xl border transition-[transform,box-shadow] duration-200 ease-soft",
          papers[paper].page,
          selected ? "ring-2 ring-sage-400 ring-offset-2 ring-offset-surface" : "group-hover:-translate-y-0.5 group-hover:shadow-lift",
        )}
      >
        {/* the same lines as the page, drawn at a smaller scale */}
        <span
          aria-hidden="true"
          className={cn("absolute inset-0", papers[paper].lines)}
          style={papers[paper].lines ? { backgroundSize: paper === "dotted" ? "0.5rem 0.5rem" : "100% 0.75rem" } : undefined}
        />
        <span
          aria-hidden="true"
          className={cn("absolute top-1.5 left-2.5 text-base leading-none text-ink-soft", pens[pen].family)}
        >
          Aa
        </span>
        {selected && (
          <span className="absolute right-1 bottom-1 flex h-4 w-4 animate-pop-in items-center justify-center rounded-full bg-sage-600 text-on-accent">
            <CheckIcon size={11} strokeWidth={2.4} />
          </span>
        )}
      </span>
      <span className={cn("text-[0.72rem] leading-none", selected ? "font-medium text-ink" : "text-muted")}>
        {papers[paper].label}
      </span>
    </button>
  );
}

function PenOption({ pen, selected, onSelect }: { pen: Pen; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      tabIndex={selected ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors duration-200",
        selected ? "bg-sage-50" : "hover:bg-sage-50",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate leading-tight text-ink", pens[pen].body)}>Dear diary,</span>
        <span className="mt-0.5 block text-xs text-subtle">
          <span className={cn(selected ? "font-medium text-ink-soft" : "text-muted")}>{pens[pen].label}</span>
          {" · "}
          {pens[pen].description}
        </span>
      </span>
      {selected && <CheckIcon size={16} className="shrink-0 animate-pop-in text-sage-600" />}
    </button>
  );
}
