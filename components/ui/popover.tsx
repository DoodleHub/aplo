"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

const GAP = 8;
/** Matches the 16px mobile gutter. */
const EDGE = 16;

export type PopoverTriggerProps = {
  onClick: () => void;
  "aria-expanded": boolean;
  "aria-haspopup": "menu" | "dialog";
};

/**
 * Floating panel anchored to a trigger. The panel renders in a portal with fixed positioning
 * so it is never clipped by scrolling containers (e.g. the sidebar list) or shifted by hover
 * transforms. Closes on Escape, an outside click, resize or scroll.
 */
export function Popover({
  trigger,
  children,
  role,
  label,
  align = "end",
  side = "bottom",
  room = 160,
  className,
  panelClassName,
}: {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  children: (close: () => void) => ReactNode;
  role: "menu" | "dialog";
  label?: string;
  align?: "start" | "end";
  side?: "top" | "bottom";
  /** Height the panel needs; it flips to the other side when there isn't this much room. */
  room?: number;
  className?: string;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !panelRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const width = panelRef.current.offsetWidth;
    const placeBelow = side === "bottom" ? rect.bottom + room < window.innerHeight : rect.top < room;
    // Keep the panel on screen: a trigger mid-toolbar on a phone would otherwise push it off the edge.
    const ideal = align === "end" ? rect.right - width : rect.left;
    const left = Math.max(EDGE, Math.min(ideal, window.innerWidth - EDGE - width));
    setPosition({
      ...(placeBelow ? { top: rect.bottom + GAP } : { bottom: window.innerHeight - rect.top + GAP }),
      left,
    });
  }, [open, side, align, room]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    // Scrolling inside the panel itself is fine.
    const onScroll = (e: Event) => !panelRef.current?.contains(e.target as Node) && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className={className}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": role })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role={role}
            aria-label={label}
            // Rendered hidden first so its width can be measured before it's placed.
            style={position ?? { top: 0, left: 0, visibility: "hidden" }}
            className={cn(
              "fixed z-60 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop",
              panelClassName,
            )}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </div>
  );
}
