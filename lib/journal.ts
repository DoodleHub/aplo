import "server-only";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Category, Entry, Profile } from "@/lib/types";

/** Everything the journal UI needs for the signed-in user, in one round trip. */
export async function getJournal() {
  // Always per-request: the session check and "today" both depend on the current time.
  await connection();
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims) redirect("/login");

  const [categories, entries, profile, cookieStore] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, emoji, color, is_public, position, created_at")
      .order("position")
      .order("created_at"),
    supabase
      .from("entries")
      .select("id, category_id, title, content, mood, is_favorite, visibility, created_at, updated_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    supabase.from("profiles").select("display_name, emoji").maybeSingle(),
    cookies(),
  ]);

  if (categories.error) throw categories.error;
  if (entries.error) throw entries.error;
  if (profile.error) throw profile.error;

  return {
    user: { id: claims.sub, email: (claims.email as string | undefined) ?? "" },
    categories: categories.data as Category[],
    entries: entries.data as Entry[],
    // Every account gets one on sign-up; this only covers a profile that's somehow missing.
    profile: (profile.data ?? { display_name: "A quiet soul", emoji: "🌿" }) satisfies Profile,
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
