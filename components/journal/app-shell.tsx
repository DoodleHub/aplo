"use client";

import { usePathname } from "next/navigation";
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { CloseIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/button";
import { CategoryDialog } from "./category-dialog";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

type ShellApi = {
  openCategoryDialog: (category?: Category) => void;
};

const ShellContext = createContext<ShellApi | null>(null);

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; category?: Category }>({ open: false });

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const api = useMemo<ShellApi>(
    () => ({ openCategoryDialog: (category) => setDialog({ open: true, category }) }),
    [],
  );

  const openCreate = () => {
    setDrawerOpen(false);
    api.openCategoryDialog();
  };

  return (
    <ShellContext value={api}>
      <div className="min-h-dvh lg:pl-60 xl:pl-64">
        {/* desktop sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-sidebar lg:block xl:w-64">
          <Sidebar onCreateCategory={openCreate} />
        </aside>

        {/* mobile drawer */}
        <div
          className={cn(
            "fixed inset-0 z-40 bg-[#2b322c]/25 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
            drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
          )}
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-[18rem] max-w-[85vw] bg-sidebar transition-[transform,box-shadow] duration-300 ease-soft lg:hidden",
            drawerOpen ? "translate-x-0 shadow-pop" : "-translate-x-full",
          )}
          aria-hidden={!drawerOpen}
          inert={!drawerOpen}
        >
          <IconButton
            label="Close menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute top-8 right-4 z-10"
          >
            <CloseIcon size={20} />
          </IconButton>
          <Sidebar onNavigate={() => setDrawerOpen(false)} onCreateCategory={openCreate} />
        </aside>

        <div className="mx-auto w-full max-w-[72rem] px-4 pb-16 sm:px-8 lg:px-12">
          <Topbar onOpenMenu={() => setDrawerOpen(true)} />
          <main className="pt-8 sm:pt-10">{children}</main>
        </div>
      </div>

      <CategoryDialog
        open={dialog.open}
        category={dialog.category}
        onClose={() => setDialog((d) => ({ ...d, open: false }))}
      />
    </ShellContext>
  );
}

export function useShell() {
  const ctx = use(ShellContext);
  if (!ctx) throw new Error("useShell must be used within AppShell");
  return ctx;
}
