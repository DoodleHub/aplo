"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { MoreIcon, PencilIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { EmptyState, EntryGrid } from "./entry-grid";
import { Footer } from "./home-view";
import { useJournal } from "./store";

export function CategoryRoute() {
  const { id } = useParams<{ id: string }>();
  return <CategoryView key={id} id={id} />;
}

export function CategoryView({ id }: { id: string }) {
  const router = useRouter();
  const { categoryById, entries, deleteCategory } = useJournal();
  const { openCategoryDialog } = useShell();
  const [confirming, setConfirming] = useState(false);
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
      <header
        className={cn(
          "relative flex animate-fade-up flex-col gap-6 overflow-hidden rounded-3xl border px-6 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-10 sm:py-10",
          palette[category.color].card,
        )}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-6 right-6 text-[9rem] leading-none opacity-[0.12] select-none sm:right-12"
        >
          {category.emoji}
        </span>
        <div className="relative min-w-0">
          <span className="text-4xl leading-none">{category.emoji}</span>
          <h1 className="mt-4 font-display text-[2.1rem] leading-[1.1] font-semibold tracking-display text-ink sm:text-[2.5rem]">
            {category.name}
          </h1>
          <p className="mt-2 text-[1.05rem] text-muted">
            {inCategory.length} {inCategory.length === 1 ? "thought" : "thoughts"} tucked away
          </p>
        </div>
        <div className="relative flex items-center gap-2">
          <ButtonLink href={`/new?category=${id}`} icon={<PlusIcon size={18} strokeWidth={2.2} />}>
            New entry
          </ButtonLink>
          <Menu
            items={[
              {
                label: "Edit corner",
                icon: <PencilIcon size={17} />,
                onSelect: () => openCategoryDialog(category),
              },
              {
                label: "Delete corner",
                icon: <TrashIcon size={17} />,
                tone: "danger",
                onSelect: () => setConfirming(true),
              },
            ]}
            trigger={(props) => (
              <IconButton label="Corner options" className="h-11 w-11 bg-white/50 text-ink hover:bg-white/80" {...props}>
                <MoreIcon size={20} />
              </IconButton>
            )}
          />
        </div>
      </header>

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

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete “${category.name}”?`}
        description={
          inCategory.length > 0
            ? `Your ${inCategory.length} ${inCategory.length === 1 ? "thought" : "thoughts"} will stay in your journal, just without a corner.`
            : "This corner is empty, so nothing else will change."
        }
      >
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              setConfirming(false);
              router.push("/");
              deleteCategory(id);
            }}
          >
            Delete corner
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
