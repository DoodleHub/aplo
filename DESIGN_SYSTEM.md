# aplo design system

Soft, warm and paper-like. Sage carries the voice; category tints add personality.
Live reference: run the app and open **`/design-system`**.

- **Tokens:** `app/globals.css` (Tailwind v4 `@theme`)
- **Primitives:** `components/ui/*`
- **Brand & icons:** `components/brand.tsx`, `components/icons.tsx`
- **Composites:** `components/journal/*`

## Principles

1. **Gentle.** Use low-contrast surfaces and warm neutrals. Never use pure black.
2. **Personal.** Emoji, tints and a hand-drawn illustration make each corner feel like the user's own.
3. **Effortless.** Updates are optimistic, writing autosaves, and keyboard shortcuts are everywhere. The user never waits.

## Color

| Token | Hex | Use |
| --- | --- | --- |
| `canvas` | `#faf9f5` | Page background |
| `sidebar` | `#f0f1ea` | Sidebar, auth panel |
| `surface` | `#ffffff` | Cards, inputs, menus |
| `wash` / `wash-strong` | `#eaede0` / `#e6e9db` | Hero prompt / quote card |
| `line` / `line-strong` | `#e9e8e0` / `#dcdbd1` | Borders |
| `ink` | `#363e37` | Headings, primary text |
| `ink-soft` | `#5c625b` | Icons, secondary UI |
| `muted` | `#85867b` | Body copy |
| `subtle` | `#999b91` | Meta, counts |
| `faint` | `#b3b4ad` | Placeholders |
| `sage-600` | `#4e684f` | Primary actions, active nav text |
| `sage-500` | `#748263` | Eyebrows |
| `sage-200` / `sage-100` | `#e0e6d8` / `#e9ece0` | Active nav / soft fills |
| `heart` | `#a48379` | Favorite state |
| `danger` | `#b4574a` | Destructive actions |

**Category palettes.** There are six: `sage`, `sand`, `lilac`, `sky`, `rose` and `stone`. Each one has three tokens:

- `cat-{name}` for the card tint
- `cat-{name}-chip` for chips
- `cat-{name}-dot` for sidebar dots

Map a palette to class names through `lib/palette.ts`. Never build class names dynamically.

## Typography

- **Display:** Instrument Sans, semibold, `tracking-display` (−0.035em)
- **Body:** DM Sans

| Role | Size | Style |
| --- | --- | --- |
| Display | 42 / 34 mobile | `font-display font-semibold tracking-display` |
| Heading | 28 | `font-display font-semibold tracking-[-0.03em]` |
| Section | 21 | `font-display font-semibold tracking-[-0.03em]` |
| Card title | 18 | `font-display font-semibold tracking-[-0.02em]` |
| Body | 15 | `text-[0.95rem] text-muted leading-relaxed` |
| Meta | 12 | `text-xs text-subtle` |
| Eyebrow | 11 | `text-eyebrow font-semibold uppercase` (0.16em tracking) |

### Pages: paper and pen

Each person picks how their editor page looks with the **Page style** button in the editor toolbar. The choice is saved on their profile (`profiles.paper`, `profiles.pen`), syncs through the offline outbox, and applies to every thought. Defaults keep the original look: `plain` paper and the `sans` pen.

| Paper | Utility | Notes |
| --- | --- | --- |
| Plain | `bg-surface` | The default |
| Notebook | `paper-ruled` + `page-rules` | 2rem rules, red margin line from `sm` |
| Dot grid | `paper-dotted` + `page-dots` | 1rem dot grid |
| Old paper | `paper-parchment` | Warm cream with a soft vignette |

Pens: Clean (DM Sans), Breezy (Caveat), Neat (Patrick Hand) and Felt tip (Kalam). Handwriting fonts aren't preloaded, so they only download once someone uses them. On lined paper the body always uses `leading-[2rem]` so writing sits on the rules. Map paper and pen to class names through `lib/page-style.ts`. Paper tokens (`paper-*`) have light and dark values.

## Shape and elevation

**Radius**

- `rounded-xl` (12): buttons, inputs, nav items
- `rounded-2xl` (16): cards and menus
- `rounded-3xl` (24): hero, dialogs and the editor

**Shadows**

- `shadow-soft`: resting cards
- `shadow-lift`: hover state
- `shadow-pop`: overlays
- `shadow-button`: the primary button's pressable lip, matching the mock

## Motion

- **State changes:** `ease-soft` at 200–300ms.
- **Playful moments:** `ease-spring` for heart bursts and emoji wiggles.
- **Content entrance:** `animate-fade-up`, staggered 40ms per item.
- **Hover:** cards lift `-translate-y-1`.
- **Ambient:** the illustration uses `animate-float` and `animate-twinkle`.
- **Reduced motion:** every animation is disabled under `prefers-reduced-motion`.

## Components

| Component | File | Notes |
| --- | --- | --- |
| Button / ButtonLink | `ui/button.tsx` | Variants: `primary`, `soft`, `outline`, `ghost`, `danger`. Sizes: `sm`, `md`, `lg`. |
| IconButton | `ui/button.tsx` | Round, 36px, always labelled |
| Input / PasswordInput / Field | `ui/field.tsx` | Field wires the label, error and `aria-*` attributes |
| Chip / Dot | `ui/chip.tsx` | Category chip; `stone` is used for "Unsorted" |
| Segmented | `ui/segmented.tsx` | "All entries / Favorites" tabs |
| Dialog | `ui/dialog.tsx` | Native `<dialog>`: focus trap, Esc to close, backdrop click to close |
| Popover | `ui/popover.tsx` | Anchored floating panel used by Menu and the page style picker |
| Menu | `ui/menu.tsx` | Popover menu with an optional header. Items can have a `description` and act as radio options (`selected`). |
| Switch | `ui/switch.tsx` | Labelled on/off row, used for "Share in Discover" |
| Toast | `ui/toast.tsx` | Bottom pill with an optional action, such as Undo |
| Skeleton | `ui/skeleton.tsx` | Loading placeholders |
| EntryCard, CategoryCard, HeroPrompt, EmptyState | `journal/*` | Composites from the mock |
| TemplateStrip, TemplateMenu | `journal/template-picker.tsx` | "Start with" chips on a blank page (hover previews as ghost text) and the toolbar menu |
| TemplateDialog | `journal/template-dialog.tsx` | List, create and edit templates, with a live preview in the person's paper and pen |
| Textarea | `ui/field.tsx` | Multi-line input matching `Input` |
| QuoteFace, QuoteDialog | `journal/quote-card.tsx`, `journal/quote-dialog.tsx` | A quote card on the wall, and the composer with its live preview |
| VisibilityMenu, Avatar | `journal/visibility-menu.tsx`, `journal/profile-dialog.tsx` | Sharing control and the pen-name avatar |

## Sharing

Everything is private by default. A corner can be shared; each entry follows its corner until you pick "Shared" or "Only me" (`isShared` in `lib/types.ts`).
Shared things show a `GlobeIcon`, private ones a `LockIcon`. People appear by pen name and emoji, never by email. Discover reads go through the `discover_feed` / `discover_entry` RPCs, which hide the names of private corners. Every shared thought has a heart (on the card and in the reader); favorites from Discover appear in their own “From Discover” section on Favorites.

## Templates

A template is a starting title and a body of prompts. Ready-made ones live in `lib/templates.ts`; people's own are in `public.templates` and sync through the outbox like everything else. `{date}`, `{weekday}` and `{time}` fill in when a template is used. A list marker left empty (`- `, `1. `, `[ ] `) or the empty line under a heading is a *blank*: the cursor lands on the first one, and Tab moves to the next. Using a template replaces the page’s title and body; if that replaces real writing, a toast offers Undo. A page holding only an untouched template is never saved as an entry.

## Quotes

The quote wall is an endless dot-grid canvas. Cards are 248 canvas units wide, tinted with a corner palette, and carry a large “ in the palette's dot color. Each one tilts slightly (`quoteTilt`, seeded by its id) and straightens on hover, focus and drag. Text size steps down as quotes get longer.

- **Pointer:** drag a card to move it (it comes to the front), drag the wall to pan, pinch or ⌘/ctrl + scroll to zoom (30–200%), and double-click or double-tap the empty wall to pin a quote right there.
- **Keyboard:** Tab through quotes (the wall glides to one that's out of view). Arrow keys nudge it (Shift moves it further), Enter edits, Delete takes it down with Undo. N adds a quote, + / − zoom, and 0 fits everything in view.
- Button-driven view changes glide with `ease-soft`; gestures follow the pointer exactly.

## Formatting

Bold, italic and strikethrough are stored in the thought’s text as `**bold**`, `_italic_` (or `*italic*`) and `~~struck~~`, parsed by `lib/inline-format.ts`. Marks never cross a line. ⌘B, ⌘I and ⌘⇧X (or the B / I / S buttons under the page) wrap or unwrap the selection. Read views render through `FormattedText`, which hides the marks. In the editor, `FormatBackdrop` draws the styled text behind a textarea whose own text is transparent, so every character must keep its plain width: the marks stay visible but faded, bold is the `faux-bold` stroke, and italic relies on the pens having no italic face loaded (the browser slants the same letters). Don’t add italic faces or swap in real bold weights there. Search matches `plainText()`.

## Voice

Warm, brief and second-person.

- Say "thoughts tucked away", "your little corners" and "Let it out".
- Error messages are kind and say what to do next: "That email and password don't match. Try again?"
- Avoid jargon, streaks, scores and guilt.
