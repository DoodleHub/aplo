export function wordCount(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function pluralize(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export function formatDate(iso: string | Date, timeZone: string, opts: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { timeZone, ...opts }).format(new Date(iso));
}

export const shortDate = (iso: string, timeZone: string) =>
  formatDate(iso, timeZone, { month: "short", day: "numeric" });

export const longDate = (iso: string | Date, timeZone: string) =>
  formatDate(iso, timeZone, { weekday: "long", month: "long", day: "numeric" });

export const fullDateTime = (iso: string, timeZone: string) =>
  formatDate(iso, timeZone, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "just now", "5m ago", "3h ago", "2d ago", then a short date. */
export function relativeTime(iso: string, timeZone: string, now = Date.now()) {
  const ago = now - new Date(iso).getTime();
  if (ago < MINUTE) return "just now";
  if (ago < HOUR) return `${Math.floor(ago / MINUTE)}m ago`;
  if (ago < DAY) return `${Math.floor(ago / HOUR)}h ago`;
  if (ago < 7 * DAY) return `${Math.floor(ago / DAY)}d ago`;
  return shortDate(iso, timeZone);
}
