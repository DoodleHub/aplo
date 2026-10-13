import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "soft" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,transform] duration-200 ease-soft active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-sage-600 text-on-accent shadow-button hover:bg-sage-700 active:shadow-[inset_0_-1px_0_rgb(0_0_0/0.18)]",
  soft: "bg-sage-100 text-sage-600 hover:bg-sage-200",
  ghost: "text-ink-soft hover:bg-sage-100 hover:text-ink",
  outline: "border border-line bg-surface text-ink hover:border-line-strong hover:bg-sage-50",
  danger: "bg-danger text-on-accent shadow-[inset_0_-3px_0_rgb(0_0_0/0.16)] hover:brightness-95",
};

const sizes: Record<Size, string> = {
  sm: "h-9 rounded-lg px-3.5 text-sm",
  md: "h-11 rounded-xl px-5 text-[0.95rem]",
  lg: "h-[3.25rem] rounded-2xl px-6 text-base",
};

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}) {
  return cn(base, variants[variant], sizes[size], className);
}

type Common = { variant?: Variant; size?: Size; icon?: ReactNode };

export function Button({
  variant,
  size,
  icon,
  className,
  children,
  type = "button",
  ...props
}: ComponentProps<"button"> & Common) {
  return (
    <button type={type} className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </button>
  );
}

export function ButtonLink({
  variant,
  size,
  icon,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & Common) {
  return (
    <Link className={buttonStyles({ variant, size, className })} {...props}>
      {icon}
      {children}
    </Link>
  );
}

export function IconButton({
  label,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-sage-100 hover:text-ink active:scale-95 disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
