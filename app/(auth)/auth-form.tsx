"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { cn } from "@/lib/cn";
import { PASSWORD_RULES } from "@/lib/password";
import { CheckIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input, PasswordInput } from "@/components/ui/field";
import { signIn, signUp, type AuthState } from "./actions";

const copy = {
  login: {
    title: "Welcome back",
    subtitle: "Your little space has been waiting for you.",
    submit: "Sign in",
    pending: "Opening your journal…",
    switchText: "New to aplo?",
    switchLink: "Create your space",
    switchHref: "/signup",
  },
  signup: {
    title: "Make yourself at home",
    subtitle: "Create a private space for your thoughts. It only takes a moment.",
    submit: "Create my space",
    pending: "Setting things up…",
    switchText: "Already have a space?",
    switchLink: "Sign in",
    switchHref: "/login",
  },
};

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const searchParams = useSearchParams();
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signIn : signUp,
    {},
  );
  const text = copy[mode];
  const next = searchParams.get("next") ?? "";
  const [password, setPassword] = useState("");

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight font-semibold tracking-display text-ink">
        {text.title}
      </h1>
      <p className="mt-2 text-[1.02rem] text-muted">{text.subtitle}</p>

      <form action={action} className="mt-8 space-y-5" noValidate>
        <input type="hidden" name="next" value={next} />
        <Field label="Email" error={state.fieldErrors?.email}>
          {(props) => (
            <Input
              {...props}
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              defaultValue={state.email}
              key={state.email}
              autoFocus
              required
            />
          )}
        </Field>
        <Field
          label="Password"
          error={state.fieldErrors?.password}
        >
          {(props) => (
            <PasswordInput
              {...props}
              name="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder={mode === "signup" ? "Something only you know" : "Your password"}
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          )}
        </Field>
        {mode === "signup" && (
          <ul className="-mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5" aria-label="Password requirements">
            {PASSWORD_RULES.map((rule) => {
              const met = rule.test(password);
              return (
                <li
                  key={rule.label}
                  className={cn(
                    "flex items-center gap-1.5 text-xs transition-colors duration-200",
                    met ? "text-sage-600" : "text-subtle",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full transition-colors duration-200",
                      met ? "bg-sage-200" : "bg-sage-100",
                    )}
                  >
                    {met && <CheckIcon size={11} strokeWidth={2.4} className="animate-pop-in" />}
                  </span>
                  {rule.label}
                  <span className="sr-only">{met ? "(met)" : "(not met)"}</span>
                </li>
              );
            })}
          </ul>
        )}

        {state.error && (
          <p role="alert" className="animate-fade-in rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {text.pending}
            </>
          ) : (
            text.submit
          )}
        </Button>
      </form>

      <p className="mt-8 text-center text-[0.95rem] text-muted">
        {text.switchText}{" "}
        <Link
          href={next ? `${text.switchHref}?next=${encodeURIComponent(next)}` : text.switchHref}
          className="font-semibold text-sage-600 underline-offset-4 hover:underline"
        >
          {text.switchLink}
        </Link>
      </p>
    </>
  );
}
