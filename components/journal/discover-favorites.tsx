"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import type { DiscoverItem } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { HeartIcon } from "@/components/icons";
import { useJournal } from "./store";

type Favoritable = Pick<DiscoverItem, "id" | "is_mine" | "is_favorite">;

/**
 * Favorites for shared thoughts. Your own thoughts use the journal's favorite flag, so they
 * stay in step with the rest of the app. Other people's go straight to Supabase rather than
 * the outbox, since Discover only works online.
 */
export function useDiscoverFavorites() {
  const { entries, toggleFavorite } = useJournal();
  const toast = useToast();
  // What the reader has changed this visit, over what the server said when it loaded.
  const [changed, setChanged] = useState<Record<string, boolean>>({});

  const isFavorite = useCallback(
    (item: Favoritable) => {
      if (item.is_mine) {
        const own = entries.find((e) => e.id === item.id);
        if (own) return own.is_favorite;
      }
      return changed[item.id] ?? item.is_favorite;
    },
    [entries, changed],
  );

  const toggle = useCallback(
    async (item: Favoritable) => {
      if (item.is_mine && entries.some((e) => e.id === item.id)) return toggleFavorite(item.id);
      const next = !isFavorite(item);
      setChanged((all) => ({ ...all, [item.id]: next }));
      const favorites = createClient().from("discover_favorites");
      const { error } = next
        ? await favorites.upsert({ entry_id: item.id }, { onConflict: "user_id,entry_id", ignoreDuplicates: true })
        : await favorites.delete().eq("entry_id", item.id);
      if (!error) return;
      console.error("Couldn’t change a Discover favorite", error);
      setChanged((all) => (all[item.id] === next ? { ...all, [item.id]: !next } : all));
      toast.show(
        next
          ? "We couldn’t keep that one just now. Check your connection and try again."
          : "We couldn’t remove that favorite just now. Check your connection and try again.",
      );
    },
    [entries, toggleFavorite, isFavorite, toast],
  );

  return { isFavorite, toggle };
}

/** The heart on a shared thought. Sits above a card's full-size link. */
export function FavoriteButton({
  favorite,
  onToggle,
  className,
}: {
  favorite: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const [burst, setBurst] = useState(0);
  return (
    <button
      type="button"
      onClick={() => {
        if (!favorite) setBurst((b) => b + 1);
        onToggle();
      }}
      aria-pressed={favorite}
      aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
      title={favorite ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200 hover:bg-sage-50",
        favorite ? "text-heart" : "text-faint hover:text-heart",
        className,
      )}
    >
      <HeartIcon key={burst} size={20} filled={favorite} className={burst ? "animate-heart" : ""} />
    </button>
  );
}
