"use client";

import { useParams, usePathname, useSearchParams } from "next/navigation";
import { useLayoutEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { papers } from "@/lib/page-style";
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
  const [freshId, setFreshId] = useState(() => (typeof window === "undefined" ? "" : crypto.randomUUID()));
  // Once saved, the editor moves the URL to /entry/<id>; coming back to it (e.g. with the
  // back button) should reopen that entry, not start another.
  const savedId = pathname.match(/^\/entry\/([^/]+)$/)?.[1];
  // Next keeps this route's state between visits (cacheComponents preserves it with
  // <Activity>), so `freshId` outlives the thought it became. Mint another when the URL
  // comes back to /new after a save — e.g. tapping New right after writing one…
  const [moved, setMoved] = useState(false);
  if (savedId === freshId && !moved) setMoved(true);
  if (!savedId && moved) {
    setMoved(false);
    setFreshId(crypto.randomUUID());
  }
  // …and whenever the page is hidden, since its editor may save on the way out.
  useLayoutEffect(() => () => setFreshId(crypto.randomUUID()), []);

  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <EditorSkeleton />;

  const id = savedId ?? freshId;
  const requested = searchParams.get("corner");
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
  const { profile } = useJournal();
  return (
    <div className="mx-auto max-w-3xl">
      <Skeleton className="mb-5 h-10 w-24" />
      <div className={cn("rounded-3xl border px-5 py-6 sm:px-10 sm:py-9", papers[profile.paper].page)}>
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
