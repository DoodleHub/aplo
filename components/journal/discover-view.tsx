"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { cn } from "@/lib/cn";
import { fullDateTime, relativeTime } from "@/lib/format";
import { MOODS } from "@/lib/palette";
import { createClient } from "@/lib/supabase/client";
import type { DiscoverEntry, DiscoverItem } from "@/lib/types";
import { useIsOffline } from "@/components/pwa";
import { Button, ButtonLink, IconButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CompassIcon,
  LockIcon,
  PencilIcon,
  PlusIcon,
} from "@/components/icons";
import { useShell } from "./app-shell";
import { EmptyState } from "./entry-grid";
import { FormattedText } from "./formatted-text";
import { Footer, PageIntro } from "./home-view";
import { Avatar } from "./profile-dialog";
import { useJournal } from "./store";

const PAGE_SIZE = 18;

type Status = "loading" | "idle" | "loading-more" | "done" | "error";

async function fetchFeed(mood: string | null, after?: DiscoverItem) {
  const { data, error } = await createClient().rpc("discover_feed", {
    p_mood: mood,
    p_before: after?.created_at ?? null,
    p_before_id: after?.id ?? null,
    p_limit: PAGE_SIZE,
  });
  if (error) throw error;
  return data;
}

async function fetchEntry(id: string) {
  const { data, error } = await createClient().rpc("discover_entry", { p_id: id });
  if (error) throw error;
  return data[0] ?? null;
}

const readingTime = (words: number) => `${Math.max(1, Math.round(words / 200))} min read`;

export function DiscoverView() {
  const searchParams = useSearchParams();
  const openId = searchParams.get("entry");
  const [mood, setMood] = useState<string | null>(null);
  const [items, setItems] = useState<DiscoverItem[]>([]);
  // Whether the open reader has its own history entry, so closing it can simply go back.
  const pushed = useRef(false);

  useEffect(() => {
    const onPop = () => (pushed.current = false);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const open = (id: string) => {
    window.history.pushState(null, "", `/discover?entry=${id}`);
    pushed.current = true;
  };
  const close = () => {
    if (pushed.current) window.history.back();
    else window.history.replaceState(null, "", "/discover");
    pushed.current = false;
  };
  const step = (by: 1 | -1) => {
    const index = items.findIndex((item) => item.id === openId);
    const next = items[index + by];
    if (index >= 0 && next) window.history.replaceState(null, "", `/discover?entry=${next.id}`);
  };
  const index = items.findIndex((item) => item.id === openId);
  const previousId = index > 0 ? items[index - 1].id : undefined;
  const nextId = index >= 0 ? items[index + 1]?.id : undefined;
  const neighbors = useMemo(() => [previousId, nextId], [previousId, nextId]);

  return (
    <div>
      <PageIntro
        eyebrow="Discover"
        title={
          <>
            Kindred thoughts
            <CompassIcon size={30} className="ml-2.5 inline-block -translate-y-0.5 text-ink" />
          </>
        }
        subtitle="Small, honest moments other people chose to share."
        action={<YouAppearAs />}
      />

      <MoodFilter
        value={mood}
        onChange={(next) => {
          setMood(next);
          setItems([]);
        }}
      />

      <p className="mt-4 flex animate-fade-up items-center gap-2 text-sm text-subtle [animation-delay:80ms]">
        <LockIcon size={14} />
        Everything you write stays private unless you choose to share it.
      </p>

      <section className="mt-8">
        <Feed key={mood ?? "all"} mood={mood} onOpen={open} onItems={setItems} />
      </section>

      <Footer />

      <Reader
        id={openId}
        preview={index >= 0 ? items[index] : undefined}
        neighbors={neighbors}
        onClose={close}
        onPrevious={index > 0 ? () => step(-1) : undefined}
        onNext={index >= 0 && index < items.length - 1 ? () => step(1) : undefined}
      />
    </div>
  );
}

function YouAppearAs() {
  const { profile } = useJournal();
  const { openProfileDialog } = useShell();
  return (
    <button
      type="button"
      onClick={openProfileDialog}
      className="group flex items-center gap-3 self-start rounded-2xl border border-line bg-surface py-2.5 pr-4 pl-2.5 text-left shadow-soft transition-[box-shadow,border-color] duration-300 ease-soft hover:border-line-strong hover:shadow-lift sm:self-auto"
    >
      <Avatar emoji={profile.emoji} size="lg" />
      <span className="min-w-0">
        <span className="block text-xs text-subtle">You appear as</span>
        <span className="block max-w-[12rem] truncate font-medium text-ink">{profile.display_name}</span>
      </span>
      <PencilIcon size={15} className="ml-1 text-subtle transition-colors group-hover:text-ink" />
    </button>
  );
}

function MoodFilter({ value, onChange }: { value: string | null; onChange: (mood: string | null) => void }) {
  const options = [{ emoji: null, label: "All moods" }, ...MOODS];
  return (
    <div
      role="group"
      aria-label="Filter by mood"
      className="-mx-4 mt-9 flex animate-fade-up gap-1.5 overflow-x-auto px-4 pb-1 scrollbar-none [animation-delay:60ms] sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {options.map((option) => {
        const active = value === option.emoji;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.emoji)}
            className={cn(
              "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm transition-all duration-200 ease-soft",
              active
                ? "border-sage-300 bg-sage-100 font-medium text-sage-600"
                : "border-line bg-surface text-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {option.emoji && (
              <span className={cn("transition-transform duration-300 ease-spring", active && "scale-125")}>
                {option.emoji}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function Feed({
  mood,
  onOpen,
  onItems,
}: {
  mood: string | null;
  onOpen: (id: string) => void;
  onItems: (items: DiscoverItem[]) => void;
}) {
  const { timeZone } = useJournal();
  const offline = useIsOffline();
  const [items, setItems] = useState<DiscoverItem[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [attempt, setAttempt] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const loadedItems = useRef<DiscoverItem[]>([]);
  // Captured once per page load so every card's "2h ago" agrees.
  const [now] = useState(() => Date.now());

  const receive = useCallback(
    (page: DiscoverItem[], more = false) => {
      const next = more ? [...loadedItems.current, ...page] : page;
      loadedItems.current = next;
      setItems(next);
      onItems(next);
      setStatus(page.length < PAGE_SIZE ? "done" : "idle");
    },
    [onItems],
  );

  const fail = useCallback((error: unknown) => {
    console.error("Couldn’t load Discover", error);
    setStatus("error");
  }, []);

  // First page (and retries).
  useEffect(() => {
    let cancelled = false;
    fetchFeed(mood)
      .then((page) => !cancelled && receive(page))
      .catch((error) => !cancelled && fail(error));
    return () => {
      cancelled = true;
    };
  }, [mood, attempt, receive, fail]);

  // A newer feed (another mood) replaces this one; drop pages that arrive after that.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const last = items.at(-1);
  const loadMore = useCallback(() => {
    if (busy.current || !last) return;
    busy.current = true;
    setStatus("loading-more");
    fetchFeed(mood, last)
      .then((page) => alive.current && receive(page, true))
      .catch((error) => alive.current && fail(error))
      .finally(() => {
        busy.current = false;
      });
  }, [mood, last, receive, fail]);

  // Next page, as the end of the list comes into view.
  useEffect(() => {
    if (status !== "idle" || !sentinel.current) return;
    const observer = new IntersectionObserver(([entry]) => entry.isIntersecting && loadMore(), {
      rootMargin: "600px 0px",
    });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [status, loadMore]);

  if (status === "loading") return <FeedSkeleton />;

  if (status === "error" && items.length === 0) {
    return (
      <EmptyState
        emoji={offline ? "☁️" : "🍂"}
        title={offline ? "Discover needs a connection" : "We couldn’t gather thoughts just now"}
        action={
          <Button
            variant="soft"
            onClick={() => {
              setStatus("loading");
              setAttempt((a) => a + 1);
            }}
          >
            Try again
          </Button>
        }
      >
        {offline
          ? "Your own journal still works offline. Shared thoughts will be here when you’re back."
          : "It’s probably a hiccup on our side. Give it another go?"}
      </EmptyState>
    );
  }

  if (items.length === 0) {
    const label = MOODS.find((m) => m.emoji === mood)?.label.toLowerCase();
    return (
      <EmptyState
        emoji={mood ?? "🌾"}
        title={mood ? `No ${label} thoughts shared yet` : "It’s quiet here, for now"}
        action={
          <ButtonLink href="/new" variant="soft" icon={<PlusIcon size={18} />}>
            Write something to share
          </ButtonLink>
        }
      >
        Open any thought and choose <b className="font-medium text-ink">Shared</b>, or share a whole corner from its
        settings.
      </EmptyState>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item, i) => (
          <DiscoverCard
            key={item.id}
            item={item}
            timeZone={timeZone}
            now={now}
            onOpen={onOpen}
            style={{ animationDelay: `${Math.min(i % PAGE_SIZE, 8) * 40}ms` }}
          />
        ))}
      </div>
      <div ref={sentinel} aria-hidden="true" />
      {status === "loading-more" && <FeedSkeleton count={3} />}
      {status === "error" && (
        <div className="mt-6 flex justify-center">
          <Button variant="soft" onClick={loadMore}>
            {offline ? "You’re offline — try again" : "Couldn’t load more — try again"}
          </Button>
        </div>
      )}
      {status === "done" && items.length > PAGE_SIZE / 2 && (
        <p className="mt-10 animate-fade-in text-center text-sm text-subtle">
          That’s everything for now. Come back later for more. 🌙
        </p>
      )}
    </>
  );
}

function DiscoverCard({
  item,
  timeZone,
  now,
  onOpen,
  style,
}: {
  item: DiscoverItem;
  timeZone: string;
  now: number;
  onOpen: (id: string) => void;
  style?: CSSProperties;
}) {
  const title = item.title.trim() || "Untitled thought";
  const href = `/discover?entry=${item.id}`;

  const onClick = (e: MouseEvent) => {
    // Let new-tab and other modified clicks behave like a normal link.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onOpen(item.id);
  };

  return (
    <article
      style={style}
      className="group relative flex min-h-[15rem] animate-fade-up flex-col rounded-2xl border border-line bg-surface p-6 shadow-soft transition-[transform,box-shadow,border-color] duration-300 ease-soft hover:-translate-y-1 hover:border-line-strong hover:shadow-lift"
    >
      <a href={href} onClick={onClick} className="absolute inset-0 z-0 rounded-[inherit]" aria-label={`Read “${title}”`} />
      <header className="flex items-center gap-2.5">
        <Avatar emoji={item.author_emoji} size="sm" />
        <div className="min-w-0 flex-1 leading-tight">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <span className="truncate">{item.author_name}</span>
            {item.is_mine && (
              <span className="shrink-0 rounded-full bg-sage-100 px-1.5 py-px text-[0.68rem] font-semibold text-sage-600">
                You
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-subtle">{relativeTime(item.created_at, timeZone, now)}</p>
        </div>
        {item.mood && (
          <span className="text-lg leading-none transition-transform duration-300 ease-spring group-hover:scale-125 group-hover:-rotate-6">
            {item.mood}
          </span>
        )}
      </header>

      <h3 className="mt-4 line-clamp-2 font-display text-[1.15rem] leading-snug font-semibold tracking-[-0.02em] text-ink">
        {title}
      </h3>
      {item.excerpt.trim() && (
        <p className="mt-2 line-clamp-4 text-[0.9rem] leading-relaxed whitespace-pre-line text-muted">
          <FormattedText text={item.excerpt.trim()} />
        </p>
      )}

      <footer className="mt-auto flex items-center justify-between gap-3 pt-5">
        {item.category_name && item.category_color ? (
          <Chip color={item.category_color} emoji={item.category_emoji ?? undefined}>
            {item.category_name}
          </Chip>
        ) : (
          <span />
        )}
        <span className="flex shrink-0 items-center gap-1 text-xs text-subtle">
          {readingTime(item.word_count)}
          <ArrowUpRightIcon
            size={14}
            className="transition-transform duration-300 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </footer>
    </article>
  );
}

function FeedSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-3", count < 6 && "mt-4")} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex min-h-[15rem] animate-fade-in flex-col rounded-2xl border border-line bg-surface p-6"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
          <Skeleton className="mt-5 h-5 w-3/4" />
          <Skeleton className="mt-3 h-3.5 w-full" />
          <Skeleton className="mt-2 h-3.5 w-5/6" />
          <Skeleton className="mt-2 h-3.5 w-2/3" />
          <Skeleton className="mt-auto h-6 w-24" />
        </div>
      ))}
    </div>
  );
}

/** The full thought, over the feed. Opens instantly with what the card knows, then fills in. */
function Reader({
  id,
  preview,
  neighbors,
  onClose,
  onPrevious,
  onNext,
}: {
  id: string | null;
  preview?: DiscoverItem;
  /** Ids of the thoughts either side of this one, loaded ahead of time. */
  neighbors: (string | undefined)[];
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}) {
  const { timeZone } = useJournal();
  // Every thought fetched while browsing, so stepping back and forth shows the full text straight away.
  const [loaded, setLoaded] = useState<Record<string, { entry: DiscoverEntry | null; failed?: boolean }>>({});
  const requested = useRef(new Set<string>());
  const entry = id ? loaded[id]?.entry : undefined;
  const failed = id ? loaded[id]?.failed : false;

  const load = useCallback((target: string) => {
    if (requested.current.has(target)) return;
    requested.current.add(target);
    fetchEntry(target)
      .then((result) => setLoaded((all) => ({ ...all, [target]: { entry: result } })))
      .catch((error) => {
        console.error("Couldn’t open that thought", error);
        requested.current.delete(target);
        setLoaded((all) => (all[target]?.entry ? all : { ...all, [target]: { entry: null, failed: true } }));
      });
  }, []);

  // The open thought, plus its neighbours ahead of time so the next step doesn’t wait.
  useEffect(() => {
    if (!id) return;
    for (const target of [id, ...neighbors]) if (target) load(target);
  }, [id, neighbors, load]);

  useEffect(() => {
    if (!id) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") onPrevious?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [id, onPrevious, onNext]);

  // Each thought starts at its top, not wherever the last one was scrolled to.
  const nav = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const dialog = nav.current?.closest("dialog");
    if (dialog) dialog.scrollTop = 0;
  }, [id]);

  const shown = entry ?? preview;
  const missing = id ? id in loaded && !entry : false;
  const title = shown ? shown.title.trim() || "Untitled thought" : "A shared thought";

  return (
    <Dialog
      open={Boolean(id)}
      onClose={onClose}
      title={title}
      className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto overscroll-contain"
      description={
        shown && (
          <span className="mt-2 flex items-center gap-2">
            <Avatar emoji={shown.author_emoji} size="sm" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-ink">
                {shown.author_name}
                {shown.is_mine && <span className="font-normal text-subtle"> (you)</span>}
              </span>
              <span className="block text-xs text-subtle">{fullDateTime(shown.created_at, timeZone)}</span>
            </span>
          </span>
        )
      }
    >
      {missing && !failed ? (
        <EmptyState emoji="🍃" title="This thought isn’t shared anymore">
          Its author may have made it private again.
        </EmptyState>
      ) : failed ? (
        <EmptyState emoji="☁️" title="We couldn’t open this thought">
          Check your connection and try again.
        </EmptyState>
      ) : !shown ? (
        <ReaderSkeleton />
      ) : (
        <div>
          {(shown.category_name || shown.mood) && (
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {shown.category_name && shown.category_color && (
                <Chip color={shown.category_color} emoji={shown.category_emoji ?? undefined}>
                  {shown.category_name}
                </Chip>
              )}
              {shown.mood && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-md bg-sage-50 px-2 text-[0.8rem] text-muted">
                  {shown.mood} {MOODS.find((m) => m.emoji === shown.mood)?.label}
                </span>
              )}
            </div>
          )}
          {entry ? (
            <p className="text-[1.05rem] leading-[1.85] whitespace-pre-wrap text-ink">
              <FormattedText text={entry.content} />
            </p>
          ) : (
            <div>
              <p className="text-[1.05rem] leading-[1.85] whitespace-pre-wrap text-ink">
                <FormattedText text={preview?.excerpt ?? ""} />
              </p>
              <Skeleton className="mt-3 h-4 w-2/3" />
            </div>
          )}
        </div>
      )}

      <div ref={nav} className="mt-8 flex items-center gap-2 border-t border-line pt-5">
        <IconButton label="Previous thought" onClick={onPrevious} disabled={!onPrevious}>
          <ArrowLeftIcon size={18} />
        </IconButton>
        <IconButton label="Next thought" onClick={onNext} disabled={!onNext}>
          <ArrowLeftIcon size={18} className="rotate-180" />
        </IconButton>
        {shown?.is_mine && (
          <ButtonLink href={`/entry/${shown.id}`} variant="soft" size="sm" className="ml-auto" icon={<PencilIcon size={15} />}>
            Edit in your journal
          </ButtonLink>
        )}
      </div>
    </Dialog>
  );
}

function ReaderSkeleton() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-3 h-4 w-11/12" />
      <Skeleton className="mt-3 h-4 w-4/5" />
      <Skeleton className="mt-3 h-4 w-2/3" />
    </div>
  );
}
