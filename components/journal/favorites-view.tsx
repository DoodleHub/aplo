"use client";

import { HeartIcon } from "@/components/icons";
import { EmptyState, EntryGrid } from "./entry-grid";
import { Footer, PageIntro } from "./home-view";
import { useJournal } from "./store";

export function FavoritesView() {
  const { entries } = useJournal();
  const favorites = entries.filter((e) => e.is_favorite);

  return (
    <div>
      <PageIntro
        eyebrow={`${favorites.length} ${favorites.length === 1 ? "thought" : "thoughts"} held close`}
        title={
          <>
            Favorites
            <HeartIcon size={30} filled className="ml-2.5 inline-block -translate-y-0.5 text-heart" />
          </>
        }
        subtitle="The moments you wanted to keep close."
      />
      <div className="mt-10">
        <EntryGrid
          entries={favorites}
          empty={
            <EmptyState emoji="🤍" title="Nothing here yet">
              Tap the heart on any thought and it will live here, too.
            </EmptyState>
          }
        />
      </div>
      <Footer />
    </div>
  );
}
