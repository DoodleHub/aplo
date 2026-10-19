import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { Quote } from "@/lib/types";

/** Width of a card on the wall, in canvas units. Height follows the text. */
export const QUOTE_WIDTH = 248;

/** A small, steady tilt per quote (−2.4° to 2.4°), so the wall feels pinned by hand. */
export function quoteTilt(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 49) - 24) / 10;
}

// Short lines get room to breathe; long passages stay readable at card width.
function textSize(text: string) {
  if (text.length <= 60) return "text-[1.32rem] leading-snug";
  if (text.length <= 160) return "text-[1.08rem] leading-snug";
  return "text-[0.95rem] leading-relaxed";
}

/** How a quote looks on the wall and in the composer's preview. */
export function QuoteFace({
  quote,
  placeholder = "Words worth keeping…",
  action,
  className,
  ...props
}: ComponentProps<"figure"> & {
  quote: Pick<Quote, "text" | "author" | "color">;
  placeholder?: string;
  /** A control in the top-right corner, such as the card's menu. */
  action?: ReactNode;
}) {
  const text = quote.text.trim();
  const author = quote.author.trim();
  return (
    <figure
      className={cn("relative w-62 rounded-2xl border p-5", palette[quote.color].card, className)}
      {...props}
    >
      <blockquote
        className={cn(
          "font-display font-medium tracking-[-0.015em] whitespace-pre-line wrap-break-word",
          textSize(text),
          text ? "text-ink" : "text-faint",
        )}
      >
        {text || placeholder}
      </blockquote>
      {author && (
        <figcaption className="mt-3 flex items-center gap-2 text-sm text-muted">
          <span aria-hidden="true" className={cn("h-px w-4 shrink-0", palette[quote.color].dot)} />
          <span className="min-w-0 wrap-break-word">{author}</span>
        </figcaption>
      )}
      {action}
    </figure>
  );
}
