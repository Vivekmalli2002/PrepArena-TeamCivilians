"use client";

import { useMemo } from "react";
import { subjectsForExam } from "@/content/catalog";
import { scopeBank, useBank } from "./bank";
import { useApp } from "./store";

/** The bank limited to the subjects of the student's target exam. */
export function useExamBank() {
  const { bank, error } = useBank();
  const examId = useApp((s) => s.profile?.examId);
  const scoped = useMemo(
    () => (bank ? scopeBank(bank, subjectsForExam(examId).map((s) => s.id)) : null),
    [bank, examId],
  );
  return { bank: scoped, fullBank: bank, error };
}
