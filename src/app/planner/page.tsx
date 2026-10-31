import type { Metadata } from "next";
import { PlannerScreen } from "./PlannerScreen";

export const metadata: Metadata = { title: "Study planner" };

export default function Page() {
  return <PlannerScreen />;
}
