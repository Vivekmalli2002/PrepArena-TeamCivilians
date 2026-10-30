import { scoreAttempt } from "./scoring";
import type { Attempt } from "./types";

/** Best net % per test key. */
export function bestByKey(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    const p = scoreAttempt(a).percent;
    if (!m.has(a.config.key) || p > m.get(a.config.key)!) m.set(a.config.key, p);
  }
  return m;
}

/** Best net % of any attempt focused on a topic. */
export function bestByTopic(attempts: Attempt[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const a of attempts) {
    const t = a.config.topic;
    if (!t) continue;
    const p = scoreAttempt(a).percent;
    if (!m.has(t) || p > m.get(t)!) m.set(t, p);
  }
  return m;
}
