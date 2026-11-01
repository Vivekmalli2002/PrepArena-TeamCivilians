/** Types for the mistake notebook and Mains answer practice (kept in the same local store as attempts). */

export type MistakeReason = "concept" | "silly" | "guess" | "time" | "revise";

export const MISTAKE_REASONS: { id: MistakeReason; label: string; hint: string }[] = [
  { id: "concept", label: "Concept gap", hint: "I did not know / understand it" },
  { id: "silly", label: "Silly slip", hint: "I knew it — misread or mis-marked" },
  { id: "guess", label: "Guessed", hint: "Pure guess that missed" },
  { id: "time", label: "Ran short of time", hint: "Rushed or skipped for time" },
  { id: "revise", label: "Need to memorise", hint: "A fact I must revise" },
];

export interface MainsEntry {
  text: string;
  updatedAt: number;
  /** Self-evaluation 0–10 from the checklist. */
  score?: number;
  /** Seconds spent writing. */
  seconds?: number;
}
