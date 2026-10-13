import { Suspense, type ReactNode } from "react";
import { getJournal } from "@/lib/journal";
import { AppShell } from "@/components/journal/app-shell";
import { AppSkeleton } from "@/components/journal/app-skeleton";
import { JournalProvider } from "@/components/journal/store";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<AppSkeleton />}>
      <Journal>{children}</Journal>
    </Suspense>
  );
}

async function Journal({ children }: { children: ReactNode }) {
  const { user, categories, entries, timeZone } = await getJournal();
  return (
    <JournalProvider
      user={user}
      initialCategories={categories}
      initialEntries={entries}
      initialTimeZone={timeZone}
      now={new Date().toISOString()}
    >
      <AppShell>{children}</AppShell>
    </JournalProvider>
  );
}
