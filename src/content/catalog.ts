/**
 * Exam ↔ Paper → Subject → Unit map, transcribed from the YUDDAM 2027 APPSC overlap masters
 * (docs/syllabus/). Papers are authored once and shared by many exams: the common GS Paper-I
 * (AEE, ASWO/ATWO, Endowment EO) and the AEE common Paper-II (R&B, Irrigation, PR & TW).
 *
 * Question topics come from the data; `ENV_TOPIC_UNITS` maps them onto the syllabus units.
 * Phase 2 moves this into the admin panel.
 */

export type ExamId = "group1" | "group2" | "aee-pcb" | "aee-prtw" | "aee-rbi" | "aswo" | "eo" | "draughtsman";

export interface Exam {
  id: ExamId;
  name: string;
  short: string;
  blurb: string;
  /** Launch-priority exams get content first and are listed first. */
  priority: boolean;
  papers: string[];
  /** Default marking scheme for this exam's mocks. */
  schemeId: string;
}

export interface Paper {
  id: string;
  name: string;
  /** Total marks, where the notification mapping states it. */
  marks?: number;
  subjects: string[];
}

export interface Unit {
  title: string;
  /** Exams whose papers include this unit — the "read once" overlap. */
  exams: ExamId[];
}

export interface Subject {
  id: string;
  name: string;
  /** Whether practice questions exist yet. */
  hasContent: boolean;
  units: Unit[];
}

const ALL_GS: ExamId[] = ["aee-pcb", "aee-prtw", "aee-rbi", "aswo", "eo"];

export const SUBJECTS: Record<string, Subject> = {
  env: {
    id: "env",
    name: "Environmental Science & Ecology",
    hasContent: true,
    units: [
      { title: "Ecosystem structure & functions", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Biodiversity & biotic resources", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Natural resources & energy management", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Environmental pollution & control technologies", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Solid, industrial & e-waste management", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Climate change & global environmental issues", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Environmental policies, conventions & laws", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "EIA, sustainability & social issues", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Human population, health & environment", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Disaster management", exams: ["aee-prtw", ...ALL_GS, "draughtsman"] },
    ],
  },
  scitech: {
    id: "scitech",
    name: "Science & Technology",
    hasContent: false,
    units: [
      { title: "S&T policies, missions, institutes & IPR", exams: ["group2", "group1"] },
      { title: "Space technology (ISRO) & defence (DRDO)", exams: ["group2", "group1"] },
      { title: "ICT, Digital India, e-governance & cyber security", exams: ["group2", "group1"] },
      { title: "Nuclear technology & energy management", exams: ["group2", "group1"] },
      { title: "Biotechnology, nanotech & agri-revolutions", exams: ["group2", "group1"] },
      { title: "Human health, diseases, vaccines & everyday science", exams: ["group2", "group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  polity: {
    id: "polity",
    name: "Indian Constitution, Polity & Welfare",
    hasContent: false,
    units: [
      { title: "Constitutional development, Preamble & rights", exams: ["group2", "aswo", "group1"] },
      { title: "Legislature, executive & judiciary", exams: ["group2", "aswo", "group1"] },
      { title: "Union–State powers & constitutional bodies", exams: ["group2", "aswo", "group1"] },
      { title: "Centre–State reforms, parties & elections", exams: ["group2", "aswo", "group1"] },
      { title: "Amendments & local government (PRI/ULB)", exams: ["group2", "aswo", "group1"] },
      { title: "Welfare of weaker sections & social laws", exams: ["aswo", "group2"] },
      { title: "Polity, public administration, ethics & law (GS line)", exams: [...ALL_GS, "draughtsman", "group1"] },
    ],
  },
  history: {
    id: "history",
    name: "AP & Indian History",
    hasContent: false,
    units: [
      { title: "AP: prehistoric & early dynasties", exams: ["group2", "aswo", "group1"] },
      { title: "AP: medieval Andhradesa (11th–16th c.)", exams: ["group2", "aswo", "group1"] },
      { title: "AP: Europeans, 1857 & freedom struggle", exams: ["group2", "aswo", "group1"] },
      { title: "AP: Andhra movement & the 1953 state", exams: ["group2", "aswo", "group1"] },
      { title: "AP: formation (1956) to bifurcation (2014)", exams: ["group2", "aswo", "group1"] },
      { title: "Indian history: ancient India", exams: ["group2", "group1"] },
      { title: "Indian history: medieval India", exams: ["group2", "group1"] },
      { title: "Indian history: modern India", exams: ["group2", "group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  economy: {
    id: "economy",
    name: "Indian & AP Economy",
    hasContent: false,
    units: [
      { title: "National income, growth, planning & inclusive development", exams: ["group2", "group1"] },
      { title: "Money, banking, public finance, GST & trade", exams: ["group2", "group1"] },
      { title: "Indian agriculture, industry & services", exams: ["group2", "group1"] },
      { title: "AP economy, GSDP, public finance & bifurcation", exams: ["group2", "group1"] },
      { title: "AP agriculture, allied sectors, industry & services", exams: ["group2", "group1"] },
      { title: "Infrastructure (India & AP)", exams: ["group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  geography: {
    id: "geography",
    name: "Geography",
    hasContent: false,
    units: [
      { title: "General & physical geography (world, India, AP)", exams: ["group2", "group1", ...ALL_GS] },
      { title: "Economic & human geography (India & AP)", exams: ["group2", "group1", ...ALL_GS] },
    ],
  },
  current: {
    id: "current",
    name: "Current Affairs",
    hasContent: false,
    units: [{ title: "Regional, national & international events", exams: ["group2", "group1", ...ALL_GS] }],
  },
  mental: {
    id: "mental",
    name: "Mental Ability & Aptitude",
    hasContent: false,
    units: [
      { title: "Logical reasoning & mental ability", exams: ["group2", "group1", ...ALL_GS] },
      { title: "Quantitative aptitude, basic maths & data interpretation", exams: ["group2", "group1", ...ALL_GS] },
    ],
  },
  essay: {
    id: "essay",
    name: "Essay & Qualifying Languages",
    hasContent: false,
    units: [
      { title: "General essay (three essays)", exams: ["group1"] },
      { title: "Qualifying Telugu & English", exams: ["group1"] },
    ],
  },
  hindu: {
    id: "hindu",
    name: "Hindu Philosophy, Temples & Endowments",
    hasContent: false,
    units: [
      { title: "Ramayana", exams: ["eo"] },
      { title: "Mahabharata & the Gita", exams: ["eo"] },
      { title: "Bhagavata Purana", exams: ["eo"] },
      { title: "Hindu philosophy: Vedas, Upanishads & Darshanas", exams: ["eo"] },
      { title: "Agama Sastras: Vaishnava, Saiva & Sakta", exams: ["eo"] },
      { title: "Temple system, rituals, festivals & mathas", exams: ["eo"] },
      { title: "AP Endowments Act 30 of 1987 & administration", exams: ["eo"] },
    ],
  },
  "engg-core": {
    id: "engg-core",
    name: "SOM, Fluid Mechanics & Materials",
    hasContent: false,
    units: [
      { title: "Engineering mechanics, stresses, SFD/BMD & bending", exams: ["aee-prtw", "aee-rbi", "aee-pcb"] },
      { title: "Principal stresses, columns, torsion, springs & shells", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Fluid statics, kinematics, dynamics & pipe flow", exams: ["aee-prtw", "aee-rbi", "aee-pcb"] },
      { title: "Hydraulic turbines, pumps & hydro plants", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Open channel flow, similitude, hydrology & irrigation", exams: ["aee-rbi", "aee-prtw", "aee-pcb"] },
      { title: "Engineering materials & process thermodynamics", exams: ["aee-pcb"] },
    ],
  },
  "drawing-survey": {
    id: "drawing-survey",
    name: "Drawing, Surveying & Computers",
    hasContent: false,
    units: [
      { title: "Engineering drawing, projections & AutoCAD", exams: ["aee-prtw", "draughtsman"] },
      { title: "Surveying fundamentals, levelling & contouring", exams: ["aee-rbi", "draughtsman"] },
      { title: "Theodolite, traversing, total station & GPS", exams: ["aee-rbi", "draughtsman"] },
      { title: "Principles of electrical engineering", exams: ["aee-prtw"] },
      { title: "Computer fundamentals", exams: ["aee-prtw"] },
      { title: "Units, arithmetic, algebra & geometry", exams: ["draughtsman"] },
    ],
  },
};

export const PAPERS: Record<string, Paper> = {
  // Shared
  "gs-common": {
    id: "gs-common",
    name: "Paper-I · General Studies & Mental Ability (common)",
    marks: 150,
    subjects: ["current", "scitech", "history", "geography", "polity", "economy", "env", "mental"],
  },
  "aee-common-2": {
    id: "aee-common-2",
    name: "Paper-II · Civil Engineering (common to R&B, Irrigation, PR & TW)",
    marks: 150,
    subjects: ["engg-core"],
  },
  // Group-2
  "g2-screening": {
    id: "g2-screening",
    name: "Screening Test · History, Geography, Society, Current Affairs, Mental Ability",
    marks: 150,
    subjects: ["history", "geography", "polity", "current", "mental"],
  },
  "g2-mains-1": { id: "g2-mains-1", name: "Mains Paper-I · AP History & Indian Constitution", marks: 150, subjects: ["history", "polity"] },
  "g2-mains-2": {
    id: "g2-mains-2",
    name: "Mains Paper-II · Indian & AP Economy, Science & Technology",
    marks: 150,
    subjects: ["economy", "scitech", "env"],
  },
  // Group-1
  "g1-prelims-1": { id: "g1-prelims-1", name: "Prelims Paper-I · General Studies", subjects: ["history", "polity", "economy", "geography", "current"] },
  "g1-prelims-2": { id: "g1-prelims-2", name: "Prelims Paper-II · Aptitude & Science", subjects: ["mental", "scitech"] },
  "g1-mains-1": { id: "g1-mains-1", name: "Mains Paper-I · General Essay", marks: 150, subjects: ["essay"] },
  "g1-mains-2": { id: "g1-mains-2", name: "Mains Paper-II · History & Culture of India and AP", marks: 150, subjects: ["history"] },
  "g1-mains-3": { id: "g1-mains-3", name: "Mains Paper-III · Polity, Governance, Law & Ethics", marks: 150, subjects: ["polity"] },
  "g1-mains-4": { id: "g1-mains-4", name: "Mains Paper-IV · Economy & Development of India and AP", marks: 150, subjects: ["economy"] },
  "g1-mains-5": { id: "g1-mains-5", name: "Mains Paper-V · Science, Technology & Environment", marks: 150, subjects: ["scitech", "env"] },
  "g1-qualifying": { id: "g1-qualifying", name: "Qualifying · Telugu & English", subjects: ["essay"] },
  // AEE department papers
  "aee-pcb-2": { id: "aee-pcb-2", name: "Paper-II · Environmental Science & Engineering (PCB)", subjects: ["env", "engg-core"] },
  "aee-prtw-3": { id: "aee-prtw-3", name: "Paper-III · PR & Tribal Welfare", subjects: ["drawing-survey", "env"] },
  "aee-rbi-3": { id: "aee-rbi-3", name: "Paper-III · Civil (R&B / Irrigation)", subjects: ["engg-core", "env", "drawing-survey"] },
  // Other posts
  "aswo-2": { id: "aswo-2", name: "Paper-II · AP History & Welfare", subjects: ["history", "polity"] },
  "aswo-3": { id: "aswo-3", name: "Paper-III · Constitution & Weaker Sections Welfare", marks: 150, subjects: ["polity"] },
  "eo-2": { id: "eo-2", name: "Paper-II · Hindu Philosophy, Temples & Endowments Act", marks: 150, subjects: ["hindu"] },
  "dm-1": { id: "dm-1", name: "Paper-I · General Studies", subjects: ["scitech", "history", "polity", "economy", "env"] },
  "dm-2": { id: "dm-2", name: "Paper-II · Drawing, Surveying & Maths", subjects: ["drawing-survey"] },
};

/** In the order the brief lists them; `priority` exams are shown first in pickers. */
export const EXAMS: Exam[] = [
  {
    id: "group2",
    name: "APPSC Group-2",
    short: "Group-2",
    blurb: "Deputy Tahsildar, Municipal Commissioner & other posts",
    priority: true,
    papers: ["g2-screening", "g2-mains-1", "g2-mains-2"],
    schemeId: "appsc",
  },
  {
    id: "aee-pcb",
    name: "AEE – AP Pollution Control Board",
    short: "AEE · PCB",
    blurb: "Assistant Environmental Engineer",
    priority: true,
    papers: ["gs-common", "aee-pcb-2"],
    schemeId: "appsc",
  },
  {
    id: "aee-prtw",
    name: "AEE Civil – Panchayat Raj & Tribal Welfare",
    short: "AEE · PR & TW",
    blurb: "Paper-II common with R&B / Irrigation; own Paper-III",
    priority: true,
    papers: ["gs-common", "aee-common-2", "aee-prtw-3"],
    schemeId: "appsc",
  },
  {
    id: "group1",
    name: "APPSC Group-1",
    short: "Group-1",
    blurb: "Deputy Collector, Municipal Commissioner, DEO & other posts",
    priority: false,
    papers: ["g1-prelims-1", "g1-prelims-2", "g1-mains-1", "g1-mains-2", "g1-mains-3", "g1-mains-4", "g1-mains-5", "g1-qualifying"],
    schemeId: "appsc",
  },
  {
    id: "aee-rbi",
    name: "AEE Civil – R&B / Irrigation",
    short: "AEE · R&B / Irr.",
    blurb: "Paper-II common with PR & TW; own Paper-III",
    priority: false,
    papers: ["gs-common", "aee-common-2", "aee-rbi-3"],
    schemeId: "appsc",
  },
  {
    id: "aswo",
    name: "ASWO / ATWO",
    short: "ASWO / ATWO",
    blurb: "Assistant Social / Tribal Welfare Officer",
    priority: false,
    papers: ["gs-common", "aswo-2", "aswo-3"],
    schemeId: "appsc",
  },
  {
    id: "eo",
    name: "Endowment Executive Officer Grade-III",
    short: "Endowment EO",
    blurb: "Hindu philosophy, temples & the AP Endowments Act",
    priority: false,
    papers: ["gs-common", "eo-2"],
    schemeId: "appsc",
  },
  {
    id: "draughtsman",
    name: "Draughtsman Grade-II",
    short: "Draughtsman",
    blurb: "Drawing, surveying & general studies",
    priority: false,
    papers: ["dm-1", "dm-2"],
    schemeId: "appsc",
  },
];

/** Question-bank topics → Environmental Science syllabus unit (1-based). */
export const ENV_TOPIC_UNITS: Record<string, number> = {
  "Ecology & Ecosystem": 1,
  "Biodiversity & Conservation": 2,
  "Sanctuary / Biosphere Reserve": 2,
  Forest: 2,
  "Non-conventional Energy Sources": 3,
  Pollution: 4,
  "Climate Change & Green House Gases": 6,
  "Ozone Layer": 6,
  "Environment Legislation & Conventions": 7,
  "Environment Conservation": 8,
  "Sustainable Development": 8,
};

export function examById(id: string | undefined): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function papersForExam(examId: string | undefined): Paper[] {
  const exam = examById(examId) ?? EXAMS[0];
  return exam.papers.map((p) => PAPERS[p]).filter(Boolean);
}

/** Subjects reachable from an exam through its papers, de-duplicated. */
export function subjectsForExam(examId: string | undefined): Subject[] {
  const ids = new Set(papersForExam(examId).flatMap((p) => p.subjects));
  return [...ids].map((id) => SUBJECTS[id]).filter(Boolean);
}

/** Other exams that share a paper with this one (e.g. AEE PR & TW ↔ R&B on Paper-II). */
export function examsSharingPaper(paperId: string, except?: string): Exam[] {
  return EXAMS.filter((e) => e.id !== except && e.papers.includes(paperId));
}
