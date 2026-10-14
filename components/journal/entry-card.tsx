"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { shortDate, wordCount } from "@/lib/format";
import { isShared, type Category, type Entry } from "@/lib/types";
import { Chip } from "@/components/ui/chip";
import { GlobeIcon, HeartIcon } from "@/components/icons";

export function EntryCard({
  entry,
  category,
  timeZone,
  onToggleFavorite,
  style,
}: {
  entry: Entry;
  category?: Category;
  timeZone: string;
  onToggleFavorite?: () => void;
  style?: CSSProperties;
}) {
  const [burst, setBurst] = useState(0);
  const title = entry.title.trim() || "Untitled thought";
  const words = wordCount(entry.content);

  return (
    <article
      style={style}
      className="group relative flex min-h-[13.5rem] animate-fade-up flex-col rounded-2xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 ease-soft hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
    >
      <Link
        href={`/entry/${entry.id}`}
        className="absolute inset-0 z-0 rounded-[inherit]"
        aria-label={`Open “${title}”`}
      />
      <div className="flex items-start justify-between gap-3">
        {category ? (
          <Chip color={category.color} emoji={category.emoji}>
            {category.name}
          </Chip>
        ) : (
          <Chip color="stone">Unsorted</Chip>
        )}
        {onToggleFavorite && (
          <button
            type="button"
            onClick={() => {
              if (!entry.is_favorite) setBurst((b) => b + 1);
              onToggleFavorite();
            }}
            aria-pressed={entry.is_favorite}
            aria-label={entry.is_favorite ? "Remove from favorites" : "Add to favorites"}
            className={cn(
              "relative z-10 -mt-1 -mr-1.5 flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-200 hover:bg-sage-50",
              entry.is_favorite ? "text-heart" : "text-faint hover:text-heart",
            )}
          >
            <HeartIcon key={burst} size={22} filled={entry.is_favorite} className={burst ? "animate-heart" : ""} />
          </button>
        )}
      </div>

      <h3 className="mt-4 line-clamp-1 font-display text-[1.15rem] font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h3>
      <p className="mt-2 line-clamp-2 text-[0.9rem] leading-relaxed text-muted">
        {entry.content.trim() || "Nothing written yet — a quiet page waiting for you."}
      </p>

      <div className="mt-auto flex items-end justify-between pt-5">
        <span className="flex items-center gap-1.5 text-xs text-subtle">
          {shortDate(entry.created_at, timeZone)} · {words} {words === 1 ? "word" : "words"}
          {isShared(entry, category) && (
            <span title="Shared in Discover" className="inline-flex items-center gap-1">
              · <GlobeIcon size={13} aria-hidden={false} role="img" aria-label="Shared in Discover" />
            </span>
          )}
        </span>
        {entry.mood && (
          <span className="text-lg leading-none transition-transform duration-300 ease-spring group-hover:scale-125 group-hover:-rotate-6">
            {entry.mood}
          </span>
        )}
      </div>
    </article>
  );
}
