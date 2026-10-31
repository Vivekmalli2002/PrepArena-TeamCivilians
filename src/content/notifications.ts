/**
 * Recruitment facts per exam, transcribed from the APPSC notifications in docs/notifications/.
 * Only what the notifications state is recorded here; anything they leave open is marked so,
 * never guessed. Update this file when APPSC issues a detailed notification or corrigendum.
 */
import type { ExamId } from "./catalog";

export interface Post {
  name: string;
  vacancies: number | string;
  pay: string;
  age?: string;
}

export interface PaperRow {
  paper: string;
  subject: string;
  questions?: number;
  minutes: number;
  marks: number;
  note?: string;
}

export interface Stage {
  name: string;
  mode: string;
  papers: PaperRow[];
  note?: string;
}

export interface Notification {
  examId: ExamId;
  title: string;
  number: string;
  /** Notification date (DD/MM/YYYY as printed). */
  dated: string;
  kind: "detailed" | "brief";
  /** ISO dates for computing "open / closed". */
  apply: { from: string; to: string };
  totalVacancies: number;
  posts: Post[];
  qualification: string[];
  age: { range: string; asOn: string; relaxation: string[] };
  fee: string[];
  stages: Stage[];
  negativeMarking: string;
  selection: string[];
  /** Minimum qualifying marks on aggregate, where the notification prints them. */
  minQualifying?: { category: string; percent: number }[];
  examDate?: string;
  centres?: string;
  extra?: string[];
  pdf: string;
}

const RELAXATION = [
  "SC, ST, BC & EWS: 5 years",
  "Persons with Benchmark Disabilities (PBD): 10 years",
  "Ex-Servicemen: 3 years plus length of service in the armed forces",
  "Regular AP State Government employees: length of regular service, up to 5 years",
  "N.C.C. instructors: length of service as instructor plus 3 years",
];

const STANDARD_FEE = (examFee: number) => [
  `₹250 application processing fee + ₹${examFee} examination fee.`,
  `Exempt from the ₹${examFee} exam fee: SC, ST, BC, PBD and Ex-Servicemen; white-card (BPL) families of AP; unemployed youth (G.O.Ms.No.439, 1996).`,
  `Applicants from other States pay both fees and cannot claim reservation.`,
];

const MIN_QUALIFYING = [
  { category: "OC, Sportspersons, Ex-Servicemen & EWS", percent: 40 },
  { category: "Backward Classes", percent: 35 },
  { category: "SC, ST & PBD", percent: 30 },
];

const NEGATIVE = "−⅓ mark for each wrong answer (G.O.Ms.No.235, Finance, 06/12/2016). Unanswered: 0.";

const CPT = "Shortlisted candidates must qualify the Computer Proficiency Test (practical, 60 min, 100 marks; qualifying marks OC 40, BC 35, SC/ST/PBD 30).";

export const NOTIFICATIONS: Notification[] = [
  {
    examId: "group2",
    title: "Group-II Services",
    number: "Brief Notification No. 37/2026",
    dated: "13/10/2026",
    kind: "brief",
    apply: { from: "2026-11-10", to: "2026-11-30" },
    totalVacancies: 686,
    posts: [
      { name: "Municipal Commissioner Grade-III", vacancies: 6, pay: "45,830–1,30,580" },
      { name: "Sub-Registrar Grade-II", vacancies: 7, pay: "44,570–1,27,480" },
      { name: "Deputy Tahsildar (A.P. Revenue Service)", vacancies: 200, pay: "44,570–1,27,480" },
      { name: "GST Officer (erstwhile ACTO)", vacancies: 40, pay: "45,830–1,30,580" },
      { name: "Assistant Registrar of Cooperative Societies", vacancies: 10, pay: "45,830–1,30,580" },
      { name: "Deputy Mandal Parishad Development Officer (PR & RD)", vacancies: 176, pay: "45,830–1,30,580" },
      { name: "Prohibition & Excise Sub-Inspector", vacancies: 29, pay: "40,970–1,24,380" },
      { name: "Assistant Section Officer (GAD), Secretariat", vacancies: 71, pay: "40,970–1,24,380" },
      { name: "Assistant Section Officer (Finance), Secretariat", vacancies: 5, pay: "40,970–1,24,380" },
      { name: "Assistant Section Officer (Law), Secretariat", vacancies: 4, pay: "40,970–1,24,380" },
      { name: "Senior Accountant (Treasuries & Accounts)", vacancies: 90, pay: "34,580–1,07,210" },
      { name: "Junior Accountant (Treasuries & Accounts)", vacancies: 48, pay: "25,220–80,910" },
    ],
    qualification: [
      "Posts 1–8: a Bachelor's degree from a recognised university (Sub-Registrar: a Law degree gets preference).",
      "ASO (Finance): degree in Mathematics, Economics or Commerce. ASO (Law): Bachelor's degree in Law.",
      "Senior / Junior Accountant: degree in Commerce, Economics or Mathematics (or any degree), plus a BTET certificate course in Office Automation / PC Maintenance / Web Designing, or a computer degree (BCA, B.Sc/B.Com/B.A Computers, B.Tech CSE/IT).",
      "Prohibition & Excise SI: physical requirements as per the detailed notification.",
      "Qualification is reckoned on the date of the detailed notification.",
    ],
    age: { range: "As per detailed notification", asOn: "—", relaxation: RELAXATION },
    fee: ["Fee details will be in the detailed notification (on or before 10/11/2026)."],
    stages: [
      {
        name: "Screening Test",
        mode: "Offline · OMR · objective (degree standard)",
        papers: [{ paper: "Screening", subject: "General Studies & Mental Ability", questions: 150, minutes: 150, marks: 150 }],
        note: "Sections of 30 marks each: Indian History, Geography, Indian Society, Current Affairs, Mental Ability.",
      },
      {
        name: "Main Examination",
        mode: "Objective (degree standard)",
        papers: [
          { paper: "Paper-I", subject: "Social & Cultural History of AP (75) + Indian Constitution (75)", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-II", subject: "Indian & AP Economy (75) + Science & Technology (75)", questions: 150, minutes: 150, marks: 150 },
        ],
      },
      {
        name: "Computer Proficiency Test",
        mode: "Practical · qualifying",
        papers: [{ paper: "CPT", subject: "Office automation", minutes: 60, marks: 100, note: "Qualifying" }],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: [
      "Screening Test marks only shortlist candidates for the Main Examination.",
      "Merit is decided on the Main Examination (300 marks).",
      CPT,
    ],
    extra: ["The detailed notification (vacancy break-up, age, community, instructions) is due on or before 10/11/2026 and its date is the crucial date for all purposes."],
    pdf: "Group_-_II_Brief_Notification.pdf",
  },
  {
    examId: "aee-pcb",
    title: "Assistant Environmental Engineer, A.P. Pollution Control Board",
    number: "Notification No. 08/2026",
    dated: "06/10/2026",
    kind: "detailed",
    apply: { from: "2026-10-06", to: "2026-10-27" },
    totalVacancies: 41,
    posts: [{ name: "Assistant Environmental Engineer (state-wide)", vacancies: "41 (incl. 1 carried forward)", pay: "57,100–1,47,760", age: "18–44" }],
    qualification: [
      "B.E / B.Tech in Civil, Mechanical, Chemical or Environmental Engineering from a recognised university, or a pass in Sections A & B of AMIE (India) Civil.",
    ],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: STANDARD_FEE(80),
    stages: [
      {
        name: "Written Examination",
        mode: "Online CBRT · objective (degree standard)",
        papers: [
          { paper: "Paper-I", subject: "General Studies & Mental Ability", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-II", subject: "Common subject — Environmental Science & Engineering (10 units)", questions: 150, minutes: 150, marks: 150 },
        ],
        note: "Scores are normalised and announced on a percentile basis if the CBRT runs in several sessions.",
      },
      {
        name: "Computer Proficiency Test",
        mode: "Practical · qualifying",
        papers: [{ paper: "CPT", subject: "Office automation", minutes: 60, marks: 100, note: "Qualifying" }],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the written examination (300 marks), subject to qualifying the CPT.", "Appearance in all papers is compulsory."],
    minQualifying: MIN_QUALIFYING,
    centres: "Visakhapatnam, Vijayawada, Tirupati, Ananthapuramu (choose 3 preferences).",
    extra: ["A mock CBRT is available on the APPSC website — practise the interface before the exam."],
    pdf: "Assistan_Environmental_Engineer_08-2026.pdf",
  },
  {
    examId: "aee-prtw",
    title: "Assistant Executive Engineer — Panchayat Raj & Tribal Welfare",
    number: "Brief Notification No. 27/2026 (revised)",
    dated: "13/10/2026",
    kind: "brief",
    apply: { from: "2026-11-02", to: "2026-11-22" },
    totalVacancies: 106,
    posts: [
      { name: "AEE, Panchayat Raj & Rural Development Engineering", vacancies: 100, pay: "57,100–1,47,760", age: "18–44" },
      { name: "AEE (Civil / Mech), Tribal Welfare Engineering", vacancies: 6, pay: "57,100–1,47,760", age: "18–44" },
    ],
    qualification: [
      "Bachelor's degree in Civil or Mechanical Engineering, or a pass in Sections A & B of AMIE in Civil/Mechanical (Panchayat Raj also accepts AMIE + B.Sc (Engg) of Ranchi University).",
    ],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: ["Fee details will be in the detailed notification (on or before 02/11/2026)."],
    stages: [
      {
        name: "Single-level Examination",
        mode: "Online CBRT · objective (degree standard) · no screening test",
        papers: [
          { paper: "Paper-1", subject: "General Studies & Mental Ability (all post codes)", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-2", subject: "Civil & Mechanical Engineering — common (SOM, Fluid Mechanics & Machinery)", questions: 150, minutes: 150, marks: 150 },
          {
            paper: "Paper-3",
            subject: "Civil & Mechanical (common) — Drawing, Environmental Science, Electrical & Electronics, Computers",
            questions: 150,
            minutes: 150,
            marks: 150,
            note: "Held in a separate session for PR & TW",
          },
        ],
        note: "Marks are normalised if the exam runs in several sessions.",
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the single-level examination (450 marks).", "Candidates appear in the papers of their own engineering branch."],
    extra: ["Paper-2 is common with AEE R&B / Irrigation; Paper-3 differs."],
    pdf: "Revised_AEE_1.pdf",
  },
  {
    examId: "aee-rbi",
    title: "Assistant Executive Engineer — R&B / Water Resources (and allied)",
    number: "Brief Notification No. 27/2026 (revised)",
    dated: "13/10/2026",
    kind: "brief",
    apply: { from: "2026-11-02", to: "2026-11-22" },
    totalVacancies: 393,
    posts: [
      { name: "AEE, Public Health & Municipal Engineering", vacancies: 21, pay: "57,100–1,47,760", age: "18–44" },
      { name: "AEE, Rural Water Supply & Sanitation", vacancies: 73, pay: "57,100–1,47,760", age: "18–44" },
      { name: "AEE (Civil), Roads & Buildings", vacancies: 75, pay: "57,100–1,47,760", age: "18–44" },
      { name: "AEE (Civil & Mech), Water Resources", vacancies: 224, pay: "57,100–1,47,760", age: "18–44" },
    ],
    qualification: ["Bachelor's degree in Civil Engineering (Mechanical for WRD Mech), or Sections A & B of AMIE in the branch, as specified per post."],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: ["Fee details will be in the detailed notification (on or before 02/11/2026)."],
    stages: [
      {
        name: "Single-level Examination",
        mode: "Online CBRT · objective (degree standard) · no screening test",
        papers: [
          { paper: "Paper-1", subject: "General Studies & Mental Ability", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-2", subject: "Civil & Mechanical Engineering — common (SOM, Fluid Mechanics & Machinery)", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-3", subject: "Civil Engineering (9 units) — Mechanical Engineering for WRD Mech", questions: 150, minutes: 150, marks: 150 },
        ],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the single-level examination (450 marks)."],
    extra: ["The same notification has 4 AEE (Electrical) posts in R&B with separate Electrical papers 2 and 3."],
    pdf: "Revised_AEE_1.pdf",
  },
  {
    examId: "group1",
    title: "Group-I Services",
    number: "Notification No. 07/2026",
    dated: "06/10/2026",
    kind: "detailed",
    apply: { from: "2026-10-06", to: "2026-10-27" },
    totalVacancies: 166,
    posts: [
      { name: "Deputy Collector", vacancies: 12, pay: "61,960–1,51,370", age: "18–44" },
      { name: "Asst. Commissioner of State Tax", vacancies: 14, pay: "61,960–1,51,370", age: "18–44" },
      { name: "Deputy Superintendent of Police (Civil) Cat-2", vacancies: "36 (3 CF)", pay: "61,960–1,51,370", age: "21–30" },
      { name: "DSP (Communications)", vacancies: 3, pay: "61,960–1,51,370", age: "18–30" },
      { name: "District Educational Officer", vacancies: 14, pay: "61,960–1,51,370", age: "18–44" },
      { name: "Regional Transport Officer", vacancies: 3, pay: "57,100–1,47,760", age: "18–44" },
      { name: "District Tribal Welfare Officer", vacancies: 1, pay: "57,100–1,47,760", age: "18–44" },
      { name: "Deputy Registrar (Cooperative)", vacancies: "16 (1 CF)", pay: "57,100–1,47,760", age: "18–44" },
      { name: "Municipal Commissioner Grade-II", vacancies: 12, pay: "54,060–1,40,540", age: "18–44" },
      { name: "Asst. Treasury Officer / Asst. Accounts Officer", vacancies: 2, pay: "54,060–1,40,540", age: "18–44" },
      { name: "District Employment Officer", vacancies: "3 (1 CF)", pay: "54,060–1,40,540", age: "18–44" },
      { name: "Assistant Audit Officer", vacancies: 15, pay: "54,060–1,40,540", age: "18–44" },
      { name: "Divisional Development Officer (Panchayat Raj)", vacancies: 35, pay: "65,360–1,54,980", age: "18–44" },
    ],
    qualification: ["A Bachelor's degree from a recognised university; some posts add post-specific requirements — see Para 3 of the notification."],
    age: { range: "18–44 years (DSP posts: 21–30 / 18–30)", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: ["₹250 application processing fee + examination fee as printed in the notification (exemptions for SC, ST, BC, PBD, Ex-Servicemen, white-card families and unemployed youth)."],
    stages: [
      {
        name: "Screening Test",
        mode: "Offline · OMR · objective (degree standard)",
        papers: [
          { paper: "Paper-I", subject: "General Studies — History & Culture, Constitution & Polity, Economy & Planning, Geography (30 each)", questions: 120, minutes: 120, marks: 120 },
          { paper: "Paper-II", subject: "General Aptitude — Mental Ability (60), Science & Technology (30), Current Events (30)", questions: 120, minutes: 120, marks: 120 },
        ],
        note: "50 candidates per vacancy are admitted to the Mains.",
      },
      {
        name: "Main Examination",
        mode: "Descriptive · Telugu or English medium",
        papers: [
          { paper: "Telugu", subject: "Qualifying paper", minutes: 180, marks: 150, note: "Qualifying" },
          { paper: "English", subject: "Qualifying paper", minutes: 180, marks: 150, note: "Qualifying" },
          { paper: "Paper-I", subject: "General Essay", minutes: 180, marks: 150 },
          { paper: "Paper-II", subject: "History, Culture & Geography of India and AP", minutes: 180, marks: 150 },
          { paper: "Paper-III", subject: "Polity, Constitution, Governance, Law & Ethics", minutes: 180, marks: 150 },
          { paper: "Paper-IV", subject: "Economy & Development of India and AP", minutes: 180, marks: 150 },
          { paper: "Paper-V", subject: "Science, Technology & Environmental Issues", minutes: 180, marks: 150 },
        ],
      },
      { name: "Interview", mode: "Personality test", papers: [{ paper: "Interview", subject: "Personality Test", minutes: 0, marks: 75 }] },
    ],
    negativeMarking: NEGATIVE + " (Screening Test).",
    selection: [
      "Screening Test marks only shortlist candidates for the Mains.",
      "Final merit: Mains Papers I–V (750) + Interview (75) = 825 marks.",
      "The Telugu and English papers are qualifying only.",
    ],
    minQualifying: MIN_QUALIFYING,
    examDate: "Screening Test: 24/01/2027. Mains dates to be announced.",
    pdf: "Group-I_Final_06102026.pdf",
  },
  {
    examId: "aswo",
    title: "Assistant Social Welfare Officer / Assistant Tribal Welfare Officer",
    number: "Notification No. 26/2026",
    dated: "09/10/2026",
    kind: "detailed",
    apply: { from: "2026-10-09", to: "2026-10-29" },
    totalVacancies: 17,
    posts: [
      { name: "Assistant Social Welfare Officer (zonal)", vacancies: 11, pay: "48,440–1,37,220", age: "18–44" },
      { name: "Assistant Tribal Welfare Officer (zonal)", vacancies: 6, pay: "48,440–1,37,220", age: "18–44" },
    ],
    qualification: ["A Bachelor's degree from a recognised university."],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: STANDARD_FEE(120),
    stages: [
      {
        name: "Written Examination",
        mode: "Online CBRT · objective (degree standard)",
        papers: [
          { paper: "Paper-I", subject: "General Studies & Mental Ability", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-II", subject: "Social & Cultural History of AP and Welfare Programmes", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-III", subject: "Indian Constitution and Welfare & Protection of Weaker Sections", questions: 150, minutes: 150, marks: 150 },
        ],
      },
      {
        name: "Computer Proficiency Test",
        mode: "Practical · qualifying",
        papers: [{ paper: "CPT", subject: "Office automation", minutes: 60, marks: 100, note: "Qualifying" }],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the written examination (450 marks), subject to qualifying the CPT."],
    minQualifying: MIN_QUALIFYING,
    pdf: "ASWO__ATWO_2026.pdf",
  },
  {
    examId: "eo",
    title: "Executive Officer Grade-III, A.P. Endowments",
    number: "Notification No. 23/2026",
    dated: "16/10/2026",
    kind: "detailed",
    apply: { from: "2026-10-16", to: "2026-11-05" },
    totalVacancies: 104,
    posts: [{ name: "Executive Officer Grade-III (district-wide)", vacancies: 104, pay: "25,220–80,910", age: "18–44" }],
    qualification: [
      "A Bachelor's degree from a recognised university.",
      "Must profess the Hindu religion (Sec. 29(3), AP Charitable & Hindu Religious Institutions & Endowments Act, 1987).",
    ],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: STANDARD_FEE(80),
    stages: [
      {
        name: "Written Examination",
        mode: "Online CBRT · objective (degree standard)",
        papers: [
          { paper: "Paper-I", subject: "General Studies & Mental Ability", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-II", subject: "Hindu Philosophy & Temple System (12 units)", questions: 150, minutes: 150, marks: 150 },
        ],
      },
      {
        name: "Computer Proficiency Test",
        mode: "Practical · qualifying",
        papers: [{ paper: "CPT", subject: "Office automation", minutes: 60, marks: 100, note: "Qualifying" }],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the written examination (300 marks), subject to qualifying the CPT."],
    minQualifying: MIN_QUALIFYING,
    pdf: "EO_Grade-III_Detailed_Notification.pdf",
  },
  {
    examId: "draughtsman",
    title: "Draughtsman Grade-II (Technical Assistant), A.P. Forest Subordinate Service",
    number: "Notification No. 15/2026",
    dated: "16/10/2026",
    kind: "detailed",
    apply: { from: "2026-10-16", to: "2026-11-05" },
    totalVacancies: 20,
    posts: [{ name: "Draughtsman Grade-II (Technical Assistant) (zonal)", vacancies: 20, pay: "34,580–1,07,210", age: "18–44" }],
    qualification: ["Trade certificate in Draughtsman (Civil) — ITI — or equivalent."],
    age: { range: "18–44 years", asOn: "01/07/2026", relaxation: RELAXATION },
    fee: STANDARD_FEE(80),
    stages: [
      {
        name: "Written Examination",
        mode: "Online CBRT · objective",
        papers: [
          { paper: "Paper-I", subject: "General Studies & Mental Ability (SSC standard)", questions: 150, minutes: 150, marks: 150 },
          { paper: "Paper-II", subject: "ITI (Civil Draughtsman) — drawing, surveying, levelling, theodolite, total station, GPS, maths", questions: 150, minutes: 150, marks: 150 },
        ],
      },
      {
        name: "Computer Proficiency Test",
        mode: "Practical · qualifying",
        papers: [{ paper: "CPT", subject: "Office automation", minutes: 60, marks: 100, note: "Qualifying" }],
      },
    ],
    negativeMarking: NEGATIVE,
    selection: ["Merit in the written examination (300 marks), subject to qualifying the CPT."],
    minQualifying: [
      { category: "OC, Sportspersons, Ex-Servicemen & EWS", percent: 40 },
      { category: "Backward Classes", percent: 35 },
      { category: "SC & ST", percent: 30 },
    ],
    pdf: "Draughtsman_Detailed_Notification.pdf",
  },
];

export function notificationFor(examId: string) {
  return NOTIFICATIONS.find((n) => n.examId === examId);
}

export type ApplyStatus = "upcoming" | "open" | "closed";

/** Status of the application window on a given local day (YYYY-MM-DD). */
export function applyStatus(n: Notification, today: string): ApplyStatus {
  if (today < n.apply.from) return "upcoming";
  if (today > n.apply.to) return "closed";
  return "open";
}

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
