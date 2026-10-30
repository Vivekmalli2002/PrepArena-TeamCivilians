/**
 * Exam ↔ Paper → Subject map. Papers are authored once and shared by many exams
 * (e.g. the GS paper and AEE Paper 2). Topics/sub-topics come from the question data.
 *
 * Paper names follow the APPSC pattern as understood at build time — confirm against
 * the latest notification before Phase 2 makes this admin-editable.
 */

export interface Exam {
  id: string;
  name: string;
  short: string;
  blurb: string;
  status: "launch" | "later";
  papers: string[];
  /** Default marking scheme for this exam's mocks. */
  schemeId: string;
}

export interface Paper {
  id: string;
  name: string;
  subjects: string[];
}

export interface Subject {
  id: string;
  name: string;
  /** Whether questions exist yet. */
  hasContent: boolean;
}

export const SUBJECTS: Record<string, Subject> = {
  "env-ecology": { id: "env-ecology", name: "Environment & Ecology", hasContent: true },
  "indian-polity": { id: "indian-polity", name: "Indian Polity", hasContent: false },
  "ap-history": { id: "ap-history", name: "History & Culture of AP", hasContent: false },
  "economy": { id: "economy", name: "Indian & AP Economy", hasContent: false },
  "mental-ability": { id: "mental-ability", name: "Mental Ability", hasContent: false },
  "civil-engg": { id: "civil-engg", name: "Civil Engineering", hasContent: false },
  "env-engg": { id: "env-engg", name: "Environmental Engineering", hasContent: false },
};

export const PAPERS: Record<string, Paper> = {
  "gs-ma": {
    id: "gs-ma",
    name: "General Studies & Mental Ability",
    subjects: ["env-ecology", "indian-polity", "ap-history", "economy", "mental-ability"],
  },
  "aee-civil-common": {
    id: "aee-civil-common",
    name: "AEE Paper 2 · Civil Engineering (common)",
    subjects: ["civil-engg"],
  },
  "aee-pcb-dept": {
    id: "aee-pcb-dept",
    name: "AEE PCB · Environmental Engineering",
    subjects: ["env-engg", "env-ecology"],
  },
  "aee-prtw-dept": { id: "aee-prtw-dept", name: "AEE PR & Tribal · Paper 3", subjects: ["civil-engg"] },
  "aee-rbi-dept": { id: "aee-rbi-dept", name: "AEE R&B / Irrigation · Paper 3", subjects: ["civil-engg"] },
};

export const EXAMS: Exam[] = [
  {
    id: "group2",
    name: "APPSC Group-2",
    short: "Group-2",
    blurb: "Deputy Tahsildar, Municipal Commissioner & allied",
    status: "launch",
    papers: ["gs-ma"],
    schemeId: "appsc",
  },
  {
    id: "aee-pcb",
    name: "AEE – AP Pollution Control Board",
    short: "AEE · PCB",
    blurb: "Assistant Environmental Engineer",
    status: "launch",
    papers: ["gs-ma", "aee-pcb-dept"],
    schemeId: "appsc",
  },
  {
    id: "aee-prtw",
    name: "AEE – Panchayat Raj & Tribal Welfare",
    short: "AEE · PR & TW",
    blurb: "Paper 2 shared with R&B / Irrigation",
    status: "launch",
    papers: ["gs-ma", "aee-civil-common", "aee-prtw-dept"],
    schemeId: "appsc",
  },
  {
    id: "group1",
    name: "APPSC Group-1",
    short: "Group-1",
    blurb: "DC, Municipal Commissioner, DEO & allied",
    status: "later",
    papers: ["gs-ma"],
    schemeId: "appsc",
  },
  {
    id: "aee-rbi",
    name: "AEE Civil – R&B / Irrigation",
    short: "AEE · R&B",
    blurb: "Shares Paper 2 with PR & Tribal",
    status: "later",
    papers: ["gs-ma", "aee-civil-common", "aee-rbi-dept"],
    schemeId: "appsc",
  },
  {
    id: "allied",
    name: "ASWO / ATWO, Endowment EO, Draughtsman",
    short: "Allied posts",
    blurb: "Grade-II / Grade-III posts",
    status: "later",
    papers: ["gs-ma"],
    schemeId: "appsc",
  },
];

export function examById(id: string | undefined): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

/** Subjects reachable from an exam through its papers, de-duplicated. */
export function subjectsForExam(examId: string | undefined): Subject[] {
  const exam = examById(examId) ?? EXAMS[0];
  const ids = new Set(exam.papers.flatMap((p) => PAPERS[p]?.subjects ?? []));
  return [...ids].map((id) => SUBJECTS[id]).filter(Boolean);
}
