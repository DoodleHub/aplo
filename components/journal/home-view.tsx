"use client";

import { useState, type ReactNode } from "react";
import { longDate } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { FlowerIcon, HeartIcon, PlusIcon, SunIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { CategoryMenu } from "./category-actions";
import { CategoryCard } from "./category-card";
import { EmptyState, EntryGrid } from "./entry-grid";
import { HeroPrompt } from "./hero-prompt";
import { SectionHeader } from "./section-header";
import { useJournal } from "./store";

export function HomeView() {
  const { entries, categories, countByCategory, timeZone, now } = useJournal();
  const { openCategoryDialog } = useShell();
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const visible = filter === "favorites" ? entries.filter((e) => e.is_favorite) : entries;

  return (
    <div>
      <PageIntro
        eyebrow={longDate(now, timeZone)}
        title={
          <>
            A little space for you
            <SunIcon size={30} className="ml-2 inline-block -translate-y-0.5 animate-[spin_24s_linear_infinite] text-ink" />
          </>
        }
        subtitle="Big feelings. Small moments. All yours."
      />

      <div className="mt-9 animate-fade-up [animation-delay:60ms]">
        <HeroPrompt />
      </div>

      <section className="mt-12">
        <SectionHeader
          title="Your little corners"
          action={
            <button
              type="button"
              onClick={() => openCategoryDialog()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl px-2 text-[0.95rem] text-muted transition-colors hover:text-ink"
            >
              <PlusIcon size={15} />
              Create category
            </button>
          }
        />
        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {categories.map((category, i) => (
              <CategoryCard
                key={category.id}
                category={category}
                count={countByCategory.get(category.id) ?? 0}
                style={{ animationDelay: `${100 + i * 50}ms` }}
                actions={
                  <CategoryMenu category={category} iconSize={18} triggerClassName="text-ink-soft hover:bg-white/60" />
                }
              />
            ))}
          </div>
        ) : (
          <EmptyState emoji="🏡" title="No corners yet" action={<CreateCornerButton />}>
            Corners help you gather similar thoughts together.
          </EmptyState>
        )}
      </section>

      <section className="mt-12">
        <SectionHeader
          title="Recent thoughts"
          count={visible.length}
          action={
            <Segmented
              label="Filter thoughts"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: "All entries" },
                { value: "favorites", label: "Favorites", icon: <HeartIcon size={16} /> },
              ]}
            />
          }
        />
        <EntryGrid
          key={filter}
          entries={visible}
          empty={
            filter === "favorites" ? (
              <EmptyState emoji="🤍" title="No favorites yet">
                Tap the heart on a thought you want to keep close.
              </EmptyState>
            ) : (
              <EmptyState
                emoji="✍️"
                title="Your journal is waiting"
                action={
                  <ButtonLink href="/new" icon={<PlusIcon size={18} />}>
                    Write your first thought
                  </ButtonLink>
                }
              >
                There’s no wrong way to start. A sentence is plenty.
              </EmptyState>
            )
          }
        />
      </section>

      <Footer />
    </div>
  );
}

function CreateCornerButton() {
  const { openCategoryDialog } = useShell();
  return (
    <button
      type="button"
      onClick={() => openCategoryDialog()}
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-sage-100 px-5 font-semibold text-sage-600 transition-colors hover:bg-sage-200"
    >
      <PlusIcon size={16} />
      Create a corner
    </button>
  );
}

export function PageIntro({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex animate-fade-up flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-sm text-muted">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-2 font-display text-[2.1rem] leading-[1.1] font-semibold tracking-display text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        {subtitle && <p className="mt-3 text-[1.05rem] text-muted">{subtitle}</p>}
      </div>
      {action ?? (
        <ButtonLink href="/new" size="lg" icon={<PlusIcon size={20} strokeWidth={2.2} />} className="self-start sm:self-auto">
          New entry
        </ButtonLink>
      )}
    </div>
  );
}

export function Footer() {
  return (
    <p className="mt-14 flex items-center justify-center gap-2 text-sm text-muted">
      <FlowerIcon size={14} className="text-ink-soft" />
      A safe place for your wonderfully messy mind.
    </p>
  );
}
