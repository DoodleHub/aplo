import { LogoMark } from "@/components/brand";
import { Skeleton } from "@/components/ui/skeleton";

export function AppSkeleton() {
  return (
    <div className="min-h-dvh lg:pl-60 xl:pl-64" aria-busy="true" aria-label="Opening your journal">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-sidebar px-5 pt-8 lg:block xl:w-64">
        <div className="ml-1 flex items-center gap-2.5">
          <LogoMark />
          <span className="font-display text-[2.15rem] leading-none font-bold tracking-[-0.05em] text-ink">aplo</span>
        </div>
        <Skeleton className="mt-10 h-12" />
        <Skeleton className="mt-2 h-12 opacity-60" />
        <div className="mt-10 space-y-3 px-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      </aside>
      <div className="mx-auto w-full max-w-[72rem] px-4 pt-6 sm:px-8 lg:px-12">
        <div className="flex justify-end">
          <Skeleton className="h-12 w-full max-w-[20.5rem] rounded-2xl" />
        </div>
        <Skeleton className="mt-12 h-4 w-40" />
        <Skeleton className="mt-3 h-11 w-96 max-w-full" />
        <Skeleton className="mt-9 h-56 rounded-3xl" />
        <div className="mt-12 grid grid-cols-2 gap-4 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
