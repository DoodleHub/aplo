"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DiscoverFavorite } from "@/lib/types";
import { useIsOffline } from "@/components/pwa";
import { Button } from "@/components/ui/button";
import { CompassIcon, HeartIcon } from "@/components/icons";
import { DiscoverCard, FeedSkeleton, Reader, useReader } from "./discover-view";
import { useDiscoverFavorites } from "./discover-favorites";
import { EmptyState, EntryGrid } from "./entry-grid";
import { Footer, PageIntro } from "./home-view";
import { SectionHeader } from "./section-header";
import { useJournal } from "./store";

const PAGE_SIZE = 24;

type Status = "loading" | "idle" | "loading-more" | "done" | "error";

async function fetchFavorites(after?: DiscoverFavorite) {
  const { data, error } = await createClient().rpc("discover_favorite_feed", {
    p_before: after?.favorited_at ?? null,
    p_before_id: after?.id ?? null,
    p_limit: PAGE_SIZE,
  });
  if (error) throw error;
  return data;
}

export function FavoritesView() {
  const { entries, timeZone } = useJournal();
  const offline = useIsOffline();
  const favorites = entries.filter((e) => e.is_favorite);
  const shared = useDiscoverFavorites();
  const [items, setItems] = useState<DiscoverFavorite[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const { open, reader } = useReader("/favorites", items);
  // Captured once per page load so every card's "2h ago" agrees.
  const [now] = useState(() => Date.now());

  const receive = useCallback((page: DiscoverFavorite[], more = false) => {
    setItems((all) => (more ? [...all, ...page] : page));
    setStatus(page.length < PAGE_SIZE ? "done" : "idle");
  }, []);

  const fail = useCallback((error: unknown) => {
    console.error("Couldn’t load favorites from Discover", error);
    setStatus("error");
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchFavorites()
      .then((page) => !cancelled && receive(page))
      .catch((error) => !cancelled && fail(error));
    return () => {
      cancelled = true;
    };
  }, [receive, fail]);

  const loadMore = () => {
    setStatus("loading-more");
    fetchFavorites(items.at(-1)).then((page) => receive(page, true), fail);
  };

  // Unfavorited ones leave the list, but stay in the reader's order so stepping still works.
  const kept = items.filter((item) => shared.isFavorite(item));
  const total = favorites.length + kept.length;
  const showOwn = favorites.length > 0 || kept.length === 0;

  return (
    <div>
      <PageIntro
        eyebrow={`${total} ${total === 1 ? "thought" : "thoughts"} held close`}
        title={
          <>
            Favorites
            <HeartIcon size={30} filled className="ml-2.5 inline-block -translate-y-0.5 text-heart" />
          </>
        }
        subtitle="The moments you wanted to keep close."
      />

      {showOwn && (
        <section className="mt-10">
          {kept.length > 0 && <SectionHeader title="From your journal" count={favorites.length} />}
          <EntryGrid
            entries={favorites}
            empty={
              <EmptyState emoji="🤍" title="Nothing here yet">
                Tap the heart on any thought, yours or one in Discover, and it will live here, too.
              </EmptyState>
            }
          />
        </section>
      )}

      {(kept.length > 0 || (status === "error" && items.length > 0)) && (
        <section className="mt-12">
          <SectionHeader
            title="From Discover"
            count={kept.length}
            action={<CompassIcon size={20} className="text-subtle" />}
          />
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kept.map((item, i) => (
              <DiscoverCard
                key={item.id}
                item={item}
                timeZone={timeZone}
                now={now}
                onOpen={open}
                favorite
                onToggleFavorite={() => shared.toggle(item)}
                style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 40}ms` }}
              />
            ))}
          </div>
          {status === "loading-more" && <FeedSkeleton count={3} />}
          {(status === "idle" || status === "error") && (
            <div className="mt-6 flex justify-center">
              <Button variant="soft" onClick={loadMore}>
                {status === "idle" ? "Show more" : offline ? "You’re offline — try again" : "Couldn’t load more — try again"}
              </Button>
            </div>
          )}
        </section>
      )}

      {status === "error" && items.length === 0 && (
        <p className="mt-8 animate-fade-in text-center text-sm text-subtle">
          {offline
            ? "Favorites from Discover will be here when you’re back online."
            : "We couldn’t gather your favorites from Discover just now."}
        </p>
      )}

      <Footer />

      <Reader {...reader} favorites={shared} />
    </div>
  );
}
