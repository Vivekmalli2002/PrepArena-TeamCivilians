"use client";

import { useMemo } from "react";
import { SUBJECTS, subjectsForExam } from "@/content/catalog";
import { scopeBank, useBank } from "./bank";
import { useApp } from "./store";

/** The bank limited to the subjects of the student's target exam. */
export function useExamBank() {
  const { bank, error } = useBank();
  const examId = useApp((s) => s.profile?.examId);
  const scoped = useMemo(
    () =>
      bank
        ? scopeBank(bank, subjectsForExam(examId).map((s) => s.id), (t) => {
            // Subjects shared by several exams (Engineering Drawing) list, per syllabus unit, the exams that study it.
            const s = SUBJECTS[t.subject];
            return !s?.filterByExam || t.unit == null || (s.units[t.unit - 1]?.exams.some((e) => e === examId) ?? true);
          })
        : null,
    [bank, examId],
  );
  return { bank: scoped, fullBank: bank, error };
}
