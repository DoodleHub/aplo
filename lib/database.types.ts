// Mirrors supabase/migrations. Regenerate with `supabase gen types typescript` once linked.
import type { CategoryColor, DiscoverEntry, DiscoverItem, Paper, Pen, Visibility } from "./types";

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
  description: string;
  is_public: boolean;
  position: number;
  created_at: string;
};

type EntryRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  title: string;
  content: string;
  mood: string | null;
  is_favorite: boolean;
  visibility: Visibility;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  display_name: string;
  emoji: string;
  paper: Paper;
  pen: Pen;
  created_at: string;
};

type TemplateRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  description: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type Insert<Row, Required extends keyof Row> = Pick<Row, Required> & Partial<Omit<Row, Required>>;

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: Insert<CategoryRow, "name">;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      entries: {
        Row: EntryRow;
        Insert: Insert<EntryRow, never>;
        Update: Partial<EntryRow>;
        Relationships: [];
      };
      templates: {
        Row: TemplateRow;
        Insert: Insert<TemplateRow, "name">;
        Update: Partial<TemplateRow>;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: Insert<ProfileRow, "display_name">;
        Update: Partial<ProfileRow>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      discover_feed: {
        Args: { p_mood?: string | null; p_before?: string | null; p_before_id?: string | null; p_limit?: number };
        Returns: DiscoverItem[];
      };
      discover_entry: {
        Args: { p_id: string };
        Returns: DiscoverEntry[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
