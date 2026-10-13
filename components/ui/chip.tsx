import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { palette } from "@/lib/palette";
import type { CategoryColor } from "@/lib/types";

export function Chip({
  color = "stone",
  emoji,
  children,
  className,
}: {
  color?: CategoryColor;
  emoji?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 max-w-full items-center gap-1.5 rounded-md px-2 text-[0.8rem] font-medium text-ink",
        palette[color].chip,
        className,
      )}
    >
      {emoji && <span className="text-[0.8rem] leading-none">{emoji}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}

export function Dot({ color, className }: { color: CategoryColor; className?: string }) {
  return <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", palette[color].dot, className)} />;
}
