"use server";

import { redirect } from "next/navigation";
import { isStrongPassword } from "@/lib/password";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  fieldErrors?: { email?: string; password?: string };
  email?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  // Only allow same-site relative paths.
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signIn(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Please enter a valid email.";
  if (!password) fieldErrors.password = "Please enter your password.";
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return {
      email,
      error:
        error.code === "invalid_credentials"
          ? "That email and password don’t match. Try again?"
          : error.message,
    };
  }

  redirect(safeNext(formData.get("next")));
}

export async function signUp(_: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  const fieldErrors: AuthState["fieldErrors"] = {};
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Please enter a valid email.";
  if (!isStrongPassword(password)) {
    fieldErrors.password = "Use 8+ characters with upper & lowercase letters, a number and a symbol.";
  }
  if (fieldErrors.email || fieldErrors.password) return { fieldErrors, email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    const message =
      error.code === "user_already_exists"
        ? "There’s already a space for this email. Try signing in instead."
        : error.code === "weak_password"
          ? "That password is a bit too easy to guess. Try a stronger one."
          : error.message;
    return { email, error: message };
  }
  if (!data.session) {
    // Happens if email confirmation gets switched back on in Supabase.
    return { email, error: "Check your inbox to confirm your email, then sign in." };
  }

  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
