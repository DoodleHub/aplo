"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";

/** How long a finger rests on an item before it lifts, so a swipe still scrolls. */
const LONG_PRESS_MS = 350;
/** A mouse picks an item up once it moves this far; less is still a click. */
const MOUSE_THRESHOLD = 4;
/** A finger that moves this far before the long press is scrolling, not holding. */
const TOUCH_SLOP = 8;
/** Distance from the scroll area's edge where dragging starts to scroll it. */
const EDGE = 40;
const MAX_SCROLL_SPEED = 12;

type Point = { x: number; y: number };
type Slot = { left: number; top: number; center: Point };

type Gesture = {
  id: string;
  from: number;
  to: number;
  pointerId: number;
  touch: boolean;
  start: Point;
  last: Point;
  active: boolean;
  slots: Slot[];
  /** The items' parent, which no transform touches, to tell how far the list has scrolled. */
  parent?: HTMLElement;
  parentStart: { left: number; top: number; scrollLeft: number; scrollTop: number };
  timer?: ReturnType<typeof setTimeout>;
  frame?: number;
};

type Drag = { id: string; from: number; to: number; offset: Point; slots: Slot[] };

/** Where an item ended up, for announcing the move. */
export type Moved = { id: string; to: number };

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  next.splice(to, 0, ...next.splice(from, 1));
  return next;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/** Scroll speed for a pointer near one edge of a range, or 0 away from both edges. */
function edgeSpeed(at: number, start: number, end: number) {
  if (at < start + EDGE) return -Math.min(1, (start + EDGE - at) / EDGE) * MAX_SCROLL_SPEED;
  if (at > end - EDGE) return Math.min(1, (at - end + EDGE) / EDGE) * MAX_SCROLL_SPEED;
  return 0;
}

/**
 * Drag-to-reorder with no library, for a vertical list, a horizontal row or a wrapping row.
 * A mouse drags an item directly; touch needs a long press so the list still scrolls; Alt and
 * the arrow keys move the focused item. Other items slide into their new slots with transforms
 * while dragging, and the new order is committed once, on drop.
 */
export function useReorder({
  ids,
  onReorder,
  scrollRef,
  orientation = "vertical",
}: {
  ids: string[];
  onReorder: (ids: string[], moved: Moved) => void;
  /** The element that scrolls the list, scrolled near its edges while dragging. */
  scrollRef: RefObject<HTMLElement | null>;
  /** Which arrow keys move an item: ↑/↓ for a vertical list, ←/→ for a row. */
  orientation?: "vertical" | "horizontal";
}) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const items = useRef(new Map<string, HTMLElement>());
  const gesture = useRef<Gesture | null>(null);
  const suppressClick = useRef(false);
  const refocus = useRef<string | null>(null);
  const latest = useRef({ ids, onReorder });
  useLayoutEffect(() => {
    latest.current = { ids, onReorder };
  });

  const update = useCallback(() => {
    const g = gesture.current;
    if (!g?.active) return;
    const { slots, from, parent, parentStart } = g;
    // Scrolling moves the items under a still pointer: either an ancestor scrolled (the
    // parent moved) or the parent scrolled its own content.
    const rect = parent?.getBoundingClientRect();
    const scrolled = {
      x: (parent ? parent.scrollLeft - parentStart.scrollLeft : 0) - (rect ? rect.left - parentStart.left : 0),
      y: (parent ? parent.scrollTop - parentStart.scrollTop : 0) - (rect ? rect.top - parentStart.top : 0),
    };
    const centers = slots.map((s) => s.center);
    // Keep the item within the list, measured from where every item started.
    const center = {
      x: clamp(slots[from].center.x + g.last.x - g.start.x + scrolled.x, ...minMax(centers.map((c) => c.x))),
      y: clamp(slots[from].center.y + g.last.y - g.start.y + scrolled.y, ...minMax(centers.map((c) => c.y))),
    };
    let to = from;
    let best = Infinity;
    centers.forEach((c, i) => {
      const distance = Math.hypot(c.x - center.x, c.y - center.y);
      if (distance < best) [best, to] = [distance, i];
    });
    g.to = to;
    setDrag({
      id: g.id,
      from,
      to,
      slots,
      offset: { x: center.x - slots[from].center.x, y: center.y - slots[from].center.y },
    });
  }, []);

  const begin = useCallback(() => {
    const g = gesture.current;
    if (!g || g.active) return;
    const rects = latest.current.ids.map((id) => items.current.get(id)?.getBoundingClientRect());
    if (rects.some((r) => !r)) return;
    g.slots = rects.map((r) => ({
      left: r!.left,
      top: r!.top,
      center: { x: r!.left + r!.width / 2, y: r!.top + r!.height / 2 },
    }));
    const parent = items.current.get(g.id)?.parentElement ?? undefined;
    if (parent) {
      const { left, top } = parent.getBoundingClientRect();
      g.parent = parent;
      g.parentStart = { left, top, scrollLeft: parent.scrollLeft, scrollTop: parent.scrollTop };
    }
    g.active = true;
    try {
      items.current.get(g.id)?.setPointerCapture(g.pointerId);
    } catch {
      // The pointer may already be gone; the drag still ends on the next pointerup.
    }
    if (g.touch) navigator.vibrate?.(10);

    // Scroll the list while the item is held near one of its edges.
    const autoScroll = () => {
      const scroller = scrollRef.current;
      if (gesture.current !== g || !scroller) return;
      const r = scroller.getBoundingClientRect();
      const dx = scroller.scrollWidth > scroller.clientWidth ? edgeSpeed(g.last.x, r.left, r.right) : 0;
      const dy = scroller.scrollHeight > scroller.clientHeight ? edgeSpeed(g.last.y, r.top, r.bottom) : 0;
      if (dx || dy) {
        scroller.scrollBy(dx, dy);
        update();
      }
      g.frame = requestAnimationFrame(autoScroll);
    };
    g.frame = requestAnimationFrame(autoScroll);
    update();
  }, [scrollRef, update]);

  const end = useCallback((commit: boolean) => {
    const g = gesture.current;
    if (!g) return;
    clearTimeout(g.timer);
    if (g.frame) cancelAnimationFrame(g.frame);
    gesture.current = null;
    if (!g.active) return;
    // The pointerup that drops an item would otherwise click its link.
    suppressClick.current = true;
    setDrag(null);
    if (commit && g.to !== g.from) {
      latest.current.onReorder(move(latest.current.ids, g.from, g.to), { id: g.id, to: g.to });
    }
  }, []);

  // Escape puts the item back where it was.
  useEffect(() => {
    if (!drag) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      end(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drag, end]);

  // Touch scrolling can only be stopped from a non-passive touchmove listener that exists
  // before the finger lands, so one stays attached and only acts mid-drag.
  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const onTouchMove = (e: TouchEvent) => {
      if (gesture.current?.active && e.cancelable) e.preventDefault();
    };
    scroller.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => scroller.removeEventListener("touchmove", onTouchMove);
  }, [scrollRef]);

  useEffect(() => () => end(false), [end]);

  // Moving an item in the DOM can drop focus; give it back after a keyboard move.
  useLayoutEffect(() => {
    if (!refocus.current) return;
    const item = items.current.get(refocus.current);
    (item?.matches("a, [tabindex]") ? item : item?.querySelector<HTMLElement>("a, [tabindex]"))?.focus();
    refocus.current = null;
  }, [ids]);

  const [back, forward] = orientation === "vertical" ? ["ArrowUp", "ArrowDown"] : ["ArrowLeft", "ArrowRight"];

  const itemProps = (id: string, index: number) => {
    let style: CSSProperties | undefined;
    if (drag) {
      const { from, to, slots, offset } = drag;
      // Items between the old and new slot each step one slot toward the old one.
      const target =
        id === drag.id
          ? undefined
          : from < to && index > from && index <= to
            ? slots[index - 1]
            : from > to && index < from && index >= to
              ? slots[index + 1]
              : undefined;
      if (id === drag.id) style = { transform: `translate(${offset.x}px, ${offset.y}px)` };
      else if (target) {
        style = { transform: `translate(${target.left - slots[index].left}px, ${target.top - slots[index].top}px)` };
      }
    }

    return {
      ref: (el: HTMLElement | null) => {
        if (el) items.current.set(id, el);
        else items.current.delete(id);
      },
      style,
      "data-dragging": drag?.id === id ? "" : undefined,
      onPointerDown: (e: PointerEvent<HTMLElement>) => {
        suppressClick.current = false;
        // Leave buttons inside the item (its menu) alone.
        if (e.button !== 0 || gesture.current || (e.target as Element).closest("button")) return;
        const touch = e.pointerType !== "mouse";
        const start = { x: e.clientX, y: e.clientY };
        gesture.current = {
          id,
          from: index,
          to: index,
          pointerId: e.pointerId,
          touch,
          start,
          last: start,
          active: false,
          slots: [],
          parentStart: { left: 0, top: 0, scrollLeft: 0, scrollTop: 0 },
          timer: touch ? setTimeout(begin, LONG_PRESS_MS) : undefined,
        };
      },
      onPointerMove: (e: PointerEvent<HTMLElement>) => {
        const g = gesture.current;
        if (!g || g.pointerId !== e.pointerId) return;
        g.last = { x: e.clientX, y: e.clientY };
        if (g.active) return update();
        const distance = Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y);
        if (g.touch && distance > TOUCH_SLOP) end(false);
        else if (!g.touch && distance > MOUSE_THRESHOLD) begin();
      },
      onPointerUp: (e: PointerEvent<HTMLElement>) => {
        if (gesture.current?.pointerId === e.pointerId) end(true);
      },
      onPointerCancel: (e: PointerEvent<HTMLElement>) => {
        if (gesture.current?.pointerId === e.pointerId) end(false);
      },
      onClickCapture: (e: MouseEvent<HTMLElement>) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      },
      // A long press on a link would otherwise open the browser's own menu.
      onContextMenu: (e: MouseEvent<HTMLElement>) => {
        if (gesture.current?.touch || drag) e.preventDefault();
      },
      onDragStart: (e: MouseEvent<HTMLElement>) => e.preventDefault(),
      onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (!e.altKey || (e.key !== back && e.key !== forward)) return;
        if ((e.target as Element).closest("button")) return;
        const to = index + (e.key === back ? -1 : 1);
        if (to < 0 || to >= ids.length) return;
        e.preventDefault();
        refocus.current = id;
        onReorder(move(ids, index, to), { id, to });
      },
    };
  };

  return { draggingId: drag?.id, itemProps };
}

function minMax(values: number[]): [number, number] {
  return [Math.min(...values), Math.max(...values)];
}
