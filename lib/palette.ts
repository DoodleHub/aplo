import type { CategoryColor } from "./types";

// Literal class names so Tailwind can see them.
export const palette: Record<
  CategoryColor,
  { label: string; card: string; chip: string; dot: string; ring: string }
> = {
  sage: {
    label: "Sage",
    card: "bg-cat-sage border-cat-sage-line",
    chip: "bg-cat-sage-chip",
    dot: "bg-cat-sage-dot",
    ring: "ring-cat-sage-dot",
  },
  sand: {
    label: "Sand",
    card: "bg-cat-sand border-cat-sand-line",
    chip: "bg-cat-sand-chip",
    dot: "bg-cat-sand-dot",
    ring: "ring-cat-sand-dot",
  },
  lilac: {
    label: "Lilac",
    card: "bg-cat-lilac border-cat-lilac-line",
    chip: "bg-cat-lilac-chip",
    dot: "bg-cat-lilac-dot",
    ring: "ring-cat-lilac-dot",
  },
  sky: {
    label: "Sky",
    card: "bg-cat-sky border-cat-sky-line",
    chip: "bg-cat-sky-chip",
    dot: "bg-cat-sky-dot",
    ring: "ring-cat-sky-dot",
  },
  rose: {
    label: "Rose",
    card: "bg-cat-rose border-cat-rose-line",
    chip: "bg-cat-rose-chip",
    dot: "bg-cat-rose-dot",
    ring: "ring-cat-rose-dot",
  },
  stone: {
    label: "Stone",
    card: "bg-cat-stone border-cat-stone-line",
    chip: "bg-cat-stone-chip",
    dot: "bg-cat-stone-dot",
    ring: "ring-cat-stone-dot",
  },
};

export const CATEGORY_EMOJIS = [
  "🌱", "☀️", "🌷", "☁️", "🌙", "🍃", "🌊", "🔥",
  "📚", "🎨", "🎵", "☕", "🧘", "💭", "💌", "🏡",
  "✈️", "🌈", "⭐", "🍓", "🐾", "💪", "🌻", "🕯️",
];

export const MOODS = [
  { emoji: "😊", label: "Happy" },
  { emoji: "☺️", label: "Content" },
  { emoji: "🥰", label: "Loved" },
  { emoji: "😌", label: "Calm" },
  { emoji: "🤩", label: "Excited" },
  { emoji: "🤔", label: "Thoughtful" },
  { emoji: "😴", label: "Tired" },
  { emoji: "🤒", label: "Sick" },
  { emoji: "😔", label: "Low" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
];
