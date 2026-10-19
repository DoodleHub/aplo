import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Category, Entry, Profile, Quote, Template } from "@/lib/types";

/** Everything the journal UI needs for the signed-in user, in one round trip. */
export async function getJournal() {
  // Always per-request: the session check and "today" both depend on the current time.
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) redirect("/login");

  const [categories, entries, templates, quotes, profile, cookieStore] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, emoji, color, description, is_public, position, created_at")
      .order("position")
      .order("created_at"),
    supabase
      .from("entries")
      .select("id, category_id, title, content, mood, is_favorite, visibility, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase
      .from("templates")
      .select("id, name, emoji, description, title, content, created_at, updated_at")
      .order("created_at"),
    supabase
      .from("quotes")
      .select("id, text, author, color, x, y, z, scale, created_at, updated_at")
      .order("created_at"),
    supabase.from("profiles").select("display_name, emoji, paper, pen").maybeSingle(),
    cookies(),
  ]);

  if (categories.error) throw categories.error;
  if (entries.error) throw entries.error;
  if (profile.error) throw profile.error;
  // Templates are a nicety: if they can't load, the journal still opens with the built-in ones.
  if (templates.error) console.error("Couldn't load templates", templates.error);
  // Same for the quote wall: it shouldn't keep anyone from their journal.
  if (quotes.error) console.error("Couldn't load quotes", quotes.error);

  return {
    user: { id: claims.sub, email: (claims.email as string | undefined) ?? "" },
    categories: categories.data as Category[],
    entries: entries.data as Entry[],
    templates: (templates.data ?? []) as Template[],
    quotes: (quotes.data ?? []) as Quote[],
    // Every account gets one on sign-up; this only covers a profile that's somehow missing.
    profile: (profile.data ?? { display_name: "A quiet soul", emoji: "🌿", paper: "plain", pen: "sans" }) satisfies Profile,
    timeZone: safeTimeZone(cookieStore.get("tz")?.value),
  };
}

function safeTimeZone(value: string | undefined) {
  if (!value) return "UTC";
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value;
  } catch {
    return "UTC";
  }
}
