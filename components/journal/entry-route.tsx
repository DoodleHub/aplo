"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "./editor";
import { EmptyState } from "./entry-grid";
import { useJournal } from "./store";

/** /entry/[id] — edit an existing thought. */
export function EntryRoute() {
  const { id } = useParams<{ id: string }>();
  const { entries } = useJournal();
  const entry = entries.find((e) => e.id === id);

  if (!entry) {
    return (
      <EmptyState
        emoji="🍂"
        title="We couldn’t find that thought"
        action={<ButtonLink href="/">Back to your journal</ButtonLink>}
      >
        It may have been deleted, or the link isn’t quite right.
      </EmptyState>
    );
  }

  return <Editor key={id} id={id} entry={entry} />;
}

const noopSubscribe = () => () => {};

/**
 * /new — a fresh thought. The editor opens right here rather than redirecting to a new
 * /entry/<id> URL, which couldn't have been cached for offline use.
 */
export function NewEntry() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { entries, categoryById } = useJournal();
  // Ids are minted on the client only; the server renders the skeleton.
  const [freshId] = useState(() => (typeof window === "undefined" ? "" : crypto.randomUUID()));
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <EditorSkeleton />;

  // Once saved, the editor moves the URL to /entry/<id>; coming back to it (e.g. with the
  // back button) should reopen that entry, not start another.
  const id = pathname.match(/^\/entry\/([^/]+)$/)?.[1] ?? freshId;
  const requested = searchParams.get("category");
  const defaultCategoryId = requested && categoryById.has(requested) ? requested : null;

  return (
    <Editor
      key={id}
      id={id}
      entry={entries.find((e) => e.id === id)}
      defaultCategoryId={defaultCategoryId}
    />
  );
}

export function EditorSkeleton() {
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-5 h-10 w-24" />
      <div className="rounded-3xl border border-line bg-surface px-5 py-6 sm:px-10 sm:py-9">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="mt-7 h-10 w-2/3" />
        <Skeleton className="mt-3 h-4 w-48" />
        <Skeleton className="mt-8 h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-5/6" />
        <Skeleton className="mt-3 h-4 w-4/6" />
      </div>
    </div>
  );
}
