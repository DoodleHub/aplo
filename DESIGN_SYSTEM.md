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
| Menu | `ui/menu.tsx` | Popover menu with an optional header |
| Toast | `ui/toast.tsx` | Bottom pill with an optional action, such as Undo |
| Skeleton | `ui/skeleton.tsx` | Loading placeholders |
| EntryCard, CategoryCard, HeroPrompt, EmptyState | `journal/*` | Composites from the mock |

## Voice

Warm, brief and second-person.

- Say "thoughts tucked away", "your little corners" and "Let it out".
- Error messages are kind and say what to do next: "That email and password don't match. Try again?"
- Avoid jargon, streaks, scores and guilt.
