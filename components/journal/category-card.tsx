import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { Category } from "@/lib/types";
import { ArrowUpRightIcon } from "@/components/icons";

export function CategoryCard({
  category,
  count,
  style,
  actions,
}: {
  category: Category;
  count: number;
  style?: CSSProperties;
  /** Optional controls (e.g. an Edit/Delete menu) pinned to the top-right corner. */
  actions?: ReactNode;
}) {
  return (
    <div
      style={style}
      className={cn(
        "group relative animate-fade-up rounded-2xl border transition-[transform,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-lift has-[[aria-expanded=true]]:-translate-y-1 has-[[aria-expanded=true]]:shadow-lift",
        palette[category.color].card,
      )}
    >
      <Link
        href={`/c/${category.id}`}
        className="flex min-h-[8.75rem] flex-col justify-between rounded-[inherit] p-5"
      >
        <span className="text-[1.6rem] leading-none">{category.emoji}</span>
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-[1.05rem] font-semibold text-ink">{category.name}</h3>
            <p className="mt-1 text-[0.82rem] text-muted">
              {count} {count === 1 ? "thought" : "thoughts"} tucked away
            </p>
          </div>
          <ArrowUpRightIcon
            size={18}
            className="mb-0.5 shrink-0 text-ink-soft transition-transform duration-300 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
      </Link>
      {actions && (
        <div className="absolute top-3 right-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 has-[[aria-expanded=true]]:opacity-100 pointer-coarse:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}
