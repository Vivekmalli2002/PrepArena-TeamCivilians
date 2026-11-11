import type { Metadata } from "next";
import { CalendarScreen } from "./CalendarScreen";

export const metadata: Metadata = { title: "Exam calendar" };

export default function Page() {
  return <CalendarScreen />;
}
