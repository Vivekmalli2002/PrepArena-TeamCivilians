import type { Attempt } from "./types";

export interface Scheme {
  id: string;
  label: string;
  correct: number;
  wrong: number;
}

export const SCHEMES: Scheme[] = [
  { id: "appsc", label: "+1 / −⅓ (APPSC)", correct: 1, wrong: 1 / 3 },
  { id: "2-066", label: "+2 / −0.66", correct: 2, wrong: 0.66 },
  { id: "1-025", label: "+1 / −0.25", correct: 1, wrong: 0.25 },
  { id: "none", label: "No negative marking", correct: 1, wrong: 0 },
];

export function schemeById(id: string): Scheme {
  return SCHEMES.find((s) => s.id === id) ?? SCHEMES[0];
}

export interface Score {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  attempted: number;
  /** Net marks after negative marking. */
  net: number;
  max: number;
  /** correct / attempted, 0–1 (0 when nothing attempted). */
  accuracy: number;
  /** net / max, 0–1, can be negative. */
  percent: number;
}

/** Answers and key are parallel arrays. Pure, so results can always be recomputed. */
export function scoreResponses(responses: (number | null)[], key: number[], scheme: Scheme): Score {
  let correct = 0;
  let wrong = 0;
  responses.forEach((r, i) => {
    if (r == null) return;
    if (r === key[i]) correct++;
    else wrong++;
  });
  const total = key.length;
  const attempted = correct + wrong;
  const net = round2(correct * scheme.correct - wrong * scheme.wrong);
  const max = total * scheme.correct;
  return {
    total,
    correct,
    wrong,
    skipped: total - attempted,
    attempted,
    net,
    max,
    accuracy: attempted ? correct / attempted : 0,
    percent: max ? net / max : 0,
  };
}

export function scoreAttempt(a: Attempt): Score {
  return scoreResponses(a.responses, a.key, schemeById(a.config.schemeId));
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
