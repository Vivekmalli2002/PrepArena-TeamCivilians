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

type Sec = PatternSpec["sections"][number];
/** Topics about Andhra Pradesh history (topic names start with "AP" or mention Andhra). */
const AP_HISTORY = "(^|\\W)AP(\\W|$)|Andhra";
const sec = (label: string, subjects: string[], seats: number, more: Partial<Sec> = {}): Sec => ({ label, subjects, seats, ...more });

/** General Studies & Mental Ability paper shared by AEE PCB and AEE Civil (150 Q). */
const AEE_GS: Sec[] = [
  sec("History", ["history"], 15), sec("Geography", ["geography"], 15), sec("Polity", ["polity"], 15), sec("Economy", ["economy"], 15),
  sec("General Science", ["scitech"], 25), sec("Current Affairs", ["current"], 20),
  sec("Environment & Sustainable Development", ["env"], 15, { topicMatch: "^(?!.*disaster)" }),
  sec("Disaster Management", ["env", "geography", "current"], 10, { topicMatch: "disaster" }),
  sec("Mental Ability & Data Analysis", ["mental"], 20),
];
/** General Studies & Mental Ability paper shared by ASWO/ATWO and Endowment EO (150 Q). */
const WELFARE_GS: Sec[] = [
  sec("History", ["history"], 20), sec("Geography", ["geography"], 15), sec("Polity", ["polity"], 20), sec("Economy", ["economy"], 15),
  sec("General Science", ["scitech"], 20), sec("Environment", ["env"], 15), sec("Current Affairs", ["current"], 20), sec("Mental Ability", ["mental"], 25),
];
const CIVIL_ALL = ["civil-em", "civil-som", "civil-fm", "civil-hm", "civil-bm", "civil-sa", "civil-rcc", "civil-ss", "civil-cpm", "civil-geo", "civil-ee", "civil-hyd", "civil-irr", "civil-sur", "civil-tra", "civil-est", "civil-gel"];

const P = (p: Omit<ExamPattern, "questions" | "schemeId"> & { schemeId?: string }): ExamPattern => ({
  schemeId: "appsc",
  ...p,
  questions: p.sections.reduce((n, x) => n + x.seats, 0),
});

export const PATTERNS: ExamPattern[] = [
  // ---- APPSC Group-1 Prelims
  P({ id: "g1-p1", exams: ["group1"], paper: "Prelims Paper-I · General Studies", title: "Group-1 Prelims · Paper-I (General Studies)", minutes: 120, basis: "notification",
    note: "120 Q · 120 marks · −⅓. Four sections of 30.",
    sections: [sec("History & Culture", ["history"], 30), sec("Constitution, Polity, Social Justice & IR", ["polity"], 30), sec("Indian & AP Economy and Planning", ["economy"], 30), sec("Geography", ["geography"], 30)] }),
  P({ id: "g1-p2", exams: ["group1"], paper: "Prelims Paper-II · General Aptitude", title: "Group-1 Prelims · Paper-II (General Aptitude)", minutes: 120, basis: "notification",
    note: "120 Q · 120 marks · −⅓. Mental ability 60 + Science & Technology 30 + Current Affairs 30.",
    sections: [sec("General Mental Ability, Administrative & Psychological Abilities", ["mental"], 60), sec("Science & Technology", ["scitech"], 30), sec("Current Affairs", ["current"], 30)] }),
  // ---- APPSC Group-2
  P({ id: "g2-screening", exams: ["group2"], paper: "Prelims (Screening Test)", title: "Group-2 · Prelims (Screening Test)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓ — five sections of 30.",
    sections: [sec("Indian History", ["history"], 30), sec("Indian & AP Geography", ["geography"], 30), sec("Indian Society", ["society"], 30), sec("Current Affairs", ["current"], 30), sec("Mental Ability", ["mental"], 30)] }),
  P({ id: "g2-mains-1", exams: ["group2"], paper: "Mains Paper-I", title: "Group-2 · Mains Paper-I (AP History & Constitution)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓ — AP social & cultural history 75, Indian Constitution & Polity 75.",
    sections: [sec("AP Social & Cultural History", ["history"], 75, { topicMatch: AP_HISTORY }), sec("Indian Constitution & Polity", ["polity"], 75)] }),
  P({ id: "g2-mains-2", exams: ["group2"], paper: "Mains Paper-II", title: "Group-2 · Mains Paper-II (Economy, Science & Technology)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓ — Economy 75, Science & Technology 75 (General S&T 50 + Environment & Ecology 25).",
    sections: [sec("Indian & AP Economy", ["economy"], 75), sec("General Science & Technology", ["scitech"], 50), sec("Environment & Ecology", ["env"], 25)] }),
  // ---- AEE PCB
  P({ id: "aee-pcb-p1", exams: ["aee-pcb"], paper: "Paper-I · GS & Mental Ability", title: "AEE PCB · Paper-I (GS & Mental Ability)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. History 15, Geography 15, Polity 15, Economy 15, General Science 25, Current Affairs 20, Environment 15, Disaster Management 10, Mental Ability 20.",
    sections: AEE_GS }),
  P({ id: "aee-pcb-p3", exams: ["aee-pcb"], paper: "Paper-III · Environmental Science & Technology", title: "AEE PCB · Paper-III (Environmental Science & Technology)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Ten syllabus units × 15 questions.",
    sections: Array.from({ length: 10 }, (_, i) => sec(`Unit ${i + 1}`, ["env"], 15, { units: [i + 1] })) }),
  // ---- AEE Civil (R&B / Irrigation / Panchayat Raj / Tribal Welfare)
  P({ id: "aee-civil-p1", exams: ["aee-rbi", "aee-prtw"], paper: "Paper-I · GS & Mental Ability", title: "AEE Civil · Paper-I (GS & Mental Ability)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Same distribution as AEE PCB Paper-I.", sections: AEE_GS }),
  P({ id: "aee-civil-p2", exams: ["aee-rbi", "aee-prtw"], paper: "Paper-II · Common Engineering", title: "AEE Civil · Paper-II (Strength of Materials, Fluid Mechanics)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Strength of Materials 75 + Fluid Mechanics 75.",
    sections: [sec("Strength of Materials", ["civil-som"], 75), sec("Fluid Mechanics & Machinery", ["civil-fm", "civil-hm"], 75)] }),
  P({ id: "aee-civil-p3", exams: ["aee-rbi"], paper: "Paper-III · Civil Engineering", title: "AEE Civil · Paper-III (Civil Engineering)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Chapter mix inside each subject follows past AEE papers.",
    sections: [
      sec("Strength of Materials", ["civil-som"], 15), sec("Structural Analysis", ["civil-sa"], 15), sec("Reinforced Cement Concrete", ["civil-rcc"], 15),
      sec("Fluid Mechanics & Hydraulics", ["civil-fm", "civil-hm"], 15), sec("Hydrology & Irrigation", ["civil-hyd", "civil-irr"], 15),
      sec("Environmental Engineering", ["civil-ee"], 15), sec("Transportation Engineering", ["civil-tra"], 15), sec("Geotechnical Engineering", ["civil-geo"], 15),
      sec("Engineering Mechanics", ["civil-em"], 10), sec("Design of Steel Structures", ["civil-ss"], 10), sec("Surveying", ["civil-sur"], 5),
      sec("Construction Materials & Management", ["civil-bm", "civil-cpm"], 5),
    ] }),
  P({ id: "aee-prtw-p3", exams: ["aee-prtw"], paper: "Paper-III · Drawing, Environment, Electrical & Computers", title: "AEE PR & TW · Paper-III (Drawing, Environmental Science, Electrical, Computers)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Disaster Management 15, Engineering Drawing 15, Basic Electrical 15, Computing 15, and 90 on Environmental Science (six areas × 15). Paper-II is common with R&B / Irrigation.",
    sections: [
      sec("Disaster Management", ["env", "geography", "current"], 15, { topicMatch: "disaster" }),
      sec("Engineering Drawing", ["drawing-survey"], 15), sec("Basic Electrical Engineering", ["electrical"], 15), sec("Computing (computer fundamentals)", ["computers"], 15),
      sec("Env. Science · Natural resources", ["env"], 15, { topicMatch: "resource|energy|coal|petroleum|biofuel|hydropower|nuclear|forest|water" }),
      sec("Env. Science · Ecosystems", ["env"], 15, { topicMatch: "ecolog|ecosystem" }),
      sec("Env. Science · Biodiversity & conservation", ["env"], 15, { topicMatch: "biodivers|sanctuary|biosphere|conservation|wildlife" }),
      sec("Env. Science · Pollution & solid waste", ["env"], 15, { topicMatch: "pollution|waste" }),
      sec("Env. Science · Social issues & environmental Acts", ["env"], 15, { topicMatch: "legislation|convention|sustainable|climate|ozone|impact|policy|social|general environment" }),
      sec("Env. Science · Human population & environment", ["env"], 15, { topicMatch: "population|health|human|issues|urban|general environment" }),
    ] }),
  // ---- ASWO / ATWO
  P({ id: "aswo-p1", exams: ["aswo"], paper: "Paper-I · GS & Mental Ability", title: "ASWO / ATWO · Paper-I (GS & Mental Ability)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. History 20, Geography 15, Polity 20, Economy 15, General Science 20, Environment 15, Current Affairs 20, Mental Ability 25.", sections: WELFARE_GS }),
  P({ id: "aswo-p2", exams: ["aswo"], paper: "Paper-II · Social & Cultural History of AP and Welfare Mechanisms", title: "ASWO / ATWO · Paper-II (AP History & Welfare mechanisms)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. AP social & cultural history 135 + welfare mechanisms 15.",
    sections: [sec("AP Social & Cultural History", ["history"], 135, { topicMatch: AP_HISTORY }), sec("Welfare mechanisms", ["society", "polity"], 15, { topicMatch: "welfare" })] }),
  P({ id: "aswo-p3", exams: ["aswo"], paper: "Paper-III · Constitution, Polity & Welfare Mechanisms", title: "ASWO / ATWO · Paper-III (Polity & Welfare mechanisms)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Indian Constitution & Polity 135 + welfare mechanisms 15.",
    sections: [sec("Indian Constitution & Polity", ["polity"], 135), sec("Welfare mechanisms", ["society", "polity"], 15, { topicMatch: "welfare" })] }),
  // ---- Endowment EO Grade-III
  P({ id: "eo-p1", exams: ["eo"], paper: "Paper-I · GS & Mental Ability", title: "Endowment EO · Paper-I (GS & Mental Ability)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Same distribution as ASWO / ATWO Paper-I.", sections: WELFARE_GS }),
  P({ id: "eo-p2", exams: ["eo"], paper: "Paper-II · Hindu Philosophy & Religious Studies", title: "Endowment EO · Paper-II (Hindu Philosophy & Temple System)", minutes: 150, basis: "assumed",
    note: "150 Q · 150 min · −⅓. Needs a Hindu-philosophy question bank, which is not loaded yet.",
    sections: [sec("Vedas, Upanishads, Puranas, Agamas, temple architecture & legislation", ["hindu"], 150)] }),
  // ---- Draughtsman Grade-II
  P({ id: "draughtsman-p1", exams: ["draughtsman"], paper: "Paper-I · General Studies & Mental Ability", title: "Draughtsman Grade-II · Paper-I (GS & Mental Ability)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. The same GS distribution as the other technical exams (AEE).", sections: AEE_GS }),
  P({ id: "draughtsman-p2", exams: ["draughtsman"], paper: "Paper-II · Surveying, Drawing & ITI Basic Maths", title: "Draughtsman Grade-II · Paper-II (Surveying, Drawing, ITI Maths)", minutes: 150, basis: "notification",
    note: "150 Q · 150 min · −⅓. Surveying 90, Engineering Drawing 15, ITI basic mathematics 45.",
    sections: [
      sec("Surveying", ["civil-sur"], 90), sec("Engineering Drawing", ["drawing-survey"], 15),
      sec("ITI Basic Mathematics", ["mental"], 45, { topicMatch: "quantitative|percent|ratio|time|average|interest|number|maths|aptitude" }),
    ] }),
  // ---- SSC JE Civil (not an exam in the app's picker; shown under "Other exams")
  P({ id: "ssc-je-p1", exams: [], paper: "Paper-I", title: "SSC JE Civil · Paper-I", minutes: 120, schemeId: "1-025", basis: "notification",
    note: "200 Q · 200 marks · −¼. Reasoning 50, General Awareness 50, Civil Engineering 100.",
    sections: [
      sec("General Intelligence & Reasoning", ["mental"], 50), sec("General Awareness", ["current", "history", "geography", "polity", "economy", "scitech", "env"], 50),
      ...civilSections(CIVIL_ALL, 100).map((x) => ({ ...x, label: `Civil · ${x.label}` })),
    ] }),
  P({ id: "ssc-je-p2", exams: [], paper: "Paper-II", title: "SSC JE Civil · Paper-II (Civil Engineering)", minutes: 120, schemeId: "1-025", basis: "past-papers",
    note: "300 Q · 300 marks · −¼. All of it Civil Engineering; subject mix follows past AEE civil papers.",
    sections: civilSections(CIVIL_ALL, 300) }),
];

export function patternsForExam(examId: string | undefined): ExamPattern[] {
  return PATTERNS.filter((p) => !examId || p.exams.includes(examId));
}

/** Blueprints that are not part of the student's own exam. */
export function otherPatterns(examId: string | undefined): ExamPattern[] {
  return PATTERNS.filter((p) => !examId || !p.exams.includes(examId));
}
