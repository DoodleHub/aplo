"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** An on/off toggle with a label and optional hint; the whole row is clickable. */
export function Switch({
  checked,
  onChange,
  label,
  description,
  icon,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4 transition-colors duration-300 ease-soft",
        checked ? "border-sage-300 bg-sage-50" : "border-line bg-surface",
        className,
      )}
    >
      {icon && (
        <span
          className={cn(
            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
            checked ? "bg-sage-200 text-sage-600" : "bg-sage-50 text-muted",
          )}
        >
          {icon}
        </span>
      )}
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[0.82rem] leading-snug text-muted">{description}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-1 h-6 w-11 shrink-0 rounded-full transition-colors duration-300 ease-soft",
          checked ? "bg-sage-600" : "bg-line-strong",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition-transform dark:bg-ink duration-300 ease-spring",
            checked && "translate-x-5",
          )}
        />
      </button>
    </div>
  );
}
