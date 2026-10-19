import type { Metadata } from "next";
import { Suspense } from "react";
import { QuotesView } from "@/components/journal/quotes-view";

export const metadata: Metadata = { title: "Quotes" };

export default function QuotesPage() {
  return (
    <Suspense>
      <QuotesView />
    </Suspense>
  );
}
