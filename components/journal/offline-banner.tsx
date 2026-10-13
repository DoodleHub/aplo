"use client";

import { CloudOffIcon } from "@/components/icons";
import { useIsOffline } from "@/components/pwa";
import { useJournal } from "./store";

export function OfflineBanner() {
  const isOffline = useIsOffline();
  const { pendingWrites } = useJournal();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="mt-4 flex animate-pop-in items-center gap-3 rounded-2xl border border-wash-line bg-wash px-4 py-3 text-sm text-ink-soft"
    >
      <CloudOffIcon size={18} className="shrink-0 text-sage-600" />
      <p>
        <span className="font-semibold text-ink">You’re offline.</span>{" "}
        {pendingWrites > 0
          ? `Keep writing — ${pendingWrites} ${pendingWrites === 1 ? "change" : "changes"} will sync when you’re back.`
          : "Keep writing — your changes will sync when you’re back."}
      </p>
    </div>
  );
}
