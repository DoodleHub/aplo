"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "./button";

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  fill = false,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** `lg` fits a form beside a live preview. */
  size?: "md" | "lg";
  /** Let the body fill a fixed-height dialog (set the height in `className`), so a child with `mt-auto` sits at the bottom. */
  fill?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-3xl border border-line bg-surface p-0 text-ink shadow-pop outline-none",
        size === "lg" ? "max-w-3xl" : "max-w-md",
        "backdrop:bg-[#2b322c]/25 backdrop:backdrop-blur-[3px] open:animate-pop-in open:backdrop:animate-fade-in",
        className,
      )}
    >
      {open && (
        <div className={cn("p-6 sm:p-7", fill && "flex min-h-full flex-col")}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="dialog-title" className="font-display text-xl font-semibold tracking-tight">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            </div>
            <IconButton label="Close" onClick={onClose} className="-mr-2 -mt-1">
              <CloseIcon size={18} />
            </IconButton>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
