/**
 * Real exam patterns for mock tests.
 *  - "notification": section sizes are printed in the official notification (e.g. Group-II screening, 5 × 30).
 *  - "past-papers": the notification gives only the paper's size (150 Q / 150 min / −⅓) and syllabus; the split
 *    across subjects follows what past AEE (civil) papers actually asked (src/content/civilWeights.json).
 *  - "assumed": no published split; seats are shared equally.
 */
import weights from "./civilWeights.json";
import { allocate, type PatternSpec } from "@/lib/tests";

export interface ExamPattern extends PatternSpec {
  exams: string[];
  paper: string;
  questions: number;
  basis: "notification" | "past-papers" | "assumed";
  note: string;
}

type W = { subjects: Record<string, { name: string; share: number; chapters: Record<string, number> }> };
const W = weights as unknown as W;

/** Past-paper frequency of a chapter inside its subject (questions per 1000 civil questions asked). */
export function chapterWeight(topic: string): number | undefined {
  for (const s of Object.values(W.subjects)) {
    const hit = s.chapters[topic] ?? s.chapters[topic.replace(/ \(.+\)$/, "")];
    if (hit != null) return hit + 0.5; // +0.5 keeps never-asked chapters reachable
  }
  return undefined;
}

function civilSections(ids: string[], total: number, labels: Record<string, string> = {}) {
  const share = ids.map((id) => W.subjects[id]?.share ?? 0);
  const seats = allocate(share.map((s) => s || 0.001), ids.map(() => total), total);
  return ids.map((id, i) => ({ label: labels[id] ?? W.subjects[id].name, subjects: [id], seats: seats[i] }));
}

const AEE_CIVIL = ["aee-rbi"];
const GS_SECTIONS: [string, string][] = [
  ["current", "Current Affairs"], ["scitech", "Science & Technology"], ["history", "History"], ["geography", "Geography"],
  ["polity", "Indian Polity"], ["economy", "Indian Economy"], ["env", "Environment & Sustainable Development"], ["mental", "Mental Ability & Reasoning"],
];

export const PATTERNS: ExamPattern[] = [
  {
    id: "aee-civil-p3", exams: AEE_CIVIL, paper: "Paper-3 · Civil Engineering", questions: 150, minutes: 150, schemeId: "appsc",
    title: "AEE Civil · Paper-3 (Civil Engineering)", basis: "past-papers",
    note: "150 Q · 150 min · −⅓ (Brief Notification 27/2026, Annexure VII). Seats per subject follow past AEE papers.",
    sections: [
      ...civilSections(["civil-bm", "civil-sa", "civil-ss", "civil-rcc", "civil-cpm", "civil-hyd", "civil-irr", "civil-ee", "civil-geo", "civil-sur", "civil-tra"], 150 - 8),
      // Paper-3 §6 (hydraulics) also covers open-channel flow and similitude from Fluid Mechanics
      { label: "Open channel flow & similitude", subjects: ["civil-fm"], chapters: ["Open Channel Flow", "Dimensional Analysis"], seats: 8 },
    ],
  },
  {
    id: "aee-civil-p2", exams: ["aee-rbi", "aee-prtw"], paper: "Paper-2 · Civil & Mechanical (common)", questions: 150, minutes: 150, schemeId: "appsc",
    title: "AEE · Paper-2 (Strength of Materials, Fluid Mechanics & Machinery)", basis: "past-papers",
    note: "150 Q · 150 min · −⅓. Common to all civil / mechanical AEE posts. Split follows past AEE papers.",
    sections: civilSections(["civil-som", "civil-em", "civil-fm", "civil-hm"], 150),
  },
  {
    id: "g2-screening", exams: ["group2"], paper: "Screening Test", questions: 150, minutes: 150, schemeId: "appsc",
    title: "Group-2 · Screening Test", basis: "notification",
    note: "150 Q · 150 min · −⅓ — five sections of 30 (Group-II Brief Notification).",
    sections: [
      { label: "Indian History", subjects: ["history"], seats: 30 },
      { label: "Geography", subjects: ["geography"], seats: 30 },
      { label: "Indian Society", subjects: ["society"], seats: 30 },
      { label: "Current Affairs", subjects: ["current"], seats: 30 },
      { label: "Mental Ability", subjects: ["mental"], seats: 30 },
    ],
  },
  {
    id: "aee-gs-p1", exams: ["aee-rbi", "aee-prtw", "aee-pcb"], paper: "Paper-1 · General Studies & Mental Ability", questions: 150, minutes: 150, schemeId: "appsc",
    title: "AEE · Paper-1 (General Studies & Mental Ability)", basis: "assumed",
    note: "150 Q · 150 min · −⅓. The notification lists topics but not question counts, so seats are shared across subjects.",
    sections: GS_SECTIONS.map(([id, label], i) => ({ label, subjects: [id], seats: i < 6 ? 19 : 18 })),
  },
];

export function patternsForExam(examId: string | undefined): ExamPattern[] {
  return PATTERNS.filter((p) => !examId || p.exams.includes(examId));
}
