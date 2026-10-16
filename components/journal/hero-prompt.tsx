import Link from "next/link";
import { CloudWriter } from "@/components/brand";
import { ArrowUpRightIcon } from "@/components/icons";

export function HeroPrompt() {
  return (
    <section className="relative flex items-end gap-6 overflow-hidden rounded-3xl border border-wash-line bg-wash px-6 py-8 sm:px-10 sm:py-10">
      <div className="relative z-10 max-w-md min-w-0 flex-1">
        <p className="text-eyebrow font-semibold uppercase text-sage-500">A moment to yourself</p>
        <h2 className="mt-3 font-display text-[1.55rem] leading-tight font-semibold tracking-[-0.03em] text-ink sm:text-[1.75rem]">
          How’s your little world today?
        </h2>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-muted">
          You don’t have to have it all figured out.
          <br />
          Start with a thought, a feeling, or a tiny win.
        </p>
        <Link
          href="/new"
          className="group mt-5 inline-flex items-center gap-1.5 rounded-lg py-1 text-[0.95rem] font-semibold text-sage-600"
        >
          Let it out
          <ArrowUpRightIcon
            size={16}
            className="transition-transform duration-300 ease-soft group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </Link>
      </div>
      {/* A flex sibling rather than absolutely placed, so on tablet widths it shrinks beside the text instead of sliding under it. */}
      <CloudWriter className="pointer-events-none -mb-10 ml-auto hidden h-auto w-[45%] max-w-104 shrink-0 md:block" />
    </section>
  );
}
