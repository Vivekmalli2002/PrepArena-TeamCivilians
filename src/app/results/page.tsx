import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui";
import { ResultsScreen } from "./ResultsScreen";

export const metadata: Metadata = { title: "Results" };

export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <ResultsScreen />
    </Suspense>
  );
}
