import Link from "next/link";
import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-9 w-9", className)} aria-hidden="true">
      <path
        d="M20 5.5c3.6 0 6.3 2.2 7 5.2 3.4-.4 6.9 2.3 6.9 6.3 0 1.7-.6 3.1-1.6 4.2 1.5 1.2 2.4 3 2.4 5 0 3.6-3 6.5-6.7 6.5-.9 0-1.7-.2-2.5-.5-1.2 1.5-3.2 2.5-5.5 2.5s-4.3-1-5.5-2.5c-.8.3-1.6.5-2.5.5-3.7 0-6.7-2.9-6.7-6.5 0-2 .9-3.8 2.4-5-1-1.1-1.6-2.5-1.6-4.2 0-4 3.5-6.7 6.9-6.3.7-3 3.4-5.2 7-5.2Z"
        fill="var(--color-sage-400)"
      />
      <circle cx="15.6" cy="19.5" r="1.25" fill="var(--color-ink)" />
      <circle cx="24.4" cy="19.5" r="1.25" fill="var(--color-ink)" />
      <path
        d="M17.2 23.4c.8.9 1.7 1.3 2.8 1.3s2-.4 2.8-1.3"
        stroke="var(--color-ink)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({ href = "/", className }: { href?: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn("group inline-flex items-center gap-2.5 rounded-xl", className)}
      aria-label="aplo home"
    >
      <LogoMark className="transition-transform duration-500 ease-spring group-hover:rotate-[-8deg] group-hover:scale-105" />
      <span className="font-display text-[2.15rem] leading-none font-bold tracking-[-0.05em] text-ink">
        aplo
      </span>
    </Link>
  );
}

/** The cloud friend writing in their journal — hero illustration. */
export function CloudWriter({ className }: { className?: string }) {
  const ink = "var(--color-ink)";
  return (
    <svg
      viewBox="0 0 380 210"
      className={className}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* ground */}
      <path d="M8 170c60-6 120-8 175-6M250 166c40 0 82 3 122 8" stroke="#c9cfbd" strokeWidth="2.2" />

      {/* sparkles */}
      <g className="origin-[38px_68px] animate-twinkle">
        <path d="M38 56c1.5 7 4.5 10 11 12-6.5 2-9.5 5-11 12-1.5-7-4.5-10-11-12 6.5-2 9.5-5 11-12Z" fill="#8fa07f" />
      </g>
      <g className="origin-[305px_36px] animate-twinkle [animation-delay:1.2s]">
        <path d="M305 20c2 9 6 13 15 16-9 3-13 7-15 16-2-9-6-13-15-16 9-3 13-7 15-16Z" fill="#ecd48c" />
      </g>
      <ellipse cx="345" cy="94" rx="7" ry="4.5" fill="#c9bccd" transform="rotate(-12 345 94)" />

      <g className="animate-float">
        {/* cloud body */}
        <path
          d="M118 136c-20 0-34-13-34-30 0-15 11-27 26-29 2-21 19-36 40-36 15 0 28 7 35 19 4-2 8-3 13-3 19 0 33 14 33 32 14 3 24 14 24 27 0 16-13 27-30 27h-26"
          fill="#fffdf6"
          stroke={ink}
          strokeWidth="3"
        />
        <path d="M118 136h18" stroke={ink} strokeWidth="3" />
        {/* face */}
        <circle cx="168" cy="96" r="3.6" fill={ink} />
        <circle cx="203" cy="96" r="3.6" fill={ink} />
        <path d="M177 108c2.8 4 5.5 5.6 8.5 5.6s5.7-1.6 8.5-5.6" stroke={ink} strokeWidth="2.8" />
        <ellipse cx="152" cy="110" rx="9" ry="4.6" fill="#f0bfa6" opacity=".85" />
        <ellipse cx="219" cy="110" rx="9" ry="4.6" fill="#f0bfa6" opacity=".85" />
        {/* little arm */}
        <path d="M125 160c-4-4-9-6-14-6" stroke={ink} strokeWidth="2.6" />
      </g>

      {/* notebook */}
      <path d="M138 140l56 10-6 34-56-10Z" fill="#cfdcbb" stroke={ink} strokeWidth="2.8" />
      <path d="M194 150l60-16 4 36-62 14Z" fill="#dbe5c8" stroke={ink} strokeWidth="2.8" />
      <path d="M146 155l38 6M144 165l30 5M203 155l38-9M204 165l30-7" stroke="#8fa07f" strokeWidth="2" />

      {/* pencil */}
      <g className="origin-[226px_152px] animate-[float_3.5s_ease-in-out_infinite]">
        <path d="M232 92l14 8-26 46-11 4 1-12Z" fill="#ecd48c" stroke={ink} strokeWidth="2.8" />
        <path d="M232 92l14 8 3-5c2-3 1-6-2-8l-3-2c-3-2-6-1-8 2Z" fill="#e8a99a" stroke={ink} strokeWidth="2.8" />
        <path d="M210 138l11 6" stroke={ink} strokeWidth="2.2" />
      </g>

      {/* leaves */}
      <path d="M275 168c-14-6-18-24-8-38 12 8 16 26 8 38Z" fill="#8fa07f" stroke={ink} strokeWidth="2.6" />
      <path d="M278 170c10-10 26-12 36-4-8 12-26 12-36 4Z" fill="#a8b893" stroke={ink} strokeWidth="2.6" />
      <path d="M272 140c2 10 3 20 6 30" stroke={ink} strokeWidth="2" />
    </svg>
  );
}
