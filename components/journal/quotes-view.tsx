"use client";

import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { cn } from "@/lib/cn";
import { CATEGORY_COLORS, type Quote, type QuoteInput, type QuotePatch } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { CopyIcon, FitIcon, MinusIcon, MoreIcon, PencilIcon, PlusIcon, QuoteIcon, TrashIcon } from "@/components/icons";
import { PageIntro } from "./home-view";
import { QUOTE_WIDTH, QuoteFace, quoteTilt } from "./quote-card";
import { QuoteDialog } from "./quote-dialog";
import { useJournal } from "./store";

/** Where the wall sits under the viewport: screen = canvas × zoom + (x, y). */
type View = { x: number; y: number; zoom: number };
type Point = { x: number; y: number };

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
/** Spacing of the dot grid at 100%, in canvas units. */
const GRID = 24;
/** A pointer that moves less than this (in px) is a tap, not a drag. */
const TAP_SLOP = 4;
const DOUBLE_TAP_MS = 350;
/** Breathing room around the quotes when fitting them in view, in px. */
const FIT_PADDING = 40;
/** How far an arrow key moves a quote; Shift moves it further. */
const NUDGE = 12;
const NUDGE_FAR = 60;
/** A card's height before it has been measured, in canvas units. */
const FALLBACK_HEIGHT = 160;
/** How small or large a quote can be, as a multiple of its natural size. */
const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
/** How much [ and ] resize a quote. */
const SCALE_STEP = 0.1;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Older device copies have no size yet. */
const scaleOf = (quote: Quote) => quote.scale ?? 1;

/** Where a pointer is, in px from the element's top-left corner. */
function pointIn(element: HTMLElement, e: { clientX: number; clientY: number }): Point {
  const rect = element.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

/** The view zoomed to `zoom`, keeping the canvas point under `at` (px in the viewport) in place. */
function zoomAround(view: View, at: Point, zoom: number): View {
  const next = clamp(zoom, MIN_ZOOM, MAX_ZOOM);
  const cx = (at.x - view.x) / view.zoom;
  const cy = (at.y - view.y) / view.zoom;
  return { x: at.x - cx * next, y: at.y - cy * next, zoom: next };
}

type Gesture =
  | { kind: "pan"; pointerId: number; start: Point; from: View }
  | { kind: "card"; pointerId: number; id: string; start: Point; origin: Point; moved: boolean }
  | {
      kind: "resize";
      pointerId: number;
      id: string;
      start: Point;
      /** The card's top-left corner and natural size, in canvas units. */
      corner: Point;
      size: { width: number; height: number };
      scale: number;
      moved: boolean;
    }
  | { kind: "pinch"; distance: number; mid: Point; from: View };

/** A card mid-gesture: where it's being dragged to, or how big it's being made. */
type Live = { id: string; x?: number; y?: number; scale?: number };

type Composer = { open: boolean; quote?: Quote; at?: Point };

export function QuotesView() {
  const { quotes, createQuote, updateQuote, deleteQuote } = useJournal();
  const toast = useToast();
  const viewportRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({ x: 0, y: 0, zoom: 1 });
  const viewRef = useRef(view);
  // Button and keyboard moves glide; pointer gestures follow the finger exactly.
  const [smooth, setSmooth] = useState(false);
  const [ready, setReady] = useState(false);
  const [live, setLive] = useState<Live>();
  const [composer, setComposer] = useState<Composer>({ open: false });
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const lastTap = useRef<{ time: number; at: Point; id: string | null } | null>(null);
  const smoothTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const apply = useCallback((next: View, glide = false) => {
    viewRef.current = next;
    setView(next);
    setSmooth(glide);
    clearTimeout(smoothTimer.current);
    if (glide) smoothTimer.current = setTimeout(() => setSmooth(false), 320);
  }, []);

  const toCanvas = (p: Point, v = viewRef.current): Point => ({ x: (p.x - v.x) / v.zoom, y: (p.y - v.y) / v.zoom });

  /** A view that shows every quote, or centers the empty wall's origin. */
  const fitView = useCallback((): View => {
    const viewport = viewportRef.current;
    if (!viewport) return viewRef.current;
    const width = viewport.clientWidth;
    const height = viewport.clientHeight;
    const cards = [...viewport.querySelectorAll<HTMLElement>("[data-quote-id]")];
    if (cards.length === 0) return { x: width / 2, y: height / 2, zoom: 1 };
    let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity];
    for (const card of cards) {
      const x = Number(card.dataset.x);
      const y = Number(card.dataset.y);
      const scale = Number(card.dataset.scale) || 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + QUOTE_WIDTH * scale);
      maxY = Math.max(maxY, y + (card.offsetHeight || FALLBACK_HEIGHT) * scale);
    }
    const zoom = clamp(
      Math.min((width - FIT_PADDING * 2) / (maxX - minX), (height - FIT_PADDING * 2) / (maxY - minY)),
      MIN_ZOOM,
      1,
    );
    return { x: width / 2 - ((minX + maxX) / 2) * zoom, y: height / 2 - ((minY + maxY) / 2) * zoom, zoom };
  }, []);

  // Always open with every quote in view: on first visit, and on coming back, since Next keeps
  // visited pages alive in a hidden <Activity> instead of unmounting them. React detaches refs
  // when a page hides and re-attaches them when it shows again, after the DOM is visible and
  // before paint, so the cards can be measured here every time.
  const attachViewport = useCallback(
    (viewport: HTMLDivElement | null) => {
      viewportRef.current = viewport;
      if (!viewport) {
        // Drop any gesture cut short by leaving the page.
        pointers.current.clear();
        gesture.current = null;
        setLive(undefined);
        return;
      }
      apply(fitView());
      setReady(true);
    },
    [apply, fitView],
  );

  // Keep the middle of the wall in the middle when the viewport changes size (rotation, sidebar).
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    let size = { width: viewport.clientWidth, height: viewport.clientHeight };
    const observer = new ResizeObserver(() => {
      const next = { width: viewport.clientWidth, height: viewport.clientHeight };
      const v = viewRef.current;
      apply({ ...v, x: v.x + (next.width - size.width) / 2, y: v.y + (next.height - size.height) / 2 });
      size = next;
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [apply]);

  // Wheel and trackpad: scroll pans, pinch (ctrl/⌘ + wheel) zooms around the cursor.
  // Attached by hand because React's wheel listener is passive and can't stop the page scrolling.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const v = viewRef.current;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? viewport.clientHeight : 1;
      if (e.ctrlKey || e.metaKey) {
        apply(zoomAround(v, pointIn(viewport, e), v.zoom * Math.exp(-e.deltaY * unit * 0.008)));
      } else {
        apply({ ...v, x: v.x - e.deltaX * unit, y: v.y - e.deltaY * unit });
      }
    };
    // Safari reports trackpad pinches as gesture events rather than ctrl + wheel.
    let gestureFrom = 1;
    type SafariGesture = Event & { scale: number; clientX: number; clientY: number };
    const onGestureStart = (e: Event) => {
      e.preventDefault();
      gestureFrom = viewRef.current.zoom;
    };
    const onGestureChange = (e: Event) => {
      e.preventDefault();
      const g = e as SafariGesture;
      apply(zoomAround(viewRef.current, pointIn(viewport, g), gestureFrom * g.scale));
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    viewport.addEventListener("gesturestart", onGestureStart);
    viewport.addEventListener("gesturechange", onGestureChange);
    return () => {
      viewport.removeEventListener("wheel", onWheel);
      viewport.removeEventListener("gesturestart", onGestureStart);
      viewport.removeEventListener("gesturechange", onGestureChange);
    };
  }, [apply]);

  // N pins a new quote from anywhere on the page, unless someone is typing or a dialog is open.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "n" || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]") || document.querySelector("dialog[open]")) return;
      e.preventDefault();
      setComposer({ open: true });
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const zoomBy = (factor: number) => {
    const viewport = viewportRef.current!;
    const v = viewRef.current;
    apply(zoomAround(v, { x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 }, v.zoom * factor), true);
  };
  const resetZoom = () => zoomBy(1 / viewRef.current.zoom);
  const fit = () => apply(fitView(), true);

  /** Puts a quote on top of the others, if it isn't already. */
  const raise = useCallback(
    (quote: Quote) => {
      const top = Math.max(0, ...quotes.map((q) => q.z));
      const alone = quotes.filter((q) => q.z === top).length === 1;
      return quote.z === top && alone ? {} : { z: top + 1 };
    },
    [quotes],
  );

  const openNew = (at?: Point) => setComposer({ open: true, at });
  const openEdit = useCallback((quote: Quote) => setComposer({ open: true, quote }), []);

  const submit = (input: QuoteInput) => {
    if (composer.quote) {
      updateQuote(composer.quote.id, input);
      return;
    }
    const viewport = viewportRef.current!;
    // Centered where it was asked for, or in the middle of the view, nudged a little so
    // several added in a row fan out instead of stacking exactly.
    const jitter = () => (composer.at ? 0 : Math.round((Math.random() - 0.5) * 48));
    const center = composer.at ?? toCanvas({ x: viewport.clientWidth / 2, y: viewport.clientHeight / 2 });
    const created = createQuote(input, { x: center.x - QUOTE_WIDTH / 2 + jitter(), y: center.y - 60 + jitter() });
    requestAnimationFrame(() =>
      viewport.querySelector<HTMLElement>(`[data-quote-id="${created.id}"]`)?.focus({ preventScroll: true }),
    );
  };

  const copy = useCallback(
    (quote: Quote) => {
      const text = quote.author ? `“${quote.text}” — ${quote.author}` : quote.text;
      navigator.clipboard.writeText(text).then(
        () => toast.show("Copied to your clipboard."),
        () => toast.show("We couldn’t copy that. Try selecting the text instead."),
      );
    },
    [toast],
  );

  // ── Pointer gestures ────────────────────────────────────────────────────────────────

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // Controls keep their own clicks; events from portalled menus bubble here too.
    if (!e.currentTarget.contains(target) || target.closest("button, a, input, textarea")) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const at = pointIn(e.currentTarget, e);
    pointers.current.set(e.pointerId, at);

    if (pointers.current.size === 2) {
      // A second finger turns whatever was happening into a pinch.
      const [a, b] = [...pointers.current.values()];
      setLive(undefined);
      gesture.current = {
        kind: "pinch",
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        from: viewRef.current,
      };
      return;
    }
    if (pointers.current.size > 2) return;

    const card = target.closest<HTMLElement>("[data-quote-id]");
    const quote = card && quotes.find((q) => q.id === card.dataset.quoteId);
    if (!quote) {
      gesture.current = { kind: "pan", pointerId: e.pointerId, start: at, from: viewRef.current };
    } else if (target.closest("[data-resize-handle]")) {
      gesture.current = {
        kind: "resize",
        pointerId: e.pointerId,
        id: quote.id,
        start: at,
        corner: { x: quote.x, y: quote.y },
        size: { width: QUOTE_WIDTH, height: card.offsetHeight || FALLBACK_HEIGHT },
        scale: scaleOf(quote),
        moved: false,
      };
    } else {
      gesture.current = { kind: "card", pointerId: e.pointerId, id: quote.id, start: at, origin: { x: quote.x, y: quote.y }, moved: false };
    }
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const at = pointIn(e.currentTarget, e);
    pointers.current.set(e.pointerId, at);
    const g = gesture.current;
    if (!g) return;

    if (g.kind === "pinch") {
      const [a, b] = [...pointers.current.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const scale = Math.hypot(a.x - b.x, a.y - b.y) / g.distance;
      // Zoom around where the pinch began, then follow the fingers as they move together.
      const zoomed = zoomAround(g.from, g.mid, g.from.zoom * scale);
      apply({ ...zoomed, x: zoomed.x + mid.x - g.mid.x, y: zoomed.y + mid.y - g.mid.y });
      return;
    }
    if (e.pointerId !== g.pointerId) return;
    const dx = at.x - g.start.x;
    const dy = at.y - g.start.y;

    if (g.kind === "pan") {
      apply({ ...g.from, x: g.from.x + dx, y: g.from.y + dy });
      return;
    }
    if (!g.moved && Math.hypot(dx, dy) < TAP_SLOP) return;
    g.moved = true;

    if (g.kind === "resize") {
      // Project the pointer onto the card's diagonal, so the corner tracks it and the
      // card keeps its shape.
      const p = toCanvas(at);
      const { width, height } = g.size;
      const along = ((p.x - g.corner.x) * width + (p.y - g.corner.y) * height) / (width * width + height * height);
      g.scale = clamp(along, MIN_SCALE, MAX_SCALE);
      setLive({ id: g.id, scale: g.scale });
      return;
    }
    const zoom = viewRef.current.zoom;
    setLive({ id: g.id, x: g.origin.x + dx / zoom, y: g.origin.y + dy / zoom });
  };

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(e.pointerId)) return;
    const at = pointIn(e.currentTarget, e);
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    const cancelled = e.type === "pointercancel";

    if (g?.kind === "pinch") {
      // Lifting one finger hands over to panning with the other.
      const [rest] = [...pointers.current.entries()];
      gesture.current = rest ? { kind: "pan", pointerId: rest[0], start: rest[1], from: viewRef.current } : null;
      lastTap.current = null;
      return;
    }
    if (!g || e.pointerId !== g.pointerId) return;
    gesture.current = null;

    if (g.kind === "resize") {
      const quote = quotes.find((q) => q.id === g.id);
      setLive(undefined);
      lastTap.current = null;
      if (quote && g.moved && !cancelled) updateQuote(quote.id, { scale: g.scale, ...raise(quote) });
      return;
    }

    if (g.kind === "card") {
      const quote = quotes.find((q) => q.id === g.id);
      setLive(undefined);
      if (!quote) return;
      if (g.moved) {
        if (cancelled) return;
        const zoom = viewRef.current.zoom;
        updateQuote(quote.id, {
          x: g.origin.x + (at.x - g.start.x) / zoom,
          y: g.origin.y + (at.y - g.start.y) / zoom,
          ...raise(quote),
        });
        lastTap.current = null;
        return;
      }
      const card = e.currentTarget.querySelector<HTMLElement>(`[data-quote-id="${quote.id}"]`);
      card?.focus({ preventScroll: true });
      if (isDoubleTap(at, quote.id)) openEdit(quote);
      else {
        const lift = raise(quote);
        if ("z" in lift) updateQuote(quote.id, lift);
      }
      return;
    }

    const moved = Math.hypot(at.x - g.start.x, at.y - g.start.y) >= TAP_SLOP;
    if (moved || cancelled) {
      lastTap.current = null;
      return;
    }
    // A tap on the empty wall lets go of the selected quote; a double tap pins a new one there.
    if (e.currentTarget.contains(document.activeElement) && document.activeElement !== e.currentTarget) {
      (document.activeElement as HTMLElement).blur();
    }
    if (isDoubleTap(at, null)) openNew(toCanvas(at));
  };

  const isDoubleTap = (at: Point, id: string | null) => {
    const last = lastTap.current;
    const now = Date.now();
    const double =
      last !== null && last.id === id && now - last.time < DOUBLE_TAP_MS && Math.hypot(at.x - last.at.x, at.y - last.at.y) < 24;
    lastTap.current = double ? null : { time: now, at, id };
    return double;
  };

  // ── Keyboard ────────────────────────────────────────────────────────────────────────

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (!e.currentTarget.contains(target) || e.metaKey || e.ctrlKey || e.altKey) return;
    const id = target.dataset.quoteId;
    const quote = id ? quotes.find((q) => q.id === id) : undefined;

    if (quote) {
      const step = e.shiftKey ? NUDGE_FAR : NUDGE;
      const moves: Record<string, Point> = {
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
      };
      const move = moves[e.key];
      if (move) {
        e.preventDefault();
        updateQuote(quote.id, { x: quote.x + move.x, y: quote.y + move.y, ...raise(quote) });
        return;
      }
      if (e.key === "[" || e.key === "]") {
        e.preventDefault();
        const scale = clamp(scaleOf(quote) + (e.key === "]" ? SCALE_STEP : -SCALE_STEP), MIN_SCALE, MAX_SCALE);
        if (scale !== scaleOf(quote)) updateQuote(quote.id, { scale, ...raise(quote) });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        openEdit(quote);
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteQuote(quote.id);
        e.currentTarget.focus({ preventScroll: true });
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        e.currentTarget.focus({ preventScroll: true });
        return;
      }
    }

    if (target.closest("button")) return;
    if (e.key === "+" || e.key === "=") zoomBy(1.25);
    else if (e.key === "-" || e.key === "_") zoomBy(0.8);
    else if (e.key === "0") fit();
    else return;
    e.preventDefault();
  };

  // Tabbing to a quote that's out of view glides the wall over to it.
  const onFocus = (e: FocusEvent<HTMLDivElement>) => {
    const id = (e.target as HTMLElement).dataset.quoteId;
    const quote = id && quotes.find((q) => q.id === id);
    if (!quote || gesture.current) return;
    const viewport = e.currentTarget;
    const v = viewRef.current;
    const scale = scaleOf(quote);
    const width = QUOTE_WIDTH * scale;
    const height = (e.target as HTMLElement).offsetHeight * scale;
    const left = quote.x * v.zoom + v.x;
    const top = quote.y * v.zoom + v.y;
    const visible =
      left >= 0 &&
      top >= 0 &&
      left + width * v.zoom <= viewport.clientWidth &&
      top + height * v.zoom <= viewport.clientHeight;
    if (visible) return;
    apply(
      {
        ...v,
        x: viewport.clientWidth / 2 - (quote.x + width / 2) * v.zoom,
        y: viewport.clientHeight / 2 - (quote.y + height / 2) * v.zoom,
      },
      true,
    );
  };

  const nextColor = CATEGORY_COLORS[quotes.length % CATEGORY_COLORS.length];
  const count = quotes.length;

  return (
    <div>
      <PageIntro
        eyebrow={count === 0 ? "Your quote wall" : `${count} ${count === 1 ? "quote" : "quotes"} on your wall`}
        title={
          <>
            Quotes
            <QuoteIcon size={30} className="ml-2.5 inline-block -translate-y-0.5 text-ink" />
          </>
        }
        subtitle="Words worth keeping close. Arrange them however feels right."
        action={
          <Button
            size="lg"
            icon={<PlusIcon size={20} strokeWidth={2.2} />}
            onClick={() => openNew()}
            aria-keyshortcuts="N"
            className="self-start sm:self-auto"
          >
            Add a quote
          </Button>
        }
      />

      <div className="relative mt-8 animate-fade-up [animation-delay:60ms] sm:mt-10">
        <div
          ref={attachViewport}
          role="region"
          aria-label="Quote wall"
          aria-describedby="quote-wall-help"
          aria-keyshortcuts="N + - 0"
          tabIndex={-1}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          className={cn(
            "relative h-[max(20rem,calc(100svh-21rem))] touch-none overflow-hidden rounded-3xl border border-line bg-canvas outline-none select-none [-webkit-touch-callout:none] sm:h-[max(30rem,calc(100dvh-17rem))]",
            "cursor-grab active:cursor-grabbing",
            smooth && "transition-[background-position,background-size] duration-300 ease-soft",
          )}
          style={{
            backgroundImage: "radial-gradient(circle, var(--color-paper-dot) 1.1px, transparent 1.6px)",
            backgroundSize: `${GRID * view.zoom}px ${GRID * view.zoom}px`,
            backgroundPosition: `${view.x}px ${view.y}px`,
          }}
        >
          <p id="quote-wall-help" className="sr-only">
            Drag the wall to look around and drag a quote to move it. With a quote selected, arrow keys move it, [ and ]
            make it smaller or bigger, Enter edits it and Delete takes it down. Press N for a new quote, plus or minus to zoom, and 0 to see everything.
          </p>

          <div
            className={cn(
              "absolute top-0 left-0 origin-top-left",
              ready ? "opacity-100" : "opacity-0",
              smooth ? "transition-[transform,opacity] duration-300 ease-soft" : "transition-opacity duration-300",
            )}
            style={
              {
                transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.zoom})`,
                "--zoom": view.zoom,
              } as CSSProperties
            }
          >
            {quotes.map((quote, i) => (
              <QuoteCard
                key={quote.id}
                quote={quote}
                index={i}
                live={live?.id === quote.id ? live : undefined}
                onEdit={openEdit}
                onCopy={copy}
                onUpdate={updateQuote}
                onDelete={deleteQuote}
              />
            ))}
          </div>

          {count === 0 && ready && <EmptyWall onAdd={() => openNew()} />}

          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
            <p className="hidden min-w-0 truncate rounded-xl bg-surface/80 px-3 py-2 text-xs text-subtle backdrop-blur-sm sm:block">
              <span className="pointer-coarse:hidden">Drag to arrange · Double-click to add · Scroll to look around</span>
              <span className="pointer-fine:hidden">Drag to arrange · Double-tap to add · Pinch to zoom</span>
            </p>
            <div className="pointer-events-auto ml-auto flex shrink-0 items-center gap-0.5 rounded-2xl border border-line bg-surface/90 p-1 shadow-soft backdrop-blur-sm">
              <IconButton label="Zoom out" onClick={() => zoomBy(0.8)} disabled={view.zoom <= MIN_ZOOM + 0.001}>
                <MinusIcon size={18} />
              </IconButton>
              <button
                type="button"
                onClick={resetZoom}
                title="Back to 100%"
                aria-label={`Zoom ${Math.round(view.zoom * 100)}%. Back to 100%`}
                className="h-9 min-w-13 rounded-full px-1.5 text-xs font-semibold tabular-nums text-ink-soft transition-colors hover:bg-sage-100 hover:text-ink"
              >
                {Math.round(view.zoom * 100)}%
              </button>
              <IconButton label="Zoom in" onClick={() => zoomBy(1.25)} disabled={view.zoom >= MAX_ZOOM - 0.001}>
                <PlusIcon size={18} />
              </IconButton>
              <span aria-hidden="true" className="mx-0.5 h-5 w-px bg-line" />
              <IconButton label="Show all quotes" onClick={fit}>
                <FitIcon size={18} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      <QuoteDialog
        open={composer.open}
        quote={composer.quote}
        defaultColor={nextColor}
        onClose={() => setComposer((c) => ({ ...c, open: false }))}
        onSubmit={submit}
      />
    </div>
  );
}

// Card controls stay a steady size on screen however big the quote is, and only shrink a
// little when zoomed out.
const steadyScale = "clamp(0.3, calc(1 / (var(--s) * max(var(--zoom), 0.6))), 3)";

// Hidden until the card is hovered or selected, so they never sit over the words.
const revealed =
  "invisible opacity-0 transition-[opacity,visibility] duration-200 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100";

const QuoteCard = memo(function QuoteCard({
  quote,
  index,
  live,
  onEdit,
  onCopy,
  onUpdate,
  onDelete,
}: {
  quote: Quote;
  /** Position in the list, to stagger the entrance. */
  index: number;
  /** Where the card is being dragged to, or how big it's being made, while it is. */
  live?: Live;
  onEdit: (quote: Quote) => void;
  onCopy: (quote: Quote) => void;
  onUpdate: (id: string, patch: QuotePatch) => void;
  onDelete: (id: string) => void;
}) {
  const x = live?.x ?? quote.x;
  const y = live?.y ?? quote.y;
  const scale = live?.scale ?? scaleOf(quote);
  return (
    <div
      className={cn("absolute top-0 left-0 origin-top-left", !live && "transition-transform duration-200 ease-soft")}
      style={
        {
          transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
          zIndex: live ? 1_000_000 : quote.z,
          "--s": scale,
        } as CSSProperties
      }
    >
      <div className="animate-pop-in" style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}>
        <QuoteFace
          quote={quote}
          data-quote-id={quote.id}
          data-x={quote.x}
          data-y={quote.y}
          data-scale={scaleOf(quote)}
          tabIndex={0}
          aria-roledescription="movable quote"
          aria-describedby="quote-wall-help"
          style={{ "--tilt": `${quoteTilt(quote.id)}deg` } as CSSProperties}
          className={cn(
            "group outline-none transition-[rotate,scale,box-shadow] duration-300 ease-soft focus-visible:ring-2 focus-visible:ring-sage-400 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas",
            live
              ? "scale-[1.03] rotate-0 shadow-pop"
              : "rotate-(--tilt) shadow-soft hover:rotate-0 hover:shadow-lift focus-visible:rotate-0",
            live?.scale !== undefined ? "cursor-nwse-resize" : live ? "cursor-grabbing" : "cursor-grab",
          )}
          action={
            <>
              <span className="absolute top-1.5 right-1.5 origin-top-right" style={{ scale: steadyScale }}>
                <Menu
                  items={[
                    { label: "Edit", icon: <PencilIcon size={17} />, onSelect: () => onEdit(quote) },
                    { label: "Copy text", icon: <CopyIcon size={17} />, onSelect: () => onCopy(quote) },
                    ...(scaleOf(quote) !== 1
                      ? [{ label: "Original size", icon: <FitIcon size={17} />, onSelect: () => onUpdate(quote.id, { scale: 1 }) }]
                      : []),
                    { label: "Take down", icon: <TrashIcon size={17} />, tone: "danger" as const, onSelect: () => onDelete(quote.id) },
                  ]}
                  trigger={(props) => (
                    <IconButton
                      {...props}
                      label="Quote options"
                      className={cn(
                        "h-8 w-8 bg-surface/75 shadow-soft backdrop-blur-sm aria-expanded:visible aria-expanded:opacity-100",
                        revealed,
                      )}
                    >
                      <MoreIcon size={18} />
                    </IconButton>
                  )}
                />
              </span>
              <span
                data-resize-handle
                aria-hidden="true"
                title="Drag to resize"
                className={cn(
                  "absolute -right-1 -bottom-1 flex h-9 w-9 origin-bottom-right cursor-nwse-resize items-end justify-end p-2 text-ink-soft",
                  revealed,
                  live?.scale !== undefined && "visible opacity-100",
                )}
                style={{ scale: steadyScale }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M11 4 4 11M11 8.5 8.5 11" />
                </svg>
              </span>
            </>
          }
        />
      </div>
    </div>
  );
});

function EmptyWall({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex animate-fade-in items-center justify-center p-6">
      <div className="max-w-xs text-center">
        <div className="relative mx-auto mb-5 h-20 w-28" aria-hidden="true">
          <span className="absolute top-2 left-2 h-14 w-16 -rotate-6 rounded-xl border border-cat-sand-line bg-cat-sand shadow-soft" />
          <span className="absolute top-0 right-2 h-16 w-16 rotate-3 rounded-xl border border-cat-sage-line bg-cat-sage shadow-soft" />
          <span className="absolute top-1 right-6 font-display text-4xl leading-none font-semibold text-cat-sage-dot">“</span>
        </div>
        <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">Your wall is waiting</h2>
        <p className="mt-2 text-[0.95rem] leading-relaxed text-muted">
          Pin the words that steady you, lift you, or make you smile.
        </p>
        <Button variant="soft" icon={<PlusIcon size={17} />} onClick={onAdd} className="pointer-events-auto mt-5">
          Add your first quote
        </Button>
        <p className="mt-3 text-xs text-subtle">
          <span className="pointer-coarse:hidden">or double-click anywhere</span>
          <span className="pointer-fine:hidden">or double-tap anywhere</span>
        </p>
      </div>
    </div>
  );
}
