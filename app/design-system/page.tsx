import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CloudWriter, Logo, LogoMark } from "@/components/brand";
import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CheckIcon,
  CloseIcon,
  EyeIcon,
  FlowerIcon,
  HeartIcon,
  JournalIcon,
  LogoutIcon,
  MenuIcon,
  MoreIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SmileIcon,
  SunIcon,
  TrashIcon,
} from "@/components/icons";
import { CategoryCard, CategoryRow } from "@/components/journal/category-card";
import { EntryCard } from "@/components/journal/entry-card";
import { EmptyState } from "@/components/journal/entry-grid";
import { HeroPrompt } from "@/components/journal/hero-prompt";
import { Button, IconButton } from "@/components/ui/button";
import { Chip, Dot } from "@/components/ui/chip";
import { Skeleton } from "@/components/ui/skeleton";
import { MOODS, palette } from "@/lib/palette";
import { CATEGORY_COLORS, type Category, type Entry } from "@/lib/types";
import { InteractiveDemos } from "./demos";

export const metadata: Metadata = { title: "Design system" };

const swatches: Array<{ group: string; items: Array<[string, string, string]> }> = [
  {
    group: "Surfaces",
    items: [
      ["canvas", "#faf9f5", "Page background"],
      ["sidebar", "#f0f1ea", "Sidebar, auth panel"],
      ["surface", "#ffffff", "Cards, inputs, menus"],
      ["wash", "#eaede0", "Hero prompt"],
      ["wash-strong", "#e6e9db", "Quote card"],
      ["line", "#e9e8e0", "Borders, dividers"],
    ],
  },
  {
    group: "Ink",
    items: [
      ["ink", "#363e37", "Headings, primary text"],
      ["ink-soft", "#5c625b", "Icons, secondary UI"],
      ["muted", "#85867b", "Body copy"],
      ["subtle", "#999b91", "Meta, counts"],
      ["faint", "#b3b4ad", "Placeholders"],
      ["heart", "#a48379", "Favorite state"],
    ],
  },
  {
    group: "Sage (brand)",
    items: [
      ["sage-100", "#e9ece0", "Soft fills, tabs"],
      ["sage-200", "#e0e6d8", "Active nav"],
      ["sage-400", "#abb995", "Logo, focus"],
      ["sage-500", "#748263", "Eyebrows"],
      ["sage-600", "#4e684f", "Primary actions"],
      ["sage-700", "#3e553f", "Primary hover"],
    ],
  },
];

const sampleCategories: Category[] = [
  { id: "1", name: "Daily life", emoji: "🌱", color: "sage", description: "", is_public: false, position: 0, created_at: "" },
  { id: "2", name: "Gratitude", emoji: "☀️", color: "sand", description: "", is_public: false, position: 1, created_at: "" },
  { id: "3", name: "Personal growth", emoji: "🌷", color: "lilac", description: "", is_public: false, position: 2, created_at: "" },
  { id: "4", name: "Dreams & ideas", emoji: "☁️", color: "sky", description: "", is_public: false, position: 3, created_at: "" },
];

const sampleEntries: Entry[] = [
  {
    id: "a",
    category_id: "1",
    title: "The beauty in slowing down",
    content:
      "Took the long way home today. No podcast, no scrolling. Just the rustle of leaves and a little room to breathe.",
    mood: "☺️",
    is_favorite: false,
    visibility: "inherit",
    created_at: "2026-10-13T16:00:00Z",
    updated_at: "2026-10-13T16:00:00Z",
  },
  {
    id: "b",
    category_id: "2",
    title: "Little things, big feelings",
    content:
      "Warm coffee. A good conversation. Sunlight on the kitchen floor. There’s so much to love about an ordinary day.",
    mood: "🥰",
    is_favorite: true,
    visibility: "inherit",
    created_at: "2026-10-12T16:00:00Z",
    updated_at: "2026-10-12T16:00:00Z",
  },
];

export default function DesignSystemPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 lg:py-16">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Logo />
          <h1 className="mt-8 font-display text-[2.6rem] leading-[1.1] font-semibold tracking-display text-ink">
            Design system
          </h1>
          <p className="mt-3 max-w-xl text-[1.05rem] leading-relaxed text-muted">
            Soft, warm and paper-like. Sage carries the voice; category tints add personality. Everything is
            rounded, gently elevated, and moves with an easy, settling ease.
          </p>
        </div>
        <p className="text-sm text-subtle">Tokens live in app/globals.css</p>
      </header>

      <Section title="Principles">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ["Gentle", "Low-contrast surfaces, warm neutrals, no harsh blacks. The UI should feel like a deep breath."],
            ["Personal", "Emoji, tints and handwritten-feeling illustration make each corner feel owned."],
            ["Effortless", "Optimistic updates, autosave and keyboard shortcuts. Nothing ever asks you to wait."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-6 shadow-soft">
              <h3 className="font-display text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Color">
        <div className="space-y-8">
          {swatches.map((group) => (
            <div key={group.group}>
              <h3 className="mb-3 text-eyebrow font-semibold uppercase text-muted">{group.group}</h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {group.items.map(([name, hex, use]) => (
                  <div key={name} className="overflow-hidden rounded-2xl border border-line bg-surface">
                    <div className="h-16 border-b border-line" style={{ background: hex }} />
                    <div className="p-3">
                      <p className="text-sm font-semibold text-ink">{name}</p>
                      <p className="font-mono text-xs text-subtle">{hex}</p>
                      <p className="mt-1 text-xs text-muted">{use}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div>
            <h3 className="mb-3 text-eyebrow font-semibold uppercase text-muted">Category palettes</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {CATEGORY_COLORS.map((color) => (
                <div key={color} className={`rounded-2xl border p-4 ${palette[color].card}`}>
                  <div className="flex items-center gap-2">
                    <Dot color={color} />
                    <span className="text-sm font-semibold">{palette[color].label}</span>
                  </div>
                  <Chip color={color} className="mt-3">
                    chip
                  </Chip>
                  <p className="mt-2 font-mono text-[0.7rem] text-ink-soft">cat-{color} · -chip · -dot</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <p className="mb-6 text-sm text-muted">
          Display: Instrument Sans, semibold, tight tracking (−0.035em). Body: DM Sans.
        </p>
        <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
          {[
            ["Display / 42", "font-display text-[2.6rem] leading-[1.1] font-semibold tracking-display", "A little space for you"],
            ["Heading / 28", "font-display text-[1.75rem] font-semibold tracking-[-0.03em]", "How’s your little world today?"],
            ["Section / 21", "font-display text-[1.3rem] font-semibold tracking-[-0.03em]", "Your little corners"],
            ["Card title / 18", "font-display text-[1.15rem] font-semibold tracking-[-0.02em]", "The beauty in slowing down"],
            ["Body / 15", "text-[0.95rem] leading-relaxed text-muted", "Start with a thought, a feeling, or a tiny win."],
            ["Meta / 12", "text-xs text-subtle", "Oct 13 · 26 words"],
            ["Eyebrow / 11", "text-eyebrow font-semibold uppercase text-sage-500", "A moment to yourself"],
          ].map(([label, cls, sample]) => (
            <div key={label} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-baseline sm:gap-8">
              <span className="w-32 shrink-0 font-mono text-xs text-subtle">{label}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius, elevation & motion">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["rounded-xl · 12", "Buttons, inputs, nav", "rounded-xl shadow-soft"],
            ["rounded-2xl · 16", "Cards, menus", "rounded-2xl shadow-lift"],
            ["rounded-3xl · 24", "Hero, dialogs, editor", "rounded-3xl shadow-pop"],
            ["shadow-button", "Primary — pressable lip", "rounded-xl bg-sage-600 shadow-button"],
          ].map(([name, use, cls]) => (
            <div key={name} className="rounded-2xl bg-sidebar p-5">
              <div className={`h-20 border border-line bg-surface ${cls}`} />
              <p className="mt-4 text-sm font-semibold">{name}</p>
              <p className="text-xs text-muted">{use}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted">
          Motion uses <code className="font-mono text-xs">ease-soft</code> (cubic-bezier(.22,1,.36,1)) at 200–300ms for
          state, <code className="font-mono text-xs">ease-spring</code> for playful moments (hearts, emoji), and{" "}
          <code className="font-mono text-xs">animate-fade-up</code> with a 40ms stagger when content appears. Cards
          lift 4px on hover. All motion respects reduced-motion preferences.
        </p>
      </Section>

      <Section title="Brand & iconography">
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-line bg-surface p-8">
            <Logo />
            <div className="flex items-center gap-4">
              <LogoMark className="h-12 w-12" />
              <LogoMark className="h-8 w-8" />
              <LogoMark className="h-6 w-6" />
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <div className="grid grid-cols-6 gap-3 text-ink-soft sm:grid-cols-9">
              {[
                JournalIcon, HeartIcon, PlusIcon, SearchIcon, ArrowUpRightIcon, ArrowLeftIcon, MenuIcon, CloseIcon,
                MoreIcon, TrashIcon, PencilIcon, CheckIcon, LogoutIcon, EyeIcon, SunIcon, FlowerIcon, SmileIcon,
              ].map((Icon, i) => (
                <div key={i} className="flex aspect-square items-center justify-center rounded-xl bg-canvas">
                  <Icon size={20} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted">24px grid, 1.6 stroke, round caps &amp; joins. Emoji are used for categories and moods.</p>
            <div className="mt-4 flex flex-wrap gap-1 text-xl">
              {MOODS.map((m) => (
                <span key={m.emoji} title={m.label} className="flex h-10 w-10 items-center justify-center rounded-xl bg-canvas">
                  {m.emoji}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 flex justify-center rounded-2xl border border-line bg-wash p-6">
          <CloudWriter className="h-48 w-auto" />
        </div>
      </Section>

      <Section title="Buttons & controls">
        <div className="space-y-6 rounded-2xl border border-line bg-surface p-6">
          <Row label="Variants">
            <Button icon={<PlusIcon size={18} strokeWidth={2.2} />}>New entry</Button>
            <Button variant="soft">Soft</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Delete</Button>
            <Button disabled>Disabled</Button>
          </Row>
          <Row label="Sizes">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg" icon={<PlusIcon size={20} strokeWidth={2.2} />}>
              Large
            </Button>
          </Row>
          <Row label="Icon buttons">
            <IconButton label="Favorite">
              <HeartIcon size={20} />
            </IconButton>
            <IconButton label="Favorited" className="text-heart">
              <HeartIcon size={20} filled />
            </IconButton>
            <IconButton label="More">
              <MoreIcon size={20} />
            </IconButton>
          </Row>
          <Row label="Chips">
            {sampleCategories.map((c) => (
              <Chip key={c.id} color={c.color} emoji={c.emoji}>
                {c.name}
              </Chip>
            ))}
            <Chip>Unsorted</Chip>
          </Row>
          <InteractiveDemos />
        </div>
      </Section>

      <Section title="Composites">
        <HeroPrompt />
        <div className="mt-6">
          <CategoryRow>
            {sampleCategories.map((c, i) => (
              <CategoryCard key={c.id} category={c} count={i === 3 ? 0 : 1} />
            ))}
          </CategoryRow>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sampleEntries.map((e) => (
            <EntryCard
              key={e.id}
              entry={e}
              category={sampleCategories.find((c) => c.id === e.category_id)}
              timeZone="UTC"
            />
          ))}
          <EmptyState emoji="🌱" title="Empty state">
            Friendly, encouraging, always with a next step.
          </EmptyState>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </Section>

      <Section title="Voice">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-eyebrow font-semibold uppercase text-sage-500">We say</p>
            <ul className="mt-3 space-y-2 text-[0.95rem] text-ink">
              <li>“Thoughts tucked away”</li>
              <li>“Your little corners”</li>
              <li>“Let it out”</li>
              <li>“That email and password don’t match. Try again?”</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-eyebrow font-semibold uppercase text-danger">We avoid</p>
            <ul className="mt-3 space-y-2 text-[0.95rem] text-muted">
              <li>“Records”, “items”, “data”</li>
              <li>Streaks, scores or guilt</li>
              <li>“Invalid credentials (401)”</li>
              <li>ALL CAPS outside of eyebrows</li>
            </ul>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-16">
      <h2 className="mb-6 font-display text-[1.3rem] font-semibold tracking-[-0.03em] text-ink">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <span className="w-28 shrink-0 font-mono text-xs text-subtle">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
