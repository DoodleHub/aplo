import type { Metadata } from "next";
import { FavoritesView } from "@/components/journal/favorites-view";

export const metadata: Metadata = { title: "Favorites" };

export default function FavoritesPage() {
  return <FavoritesView />;
}
