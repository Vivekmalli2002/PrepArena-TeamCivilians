/** Small deterministic RNG so the daily quiz is the same for everyone on a given day. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function shuffle<T>(arr: readonly T[], rand: () => number = Math.random): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Local calendar day, e.g. "2026-10-30". */
export function dayKey(d: Date = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * Options that refer to each other ("All of the above", "Both A and B", "1 and 2 only", "(a), (b) and (c)")
 * keep their printed order; everything else may be shuffled for display.
 */
export function canShuffleOptions(options: readonly string[]): boolean {
  if (options.length < 3) return false;
  const refers =
    /\b(above|below|both|neither|none of|all of|any of|all the|only|and)\b|^\(?[a-e1-5]\)?([\s,.\-–]|$)|^[ivx]+[\s,.]|\b[a-e]\s*[-–]\s*[ivx]+|\b(statement|option)s?\b/i;
  return !options.some((o) => refers.test(o.trim()));
}

/** Display order (original option indices), stable for a given seed, e.g. `${sessionId}:${qid}`. */
export function optionOrder(options: readonly string[], seed: string): number[] {
  const idx = options.map((_, i) => i);
  return canShuffleOptions(options) ? shuffle(idx, mulberry32(hashString(seed))) : idx;
}
