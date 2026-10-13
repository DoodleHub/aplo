import { Suspense } from "react";
import { CategoryRoute } from "@/components/journal/category-view";

export default function CategoryPage() {
  return (
    <Suspense>
      <CategoryRoute />
    </Suspense>
  );
}
