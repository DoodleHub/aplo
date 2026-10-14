export const CATEGORY_COLORS = ["sage", "sand", "lilac", "sky", "rose", "stone"] as const;
export type CategoryColor = (typeof CATEGORY_COLORS)[number];

/** "inherit" follows the entry's corner; entries without a corner are then private. */
export const VISIBILITIES = ["inherit", "public", "private"] as const;
export type Visibility = (typeof VISIBILITIES)[number];

export type Category = {
  id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  /** Thoughts here appear in Discover, unless an entry says otherwise. */
  is_public: boolean;
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
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

export type CategoryInput = Pick<Category, "name" | "emoji" | "color" | "is_public">;
export type EntryPatch = Partial<
  Pick<Entry, "category_id" | "title" | "content" | "mood" | "is_favorite" | "visibility">
>;

/** The pen name shown next to shared thoughts. */
export type Profile = { display_name: string; emoji: string };

/**
 * Whether an entry shows in Discover. Rows saved on the device before sharing existed have
 * no visibility fields, so missing values count as private.
 */
export function isShared(entry: Pick<Entry, "visibility">, category?: Pick<Category, "is_public">) {
  const visibility = entry.visibility ?? "inherit";
  return visibility === "public" || (visibility === "inherit" && Boolean(category?.is_public));
}

/** A shared thought as Discover lists it. */
export type DiscoverItem = {
  id: string;
  title: string;
  excerpt: string;
  mood: string | null;
  word_count: number;
  created_at: string;
  /** Only set when the author's corner is itself shared. */
  category_name: string | null;
  category_emoji: string | null;
  category_color: CategoryColor | null;
  author_name: string;
  author_emoji: string;
  is_mine: boolean;
};

export type DiscoverEntry = Omit<DiscoverItem, "excerpt" | "word_count"> & { content: string };
