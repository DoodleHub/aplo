import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { parseInline, type Run } from "@/lib/inline-format";

/** A thought’s text with its bold, italic and strikethrough shown and the marks hidden. */
export function FormattedText({ text }: { text: string }) {
  return parseInline(text).map((run, i) => (run.mark ? null : <Styled key={i} run={run} />));
}

function Styled({ run }: { run: Run }) {
  let node: ReactNode = run.text;
  if (run.strike) node = <s className="decoration-ink/50">{node}</s>;
  if (run.italic) node = <em>{node}</em>;
  if (run.bold) node = <strong className="font-semibold">{node}</strong>;
  return node;
}

/**
 * The editor’s styled layer, drawn behind a textarea with transparent text. Every character must
 * keep its plain width so the caret lines up: the marks stay (just faded), bold is a stroke rather
 * than a heavier weight, and italic is the browser’s slanted version of the same letters.
 */
export function FormatBackdrop({ text, className }: { text: string; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 whitespace-pre-wrap wrap-break-word", className)}>
      {parseInline(text).map((run, i) => (
        <span
          key={i}
          className={cn(
            run.mark && "text-faint",
            run.bold && "faux-bold",
            run.italic && "italic",
            run.strike && !run.mark && "line-through decoration-ink/50",
          )}
        >
          {run.text}
        </span>
      ))}
    </div>
  );
}
