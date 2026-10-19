import type { Metadata } from "next";
import { Suspense } from "react";
import { FavoritesView } from "@/components/journal/favorites-view";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return (
    <Suspense>
      <FavoritesView />
    </Suspense>
  );
}
