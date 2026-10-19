"use client";

import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { palette } from "@/lib/palette";
import { ButtonLink } from "@/components/ui/button";
import { GlobeIcon, LockIcon, PlusIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { CategoryMenu } from "./category-actions";
import { UNSORTED } from "./category-card";
import { EmptyState, EntryGrid } from "./entry-grid";
import { Footer } from "./home-view";
import { isUnsorted, useJournal } from "./store";

export function CategoryRoute() {
  const { id } = useParams<{ id: string }>();
  return <CategoryView key={id} id={id} />;
}

export function CategoryView({ id }: { id: string }) {
  const { categoryById, entries } = useJournal();
  const { openCategoryDialog } = useShell();
  const category = categoryById.get(id);

  if (!category) {
    return (
      <EmptyState
        emoji="🍃"
        title="This corner has drifted away"
        action={<ButtonLink href="/">Back to your journal</ButtonLink>}
      >
        It may have been removed, or the link isn’t quite right.
      </EmptyState>
    );
  }

  const inCategory = entries.filter((e) => e.category_id === id);

  return (
    <div>
      <CornerHeader
        corner={category}
        count={inCategory.length}
        badge={
          <button
            type="button"
            onClick={() => openCategoryDialog(category)}
            title="Change who can see this corner"
            className="inline-flex h-7 items-center gap-1.5 rounded-full bg-surface/60 px-2.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface/90 hover:text-ink"
          >
            {category.is_public ? <GlobeIcon size={13} /> : <LockIcon size={13} />}
            {category.is_public ? "Shared in Discover" : "Private"}
          </button>
        }
        actions={
          <>
            <ButtonLink href={`/new?category=${id}`} icon={<PlusIcon size={18} strokeWidth={2.2} />}>
              New entry
            </ButtonLink>
            <CategoryMenu category={category} triggerClassName="h-11 w-11 bg-surface/50 text-ink hover:bg-surface/80" />
          </>
        }
      />

      <section className="mt-10">
        <EntryGrid
          key={id}
          entries={inCategory}
          empty={
            <EmptyState
              emoji={category.emoji}
              title="A quiet little corner"
              action={
                <ButtonLink href={`/new?category=${id}`} variant="soft" icon={<PlusIcon size={18} />}>
                  Write something here
                </ButtonLink>
              }
            >
              Nothing tucked away in {category.name} yet.
            </EmptyState>
          }
        />
      </section>

      <Footer />
    </div>
  );
}

/** Thoughts with no corner, gathered as if they had one. */
export function UnsortedView() {
  const { categoryById, entries } = useJournal();
  const unsorted = entries.filter((e) => isUnsorted(e, categoryById));

  return (
    <div>
      <CornerHeader
        corner={UNSORTED}
        count={unsorted.length}
        countLabel="waiting for a corner"
        actions={
          <ButtonLink href="/new" icon={<PlusIcon size={18} strokeWidth={2.2} />}>
            New entry
          </ButtonLink>
        }
      />

      <section className="mt-10">
        <EntryGrid
          entries={unsorted}
          empty={
            <EmptyState emoji="🌿" title="Everything has a home">
              Every thought is tucked into a corner. Any you write without one will gather here.
            </EmptyState>
          }
        />
      </section>

      <Footer />
    </div>
  );
}

function CornerHeader({
  corner,
  count,
  countLabel = "tucked away",
  badge,
  actions,
}: {
  corner: Pick<Category, "name" | "emoji" | "color"> & { description?: string };
  count: number;
  countLabel?: string;
  badge?: ReactNode;
  actions: ReactNode;
}) {
  return (
    <header
      className={cn(
        "relative flex animate-fade-up flex-col gap-6 overflow-hidden rounded-3xl border px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10",
        palette[corner.color].card,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-6 right-6 text-[9rem] leading-none opacity-[0.12] select-none sm:right-12"
      >
        {corner.emoji}
      </span>
      <div className="relative min-w-0">
        <span className="text-4xl leading-none">{corner.emoji}</span>
        <h1 className="mt-4 font-display text-[2.1rem] leading-[1.1] font-semibold tracking-display text-ink sm:text-[2.5rem]">
          {corner.name}
        </h1>
        {corner.description && (
          <p className="mt-2 max-w-prose text-[1.05rem] wrap-break-word text-ink-soft">{corner.description}</p>
        )}
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[1.05rem] text-muted">
          {count} {count === 1 ? "thought" : "thoughts"} {countLabel}
          {badge}
        </p>
      </div>
      <div className="relative flex items-center gap-2">{actions}</div>
    </header>
  );
}
