"use client";

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/icons";

type Item = {
  label: string;
  /** A second, quieter line under the label. */
  description?: ReactNode;
  icon?: ReactNode;
  onSelect: () => void;
  tone?: "danger";
  /** Makes the item a radio option, checked when true. */
  selected?: boolean;
};

const GAP = 8;
const PANEL_ROOM = 160;

/**
 * Popover menu. The panel renders in a portal with fixed positioning so it is never
 * clipped by scrolling containers (e.g. the sidebar list) or shifted by hover transforms.
 */
export function Menu({
  trigger,
  items,
  header,
  align = "end",
  side = "bottom",
  className,
}: {
  trigger: (props: { onClick: () => void; "aria-expanded": boolean; "aria-haspopup": "menu" }) => ReactNode;
  items: Item[];
  header?: ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<CSSProperties>();
  const anchorRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const placeBelow =
      side === "bottom" ? rect.bottom + PANEL_ROOM < window.innerHeight : rect.top < PANEL_ROOM;
    setPosition({
      ...(placeBelow
        ? { top: rect.bottom + GAP }
        : { bottom: window.innerHeight - rect.top + GAP }),
      ...(align === "end" ? { right: window.innerWidth - rect.right } : { left: rect.left }),
    });
  }, [open, side, align]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!anchorRef.current?.contains(target) && !panelRef.current?.contains(target)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  return (
    <div ref={anchorRef} className={className}>
      {trigger({ onClick: () => setOpen((o) => !o), "aria-expanded": open, "aria-haspopup": "menu" })}
      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            style={position}
            className="fixed z-60 min-w-52 animate-pop-in rounded-2xl border border-line bg-surface p-1.5 shadow-pop"
          >
            {header && <div className="mb-1 border-b border-line px-3 pt-2 pb-2.5">{header}</div>}
            {items.map((item) => (
              <button
                key={item.label}
                role={item.selected === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={item.selected}
                type="button"
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                className={cn(
                  "flex w-full gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                  item.description ? "max-w-72 items-start" : "items-center",
                  item.tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-ink hover:bg-sage-50",
                  item.selected && "bg-sage-50",
                )}
              >
                {item.icon && <span className={cn("shrink-0", Boolean(item.description) && "mt-px")}>{item.icon}</span>}
                <span className="min-w-0 flex-1">
                  <span className={cn("block", item.selected && "font-medium")}>{item.label}</span>
                  {item.description && (
                    <span className="mt-0.5 block text-xs leading-snug text-subtle">{item.description}</span>
                  )}
                </span>
                {item.selected && <CheckIcon size={16} className="mt-0.5 shrink-0 text-sage-600" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
