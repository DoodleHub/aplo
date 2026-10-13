"use client";

import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { CATEGORY_EMOJIS, palette } from "@/lib/palette";
import { CATEGORY_COLORS, type Category, type CategoryColor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { CheckIcon } from "@/components/icons";
import { useJournal } from "./store";

export function CategoryDialog({
  open,
  onClose,
  category,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  category?: Category;
  onCreated?: (category: Category) => void;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={category ? "Edit corner" : "A new little corner"}
      description={category ? "Give it a fresh look." : "A home for a certain kind of thought."}
    >
      {/* Remount per open so the form starts fresh each time. */}
      {open && <CategoryForm category={category} onDone={onClose} onCreated={onCreated} />}
    </Dialog>
  );
}

function CategoryForm({
  category,
  onDone,
  onCreated,
}: {
  category?: Category;
  onDone: () => void;
  onCreated?: (category: Category) => void;
}) {
  const { categories, createCategory, updateCategory } = useJournal();
  const [name, setName] = useState(category?.name ?? "");
  const [emoji, setEmoji] = useState(category?.emoji ?? CATEGORY_EMOJIS[4]);
  const [color, setColor] = useState<CategoryColor>(
    category?.color ?? CATEGORY_COLORS[categories.length % CATEGORY_COLORS.length],
  );
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return setError("Every corner needs a name.");
    const taken = categories.some(
      (c) => c.id !== category?.id && c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (taken) return setError("You already have a corner with that name.");

    if (category) {
      updateCategory(category.id, { name: trimmed, emoji, color });
    } else {
      const created = createCategory({ name: trimmed, emoji, color });
      onCreated?.(created);
    }
    onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* live preview */}
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl border p-4 transition-colors duration-300",
          palette[color].card,
        )}
      >
        <span className="text-2xl leading-none">{emoji}</span>
        <span className="truncate font-semibold text-ink">{name.trim() || "Your new corner"}</span>
      </div>

      <div className="space-y-2">
        <label htmlFor="category-name" className="text-sm font-semibold text-ink">
          Name
        </label>
        <Input
          id="category-name"
          autoFocus
          maxLength={40}
          placeholder="e.g. Morning pages"
          value={name}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError(undefined);
          }}
        />
        {error && <p className="animate-fade-in text-sm text-danger">{error}</p>}
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold text-ink">Icon</legend>
        <div className="grid grid-cols-8 gap-1.5">
          {CATEGORY_EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setEmoji(option)}
              aria-label={`Use ${option}`}
              aria-pressed={emoji === option}
              className={cn(
                "flex aspect-square items-center justify-center rounded-xl text-lg transition-all duration-200 ease-soft",
                emoji === option
                  ? "scale-105 bg-sage-200 ring-2 ring-sage-400"
                  : "hover:scale-110 hover:bg-sage-50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </fieldset>

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
                "flex h-9 w-9 items-center justify-center rounded-full border transition-transform duration-200 ease-spring hover:scale-110",
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
        <Button type="submit">{category ? "Save changes" : "Create corner"}</Button>
      </div>
    </form>
  );
}
