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
  /** What the corner is for; "" when unset. Missing in snapshots saved before it existed. */
  description: string;
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

export type CategoryInput = Pick<Category, "name" | "emoji" | "color" | "description" | "is_public">;
export type EntryPatch = Partial<
  Pick<Entry, "category_id" | "title" | "content" | "mood" | "is_favorite" | "visibility">
>;

/** A starting shape for a thought: an optional title and a body of gentle prompts. */
export type Template = {
  id: string;
  name: string;
  emoji: string;
  /** One quiet line about what it's for. */
  description: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type TemplateInput = Pick<Template, "name" | "emoji" | "description" | "title" | "content">;

export const PAPERS = ["plain", "ruled", "dotted", "parchment"] as const;
export type Paper = (typeof PAPERS)[number];

export const PENS = ["sans", "caveat", "patrick", "kalam"] as const;
export type Pen = (typeof PENS)[number];

/** How pages look while writing: the paper and the pen. Applies to every thought. */
export type WritingStyle = { paper: Paper; pen: Pen };

/** The pen name shown next to shared thoughts, and how this person likes to write. */
export type Profile = { display_name: string; emoji: string } & WritingStyle;

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
  /** Whether the reader has favorited it. For their own thoughts this is the entry's own flag. */
  is_favorite: boolean;
};

/** A shared thought the reader favorited, as their Favorites lists it. */
export type DiscoverFavorite = DiscoverItem & { favorited_at: string };

export type DiscoverEntry = Omit<DiscoverItem, "excerpt" | "word_count"> & { content: string };
