"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/brand";
import { MenuIcon } from "@/components/icons";
import { IconButton } from "@/components/ui/button";
import { Search } from "./search";
import { useJournal } from "./store";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const crumb = useCrumb();

  return (
    <header className="flex items-center gap-3 pt-5 sm:gap-4 lg:pt-6">
      <IconButton label="Open menu" onClick={onOpenMenu} className="-ml-2 h-10 w-10 text-ink lg:hidden">
        <MenuIcon size={22} />
      </IconButton>
      <Link href="/" aria-label="aplo home" className="lg:hidden">
        <LogoMark className="h-8 w-8" />
      </Link>
      <nav aria-label="Breadcrumb" className="hidden min-w-0 flex-1 text-[0.95rem] text-muted sm:block">
        <ol className="flex min-w-0 items-center gap-1.5">
          <li className="shrink-0">
            <Link href="/" className="transition-colors hover:text-ink">
              Your space
            </Link>
          </li>
          {crumb.map((item, i) => (
            <li key={i} className="flex min-w-0 items-center gap-1.5">
              <span aria-hidden="true">/</span>
              {item.href ? (
                <Link href={item.href} className="truncate transition-colors hover:text-ink">
                  {item.label}
                </Link>
              ) : (
                <span className="truncate" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <Search className="ml-auto w-full max-w-[20.5rem]" />
    </header>
  );
}

function useCrumb(): Array<{ label: string; href?: string }> {
  const pathname = usePathname();
  const { categoryById, entries } = useJournal();

  if (pathname === "/favorites") return [{ label: "Favorites" }];
  if (pathname === "/discover") return [{ label: "Discover" }];
  if (pathname === "/new") return [{ label: "New entry" }];
  if (pathname.startsWith("/c/")) {
    return [{ label: categoryById.get(pathname.slice(3))?.name ?? "Category" }];
  }
  if (pathname.startsWith("/entry/")) {
    const entry = entries.find((e) => e.id === pathname.slice(7));
    const category = entry?.category_id ? categoryById.get(entry.category_id) : undefined;
    return [
      category ? { label: category.name, href: `/c/${category.id}` } : { label: "My journal", href: "/" },
      { label: entry?.title.trim() || "Untitled thought" },
    ];
  }
  return [{ label: "My journal" }];
}
