import type { Metadata } from "next";
import { LearnScreen } from "./LearnScreen";

export const metadata: Metadata = { title: "Learn" };

export default function Page() {
  return <LearnScreen />;
}
