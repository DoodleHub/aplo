import type { CategoryColor } from "./types";

// Literal class names so Tailwind can see them.
export const palette: Record<
  CategoryColor,
  { label: string; card: string; chip: string; dot: string; ring: string }
> = {
  sage: {
    label: "Sage",
    card: "bg-cat-sage border-[#dfe3d4]",
    chip: "bg-cat-sage-chip",
    dot: "bg-cat-sage-dot",
    ring: "ring-cat-sage-dot",
  },
  sand: {
    label: "Sand",
    card: "bg-cat-sand border-[#e0d6c3]",
    chip: "bg-cat-sand-chip",
    dot: "bg-cat-sand-dot",
    ring: "ring-cat-sand-dot",
  },
  lilac: {
    label: "Lilac",
    card: "bg-cat-lilac border-[#e4dce5]",
    chip: "bg-cat-lilac-chip",
    dot: "bg-cat-lilac-dot",
    ring: "ring-cat-lilac-dot",
  },
  sky: {
    label: "Sky",
    card: "bg-cat-sky border-[#d9e3e7]",
    chip: "bg-cat-sky-chip",
    dot: "bg-cat-sky-dot",
    ring: "ring-cat-sky-dot",
  },
  rose: {
    label: "Rose",
    card: "bg-cat-rose border-[#e9d6d1]",
    chip: "bg-cat-rose-chip",
    dot: "bg-cat-rose-dot",
    ring: "ring-cat-rose-dot",
  },
  stone: {
    label: "Stone",
    card: "bg-cat-stone border-[#dfdbd4]",
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
  { emoji: "😔", label: "Low" },
  { emoji: "😢", label: "Sad" },
  { emoji: "😤", label: "Frustrated" },
];
