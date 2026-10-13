import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorSkeleton, NewEntry } from "@/components/journal/entry-route";

export const metadata: Metadata = { title: "New entry" };

export default function NewEntryPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewEntry />
    </Suspense>
  );
}
