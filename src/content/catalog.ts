/**
 * Exam ↔ Paper → Subject → Unit map, transcribed from the APPSC 2026 notifications
 * (docs/notifications/) and the YUDDAM 2027 overlap masters (docs/syllabus/). Papers are authored once and shared by many exams: the common GS Paper-I
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
  /** Unit / section headings exactly as the notification lists them. */
  syllabus?: string[];
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
  society: {
    id: "society",
    name: "Indian Society",
    hasContent: false,
    units: [
      { title: "Structure: family, marriage, kinship, caste, tribe, ethnicity, religion, women", exams: ["group2"] },
      { title: "Social issues: casteism, communalism, regionalism, crimes against women, child labour, youth unrest", exams: ["group2"] },
      { title: "Welfare mechanisms: policies, programmes, constitutional & statutory safeguards", exams: ["group2", "aswo"] },
    ],
  },
  "civil-core": {
    id: "civil-core",
    name: "Civil Engineering Core",
    hasContent: false,
    units: [
      { title: "Building materials", exams: ["aee-rbi"] },
      { title: "Structural analysis", exams: ["aee-rbi"] },
      { title: "Design of steel structures", exams: ["aee-rbi"] },
      { title: "Design of concrete & masonry structures", exams: ["aee-rbi"] },
      { title: "Construction planning & management (CPM/PERT)", exams: ["aee-rbi"] },
      { title: "Soil mechanics & foundation engineering", exams: ["aee-rbi"] },
      { title: "Highway & transport engineering", exams: ["aee-rbi"] },
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
    syllabus: ["Major current events — International, National, Andhra Pradesh", "General Science in daily life; contemporary S&T and IT", "History of India (social, economic, cultural, political) with focus on AP and the National Movement", "Geography of India with focus on AP", "Indian Polity & Governance: constitutional issues, public policy, reforms, e-Governance", "Indian Economy and Planning", "Sustainable Development and Environmental Protection", "Disaster management: vulnerability, prevention & mitigation, Remote Sensing & GIS", "Logical reasoning, analytical ability and logical interpretation", "Data analysis: tabulation, visual representation, mean/median/mode/variance"],
  },
  "aee-common-2": {
    id: "aee-common-2",
    name: "Paper-2 · Civil & Mechanical Engineering (common to PR & TW, R&B, WRD, PH&ME, RWS)",
    marks: 150,
    subjects: ["engg-core"],
    syllabus: ["Strength of Materials: equilibrium, trusses, friction, stresses & strains, SFD/BMD, bending & shear stresses, principal stresses, columns, torsion, springs, thin & thick cylinders", "Fluid Mechanics & Machinery: statics, kinematics, dynamics, flow measurement, pipe flow, boundary layer, jets & turbines, pumps, hydraulic valves, hydro projects"],
  },
  // Group-2
  "g2-screening": {
    id: "g2-screening",
    name: "Screening Test · General Studies & Mental Ability",
    marks: 150,
    subjects: ["history", "geography", "society", "current", "mental"],
    syllabus: ["Indian History (30): ancient, medieval, modern", "Geography (30): general & physical, economic, human — India & AP", "Indian Society (30): structure, social issues, welfare mechanisms", "Current Affairs (30): international, national, AP", "Mental Ability (30): logical reasoning, mental ability, basic numeracy, data analysis"],
  },
  "g2-mains-1": { id: "g2-mains-1", name: "Mains Paper-I · AP History & Indian Constitution", marks: 150, subjects: ["history", "polity"],
    syllabus: ["A1 · Pre-historic cultures to Andhra Cholas", "A2 · Dynasties of Andhradesa, 11th–16th c.", "A3 · Europeans, 1857, British rule, nationalist & social movements (1885–1947)", "A4 · Andhra Movement and the formation of Andhra State, 1953", "A5 · Formation of AP: Visalandhra, SRC, Gentlemen Agreement, 1956–2014", "B6 · Nature, features, Preamble, FRs, DPSPs, FDs, amendment, basic structure", "B7 · Legislature, Executive, Judiciary; judicial review & activism", "B8 · Union–State distribution of powers; constitutional bodies; NHRC, RTI, Lokpal", "B9 · Centre–State reforms (Rajamannar, Sarkaria, Punchhi); parties; elections; anti-defection", "B10 · Decentralisation: CDP, Balwant Rai Mehta, Ashok Mehta, 73rd & 74th Amendments"] },
  "g2-mains-2": {
    id: "g2-mains-2",
    name: "Mains Paper-II · Indian & AP Economy, Science & Technology",
    marks: 150,
    subjects: ["economy", "scitech", "env"],
    syllabus: ["A1 · Structure of the economy, national income, planning, 1991 reforms, NITI Aayog", "A2 · Money, banking, RBI, inflation, fiscal policy, taxes & GST, budget, BoP, FDI", "A3 · Agriculture, industry and services in India", "A4 · AP economy: GSDP, per-capita income, revenue, expenditure, debt, budget", "A5 · AP agriculture & allied, industry, MSMEs, corridors, services & IT policy", "B1 · Technology missions: STI policy, space, DRDO/IGMDP, ICT & Digital India, cyber security, nuclear", "B2 · Energy management: capacities, policies, biofuels, BS norms, renewables", "B3 · Ecosystem & biodiversity: hotspots, CITES, biosphere reserves, conservation", "B4 · Waste management & pollution control: solid waste, transgenics, bioremediation", "B5 · Environment & health: climate change, conventions, SDGs, disease burden, public health"],
  },
  // Group-1
  "g1-prelims-1": { id: "g1-prelims-1", name: "Screening Paper-I · General Studies", marks: 120, subjects: ["history", "polity", "economy", "geography", "current"],
    syllabus: ["A · History & Culture (30)", "B · Constitution, Polity, Social Justice & International Relations (30)", "C · Indian & AP Economy and Planning (30)", "D · Geography (30)"] },
  "g1-prelims-2": { id: "g1-prelims-2", name: "Screening Paper-II · General Aptitude", marks: 120, subjects: ["mental", "scitech", "current"],
    syllabus: ["A · General Mental Ability, Administrative & Psychological Abilities (60)", "B(i) · Science & Technology (30)", "B(ii) · Current events of regional, national & international importance (30)"] },
  "g1-mains-1": { id: "g1-mains-1", name: "Mains Paper-I · General Essay", marks: 150, subjects: ["essay"] },
  "g1-mains-2": { id: "g1-mains-2", name: "Mains Paper-II · History & Culture of India and AP", marks: 150, subjects: ["history"] },
  "g1-mains-3": { id: "g1-mains-3", name: "Mains Paper-III · Polity, Governance, Law & Ethics", marks: 150, subjects: ["polity"] },
  "g1-mains-4": { id: "g1-mains-4", name: "Mains Paper-IV · Economy & Development of India and AP", marks: 150, subjects: ["economy"] },
  "g1-mains-5": { id: "g1-mains-5", name: "Mains Paper-V · Science, Technology & Environment", marks: 150, subjects: ["scitech", "env"] },
  "g1-qualifying": { id: "g1-qualifying", name: "Qualifying · Telugu & English (150 each)", subjects: ["essay"] },
  // AEE department papers
  "aee-pcb-2": { id: "aee-pcb-2", name: "Paper-II · Common Subject — Environmental Science & Engineering", marks: 150, subjects: ["env", "engg-core"],
    syllabus: ["1 · Ecosystems", "2 · Natural resources", "3 · Biodiversity and biotic resources", "4 · Engineering materials", "5 · Fluid mechanics and hydraulics", "6 · Process calculations and thermodynamics", "7 · Air, water, soil and noise pollution & control technologies", "8 · Solid and industrial waste management", "9 · Global environmental problems, policies and legislations", "10 · Environmental impact assessment towards sustainable development"] },
  "aee-prtw-3": { id: "aee-prtw-3", name: "Paper-3 · Civil & Mechanical (PR & TW) — Drawing, Env. Science, Electrical, Computers", marks: 150, subjects: ["drawing-survey", "env"],
    syllabus: ["1 · Engineering drawing & AutoCAD basics", "2 · Environmental science: natural resources", "3 · Ecosystems", "4 · Biodiversity & conservation; pollution", "5 · Solid waste management", "6 · Disaster management", "7 · Social issues & the environment; environmental Acts", "8 · Human population & the environment", "9 · Principles of electrical & electronic engineering", "10 · Computer fundamentals"] },
  "aee-rbi-3": { id: "aee-rbi-3", name: "Paper-3 · Civil Engineering (R&B, WRD, PH&ME, RWS)", marks: 150, subjects: ["civil-core", "engg-core", "env", "drawing-survey"],
    syllabus: ["1 · Building materials", "2 · Structural analysis", "3 · Design of steel structures", "4 · Design of concrete & masonry structures", "5 · Construction planning & management", "6 · Hydraulics & water resources engineering", "7 · Environmental engineering", "8 · Soil mechanics & foundation engineering", "9 · Surveying & transport engineering"] },
  // Other posts
  "aswo-2": { id: "aswo-2", name: "Paper-II · Social & Cultural History of AP and Welfare Programmes", marks: 150, subjects: ["history", "polity"],
    syllabus: ["1 · Social & cultural history of AP: early dynasties", "2 · Kingdoms of Andhra, 11th–16th c.", "3 · Europeans, 1857 and the freedom movement in Andhra", "4 · Andhra Movement and the Andhra Mahasabhas", "5 · Formation of Andhra Pradesh", "6 · State priorities for welfare and economic development"] },
  "aswo-3": { id: "aswo-3", name: "Paper-III · Constitution & Weaker Sections Welfare", marks: 150, subjects: ["polity"],
    syllabus: ["1 · Nature and salient features of the Constitution", "2 · Legislature, Executive and Judiciary", "3 · Union–State distribution of powers", "4 · Centre–State relations and reform committees", "5 · Amendments; centralisation vs decentralisation", "6 · Political parties and party systems", "7 · Constitutional provisions & welfare mechanisms for SC/ST", "8 · Legislative Acts against social evils"] },
  "eo-2": { id: "eo-2", name: "Paper-II · Hindu Philosophy & Temple System", marks: 150, subjects: ["hindu"],
    syllabus: ["01 · Ramayanam", "02 · Mahabharatham", "03 · Bhagavatham", "04 · Hindu Puranams", "05 · Temple Agamas", "06 · Hindu festivals and classical fine arts", "07 · Vedic culture: yagnas, Vedas, Upavedas", "08 · Philosophies, cults and gurus", "09 · Hindu family structure, adoption, succession", "10 · Sources of income for temples; allocation of funds", "11 · Duties of Executive Officers (Sec. 29 of Act 30/1987)", "12 · Land records and law on endowment lands"] },
  "dm-1": { id: "dm-1", name: "Paper-I · General Studies & Mental Ability (SSC standard)", marks: 150, subjects: ["scitech", "history", "polity", "economy", "env"] },
  "dm-2": { id: "dm-2", name: "Paper-II · ITI (Civil Draughtsman)", marks: 150, subjects: ["drawing-survey"],
    syllabus: ["1 · Drawing (IS 962-1989, layout, lines, lettering, dimensioning, scales, projection)", "2 · Surveying", "3 · Levelling", "4 · Theodolite survey", "5 · Total station", "6 · GPS", "7 · Units, arithmetic, algebra, geometry, mensuration"] },
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
    blurb: "Paper-2 common with R&B / Irrigation; own Paper-3",
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
    name: "AEE Civil – R&B / Irrigation (WRD) & allied",
    short: "AEE · R&B / Irr.",
    blurb: "Also PH&ME and RWS · Paper-2 common with PR & TW; own Paper-3",
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
