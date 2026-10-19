"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { fullDateTime, wordCount } from "@/lib/format";
import { toggleFormat, type Format } from "@/lib/inline-format";
import { bodyLeading, papers, pens } from "@/lib/page-style";
import { MOODS, palette } from "@/lib/palette";
import { fillTemplate, nextBlank } from "@/lib/templates";
import { isShared, type Entry, type Template, type Visibility } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/button";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";
import { ArrowLeftIcon, CheckIcon, HeartIcon, MoreIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { useShell } from "./app-shell";
import { FormatBackdrop } from "./formatted-text";
import { PageStyleMenu } from "./page-style-menu";
import { TemplateMenu, TemplateStrip } from "./template-picker";
import { useJournal } from "./store";
import { VisibilityMenu } from "./visibility-menu";

const PROMPTS = [
  "What’s on your mind?",
  "What made you smile today?",
  "What’s one thing you’d like to let go of?",
  "Describe a small moment you want to remember.",
  "What are you grateful for right now?",
  "How are you, really?",
  "What would you tell a friend feeling this way?",
];

const SAVE_DELAY = 600;

type Draft = Pick<Entry, "title" | "content" | "mood" | "category_id" | "is_favorite" | "visibility">;
type Status = "idle" | "saving" | "saved" | "error";
/** What a template put on the page, so we can tell whether the writer has made it their own. */
type Scaffold = { id: string; title: string | null; content: string | null };

export function Editor({
  id,
  entry,
  defaultCategoryId,
}: {
  id: string;
  /** Undefined while this is a brand-new, unsaved entry. */
  entry?: Entry;
  defaultCategoryId?: string | null;
}) {
  const router = useRouter();
  const { categories, categoryById, profile, createEntry, updateEntry, deleteEntry, timeZone } = useJournal();
  const { openCategoryDialog, openProfileDialog, openTemplates } = useShell();
  const toast = useToast();

  const [draft, setDraft] = useState<Draft>(() => ({
    title: entry?.title ?? "",
    content: entry?.content ?? "",
    mood: entry?.mood ?? null,
    category_id: entry ? entry.category_id : (defaultCategoryId ?? null),
    is_favorite: entry?.is_favorite ?? false,
    visibility: entry?.visibility ?? "inherit",
  }));
  const [status, setStatus] = useState<Status>(entry ? "saved" : "idle");
  const [createdAt] = useState(() => entry?.created_at ?? new Date().toISOString());

  const [exists, setExists] = useState(Boolean(entry));
  const persisted = useRef(Boolean(entry));
  const dirty = useRef(false);
  const latest = useRef(draft);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  const [scaffold, setScaffoldState] = useState<Scaffold | null>(null);
  const scaffoldRef = useRef<Scaffold | null>(null);
  const setScaffold = (next: Scaffold | null) => {
    scaffoldRef.current = next;
    setScaffoldState(next);
  };
  const [preview, setPreview] = useState<Template | null>(null);
  // Where to put the cursor once a template's text is on the page.
  const pendingCaret = useRef<number | null>(null);

  /** Nothing written yet: only what a template put there, if anything. */
  const isBlank = useCallback((d: Draft) => {
    const s = scaffoldRef.current;
    return (!d.title.trim() || d.title === s?.title) && (!d.content.trim() || d.content === s?.content);
  }, []);

  const save = useCallback(async () => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    const current = latest.current;

    if (!persisted.current) {
      // Don't create empty entries just because a mood, corner or template was picked.
      if (isBlank(current)) return;
      dirty.current = false;
      persisted.current = true;
      setStatus("saving");
      const ok = await createEntry({ id, ...current, created_at: createdAt, updated_at: createdAt });
      if (!ok) {
        persisted.current = false;
        dirty.current = true;
        setStatus("error");
        return;
      }
      setExists(true);
      // A save on the way out (e.g. tapping back mid-sentence) lands after the URL has
      // already moved on; don't rewrite the page someone is now on.
      if (window.location.pathname === "/new") window.history.replaceState(null, "", `/entry/${id}`);
    } else {
      dirty.current = false;
      setStatus("saving");
      if (!(await updateEntry(id, current))) {
        dirty.current = true;
        setStatus("error");
        return;
      }
    }
    if (!dirty.current) setStatus("saved");
  }, [id, createdAt, createEntry, updateEntry, isBlank]);

  const change = (patch: Partial<Draft>, immediate = false) => {
    setDraft((d) => ({ ...d, ...patch }));
    latest.current = { ...latest.current, ...patch };
    dirty.current = true;
    if (persisted.current) setStatus("saving");
    clearTimeout(timer.current);
    if (immediate) save();
    else timer.current = setTimeout(save, SAVE_DELAY);
  };

  const corner = draft.category_id ? categoryById.get(draft.category_id) : undefined;
  const shared = isShared(draft, corner);

  /** Changes who can read this thought, and says so when it starts showing in Discover. */
  const share = (patch: Pick<Partial<Draft>, "visibility" | "category_id">) => {
    const next = { ...draft, ...patch };
    const nowShared = isShared(next, next.category_id ? categoryById.get(next.category_id) : undefined);
    change(patch, true);
    if (nowShared === shared) return;
    if (nowShared) {
      toast.show(`Shared in Discover as ${profile.emoji} ${profile.display_name}.`, {
        label: "Change name",
        onClick: openProfileDialog,
      });
    } else {
      toast.show("Only you can see this thought now.");
    }
  };

  // Flush pending changes when leaving the page.
  useEffect(() => () => void save(), [save]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current && (persisted.current || !isBlank(latest.current))) {
        save();
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [save, isBlank]);

  const { paper, pen } = profile;

  // Grow textareas with their content, and again once a pen's font has loaded.
  const fit = useCallback(() => {
    for (const el of [titleRef.current, contentRef.current]) {
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, []);
  useLayoutEffect(fit, [fit, draft.title, draft.content, paper, pen]);
  useLayoutEffect(() => {
    const el = contentRef.current;
    const caret = pendingCaret.current;
    if (!el || caret === null) return;
    pendingCaret.current = null;
    el.focus();
    el.setSelectionRange(caret, caret);
  }, [draft.content]);
  useEffect(() => {
    document.fonts?.addEventListener("loadingdone", fit);
    return () => document.fonts?.removeEventListener("loadingdone", fit);
  }, [fit]);

  useEffect(() => {
    if (!entry) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backHref = draft.category_id && categoryById.has(draft.category_id) ? `/c/${draft.category_id}` : "/";

  const finish = async () => {
    await save();
    router.push(backHref);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === "s") {
        e.preventDefault();
        save();
      } else if (e.key === "Enter") {
        e.preventDefault();
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const words = wordCount(draft.content);
  const prompt = PROMPTS[id.charCodeAt(0) % PROMPTS.length];

  const bodyUntouched = !draft.content.trim() || draft.content === scaffold?.content;
  const titleUntouched = !draft.title.trim() || draft.title === scaffold?.title;
  const activeTemplate = scaffold && draft.content === scaffold.content ? scaffold.id : null;
  const previewed = preview && !draft.content ? fillTemplate(preview, timeZone, createdAt) : null;
  const hasBlanks = nextBlank(draft.content) !== -1;

  /**
   * Puts a template on the page, replacing the title and body. Trying a few on a blank page
   * is free; if it replaces real writing, there's an undo.
   */
  const applyTemplate = (template: Template) => {
    const { title, content } = fillTemplate(template, timeZone, createdAt);
    const previous = { title: draft.title, content: draft.content };
    const previousScaffold = scaffold;

    setScaffold({ id: template.id, title, content });
    setPreview(null);
    const blank = nextBlank(content);
    pendingCaret.current = blank === -1 ? content.length : blank;
    change({ title, content });

    if (!bodyUntouched || !titleUntouched) {
      toast.show(`Replaced with “${template.name}”.`, {
        label: "Undo",
        onClick: () => {
          setScaffold(previousScaffold);
          change(previous);
        },
      });
    }
  };
  // Dialog callbacks outlive this render; they should apply to the page as it is then.
  const applyRef = useRef(applyTemplate);
  useEffect(() => {
    applyRef.current = applyTemplate;
  });

  const clearTemplate = () => {
    setScaffold(null);
    pendingCaret.current = 0;
    change({ title: titleUntouched ? "" : draft.title, content: "" });
  };

  const createTemplate = () =>
    openTemplates({ view: "form" }, (template) => applyRef.current(template));

  const saveAsTemplate = () =>
    openTemplates({ view: "form", seed: { name: draft.title.slice(0, 40), content: draft.content } }, () =>
      toast.show("Saved as a template. It’s waiting on every blank page."),
    );

  /** Wraps or unwraps the selection in the body, through the browser’s editing so ⌘Z undoes it. */
  const format = (f: Format) => {
    const el = contentRef.current;
    if (!el) return;
    const edit = toggleFormat(el.value, el.selectionStart, el.selectionEnd, f);
    el.focus();
    el.setSelectionRange(edit.from, edit.to);
    typeText(el, edit.insert);
    el.setSelectionRange(...edit.select);
  };

  /** ⌘B, ⌘I and ⌘⇧X format; Tab hops between a template's blanks; Enter keeps a list going. */
  const onBodyKeyDown = (e: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey) {
      const key = e.key.toLowerCase();
      const f = e.shiftKey ? (key === "x" ? "strike" : null) : key === "b" ? "bold" : key === "i" ? "italic" : null;
      if (f) {
        e.preventDefault();
        format(f);
      }
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = el;

    if (e.key === "Tab" && !e.shiftKey) {
      const next = nextBlank(value, end);
      if (next === -1) return;
      e.preventDefault();
      el.setSelectionRange(next, next);
      return;
    }

    if (e.key === "Enter" && !e.shiftKey && start === end) {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const lineEnd = value.indexOf("\n", start);
      const item = /^(\s*)([-*•]|\d+[.)]|\[[ x]\])(\s+)(.*)$/.exec(value.slice(lineStart, start));
      if (!item) return;
      e.preventDefault();
      const [, indent, marker, , text] = item;
      if (!text.trim() && !value.slice(start, lineEnd === -1 ? undefined : lineEnd).trim()) {
        // Enter on an empty item ends the list, as in most editors.
        el.setSelectionRange(lineStart, start);
        typeText(el, "");
        return;
      }
      const number = /^\d+/.exec(marker)?.[0];
      const nextMarker = number ? `${Number(number) + 1}${marker.slice(number.length)}` : marker === "[x]" ? "[ ]" : marker;
      typeText(el, `\n${indent}${nextMarker} `);
    }
  };

  return (
    <div className="mx-auto max-w-3xl animate-fade-up">
      <div className="mb-5 flex items-center gap-1 sm:gap-2">
        <Link
          href={backHref}
          className="-ml-2 inline-flex h-10 items-center gap-2 rounded-xl px-2 text-[0.95rem] text-muted transition-colors hover:bg-sage-100 hover:text-ink sm:px-3"
        >
          <ArrowLeftIcon size={18} />
          <span className="max-sm:sr-only">Back</span>
        </Link>
        <SaveStatus status={status} />
        <div className="ml-auto flex items-center sm:gap-1">
          <PageStyleMenu />
          <TemplateMenu
            onApply={applyTemplate}
            onSaveAsTemplate={saveAsTemplate}
            onManage={() => openTemplates()}
            canSave={Boolean(draft.content.trim())}
          />
          <VisibilityMenu
            visibility={draft.visibility}
            category={corner}
            onChange={(visibility: Visibility) => share({ visibility })}
          />
          <IconButton
            label={draft.is_favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={draft.is_favorite}
            onClick={() => change({ is_favorite: !draft.is_favorite }, true)}
            className={cn("h-10 w-9 sm:w-10", draft.is_favorite && "text-heart hover:text-heart")}
          >
            <HeartIcon
              key={String(draft.is_favorite)}
              size={21}
              filled={draft.is_favorite}
              className={draft.is_favorite ? "animate-heart" : ""}
            />
          </IconButton>
          {exists ? (
            <Menu
              items={[
                {
                  label: "Delete thought",
                  icon: <TrashIcon size={17} />,
                  tone: "danger",
                  onSelect: () => {
                    clearTimeout(timer.current);
                    dirty.current = false;
                    deleteEntry(id);
                    router.push(backHref);
                  },
                },
              ]}
              trigger={(props) => (
                <IconButton label="More options" className="h-10 w-9 sm:w-10" {...props}>
                  <MoreIcon size={20} />
                </IconButton>
              )}
            />
          ) : null}
          <Button size="sm" className="ml-1 h-10 rounded-xl sm:ml-2 sm:px-4" onClick={finish}>
            Done
          </Button>
        </div>
      </div>

      <article
        className={cn(
          "rounded-3xl border px-5 py-6 shadow-soft transition-[background-color,border-color] duration-500 ease-soft sm:px-10 sm:py-9",
          papers[paper].page,
        )}
      >
        <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {categories.map((category) => {
            const selected = draft.category_id === category.id;
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => share({ category_id: selected ? null : category.id })}
                className={cn(
                  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[0.82rem] font-medium transition-all duration-200 ease-soft",
                  selected
                    ? cn(palette[category.color].chip, "text-ink ring-1 ring-inset", palette[category.color].ring)
                    : "text-muted hover:bg-sage-50 hover:text-ink",
                )}
              >
                <span className={cn("transition-[filter]", !selected && "grayscale-[60%]")}>{category.emoji}</span>
                {category.name}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => openCategoryDialog()}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2.5 text-[0.82rem] text-subtle transition-colors hover:bg-sage-50 hover:text-ink"
          >
            <PlusIcon size={14} />
            New
          </button>
        </div>

        <textarea
          ref={titleRef}
          rows={1}
          value={draft.title}
          onChange={(e) => change({ title: e.target.value.replace(/\n/g, "") })}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.metaKey && !e.ctrlKey) {
              e.preventDefault();
              contentRef.current?.focus();
            }
          }}
          maxLength={200}
          placeholder={previewed?.title || "Give it a little title"}
          aria-label="Title"
          className={cn(
            "mt-6 block w-full resize-none overflow-hidden bg-transparent text-ink outline-none placeholder:text-faint",
            pens[pen].title,
          )}
        />
        <p className="mt-2 text-sm text-subtle" suppressHydrationWarning>
          {fullDateTime(createdAt, timeZone)}
        </p>

        <TemplateStrip
          show={bodyUntouched}
          activeId={activeTemplate}
          onApply={applyTemplate}
          onClear={clearTemplate}
          onPreview={setPreview}
          onCreate={createTemplate}
          onManage={() => openTemplates()}
        />

        <div className={cn("relative mt-6", papers[paper].lines)}>
          <FormatBackdrop text={draft.content} className={cn("text-ink", pens[pen].body, bodyLeading(paper, pen))} />
          <textarea
            ref={contentRef}
            value={draft.content}
            onChange={(e) => change({ content: e.target.value })}
            onKeyDown={onBodyKeyDown}
            placeholder={previewed?.content || prompt}
            aria-label="Your thoughts"
            className={cn(
              // The text itself is drawn by the backdrop; this keeps the caret, selection and typing.
              "relative block min-h-[38vh] w-full resize-none overflow-hidden bg-transparent text-transparent caret-ink outline-none selection:bg-sage-200/60 selection:text-transparent placeholder:text-faint",
              pens[pen].body,
              bodyLeading(paper, pen),
            )}
          />
        </div>

        <div className="mt-6 flex flex-col gap-4 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-medium text-subtle">How are you feeling?</p>
            <div className="-ml-1 flex flex-wrap gap-0.5">
              {MOODS.map((mood) => {
                const selected = draft.mood === mood.emoji;
                return (
                  <button
                    key={mood.emoji}
                    type="button"
                    aria-label={mood.label}
                    aria-pressed={selected}
                    onClick={() => change({ mood: selected ? null : mood.emoji }, true)}
                    className="group relative"
                  >
                    <span
                      className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-xl text-xl transition-all duration-200 ease-spring",
                        selected
                          ? "scale-110 bg-sage-100 ring-1 ring-sage-300"
                          : "opacity-60 grayscale-40 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0",
                      )}
                    >
                      {mood.emoji}
                    </span>
                    {/* `hidden` rather than opacity so the label never adds sideways overflow on narrow screens;
                        group-hover only fires on devices that really hover, so taps don't leave it stuck open. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 animate-fade-in whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-xs font-medium text-canvas shadow-sm group-hover:block group-focus-visible:block"
                    >
                      {mood.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <FormatButtons onFormat={format} />
            <p className="shrink-0 text-sm tabular-nums text-subtle">
              {words} {words === 1 ? "word" : "words"}
            </p>
          </div>
        </div>
      </article>

      <p className="mt-4 hidden text-center text-xs text-faint sm:block">
        {hasBlanks && (
          <>
            <kbd className="font-sans">Tab</kbd> jumps to the next prompt ·{" "}
          </>
        )}
        Saves as you write · <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> when
        you’re done
      </p>
    </div>
  );
}

const FORMAT_BUTTONS: { format: Format; label: string; keys: string; glyph: string; className: string }[] = [
  { format: "bold", label: "Bold (⌘B)", keys: "Meta+B", glyph: "B", className: "font-bold" },
  { format: "italic", label: "Italic (⌘I)", keys: "Meta+I", glyph: "I", className: "font-serif italic" },
  { format: "strike", label: "Strikethrough (⌘⇧X)", keys: "Meta+Shift+X", glyph: "S", className: "line-through" },
];

function FormatButtons({ onFormat }: { onFormat: (format: Format) => void }) {
  return (
    <div role="group" aria-label="Formatting" className="-ml-1 flex items-center sm:ml-0">
      {FORMAT_BUTTONS.map((b) => (
        <IconButton
          key={b.format}
          label={b.label}
          aria-keyshortcuts={b.keys}
          // Keep the text selected while the button is pressed.
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onFormat(b.format)}
          className="rounded-xl"
        >
          <span aria-hidden="true" className={cn("text-[0.95rem] leading-none", b.className)}>
            {b.glyph}
          </span>
        </IconButton>
      ))}
    </div>
  );
}

/** Types into a field through the browser's own editing, so ⌘Z still undoes it. */
function typeText(el: HTMLTextAreaElement, text: string) {
  el.focus();
  const done = text ? document.execCommand("insertText", false, text) : document.execCommand("delete");
  if (done) return;
  el.setRangeText(text, el.selectionStart, el.selectionEnd, "end");
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

function SaveStatus({ status }: { status: Status }) {
  if (status === "idle") return null;
  return (
    <span
      key={status}
      className={cn(
        "inline-flex animate-fade-in items-center gap-1.5 text-xs",
        status === "error" ? "text-danger" : "text-subtle",
      )}
      aria-live="polite"
    >
      {status === "saving" && (
        <>
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage-400" />
          <span className="max-sm:sr-only">Saving…</span>
        </>
      )}
      {status === "saved" && (
        <>
          <CheckIcon size={14} className="text-sage-500" />
          <span className="max-sm:sr-only">Saved</span>
        </>
      )}
      {status === "error" && (
        <>
          <span className="h-1.5 w-1.5 rounded-full bg-danger" />
          <span className="max-sm:sr-only">Not saved — we’ll retry as you type</span>
        </>
      )}
    </span>
  );
}
