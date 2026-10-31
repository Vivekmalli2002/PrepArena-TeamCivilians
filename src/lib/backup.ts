import { migrateApp } from "./store";

export const BACKUP_KIND = "team-civilians-backup";
const STORE_VERSION = 2;

type Restorable = {
  profile: { name: string; examId: string; createdAt: number } | null;
  theme: "system" | "light" | "dark";
  attempts: unknown[];
  qstats: Record<string, unknown>;
  bookmarks: number[];
  activeDays: string[];
  mistakeTags?: Record<number, string>;
  plan?: unknown;
  mains?: Record<string, unknown>;
};

export function makeBackup(state: Restorable) {
  const { profile, theme, attempts, qstats, bookmarks, activeDays, mistakeTags, plan, mains } = state;
  return {
    kind: BACKUP_KIND,
    version: STORE_VERSION,
    exportedAt: new Date().toISOString(),
    data: { profile, theme, attempts, qstats, bookmarks, activeDays, mistakeTags, plan, mains },
  };
}

/** Parses and sanity-checks a backup file; throws a readable error if it isn't one. */
export function parseBackup(text: string): Restorable {
  let json: { kind?: string; version?: number; data?: Partial<Restorable> };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }
  if (json?.kind !== BACKUP_KIND || !json.data) throw new Error("That isn't a Team Civilians backup file.");
  if ((json.version ?? 0) > STORE_VERSION) throw new Error("This backup is from a newer version of the app — update first.");
  const d = migrateApp(json.data as Record<string, unknown>, json.version ?? 1) as Partial<Restorable>;
  const ok =
    Array.isArray(d.attempts) &&
    d.qstats != null &&
    typeof d.qstats === "object" &&
    Array.isArray(d.bookmarks ?? []) &&
    Array.isArray(d.activeDays ?? []);
  if (!ok) throw new Error("The backup is incomplete or damaged.");
  return {
    profile: d.profile ?? null,
    theme: d.theme ?? "system",
    attempts: d.attempts!,
    qstats: d.qstats!,
    bookmarks: (d.bookmarks ?? []).filter(Number.isInteger),
    activeDays: (d.activeDays ?? []).filter((x) => typeof x === "string"),
    mistakeTags: d.mistakeTags && typeof d.mistakeTags === "object" ? d.mistakeTags : {},
    plan: d.plan ?? null,
    mains: d.mains && typeof d.mains === "object" ? d.mains : {},
  };
}
