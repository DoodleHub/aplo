import type { ReactNode } from "react";

export function SectionHeader({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex min-h-10 flex-wrap items-center justify-between gap-3">
      <h2 className="font-display text-[1.3rem] font-semibold tracking-[-0.03em] text-ink">
        {title}
        {count !== undefined && (
          <span className="ml-1.5 text-sm font-normal tracking-normal text-subtle">{count}</span>
        )}
      </h2>
      {action}
    </div>
  );
}
