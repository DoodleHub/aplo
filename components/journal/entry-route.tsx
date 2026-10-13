"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Editor } from "./editor";
import { EmptyState } from "./entry-grid";
import { useJournal } from "./store";

/** /entry/[id] — edit an existing thought, or start a fresh one when ?new=1. */
export function EntryRoute() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { entries, categoryById } = useJournal();
  const entry = entries.find((e) => e.id === id);
  const isNew = searchParams.get("new") === "1";

  if (!entry && !isNew) {
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

  const requested = searchParams.get("category");
  const defaultCategoryId = requested && categoryById.has(requested) ? requested : null;

  return <Editor key={id} id={id} entry={entry} defaultCategoryId={defaultCategoryId} />;
}

/** /new — mint an id for a fresh thought and hand off to the editor. */
export function NewEntryRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams({ new: "1" });
    const category = searchParams.get("category");
    if (category) params.set("category", category);
    router.replace(`/entry/${crypto.randomUUID()}?${params}`);
  }, [router, searchParams]);

  return <EditorSkeleton />;
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
