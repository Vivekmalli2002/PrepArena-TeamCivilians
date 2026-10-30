"use client";

import { useEffect, useState } from "react";
import type { Bank, Question } from "./types";

export interface LoadedBank extends Bank {
  byId: Map<number, Question>;
  /** Topics ordered by question count (largest first). */
  topics: TopicInfo[];
}

export interface TopicInfo {
  name: string;
  count: number;
  qids: number[];
  subtopics: { name: string; qids: number[] }[];
}

let cache: LoadedBank | null = null;
let pending: Promise<LoadedBank> | null = null;

export function loadBank(): Promise<LoadedBank> {
  if (cache) return Promise.resolve(cache);
  pending ??= fetch("/data/questions.json")
    .then((r) => {
      if (!r.ok) throw new Error(`Could not load questions (${r.status})`);
      return r.json() as Promise<Bank>;
    })
    .then((b) => (cache = index(b)))
    .catch((e) => {
      pending = null;
      throw e;
    });
  return pending;
}

export function index(b: Bank): LoadedBank {
  const byId = new Map(b.questions.map((q) => [q.id, q]));
  const map = new Map<string, TopicInfo>();
  for (const q of b.questions) {
    let t = map.get(q.topic);
    if (!t) map.set(q.topic, (t = { name: q.topic, count: 0, qids: [], subtopics: [] }));
    t.count++;
    t.qids.push(q.id);
    if (q.subtopic) {
      let s = t.subtopics.find((x) => x.name === q.subtopic);
      if (!s) t.subtopics.push((s = { name: q.subtopic, qids: [] }));
      s.qids.push(q.id);
    }
  }
  const topics = [...map.values()].sort((a, b) => b.count - a.count);
  return { ...b, byId, topics };
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
