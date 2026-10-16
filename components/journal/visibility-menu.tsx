"use client";

import { cn } from "@/lib/cn";
import { isShared, type Category, type Visibility } from "@/lib/types";
import { Menu } from "@/components/ui/menu";
import { ChevronDownIcon, FolderIcon, GlobeIcon, LockIcon } from "@/components/icons";
import { useJournal } from "./store";

/** Who can read an entry: its corner's choice, everyone, or only its author. */
export function VisibilityMenu({
  visibility,
  category,
  onChange,
}: {
  visibility: Visibility;
  category?: Category;
  onChange: (visibility: Visibility) => void;
}) {
  const { profile } = useJournal();
  const shared = isShared({ visibility }, category);

  return (
    <Menu
      items={[
        {
          label: "Same as corner",
          description: category
            ? `${category.is_public ? "Shared" : "Private"}, like ${category.emoji} ${category.name}`
            : "Private until it’s in a shared corner",
          icon: <FolderIcon size={17} />,
          selected: visibility === "inherit",
          onSelect: () => onChange("inherit"),
        },
        {
          label: "Shared in Discover",
          description: `Anyone on aplo can read it, as ${profile.emoji} ${profile.display_name}`,
          icon: <GlobeIcon size={17} />,
          selected: visibility === "public",
          onSelect: () => onChange("public"),
        },
        {
          label: "Only me",
          description: "Stays in your journal, even in a shared corner",
          icon: <LockIcon size={17} />,
          selected: visibility === "private",
          onSelect: () => onChange("private"),
        },
      ]}
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Visibility: ${shared ? "shared in Discover" : "private"}`}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-sm font-medium transition-colors duration-200 sm:px-3",
            shared ? "bg-sage-100 text-sage-600 hover:bg-sage-200" : "text-muted hover:bg-sage-100 hover:text-ink",
          )}
        >
          <span key={String(shared)} className="animate-pop-in">
            {shared ? <GlobeIcon size={17} /> : <LockIcon size={17} />}
          </span>
          <span className="hidden sm:inline">{shared ? "Shared" : "Private"}</span>
          <ChevronDownIcon size={14} className="opacity-60 max-sm:hidden" />
        </button>
      )}
    />
  );
}
