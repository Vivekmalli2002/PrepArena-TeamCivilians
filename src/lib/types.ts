/** One question as it appears in the bank. `subtopic` is reserved for a later tagging pass. */
export interface Question {
  id: number;
  topic: string;
  subtopic?: string;
  question: string;
  options: string[];
  /** 0-based index into `options`. */
  answerIndex: number;
  explanation: string;
  source: string;
  /** Set by the content pipeline for questions kept only so old results can be reviewed. */
  status?: "withdrawn" | "duplicate";
  note?: string;
  /** Why the question was editorially revised (see content/corrections.json). */
  revised?: string;
  /** Figures that belong to the explanation (public URLs). */
  explanationImage?: string[];
  /** Figure the question itself refers to (public URL). */
  image?: string;
}

export type Mode = "practice" | "exam";

export type TestKind = "topic" | "subtopic" | "topic-mock" | "mock" | "daily" | "custom" | "revision";

export interface TestConfig {
  kind: TestKind;
  /** Stable key used to compare attempts of the "same" test (best score, personal best). */
  key: string;
  title: string;
  subtitle?: string;
  mode: Mode;
  schemeId: string;
  /** 0 = untimed. */
  durationSec: number;
  qids: number[];
  topic?: string;
}

/** A test in progress. Kept in its own small store so it can be written every second. */
export interface Session {
  id: string;
  config: TestConfig;
  started: boolean;
  current: number;
  /** Saved answers (what gets evaluated). */
  responses: (number | null)[];
  /** Selected-but-not-saved choice on each question (exam mode, like the real CBT). */
  drafts: (number | null)[];
  marked: boolean[];
  visited: boolean[];
  /** Milliseconds spent on each question. */
  qTimeMs: number[];
  elapsedMs: number;
  paused: boolean;
}

/** A finished test. Stores only ids + responses; question content is looked up from the bank. */
export interface Attempt {
  id: string;
  config: TestConfig;
  finishedAt: number;
  responses: (number | null)[];
  marked: boolean[];
  qTimeMs: number[];
  elapsedMs: number;
  /** Answer key snapshot at submit time, so old results stay correct if the bank is fixed later. */
  key: number[];
  /** Topic snapshot per question. */
  topics: string[];
}

export interface QStat {
  /** times answered */
  n: number;
  /** times correct */
  c: number;
  /** last answer was correct */
  last: boolean;
  /** last answered at (ms) */
  at: number;
  /** Spaced-repetition box (0–4) while in the revision set; null/absent otherwise. */
  box?: number | null;
  /** When the next revision is due (ms). */
  due?: number;
}

export type PaletteStatus = "notVisited" | "notAnswered" | "answered" | "marked" | "answeredMarked";
