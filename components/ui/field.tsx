"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EyeIcon } from "@/components/icons";

export const inputStyles =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-[0.95rem] text-ink shadow-soft outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-faint hover:border-line-strong focus:border-sage-400 focus:ring-4 focus:ring-sage-200/70 aria-invalid:border-danger/60 aria-invalid:focus:ring-danger-soft";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(inputStyles, className)} {...props} />;
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: (props: { id: string; "aria-invalid"?: true; "aria-describedby"?: string }) => ReactNode;
}) {
  const id = useId();
  const messageId = `${id}-message`;
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {hint && <span className="text-xs text-subtle">{hint}</span>}
      </div>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error ? messageId : undefined,
      })}
      {error && (
        <p id={messageId} className="animate-fade-in text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordInput(props: ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={visible ? "text" : "password"} className="pr-12" />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-1.5 my-auto flex h-9 w-9 items-center justify-center rounded-lg text-subtle transition-colors hover:bg-sage-100 hover:text-ink"
      >
        <EyeIcon off={visible} size={18} />
      </button>
    </div>
  );
}
