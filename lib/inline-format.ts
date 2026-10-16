// Bold, italic and strikethrough live in the text itself as Markdown-style marks, so a thought
// stays one plain string: it syncs, searches and counts words exactly as before.

export type Format = "bold" | "italic" | "strike";

/** The marks each shortcut types. Italic also reads `*word*`. */
export const MARKS: Record<Format, string> = { bold: "**", italic: "_", strike: "~~" };

/** A stretch of text and the styles on it. `mark` runs are the `**`, `_` and `~~` themselves. */
export type Run = { text: string; bold: boolean; italic: boolean; strike: boolean; mark: boolean };
type Style = Pick<Run, Format>;

const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const isWord = (c: string | undefined) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

function opener(s: string, i: number): { format: Format; mark: string } | null {
  if (s.startsWith("**", i)) return { format: "bold", mark: "**" };
  if (s.startsWith("~~", i)) return { format: "strike", mark: "~~" };
  if (s[i] === "*") return { format: "italic", mark: "*" };
  // Not inside words, so snake_case_names stay as they are.
  if (s[i] === "_" && !isWord(s[i - 1])) return { format: "italic", mark: "_" };
  return null;
}

/** Where the mark opened just before `from` closes, or -1. Marks never reach across lines. */
function closer(s: string, from: number, mark: string) {
  // "* item" and "2 * 3" aren't emphasis.
  if (isSpace(s[from])) return -1;
  for (let j = from + 1; j < s.length; j++) {
    if (s[j] === "\n") return -1;
    if (mark === "*" && s.startsWith("**", j)) {
      j++;
      continue;
    }
    if (!s.startsWith(mark, j) || isSpace(s[j - 1])) continue;
    if (mark === "_" && isWord(s[j + 1])) continue;
    // ***both*** closes bold on the outer pair, leaving *both* inside.
    if (mark === "**") while (s[j + 2] === "*") j++;
    return j;
  }
  return -1;
}

/** Splits text into styled runs. Unmatched marks stay as plain text. */
export function parseInline(text: string): Run[] {
  const runs: Run[] = [];
  const push = (t: string, style: Style, mark: boolean) => {
    if (!t) return;
    const last = runs.at(-1);
    if (last && last.mark === mark && last.bold === style.bold && last.italic === style.italic && last.strike === style.strike) {
      last.text += t;
    } else {
      runs.push({ text: t, ...style, mark });
    }
  };
  const walk = (s: string, style: Style) => {
    let plain = "";
    let i = 0;
    while (i < s.length) {
      const open = opener(s, i);
      if (open && !style[open.format]) {
        const from = i + open.mark.length;
        const end = closer(s, from, open.mark);
        if (end !== -1) {
          push(plain, style, false);
          plain = "";
          push(open.mark, style, true);
          walk(s.slice(from, end), { ...style, [open.format]: true });
          push(open.mark, style, true);
          i = end + open.mark.length;
          continue;
        }
      }
      plain += s[i];
      i++;
    }
    push(plain, style, false);
  };
  walk(text, { bold: false, italic: false, strike: false });
  return runs;
}

/** The text without its formatting marks, for search and snippets. */
export function plainText(text: string) {
  return parseInline(text)
    .filter((run) => !run.mark)
    .map((run) => run.text)
    .join("");
}

/** A change to make to the text, then the selection to leave behind. */
export type FormatEdit = { from: number; to: number; insert: string; select: [number, number] };

const LIST_ITEM = /^(\s*(?:(?:[-*•]|\d+[.)]|\[[ x]\])\s+)?)(.*?)(\s*)$/;

/**
 * Turns a format on or off for the selection. It unwraps when the selection is already wrapped,
 * and otherwise wraps each selected line, leaving spaces and list markers outside the marks. With
 * no selection it acts on the word around the cursor, or leaves a pair of marks to type between.
 */
export function toggleFormat(value: string, start: number, end: number, format: Format): FormatEdit {
  const mark = MARKS[format];

  if (start === end && isWord(value[start - 1]) && isWord(value[start])) {
    while (isWord(value[start - 1])) start--;
    while (isWord(value[end])) end++;
  }
  while (start < end && /\s/.test(value[start])) start++;
  while (end > start && /\s/.test(value[end - 1])) end--;
  const selected = value.slice(start, end);

  for (const m of format === "italic" ? ["_", "*"] : [mark]) {
    const n = m.length;
    // A lone * next to another * is part of bold, not italic.
    const lone = m !== "*" || (value[start - 2] !== "*" && value[end + 1] !== "*");
    if (start >= n && value.slice(start - n, start) === m && value.slice(end, end + n) === m && lone) {
      return { from: start - n, to: end + n, insert: selected, select: [start - n, end - n] };
    }
    const inner = selected.slice(n, -n);
    const loneInside = m !== "*" || (selected[1] !== "*" && selected.at(-2) !== "*");
    if (selected.length > 2 * n && selected.startsWith(m) && selected.endsWith(m) && !inner.includes("\n") && loneInside) {
      return { from: start, to: end, insert: inner, select: [start, start + inner.length] };
    }
  }

  if (start === end) return { from: start, to: end, insert: mark + mark, select: [start + mark.length, start + mark.length] };

  const lines = selected.split("\n");
  const insert = lines
    .map((line) => {
      const [, lead, body, trail] = LIST_ITEM.exec(line)!;
      return body ? lead + mark + body + mark + trail : line;
    })
    .join("\n");
  if (lines.length > 1) return { from: start, to: end, insert, select: [start, start + insert.length] };
  // One line: keep the words selected, now inside their marks.
  const [, lead, body] = LIST_ITEM.exec(selected)!;
  const at = start + lead.length + mark.length;
  return { from: start, to: end, insert, select: [at, at + body.length] };
}
