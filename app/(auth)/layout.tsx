import { CloudWriter, Logo } from "@/components/brand";
import { FlowerIcon } from "@/components/icons";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-12 lg:flex">
        <Logo />
        <div className="relative">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sage-200/60 blur-3xl" />
          <div className="absolute right-0 bottom-0 h-64 w-64 rounded-full bg-cat-sand/80 blur-3xl" />
          <CloudWriter className="relative mx-auto w-full max-w-md" />
          <h2 className="relative mt-10 max-w-md font-display text-[2.4rem] leading-[1.1] font-semibold tracking-display text-ink">
            A little space for big feelings and small moments.
          </h2>
          <p className="relative mt-4 max-w-sm text-[1.05rem] leading-relaxed text-muted">
            Write it down, tuck it away, come back whenever you need. No pressure, no audience — just you.
          </p>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <FlowerIcon size={14} className="text-ink-soft" />
          A safe place to help declutter your mind.
        </p>
      </aside>
      <main className="flex flex-col px-5 py-8 sm:px-10">
        <Logo className="lg:hidden" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-[24rem] animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
