/**
 * Group-I Mains learning queue. Questions are grouped into themes; themes the commission keeps returning to come
 * first, and inside a theme the questions that cover different angles ("dimensions") come first. A few questions
 * a day are served; anything not marked completed that day slides to the backlog at the end.
 */
export type DimId = "concept" | "mechanism" | "policy" | "issues" | "impact" | "measures" | "critical" | "short";

export const DIMS: { id: DimId; label: string; angle: string; step: string }[] = [
  { id: "concept", label: "Concept & definition", angle: "define it, give types and differences", step: "Open with a precise definition and, where useful, the types or classification." },
  { id: "mechanism", label: "How it works", angle: "explain how it works, with a process or diagram", step: "Explain the working or process in clear steps; add a labelled diagram or flowchart." },
  { id: "policy", label: "Policy, schemes & law", angle: "policies, missions, schemes and laws", step: "Name the relevant policy, mission, scheme or Act with its year, objectives and key provisions." },
  { id: "issues", label: "Issues & challenges", angle: "problems, risks and constraints", step: "List the main challenges (technical, financial, social, regulatory), each with one line of evidence." },
  { id: "impact", label: "Impact & applications", angle: "impact, uses and applications", step: "Cover impact and applications on economy, society, health or environment, with an India / AP example." },
  { id: "measures", label: "Measures & way forward", angle: "measures, strategy and way forward", step: "Suggest specific, practical measures and end with a forward-looking line." },
  { id: "critical", label: "Critical evaluation", angle: "critically examine or assess", step: "Weigh both sides before giving a balanced judgement." },
  { id: "short", label: "Short note", angle: "short note", step: "Keep it to a tight 8–10 line note: definition, key facts, one example." },
];
/** The six angles used to suggest "this theme has not been asked from this side yet". */
export const CORE_DIMS: DimId[] = ["concept", "mechanism", "policy", "issues", "impact", "measures"];

export interface MainsQ {
  id: string;
  year: number;
  paper: string;
  paperName: string;
  no: string;
  marks: number | null;
  question: string;
  theme: string;
  dims: DimId[];
  ap: boolean;
}

export interface ThemeStat {
  theme: string;
  count: number;
  years: number[];
  last: number;
  dims: Record<string, number>;
  /** Core angles never asked for this theme yet — the likely "new dimension" of a future question. */
  unseen: DimId[];
  ids: string[];
}

export function themeStats(qs: MainsQ[]): ThemeStat[] {
  const by = new Map<string, MainsQ[]>();
  for (const q of qs) by.set(q.theme, [...(by.get(q.theme) ?? []), q]);
  const stats = [...by].map(([theme, list]): ThemeStat => {
    const years = [...new Set(list.map((q) => q.year))].sort((a, b) => a - b);
    const dims: Record<string, number> = {};
    for (const q of list) for (const d of q.dims) dims[d] = (dims[d] ?? 0) + 1;
    return { theme, count: list.length, years, last: years.at(-1)!, dims, unseen: CORE_DIMS.filter((d) => !dims[d]), ids: list.map((q) => q.id) };
  });
  // Most recurring first; then spread over more sittings; then most recently asked. "Other" themes go last.
  return stats.sort(
    (a, b) => Number(a.theme.startsWith("Other")) - Number(b.theme.startsWith("Other")) || b.count - a.count || b.years.length - a.years.length || b.last - a.last,
  );
}

const CORE_PER_THEME = 5;

/**
 * Learning order: pass 1 takes up to five questions of each theme (themes in priority order), picking at each step the
 * question that adds the most angles not yet covered by the ones chosen — so a theme is met from different sides.
 * Pass 2 serves whatever is left, theme by theme.
 */
export function buildQueue(qs: MainsQ[]): string[] {
  const byId = new Map(qs.map((q) => [q.id, q]));
  const themes = themeStats(qs);
  const first: string[] = [];
  const rest: string[] = [];
  for (const t of themes) {
    const pool = t.ids.map((id) => byId.get(id)!).sort((a, b) => b.year - a.year || a.no.localeCompare(b.no, undefined, { numeric: true }));
    const covered = new Set<string>();
    const picked: MainsQ[] = [];
    while (pool.length) {
      let bi = 0;
      let best = -1;
      pool.forEach((q, i) => {
        const gain = q.dims.filter((d) => !covered.has(d)).length;
        if (gain > best) {
          best = gain;
          bi = i;
        }
      });
      const [q] = pool.splice(bi, 1);
      q.dims.forEach((d) => covered.add(d));
      picked.push(q);
    }
    picked.forEach((q, i) => (i < CORE_PER_THEME ? first : rest).push(q.id));
  }
  return [...first, ...rest];
}

/** An answer skeleton from what the question asks for — a guide, not a model answer. */
export function frameFor(q: Pick<MainsQ, "dims" | "marks" | "ap">): string[] {
  const steps = ["Introduction (2–3 lines): set the context with one recent fact or figure."];
  const dims = q.dims.includes("short") ? (["short"] as DimId[]) : q.dims.filter((d) => d !== "short");
  for (const d of dims) steps.push(DIMS.find((x) => x.id === d)!.step);
  if (q.ap) steps.push("Add the Andhra Pradesh angle: a state scheme, institution or data point.");
  steps.push("Conclusion (2 lines): a balanced, forward-looking close.");
  return steps;
}

/* ---------------- the daily queue ---------------- */

export interface LearnState {
  perDay: 1 | 2 | 3;
  /** Date (YYYY-MM-DD) the `today` list belongs to. */
  todayKey: string;
  today: string[];
  /** Missed questions, oldest first; served again once the fresh queue runs out. */
  backlog: string[];
  /** Every question ever handed out, so nothing is served twice as "new". */
  assigned: string[];
  /** Completed questions → completion time. */
  done: Record<string, number>;
}

export const emptyLearn = (): LearnState => ({ perDay: 1, todayKey: "", today: [], backlog: [], assigned: [], done: {} });

function pullOne(s: LearnState, queue: string[]): LearnState {
  const seen = new Set(s.assigned);
  const fresh = queue.find((id) => !seen.has(id) && !s.done[id]);
  if (fresh) return { ...s, today: [...s.today, fresh], assigned: [...s.assigned, fresh] };
  const back = s.backlog.find((id) => !s.done[id] && !s.today.includes(id));
  if (back) return { ...s, today: [...s.today, back], backlog: s.backlog.filter((id) => id !== back) };
  return s;
}

/** Fills today's list up to `perDay` questions. */
export function topUp(s: LearnState, queue: string[]): LearnState {
  let cur = s;
  while (cur.today.length < cur.perDay) {
    const next = pullOne(cur, queue);
    if (next === cur) break;
    cur = next;
  }
  return cur;
}

/**
 * Called whenever the tool is opened. On a new day, whatever was served yesterday and not completed goes to the end
 * (the backlog) and a fresh set is served.
 */
export function rollDay(s: LearnState, todayKey: string, queue: string[]): LearnState {
  if (s.todayKey === todayKey) return topUp(s, queue);
  const missed = s.today.filter((id) => !s.done[id]);
  const backlog = [...s.backlog.filter((id) => !s.done[id]), ...missed.filter((id) => !s.backlog.includes(id))];
  return topUp({ ...s, todayKey, today: [], backlog }, queue);
}

/** "Learn one more today". */
export const learnMore = (s: LearnState, queue: string[]) => pullOne(s, queue);

export function complete(s: LearnState, id: string, at = Date.now()): LearnState {
  return { ...s, done: { ...s.done, [id]: at }, backlog: s.backlog.filter((x) => x !== id) };
}

export function uncomplete(s: LearnState, id: string): LearnState {
  const done = { ...s.done };
  delete done[id];
  const backlog = s.today.includes(id) || s.backlog.includes(id) ? s.backlog : [...s.backlog, id];
  return { ...s, done, backlog };
}

/** Consecutive days (ending today or yesterday) with at least one question completed. */
export function learnStreak(done: Record<string, number>, todayKey: string, dayOf: (t: number) => string): number {
  const days = new Set(Object.values(done).map(dayOf));
  const step = (k: string, by: number) => {
    const d = new Date(k + "T00:00");
    d.setDate(d.getDate() + by);
    return dayOf(d.getTime());
  };
  let k = days.has(todayKey) ? todayKey : step(todayKey, -1);
  let n = 0;
  while (days.has(k)) {
    n++;
    k = step(k, -1);
  }
  return n;
}
