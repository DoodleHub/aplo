import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Category, Entry } from "@/lib/types";

/** Everything the journal UI needs for the signed-in user, in one round trip. */
export async function getJournal() {
  // Always per-request: the session check and "today" both depend on the current time.
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) redirect("/login");

  const [categories, entries, cookieStore] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, emoji, color, position, created_at")
      .order("position")
      .order("created_at"),
    supabase
      .from("entries")
      .select("id, category_id, title, content, mood, is_favorite, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    cookies(),
  ]);

  if (categories.error) throw categories.error;
  if (entries.error) throw entries.error;

  return {
    user: { id: claims.sub, email: (claims.email as string | undefined) ?? "" },
    categories: categories.data as Category[],
    entries: entries.data as Entry[],
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
