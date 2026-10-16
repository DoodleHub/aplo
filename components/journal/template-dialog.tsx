"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { bodyLeading, papers, pens } from "@/lib/page-style";
import { BUILT_IN_TEMPLATES, TEMPLATE_EMOJIS, TEMPLATE_TOKENS, fillTemplate, nextBlank } from "@/lib/templates";
import type { Template, TemplateInput } from "@/lib/types";
import { Button, IconButton } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Textarea } from "@/components/ui/field";
import { Popover } from "@/components/ui/popover";
import { CopyIcon, PencilIcon, PlusIcon, TemplateIcon, TrashIcon } from "@/components/icons";
import { useJournal } from "./store";

/** Where the dialog opens: the list of templates, or straight into writing one. */
export type TemplateDialogStart =
  | { view: "list" }
  | { view: "form"; template?: Template; seed?: Partial<TemplateInput> };

type View = TemplateDialogStart & { fromList?: boolean };

export function TemplateDialog({
  open,
  start,
  onClose,
  onSaved,
}: {
  open: boolean;
  start: TemplateDialogStart;
  onClose: () => void;
  /** Called with a template that was just created or changed. */
  onSaved?: (template: Template) => void;
}) {
  const [view, setView] = useState<View>(start);
  // Start fresh each time the dialog opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setView(start);
  }

  const backOrClose = () => (view.view === "form" && view.fromList ? setView({ view: "list" }) : onClose());

  const heading =
    view.view === "list"
      ? { title: "Templates", description: "Shapes to start a thought from. Pick one on any blank page." }
      : view.template
        ? { title: "Edit template", description: "Changes apply the next time you use it." }
        : { title: "New template", description: "Write the prompts you’d like to find on a blank page." };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size={view.view === "form" ? "lg" : "md"}
      className="transition-[max-width] duration-300 ease-soft"
      {...heading}
    >
      {open && view.view === "list" && (
        <TemplateList
          onNew={() => setView({ view: "form", fromList: true })}
          onEdit={(template) => setView({ view: "form", template, fromList: true })}
          onCustomize={(template) => setView({ view: "form", fromList: true, seed: template })}
        />
      )}
      {open && view.view === "form" && (
        <TemplateForm
          // Remount when switching between templates so the fields start from each one.
          key={view.template?.id ?? "new"}
          template={view.template}
          seed={view.seed}
          onCancel={backOrClose}
          onSaved={(template) => {
            onSaved?.(template);
            backOrClose();
          }}
        />
      )}
    </Dialog>
  );
}

function TemplateList({
  onNew,
  onEdit,
  onCustomize,
}: {
  onNew: () => void;
  onEdit: (template: Template) => void;
  onCustomize: (template: Template) => void;
}) {
  const { templates, deleteTemplate } = useJournal();

  return (
    <div className="animate-fade-in space-y-6">
      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-eyebrow font-semibold uppercase text-muted">Yours</p>
          <Button size="sm" variant="soft" icon={<PlusIcon size={16} />} onClick={onNew}>
            New template
          </Button>
        </div>
        {templates.length ? (
          <ul className="-mx-2">
            {templates.map((template) => (
              <TemplateRow key={template.id} template={template} onOpen={() => onEdit(template)}>
                <IconButton label={`Edit ${template.name}`} onClick={() => onEdit(template)}>
                  <PencilIcon size={17} />
                </IconButton>
                <IconButton
                  label={`Delete ${template.name}`}
                  onClick={() => deleteTemplate(template.id)}
                  className="hover:bg-danger-soft hover:text-danger"
                >
                  <TrashIcon size={17} />
                </IconButton>
              </TemplateRow>
            ))}
          </ul>
        ) : (
          <button
            type="button"
            onClick={onNew}
            className="group flex w-full items-center gap-3 rounded-2xl border border-dashed border-line-strong p-4 text-left transition-colors hover:border-sage-400 hover:bg-sage-50"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sage-100 text-sage-600 transition-transform duration-200 ease-spring group-hover:scale-110">
              <TemplateIcon size={20} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-ink">Make your first template</span>
              <span className="block text-xs text-subtle">The questions you always come back to, ready on a blank page.</span>
            </span>
          </button>
        )}
      </section>

      <section>
        <p className="mb-2 text-eyebrow font-semibold uppercase text-muted">Ready-made</p>
        <ul className="-mx-2">
          {BUILT_IN_TEMPLATES.map((template) => (
            <TemplateRow key={template.id} template={template} onOpen={() => onCustomize(template)}>
              <Button
                size="sm"
                variant="ghost"
                icon={<CopyIcon size={15} />}
                onClick={() => onCustomize(template)}
                className="opacity-80 group-hover:opacity-100"
              >
                Customize
              </Button>
            </TemplateRow>
          ))}
        </ul>
      </section>
    </div>
  );
}

function TemplateRow({
  template,
  onOpen,
  children,
}: {
  template: Template;
  onOpen: () => void;
  children: ReactNode;
}) {
  const summary = template.description || template.content.split("\n").find((line) => line.trim()) || "";
  return (
    <li className="group flex items-center gap-3 rounded-2xl px-2 py-1.5 transition-colors hover:bg-sage-50">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl text-left">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-xl shadow-soft transition-transform duration-200 ease-spring group-hover:-rotate-3">
          {template.emoji}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[0.95rem] font-medium text-ink">{template.name}</span>
          <span className="block truncate text-xs text-subtle">{summary}</span>
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-0.5">{children}</span>
    </li>
  );
}

function TemplateForm({
  template,
  seed,
  onCancel,
  onSaved,
}: {
  template?: Template;
  seed?: Partial<TemplateInput>;
  onCancel: () => void;
  onSaved: (template: Template) => void;
}) {
  const { profile, timeZone, createTemplate, updateTemplate, deleteTemplate } = useJournal();
  const from = template ?? seed;
  const [name, setName] = useState(from?.name ?? "");
  const [emoji, setEmoji] = useState(from?.emoji ?? TEMPLATE_EMOJIS[0]);
  const [description, setDescription] = useState(from?.description ?? "");
  const [title, setTitle] = useState(from?.title ?? "");
  const [content, setContent] = useState(from?.content ?? "");
  const [error, setError] = useState<{ field: "name" | "content"; message: string }>();

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  // Tokens go wherever the writer was last typing.
  const lastField = useRef<"title" | "content">("content");

  const insert = (text: string) => {
    const field = lastField.current;
    const el = field === "title" ? titleRef.current : contentRef.current;
    if (!el) return;
    const value = field === "title" ? title : content;
    const startAt = el.selectionStart ?? value.length;
    const endAt = el.selectionEnd ?? value.length;
    const next = value.slice(0, startAt) + text + value.slice(endAt);
    if (field === "title") setTitle(next.slice(0, 200));
    else {
      setContent(next);
      setError(undefined);
    }
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(startAt + text.length, startAt + text.length);
    });
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) {
      setError({ field: "name", message: "Give it a name you’ll recognise." });
      return;
    }
    if (!content.trim() && !title.trim()) {
      setError({ field: "content", message: "Add a prompt or two, so there’s something to start from." });
      contentRef.current?.focus();
      return;
    }
    const input: TemplateInput = { name, emoji, description, title, content };
    if (template) {
      updateTemplate(template.id, input);
      onSaved({ ...template, ...input, name: name.trim() });
    } else {
      onSaved(createTemplate(input));
    }
  };

  return (
    <form
      onSubmit={submit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          submit();
        }
      }}
      className="grid animate-fade-in gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]"
    >
      <div className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="template-name" className="text-sm font-semibold text-ink">
            Name
          </label>
          <div className="flex gap-2">
            <EmojiPicker value={emoji} onChange={setEmoji} />
            <Input
              id="template-name"
              autoFocus={!template}
              maxLength={40}
              placeholder="e.g. Sunday reset"
              value={name}
              aria-invalid={error?.field === "name" ? true : undefined}
              onChange={(e) => {
                setName(e.target.value);
                setError(undefined);
              }}
            />
          </div>
          {error?.field === "name" && <p className="animate-fade-in text-sm text-danger">{error.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="template-description" className="text-sm font-semibold text-ink">
              What it’s for
            </label>
            <span className="text-xs text-subtle">Optional</span>
          </div>
          <Input
            id="template-description"
            maxLength={120}
            placeholder="e.g. Clear my head before the week starts"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="template-title" className="text-sm font-semibold text-ink">
              Starting title
            </label>
            <span className="text-xs text-subtle">Optional</span>
          </div>
          <Input
            ref={titleRef}
            id="template-title"
            maxLength={200}
            placeholder="e.g. Reset, {date}"
            value={title}
            onFocus={() => (lastField.current = "title")}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="template-content" className="text-sm font-semibold text-ink">
            Prompts
          </label>
          <Textarea
            ref={contentRef}
            id="template-content"
            rows={8}
            maxLength={20000}
            placeholder={"What went well\n- \n\nWhat I’d do differently\n- "}
            value={content}
            aria-invalid={error?.field === "content" ? true : undefined}
            aria-describedby="template-content-hint"
            onFocus={() => (lastField.current = "content")}
            onChange={(e) => {
              setContent(e.target.value);
              setError(undefined);
            }}
            className="min-h-48"
          />
          {error?.field === "content" && <p className="animate-fade-in text-sm text-danger">{error.message}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-xs text-subtle">Insert</span>
            <TokenChip onClick={() => insert(content && !content.endsWith("\n") ? "\n- " : "- ")}>
              • List item
            </TokenChip>
            {TEMPLATE_TOKENS.map(({ token, label }) => (
              <TokenChip key={token} onClick={() => insert(token)}>
                {label}
              </TokenChip>
            ))}
          </div>
          <p id="template-content-hint" className="text-xs leading-relaxed text-subtle">
            Leave a “- ” waiting on a line and your cursor lands there. <span className="max-sm:hidden">Tab jumps to the next one.</span>
          </p>
        </div>
      </div>

      <Preview
        emoji={emoji}
        name={name}
        {...fillTemplate({ title, content }, timeZone)}
        paper={profile.paper}
        pen={profile.pen}
      />

      <div className="flex items-center gap-2 border-t border-line pt-5 md:col-span-2">
        {template && (
          <Button
            variant="ghost"
            icon={<TrashIcon size={16} />}
            onClick={() => {
              deleteTemplate(template.id);
              onCancel();
            }}
            className="-ml-2 text-danger hover:bg-danger-soft hover:text-danger"
          >
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        )}
        <span className="ml-auto hidden text-xs text-faint sm:inline">
          <kbd className="font-sans">⌘</kbd> + <kbd className="font-sans">Enter</kbd> to save
        </span>
        <Button variant="ghost" onClick={onCancel} className="max-sm:ml-auto">
          Cancel
        </Button>
        <Button type="submit">{template ? "Save changes" : "Save template"}</Button>
      </div>
    </form>
  );
}

function TokenChip({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      // Keep focus (and the cursor position) in the field being written.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex h-7 items-center rounded-lg border border-line bg-surface px-2.5 text-xs font-medium text-ink-soft transition-[background-color,border-color,transform] duration-200 ease-soft hover:-translate-y-px hover:border-sage-300 hover:bg-sage-50 active:scale-95"
    >
      {children}
    </button>
  );
}

function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  return (
    <Popover
      role="dialog"
      label="Choose an icon"
      align="start"
      room={200}
      panelClassName="p-2"
      trigger={(props) => (
        <button
          type="button"
          {...props}
          aria-label={`Icon: ${value}. Change icon`}
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-2xl shadow-soft transition-[transform,border-color] duration-200 ease-spring hover:scale-105 hover:border-line-strong",
            props["aria-expanded"] && "border-sage-400 ring-4 ring-sage-200/70",
          )}
        >
          <span key={value} className="animate-pop-in">
            {value}
          </span>
        </button>
      )}
    >
      {(close) => (
        <div className="grid grid-cols-8 gap-1">
          {TEMPLATE_EMOJIS.map((option) => (
            <button
              key={option}
              type="button"
              aria-label={`Use ${option}`}
              aria-pressed={value === option}
              onClick={() => {
                onChange(option);
                close();
              }}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg text-lg transition-[transform,background-color] duration-200 ease-soft",
                value === option ? "bg-sage-200 ring-2 ring-sage-400" : "hover:scale-110 hover:bg-sage-50",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </Popover>
  );
}

/** The template as it will look on a fresh page, in this person's own paper and pen. */
function Preview({
  emoji,
  name,
  title,
  content,
  paper,
  pen,
}: {
  emoji: string;
  name: string;
  title: string;
  content: string;
  paper: keyof typeof papers;
  pen: keyof typeof pens;
}) {
  const caret = nextBlank(content);
  const at = caret === -1 ? content.length : caret;

  return (
    <div className="flex min-w-0 flex-col">
      <p className="mb-2 text-eyebrow font-semibold uppercase text-muted">Preview</p>
      <div
        className={cn(
          "relative min-h-64 flex-1 overflow-hidden rounded-2xl border p-5 shadow-soft transition-[background-color,border-color] duration-500 ease-soft md:max-h-120 md:overflow-y-auto",
          papers[paper].page,
        )}
      >
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-sage-100/80 px-2 py-1 text-[0.72rem] font-medium text-sage-600">
          <span>{emoji}</span>
          <span className="max-w-40 truncate">{name.trim() || "Your template"}</span>
        </span>
        <p
          className={cn(
            "mt-4 wrap-break-word text-[1.6rem] leading-tight font-semibold text-ink",
            pens[pen].family,
            !title && "text-faint",
          )}
        >
          {title || "Give it a little title"}
        </p>
        {content ? (
          <p
            className={cn(
              "mt-3 wrap-break-word whitespace-pre-wrap text-ink",
              pens[pen].body,
              bodyLeading(paper, pen),
              papers[paper].lines,
            )}
          >
            {content.slice(0, at)}
            <span
              aria-hidden="true"
              className="mx-px inline-block h-[1.05em] w-0.5 translate-y-[0.15em] animate-caret rounded-full bg-sage-500"
            />
            {content.slice(at)}
          </p>
        ) : (
          <p className={cn("mt-3 text-faint", pens[pen].body, pens[pen].leading)}>Your prompts will show up here.</p>
        )}
      </div>
    </div>
  );
}
