import type { Metadata } from "next";
import { DrillScreen } from "./DrillScreen";

export const metadata: Metadata = { title: "60-day drill" };

export default function Page() {
  return <DrillScreen />;
}
