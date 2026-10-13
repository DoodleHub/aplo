import type { CSSProperties } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { Category } from "@/lib/types";
import { ArrowUpRightIcon } from "@/components/icons";

export function CategoryCard({
  category,
  count,
  style,
}: {
  category: Category;
  count: number;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={`/c/${category.id}`}
      style={style}
      className={cn(
        "group relative flex min-h-[8.75rem] animate-fade-up flex-col justify-between rounded-2xl border p-5 transition-[transform,box-shadow] duration-300 ease-soft hover:-translate-y-1 hover:shadow-lift",
        palette[category.color].card,
      )}
    >
      <span className="text-[1.6rem] leading-none transition-transform duration-500 ease-spring group-hover:scale-110 group-hover:-rotate-6">
        {category.emoji}
      </span>
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
  );
}
