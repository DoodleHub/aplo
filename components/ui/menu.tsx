"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CheckIcon } from "@/components/icons";
import { Popover, type PopoverTriggerProps } from "./popover";

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

/** Popover menu of actions, or of radio options when items set `selected`. */
export function Menu({
  trigger,
  items,
  header,
  align = "end",
  side = "bottom",
  className,
}: {
  trigger: (props: PopoverTriggerProps) => ReactNode;
  items: Item[];
  header?: ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}) {
  return (
    <Popover role="menu" trigger={trigger} align={align} side={side} className={className} panelClassName="min-w-52">
      {(close) => (
        <>
          {header && <div className="mb-1 border-b border-line px-3 pt-2 pb-2.5">{header}</div>}
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <button
                key={item.label}
                role={item.selected === undefined ? "menuitem" : "menuitemradio"}
                aria-checked={item.selected}
                type="button"
                onClick={() => {
                  close();
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
          </div>
        </>
      )}
    </Popover>
  );
}
