import type { Paper, Pen } from "./types";

// Literal class names so Tailwind can see them. Paper utilities live in app/globals.css.

export const papers: Record<
  Paper,
  { label: string; /** The page itself. */ page: string; /** Lines or dots behind the writing. */ lines: string }
> = {
  plain: { label: "Plain", page: "bg-surface border-line", lines: "" },
  ruled: { label: "Notebook", page: "paper-ruled border-line", lines: "page-rules" },
  dotted: { label: "Dot grid", page: "paper-dotted border-line", lines: "page-dots" },
  parchment: { label: "Old paper", page: "paper-parchment border-paper-parchment-line", lines: "" },
};

export const pens: Record<
  Pen,
  {
    label: string;
    description: string;
    family: string;
    title: string;
    body: string;
    /** Line height on unlined paper; lined paper always uses its 2rem lines. */
    leading: string;
  }
> = {
  sans: {
    label: "Clean",
    description: "Crisp and easy to read",
    family: "font-sans",
    title: "font-display text-[1.75rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[2.1rem]",
    body: "font-sans text-[1.05rem]",
    leading: "leading-[1.85]",
  },
  caveat: {
    label: "Breezy",
    description: "Loose, flowing script",
    family: "font-caveat",
    title: "font-caveat text-[2.35rem] leading-[1.1] font-bold sm:text-[2.75rem]",
    body: "font-caveat text-[1.5rem]",
    leading: "leading-[1.45]",
  },
  patrick: {
    label: "Neat",
    description: "Tidy print, like class notes",
    family: "font-patrick",
    title: "font-patrick text-[1.95rem] leading-tight sm:text-[2.35rem]",
    body: "font-patrick text-[1.25rem]",
    leading: "leading-[1.7]",
  },
  kalam: {
    label: "Felt tip",
    description: "Warm and a little slanted",
    family: "font-kalam",
    title: "font-kalam text-[1.8rem] leading-tight font-bold sm:text-[2.15rem]",
    body: "font-kalam text-[1.1rem]",
    leading: "leading-[1.9]",
  },
};

/** Lined paper sets the rhythm: every line of writing sits on a rule or a row of dots. */
export function bodyLeading(paper: Paper, pen: Pen) {
  return papers[paper].lines ? "leading-[2rem]" : pens[pen].leading;
}
