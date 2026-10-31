"use client";

import { useEffect, useMemo, useState } from "react";
import type { Question } from "./types";

/**
 * The bank is published as a small index (topics → question ids) plus one file per topic.
 * Screens that only need counts and ids use the index; question text is loaded per topic
 * on demand (the service worker still precaches every file for offline use).
 */
export interface TopicInfo {
  name: string;
  subject: string;
  /** Syllabus unit (1-based) of the subject, when mapped. */
  unit: number | null;
  file: string;
  /** Live question ids (withdrawn and duplicate questions excluded). */
  qids: number[];
  /** Every id in the topic file, including withdrawn ones — for reviewing old results. */
  all: number[];
  subtopics: { name: string; qids: number[] }[];
  count: number;
}

export interface SubjectInfo {
  id: string;
  name: string;
  /** Live questions in this subject. */
  total: number;
}

export interface BankIndex {
  version: string;
  subjects: SubjectInfo[];
  meta: { name: string; subject: string; note?: string };
  total: number;
  topics: TopicInfo[];
}

export interface LoadedBank extends BankIndex {
  topicOf: Map<number, TopicInfo>;
  /** All live ids in topic order. */
  allActive: number[];
  isActive: (id: number) => boolean;
}

/**
 * Restricts a bank to some subjects (e.g. those in the student's exam). Question lookups
 * (`topicOf`) stay global so results and revision of other subjects still resolve.
 */
export function scopeBank(bank: LoadedBank, subjectIds: string[]): LoadedBank {
  const keep = new Set(subjectIds);
  const topics = bank.topics.filter((t) => keep.has(t.subject));
  const subjects = bank.subjects.filter((s) => keep.has(s.id));
  // Never scope down to nothing: fall back to the full bank.
  if (!topics.length) return bank;
  const allActive = topics.flatMap((t) => t.qids);
  const active = new Set(allActive);
  return { ...bank, subjects, topics, allActive, total: allActive.length, isActive: (id) => active.has(id) };
}

export function indexBank(raw: Omit<BankIndex, "topics"> & { topics: Omit<TopicInfo, "count">[] }): LoadedBank {
  const topics = raw.topics.map((t) => ({ ...t, count: t.qids.length }));
  const topicOf = new Map<number, TopicInfo>();
  for (const t of topics) for (const id of t.all) topicOf.set(id, t);
  const allActive = topics.flatMap((t) => t.qids);
  const active = new Set(allActive);
  return { ...raw, topics, topicOf, allActive, isActive: (id) => active.has(id) };
}

let cache: LoadedBank | null = null;
let pending: Promise<LoadedBank> | null = null;
let fetcher: (path: string) => Promise<unknown> = async (path) => {
  const r = await fetch(`/data/${path}`);
  if (!r.ok) throw new Error(`Could not load questions (${r.status})`);
  return r.json();
};

/** Tests swap the network for the filesystem. */
export function setBankFetcher(f: typeof fetcher) {
  fetcher = f;
  cache = null;
  pending = null;
  chunks.clear();
  questions.clear();
}

export function loadBank(): Promise<LoadedBank> {
  if (cache) return Promise.resolve(cache);
  pending ??= (fetcher("index.json") as Promise<Parameters<typeof indexBank>[0]>)
    .then((b) => (cache = indexBank(b)))
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}

const chunks = new Map<string, Promise<void>>();
const questions = new Map<number, Question>();

function loadChunk(file: string) {
  let p = chunks.get(file);
  if (!p) {
    p = (fetcher(file) as Promise<Question[]>)
      .then((qs) => {
        for (const q of qs) questions.set(q.id, q);
      })
      .catch((e) => {
        chunks.delete(file);
        throw e;
      });
    chunks.set(file, p);
  }
  return p;
}

/** Loads the topic files that hold `ids` and returns the shared id → question map. */
export async function loadQuestions(ids: number[]): Promise<Map<number, Question>> {
  const bank = await loadBank();
  const files = new Set<string>();
  for (const id of ids) {
    const t = bank.topicOf.get(id);
    if (t && !questions.has(id)) files.add(t.file);
  }
  await Promise.all([...files].map(loadChunk));
  return questions;
}

export function useBank() {
  const [bank, setBank] = useState<LoadedBank | null>(cache);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    loadBank().then(
      (b) => alive && setBank(b),
      (e: Error) => alive && setError(e.message),
    );
    return () => {
      alive = false;
    };
  }, []);
  return { bank, error };
}

/** Question bodies for `ids`; `byId` is null until every requested question is available. */
export function useQuestions(ids: readonly number[] | null) {
  const key = ids ? ids.join(",") : "";
  const ready = () => !!ids && ids.every((id) => questions.has(id));
  const [state, setState] = useState<{ key: string; byId: Map<number, Question> | null; error: string | null }>(() => ({
    key,
    byId: ready() ? questions : null,
    error: null,
  }));
  useEffect(() => {
    if (!ids || ready()) return;
    let alive = true;
    loadQuestions([...ids]).then(
      (m) => alive && setState({ key, byId: m, error: null }),
      (e: Error) => alive && setState({ key, byId: null, error: e.message }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` captures `ids`
  }, [key]);
  // Questions can already be cached from another screen: answer synchronously.
  const byId = useMemo(() => (ready() ? questions : state.key === key ? state.byId : null), [key, state]); // eslint-disable-line react-hooks/exhaustive-deps
  return { byId, error: state.key === key ? state.error : null };
}
