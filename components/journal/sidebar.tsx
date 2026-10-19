"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { signOut } from "@/app/(auth)/actions";
import { clearDeviceCopy } from "@/lib/local-db";
import { dailyQuote } from "@/lib/quotes";
import { Logo } from "@/components/brand";
import { Dot } from "@/components/ui/chip";
import { Menu } from "@/components/ui/menu";
import { ThemeSwitch } from "@/components/theme";
import {
  CompassIcon,
  FlowerIcon,
  GlobeIcon,
  HeartIcon,
  JournalIcon,
  LogoutIcon,
  PencilIcon,
  PlusIcon,
  QuoteIcon,
} from "@/components/icons";
import { useShell } from "./app-shell";
import { CategoryMenu } from "./category-actions";
import { UNSORTED } from "./category-card";
import { Avatar } from "./profile-dialog";
import { useJournal } from "./store";
import { useReorder } from "./use-reorder";

export function Sidebar({
  onNavigate,
  onCreateCategory,
}: {
  onNavigate?: () => void;
  onCreateCategory: () => void;
}) {
  const pathname = usePathname();
  const {
    categories,
    categoryById,
    countByCategory,
    unsortedCount,
    entries,
    quotes,
    user,
    profile,
    pendingWrites,
    timeZone,
    reorderCategories,
  } = useJournal();
  const { openProfileDialog } = useShell();
  const favorites = entries.filter((e) => e.is_favorite).length;
  const listRef = useRef<HTMLDivElement>(null);
  const [moveStatus, setMoveStatus] = useState("");
  const { draggingId, itemProps } = useReorder({
    ids: categories.map((c) => c.id),
    scrollRef: listRef,
    onReorder: (ids, moved) => {
      reorderCategories(ids);
      setMoveStatus(`${categoryById.get(moved.id)?.name} moved to ${moved.to + 1} of ${ids.length}.`);
    },
  });

  return (
    <div className="flex h-full flex-col px-5 pt-8 pb-5">
      <Logo className="ml-1" />

      <nav className="mt-10 space-y-1" aria-label="Journal">
        <NavItem href="/" active={pathname === "/"} icon={<JournalIcon size={18} />} onNavigate={onNavigate}>
          My journal
        </NavItem>
        <NavItem
          href="/favorites"
          active={pathname === "/favorites"}
          icon={<HeartIcon size={18} />}
          onNavigate={onNavigate}
          trailing={favorites > 0 ? favorites : undefined}
        >
          Favorites
        </NavItem>
        <NavItem
          href="/discover"
          active={pathname === "/discover"}
          icon={<CompassIcon size={18} />}
          onNavigate={onNavigate}
        >
          Discover
        </NavItem>
        <NavItem
          href="/quotes"
          active={pathname === "/quotes"}
          icon={<QuoteIcon size={18} />}
          onNavigate={onNavigate}
          trailing={quotes.length > 0 ? quotes.length : undefined}
        >
          Quotes
        </NavItem>
      </nav>

      <div className="mt-9 flex items-center justify-between pr-1 pl-3">
        <h2 className="text-eyebrow font-semibold uppercase text-muted">My categories</h2>
        <button
          type="button"
          onClick={onCreateCategory}
          aria-label="New category"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition-colors hover:bg-sage-100 hover:text-ink"
        >
          <PlusIcon size={15} />
        </button>
      </div>

      <div ref={listRef} className="-mx-1 mt-2 min-h-0 flex-1 overflow-y-auto px-1 scrollbar-none">
        <p className="sr-only" aria-live="polite">
          {moveStatus}
        </p>
        <ul className="space-y-0.5">
          {categories.map((category, index) => {
            const href = `/c/${category.id}`;
            const active = pathname === href;
            const dragging = draggingId === category.id;
            return (
              <li
                key={category.id}
                {...itemProps(category.id, index)}
                className={cn(
                  "group/row relative animate-fade-in select-none",
                  dragging ? "z-10 cursor-grabbing" : draggingId && "transition-transform duration-200 ease-soft",
                )}
              >
                <Link
                  href={href}
                  onClick={onNavigate}
                  draggable={false}
                  aria-current={active ? "page" : undefined}
                  aria-keyshortcuts="Alt+ArrowUp Alt+ArrowDown"
                  className={cn(
                    "group flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-[background-color,box-shadow] duration-200 [-webkit-touch-callout:none] pointer-coarse:pr-11",
                    dragging
                      ? "bg-surface text-ink shadow-lift"
                      : active
                        ? "bg-sage-100 text-ink"
                        : "text-ink hover:bg-sage-100/70 group-has-[[aria-expanded=true]]/row:bg-sage-100/70",
                  )}
                >
                  <Dot
                    color={category.color}
                    className="transition-transform duration-300 ease-spring group-hover:scale-125"
                  />
                  <span className="min-w-0 truncate">{category.name}</span>
                  {category.is_public && (
                    <GlobeIcon size={13} className="-ml-1 shrink-0 text-subtle" aria-label="Shared" aria-hidden={false} role="img" />
                  )}
                  <span className="flex-1" />
                  <span className="text-xs tabular-nums text-subtle transition-opacity duration-150 pointer-fine:group-hover/row:opacity-0 pointer-fine:group-focus-within/row:opacity-0 pointer-fine:group-has-[[aria-expanded=true]]/row:opacity-0">
                    {countByCategory.get(category.id) ?? 0}
                  </span>
                </Link>
                <CategoryMenu
                  category={category}
                  iconSize={17}
                  className="absolute top-1/2 right-1 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/row:opacity-100 group-focus-within/row:opacity-100 has-[[aria-expanded=true]]:opacity-100 pointer-coarse:opacity-100"
                  triggerClassName="h-8 w-8 hover:bg-sage-200/70"
                />
              </li>
            );
          })}
          {unsortedCount > 0 && (
            <li className="animate-fade-in">
              <Link
                href={UNSORTED.href}
                onClick={onNavigate}
                aria-current={pathname === UNSORTED.href ? "page" : undefined}
                className={cn(
                  "group flex h-11 items-center gap-3 rounded-xl px-3 text-[0.95rem] transition-colors duration-200",
                  pathname === UNSORTED.href ? "bg-sage-100 text-ink" : "text-muted hover:bg-sage-100/70 hover:text-ink",
                )}
              >
                <Dot
                  color={UNSORTED.color}
                  className="transition-transform duration-300 ease-spring group-hover:scale-125"
                />
                <span className="min-w-0 flex-1 truncate">{UNSORTED.name}</span>
                <span className="text-xs tabular-nums text-subtle">{unsortedCount}</span>
              </Link>
            </li>
          )}
        </ul>
        <button
          type="button"
          onClick={onCreateCategory}
          className="mt-1 flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.95rem] text-muted transition-colors hover:bg-sage-100/70 hover:text-ink"
        >
          <PlusIcon size={16} />
          New category
        </button>
      </div>

      <div className="mt-6 rounded-2xl bg-wash-strong px-5 py-5 text-center">
        <FlowerIcon size={16} className="mx-auto text-ink" />
        <p className="mx-auto mt-2 max-w-[11rem] text-sm leading-relaxed text-ink">
          {dailyQuote(timeZone)}
        </p>
      </div>

      <Menu
        side="top"
        align="start"
        className="mt-4"
        header={
          <>
            <p className="text-xs text-subtle">Signed in as</p>
            <p className="truncate text-sm font-medium text-ink">{user.email}</p>
            <ThemeSwitch className="mt-3" />
          </>
        }
        items={[
          {
            label: "Edit pen name",
            icon: <PencilIcon size={17} />,
            onSelect: openProfileDialog,
          },
          {
            label: "Sign out",
            icon: <LogoutIcon size={17} />,
            onSelect: async () => {
              if (
                pendingWrites > 0 &&
                !window.confirm(
                  "Some changes haven’t synced yet. They’ll stay on this device and sync next time you sign in here. Sign out anyway?",
                )
              ) {
                return;
              }
              await clearDeviceCopy(user.id);
              await signOut();
            },
          },
        ]}
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className="flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors hover:bg-sage-100/70"
          >
            <Avatar emoji={profile.emoji} size="lg" />
            <span className="min-w-0">
              <span className="block truncate text-[0.95rem] text-ink">{profile.display_name}</span>
              <span className="block truncate text-xs text-muted">Make yourself at home</span>
            </span>
          </button>
        )}
      />
    </div>
  );
}

function NavItem({
  href,
  active,
  icon,
  children,
  trailing,
  onNavigate,
}: {
  href: string;
  active: boolean;
  icon: ReactNode;
  children: ReactNode;
  trailing?: ReactNode;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-12 items-center gap-3 rounded-xl px-4 text-[0.98rem] transition-colors duration-200",
        active ? "bg-sage-200 font-semibold text-sage-600" : "text-ink hover:bg-sage-100/70",
      )}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {trailing !== undefined && <span className="text-xs font-normal tabular-nums text-subtle">{trailing}</span>}
    </Link>
  );
}
