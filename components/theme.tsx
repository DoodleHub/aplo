"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { THEME_STORAGE_KEY, type ThemePreference } from "@/lib/theme";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/icons";

const CHANGE_EVENT = "aplo:themechange";
const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

function readPreference(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

function applyTheme(preference: ThemePreference) {
  const resolved = preference === "system" ? (darkQuery().matches ? "dark" : "light") : preference;
  document.documentElement.setAttribute("data-theme", resolved);
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, readPreference, () => "system" as const);

  function setPreference(next: ThemePreference) {
    try {
      if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
      else localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }

  return [preference, setPreference] as const;
}

/**
 * Keeps <html data-theme> correct after hydration: re-applies it after React's dev remount
 * clears it, follows OS changes while on "system", and syncs other tabs.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    const sync = () => applyTheme(readPreference());
    sync();
    const query = darkQuery();
    query.addEventListener("change", sync);
    const unsubscribe = subscribe(sync);
    return () => {
      query.removeEventListener("change", sync);
      unsubscribe();
    };
  }, []);
  return null;
}

const OPTIONS = [
  { value: "light", label: "Light", icon: SunIcon },
  { value: "dark", label: "Dark", icon: MoonIcon },
  { value: "system", label: "System", icon: MonitorIcon },
] as const;

export function ThemeSwitch({ className }: { className?: string }) {
  const [preference, setPreference] = useTheme();

  return (
    <div role="radiogroup" aria-label="Appearance" className={cn("flex gap-1 rounded-xl bg-sage-50 p-1", className)}>
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            title={label}
            onClick={() => setPreference(value)}
            className={cn(
              "flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs transition-colors duration-200",
              active ? "bg-surface font-medium text-ink shadow-soft" : "text-muted hover:text-ink",
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
