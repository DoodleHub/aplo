import { formatDate } from "@/lib/format";
import type { Template, TemplateInput } from "@/lib/types";

/** Ready-made shapes for a thought. People can copy any of these and make it their own. */
export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "builtin-check-in",
    name: "Daily check-in",
    emoji: "🌱",
    description: "A gentle look at how today is going.",
    title: "{weekday} check-in",
    content: "How I’m feeling\n- \n\nWhat’s on my mind\n- \n\nOne small win\n- ",
  },
  {
    id: "builtin-gratitude",
    name: "Gratitude",
    emoji: "☀️",
    description: "Three good things, and why they mattered.",
    title: "Grateful for",
    content: "Three things I’m grateful for\n1. \n2. \n3. \n\nWhy they mattered\n- ",
  },
  {
    id: "builtin-morning",
    name: "Morning pages",
    emoji: "🌅",
    description: "Set a soft intention for the day.",
    title: "Morning, {date}",
    content: "Today I’d like to\n- \n\nWhat would make today feel good\n- \n\nA kind word to myself\n- ",
  },
  {
    id: "builtin-evening",
    name: "Evening wind-down",
    emoji: "🌙",
    description: "Close the day and set it down.",
    title: "Winding down",
    content: "What went well\n- \n\nWhat was hard\n- \n\nWhat I’m letting go of\n- \n\nTomorrow I’ll\n- ",
  },
  {
    id: "builtin-unload",
    name: "Untangle a worry",
    emoji: "💭",
    description: "Sort what you can change from what you can’t.",
    title: "",
    content:
      "What’s weighing on me\n- \n\nWhat I can control\n- \n\nWhat I can let go of\n- \n\nWhat I’d tell a friend\n- ",
  },
  {
    id: "builtin-week",
    name: "Weekly review",
    emoji: "🗓️",
    description: "Look back on the week, then ahead.",
    title: "Week of {date}",
    content: "Highlights\n- \n\nWhat I learned\n- \n\nWhat drained me\n- \n\nNext week I want to\n- ",
  },
].map((t) => ({ ...t, created_at: "", updated_at: "" }));

export const isBuiltIn = (template: Pick<Template, "id">) => template.id.startsWith("builtin-");

export const TEMPLATE_EMOJIS = [
  "📝", "🌱", "☀️", "🌙", "🌅", "💭", "🗓️", "📚",
  "🎯", "💌", "🧘", "🌊", "🔥", "🌷", "☕", "✨",
];

/** Words in a template that fill themselves in when it's used. */
export const TEMPLATE_TOKENS = [
  { token: "{date}", label: "Date", format: { month: "long", day: "numeric" } },
  { token: "{weekday}", label: "Weekday", format: { weekday: "long" } },
  { token: "{time}", label: "Time", format: { hour: "numeric", minute: "2-digit" } },
] as const satisfies { token: string; label: string; format: Intl.DateTimeFormatOptions }[];

export function fillTokens(text: string, timeZone: string, at: string | Date = new Date()) {
  return TEMPLATE_TOKENS.reduce(
    (out, { token, format }) => (out.includes(token) ? out.replaceAll(token, formatDate(at, timeZone, format)) : out),
    text,
  );
}

export function fillTemplate(
  template: Pick<TemplateInput, "title" | "content">,
  timeZone: string,
  at: string | Date = new Date(),
) {
  return { title: fillTokens(template.title, timeZone, at), content: fillTokens(template.content, timeZone, at) };
}

// A list marker waiting for words: "- ", "1. ", "[ ] ".
const EMPTY_ITEM = /^[ \t]*(?:[-*•]|\d+[.)]|\[ \])[ \t]*$/;
const ITEM = /^[ \t]*(?:[-*•]|\d+[.)]|\[[ x]\])(?:\s|$)/;

/**
 * Where the writer's cursor should go next: the end of the first blank list item, or the
 * empty line under a heading, that starts after `after`. Returns -1 when there are none.
 */
export function nextBlank(content: string, after = -1) {
  let start = 0;
  let previous = "";
  for (const line of content.split("\n")) {
    const end = start + line.length;
    const underHeading = line.trim() === "" && previous.trim() !== "" && !ITEM.test(previous);
    if (start > after && (EMPTY_ITEM.test(line) || underHeading)) return end;
    previous = line;
    start = end + 1;
  }
  return -1;
}
