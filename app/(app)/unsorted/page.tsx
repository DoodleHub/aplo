import type { Metadata } from "next";
import { UnsortedView } from "@/components/journal/category-view";

export const metadata: Metadata = { title: "Unsorted" };

export default function UnsortedPage() {
  return <UnsortedView />;
}
