"use client";

import { useState, type ReactNode } from "react";
import type { Entry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EntryCard } from "./entry-card";
import { useJournal } from "./store";

const PAGE_SIZE = 9;

export function EntryGrid({ entries, empty }: { entries: Entry[]; empty: ReactNode }) {
  const { categoryById, timeZone, toggleFavorite } = useJournal();
  const [limit, setLimit] = useState(PAGE_SIZE);

  if (entries.length === 0) return <>{empty}</>;

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {entries.slice(0, limit).map((entry, i) => (
          <EntryCard
            key={entry.id}
            entry={entry}
            category={entry.category_id ? categoryById.get(entry.category_id) : undefined}
            timeZone={timeZone}
            onToggleFavorite={() => toggleFavorite(entry.id)}
            style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 40}ms` }}
          />
        ))}
      </div>
      {entries.length > limit && (
        <div className="mt-6 flex justify-center">
          <Button variant="soft" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            Show more thoughts
          </Button>
        </div>
      )}
    </>
  );
}

export function EmptyState({
  emoji = "🌱",
  title,
  children,
  action,
}: {
  emoji?: string;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col items-center rounded-3xl border border-dashed border-line-strong bg-surface/60 px-6 py-14 text-center">
      <span className="animate-float text-4xl">{emoji}</span>
      <h3 className="mt-4 font-display text-lg font-semibold tracking-tight text-ink">{title}</h3>
      {children && <p className="mt-1.5 max-w-sm text-[0.95rem] leading-relaxed text-muted">{children}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
