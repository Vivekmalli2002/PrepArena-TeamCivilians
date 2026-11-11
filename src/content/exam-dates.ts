/**
 * Exam dates announced so far. Add a date here as soon as APPSC announces it (YYYY-MM-DD); anything with `date: null`
 * is shown as "date not announced yet". Only the two dates below are announced at the moment.
 */
import type { ExamId } from "./catalog";

export interface ExamDate {
  id: string;
  examId: ExamId;
  /** Short name used on the calendar. */
  name: string;
  /** Two-letter mark shown inside the calendar cell. */
  mark: string;
  date: string | null;
}

export const EXAM_DATES: ExamDate[] = [
  { id: "group1-prelims", examId: "group1", name: "Group-1 Prelims", mark: "G1", date: "2027-01-24" },
  { id: "group2-prelims", examId: "group2", name: "Group-2 Prelims", mark: "G2", date: "2027-02-21" },
  { id: "group1-mains", examId: "group1", name: "Group-1 Mains", mark: "G1M", date: null },
  { id: "group2-mains", examId: "group2", name: "Group-2 Mains", mark: "G2M", date: null },
  { id: "aee-pcb", examId: "aee-pcb", name: "AEE · PCB", mark: "PCB", date: null },
  { id: "aee-prtw", examId: "aee-prtw", name: "AEE · PR & TW", mark: "PRT", date: null },
  { id: "aee-rbi", examId: "aee-rbi", name: "AEE · R&B / Irrigation", mark: "RBI", date: null },
  { id: "aswo", examId: "aswo", name: "ASWO / ATWO", mark: "ASW", date: null },
  { id: "eo", examId: "eo", name: "Endowment EO", mark: "EO", date: null },
  { id: "draughtsman", examId: "draughtsman", name: "Draughtsman", mark: "DM", date: null },
];
