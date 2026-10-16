import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { Category } from "@/lib/types";

/** Compact, pill-like tile linking to a category. */
export function CategoryCard({
  category,
  count,
  style,
  className,
}: {
  category: Category;
  count: number;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <Link
      href={`/c/${category.id}`}
      style={style}
      className={cn(
        "group flex h-14 max-w-60 shrink-0 animate-fade-up snap-start items-center gap-3 rounded-2xl border py-2 pr-4 pl-2 transition-[transform,box-shadow] duration-300 ease-soft hover:-translate-y-0.5 hover:shadow-lift active:scale-[0.98]",
        palette[category.color].card,
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface/60 text-[1.25rem] leading-none transition-transform will-change-transform duration-300 ease-soft group-hover:scale-110 group-hover:-rotate-6">
        {category.emoji}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[0.95rem] leading-tight font-semibold text-ink">{category.name}</span>
        <span className="mt-0.5 block text-xs text-muted tabular-nums">
          {count} {count === 1 ? "thought" : "thoughts"}
        </span>
      </span>
    </Link>
  );
}

/** Row of category tiles: swipeable on small screens, wrapping on larger ones. */
export function CategoryRow({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 -my-1 flex snap-x snap-mandatory scroll-px-4 gap-2.5 overflow-x-auto px-4 py-1 scrollbar-none mask-[linear-gradient(to_right,transparent,black_1rem,black_calc(100%-1rem),transparent)] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:mask-none">
      {children}
    </div>
  );
}
