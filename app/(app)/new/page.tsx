import type { Metadata } from "next";
import { Suspense } from "react";
import { EditorSkeleton, NewEntryRedirect } from "@/components/journal/entry-route";

export const metadata: Metadata = { title: "New entry" };

export default function NewEntryPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <NewEntryRedirect />
    </Suspense>
  );
}
