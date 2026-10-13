"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/cn";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Menu } from "@/components/ui/menu";
import { MoreIcon, PencilIcon, TrashIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { useJournal } from "./store";

/** "⋯" menu with Edit / Delete for a category. */
export function CategoryMenu({
  category,
  className,
  triggerClassName,
  iconSize = 20,
}: {
  category: Category;
  className?: string;
  triggerClassName?: string;
  iconSize?: number;
}) {
  const { openCategoryDialog, confirmDeleteCategory } = useShell();
  return (
    <Menu
      className={className}
      items={[
        { label: "Edit corner", icon: <PencilIcon size={17} />, onSelect: () => openCategoryDialog(category) },
        {
          label: "Delete corner",
          icon: <TrashIcon size={17} />,
          tone: "danger",
          onSelect: () => confirmDeleteCategory(category),
        },
      ]}
      trigger={(props) => (
        <IconButton label={`Options for ${category.name}`} className={cn(triggerClassName)} {...props}>
          <MoreIcon size={iconSize} />
        </IconButton>
      )}
    />
  );
}

export function DeleteCategoryDialog({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { countByCategory, deleteCategory } = useJournal();
  const count = category ? (countByCategory.get(category.id) ?? 0) : 0;

  return (
    <Dialog
      open={Boolean(category)}
      onClose={onClose}
      title={category ? `Delete “${category.name}”?` : ""}
      description={
        count > 0
          ? `Your ${count} ${count === 1 ? "thought" : "thoughts"} will stay in your journal, just without a corner.`
          : "This corner is empty, so nothing else will change."
      }
    >
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>
          Keep it
        </Button>
        <Button
          variant="danger"
          onClick={() => {
            if (!category) return;
            onClose();
            if (pathname === `/c/${category.id}`) router.push("/");
            deleteCategory(category.id);
          }}
        >
          Delete corner
        </Button>
      </div>
    </Dialog>
  );
}
