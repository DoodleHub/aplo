// Mirrors supabase/migrations. Regenerate with `supabase gen types typescript` once linked.
import type { CategoryColor } from "./types";

type CategoryRow = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: CategoryColor;
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
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
