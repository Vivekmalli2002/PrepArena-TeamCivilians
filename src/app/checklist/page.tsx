import type { Metadata } from "next";
import { SyllabusChecklist } from "./SyllabusChecklist";

export const metadata: Metadata = { title: "Syllabus checklist" };

export default function Page() {
  return <SyllabusChecklist />;
}
