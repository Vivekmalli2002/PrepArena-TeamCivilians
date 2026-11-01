/**
 * Group-I Mains progress checklist: Paper → subject → theme. Every theme lists the questions already asked (previous papers,
 * APPSC and TGPSC) and the questions expected next; the learner ticks expected questions off, and when a theme is finished
 * the next theme is offered. No daily quota and no backlog.
 */
export interface Asked {
  q: string;
  years: number[];
  boards: string[];
  dims: string[];
}
export interface Expected {
  id: string;
  q: string;
  dim: string;
  why: string;
  structure?: string[];
  /** A hand-written model answer exists (mains-model-*.json) under this id. */
  model?: boolean;
  dynamic?: boolean;
}
export interface Theme {
  id: string;
  paper: number;
  subject: string;
  label: string;
  full: string;
  n: number;
  years: number[];
  dims: Record<string, number>;
  unseen: string[];
  asked: Asked[];
  expected: Expected[];
  domain: string;
  dynamic: boolean;
  legacy?: boolean;
  /** Position of the theme in the compilation PDF (syllabus order). */
  order: number;
}

export const PAPER_TITLES: Record<number, string> = {
  1: "Paper I · General Essay",
  2: "Paper II · History, Culture & Geography",
  3: "Paper III · Polity, Governance, Law & Ethics",
  4: "Paper IV · Economy of India & Andhra Pradesh",
  5: "Paper V · Science, Technology & Environment",
};

export const DIM_LABEL: Record<string, string> = {
  concept: "Concept & definition",
  mechanism: "How it works",
  policy: "Policy, schemes & law",
  issues: "Issues & challenges",
  impact: "Impact & implications",
  measures: "Measures & way forward",
  critical: "Critical evaluation",
  short: "Short note",
  ap: "Andhra Pradesh angle",
  current: "Recent developments",
};

export interface Progress {
  done: number;
  total: number;
}
export const themeProgress = (t: Theme, done: Record<string, number>): Progress => ({
  done: t.expected.filter((e) => done[e.id]).length,
  total: t.expected.length,
});
export const themeDone = (t: Theme, done: Record<string, number>) => {
  const p = themeProgress(t, done);
  return p.total > 0 && p.done === p.total;
};
export function sumProgress(themes: Theme[], done: Record<string, number>): Progress {
  return themes.reduce((a, t) => {
    const p = themeProgress(t, done);
    return { done: a.done + p.done, total: a.total + p.total };
  }, { done: 0, total: 0 });
}

/** Themes of a paper grouped by subject, subjects in the syllabus order of first appearance, themes most-asked first. */
export function bySubject(themes: Theme[], paper: number): { subject: string; themes: Theme[] }[] {
  const groups = new Map<string, Theme[]>();
  for (const t of themes) if (t.paper === paper && !t.legacy) groups.set(t.subject, [...(groups.get(t.subject) ?? []), t]);
  return [...groups].map(([subject, ts]) => ({ subject, themes: ts.sort((a, b) => Number(a.label.startsWith("Misc")) - Number(b.label.startsWith("Misc")) || b.n - a.n) }));
}

/** The order the checklist is worked through: paper by paper, subject by subject, most-asked theme first. Themes with nothing to tick are skipped. */
export function studyOrder(themes: Theme[]): Theme[] {
  const out: Theme[] = [];
  for (const paper of [1, 2, 3, 4, 5]) for (const g of bySubject(themes, paper)) out.push(...g.themes.filter((t) => t.expected.length));
  return out;
}

/** The next theme after `current` (in study order) that is not finished; null when everything is done. */
export function nextTheme(order: Theme[], current: string | null, done: Record<string, number>): Theme | null {
  const start = current ? order.findIndex((t) => t.id === current) : -1;
  for (let k = 1; k <= order.length; k++) {
    const t = order[(start + k) % order.length];
    if (t.id !== current && !themeDone(t, done)) return t;
  }
  return null;
}
