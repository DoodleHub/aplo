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
