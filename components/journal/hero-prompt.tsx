import Link from "next/link";
import { CloudWriter } from "@/components/brand";
import { ArrowUpRightIcon } from "@/components/icons";

export function HeroPrompt() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-wash-line bg-wash px-6 py-8 sm:px-10 sm:py-10">
      <div className="relative z-10 max-w-md">
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
      <CloudWriter className="pointer-events-none absolute right-4 bottom-0 hidden h-[88%] w-auto md:right-10 md:block lg:right-16" />
    </section>
  );
}
