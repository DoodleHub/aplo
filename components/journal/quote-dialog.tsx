"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import { CATEGORY_COLORS, type CategoryColor, type Quote, type QuoteInput } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/field";
import { CheckIcon } from "@/components/icons";
import { QuoteFace } from "./quote-card";

const MAX_TEXT = 500;
const MAX_AUTHOR = 80;

/** Writes a new quote for the wall, or edits one already there. */
export function QuoteDialog({
  open,
  quote,
  defaultColor,
  onClose,
  onSubmit,
}: {
  open: boolean;
  /** The quote being edited; a new one when unset. */
  quote?: Quote;
  defaultColor: CategoryColor;
  onClose: () => void;
  onSubmit: (input: QuoteInput) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={quote ? "Edit quote" : "Pin a quote"}
      description={quote ? undefined : "Something that steadies you, lifts you, or makes you smile."}
    >
      {/* Remount per open so the form starts fresh each time. */}
      {open && <QuoteForm quote={quote} defaultColor={defaultColor} onDone={onClose} onSubmit={onSubmit} />}
    </Dialog>
  );
}

function QuoteForm({
  quote,
  defaultColor,
  onDone,
  onSubmit,
}: {
  quote?: Quote;
  defaultColor: CategoryColor;
  onDone: () => void;
  onSubmit: (input: QuoteInput) => void;
}) {
  const [text, setText] = useState(quote?.text ?? "");
  const [author, setAuthor] = useState(quote?.author ?? "");
  const [color, setColor] = useState<CategoryColor>(quote?.color ?? defaultColor);
  const [error, setError] = useState<string>();

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return setError("Add the words you’d like to keep.");
    onSubmit({ text, author, color });
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* live preview, on a scrap of the wall */}
      <div className="flex max-h-64 justify-center overflow-y-auto rounded-2xl bg-sage-50 px-4 py-6 scrollbar-none">
        <QuoteFace
          quote={{ text, author, color }}
          className="max-w-full -rotate-1 shadow-soft transition-colors duration-300"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="quote-text" className="text-sm font-semibold text-ink">
            Quote
          </label>
          {text.length > MAX_TEXT - 100 && (
            <span className="animate-fade-in text-xs tabular-nums text-subtle">{MAX_TEXT - text.length} left</span>
          )}
        </div>
        <Textarea
          id="quote-text"
          autoFocus
          rows={3}
          maxLength={MAX_TEXT}
          placeholder="e.g. Not all those who wander are lost."
          value={text}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "quote-text-error" : undefined}
          aria-keyshortcuts="Meta+Enter Control+Enter"
          className="max-h-48"
          onChange={(e) => {
            setText(e.target.value);
            setError(undefined);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
        />
        {error && (
          <p id="quote-text-error" className="animate-fade-in text-sm text-danger">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="quote-author" className="text-sm font-semibold text-ink">
            Who said it
          </label>
          <span className="text-xs text-subtle">Optional</span>
        </div>
        <Input
          id="quote-author"
          maxLength={MAX_AUTHOR}
          placeholder="e.g. J.R.R. Tolkien, or Grandma"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-ink">Color</legend>
        <div className="flex flex-wrap gap-2.5">
          {CATEGORY_COLORS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setColor(option)}
              aria-label={palette[option].label}
              aria-pressed={color === option}
              title={palette[option].label}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full border transition-transform duration-200 ease-spring will-change-transform hover:scale-110",
                palette[option].card,
                color === option && "ring-2 ring-offset-2 ring-offset-surface " + palette[option].ring,
              )}
            >
              {color === option && <CheckIcon size={16} className="text-ink" />}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2 pt-1">
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit">{quote ? "Save changes" : "Pin to wall"}</Button>
      </div>
    </form>
  );
}
