export const CATEGORY_COLORS = ["sage", "sand", "lilac", "sky", "rose", "stone"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  position: number;
  created_at: string;
};

export type Entry = {
  id: string;
  category_id: string | null;
  title: string;
  content: string;
  mood: string | null;
  is_favorite: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryInput = Pick<Category, "name" | "emoji" | "color">;
export type EntryPatch = Partial<Pick<Entry, "category_id" | "title" | "content" | "mood" | "is_favorite">>;
