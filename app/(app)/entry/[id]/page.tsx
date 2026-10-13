import { Suspense } from "react";
import { EditorSkeleton, EntryRoute } from "@/components/journal/entry-route";

export default function EntryPage() {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <EntryRoute />
    </Suspense>
  );
}
