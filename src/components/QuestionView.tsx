"use client";

import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { LETTERS, splitStatements } from "@/lib/format";
import type { Question } from "@/lib/types";
import { cx } from "./ui";

export function QuestionText({ text, className }: { text: string; className?: string }) {
  const blocks = splitStatements(text);
  return (
    <div className={cx("space-y-2.5 text-[17px] leading-relaxed sm:text-lg", className)}>
      {blocks.map((b, i) =>
        b.kind === "item" && !b.label ? (
          <p key={i} className="border-l-[3px] border-primary/40 pl-3">
            {b.text}
          </p>
        ) : b.kind === "item" ? (
          <div key={i} className="flex gap-2.5">
            <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-primary-soft text-xs font-bold text-primary">
              {b.label}
            </span>
            <span>{b.text}</span>
          </div>
        ) : (
          <p key={i} className={i === 0 ? "font-medium" : ""}>
            {b.text}
          </p>
        ),
      )}
    </div>
  );
}

export type OptionState = "idle" | "selected" | "correct" | "wrong" | "dim";

export function Options({
  q,
  stateOf,
  onChoose,
  disabled,
}: {
  q: Question;
  stateOf: (i: number) => OptionState;
  onChoose?: (i: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2.5" role="radiogroup" aria-label="Options">
      {q.options.map((o, i) => {
        const st = stateOf(i);
        return (
          <motion.button
            key={i}
            role="radio"
            aria-checked={st === "selected" || st === "correct" || st === "wrong"}
            disabled={disabled}
            onClick={() => onChoose?.(i)}
            whileTap={disabled ? undefined : { scale: 0.985 }}
            animate={st === "wrong" ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className={cx(
              "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left text-[16px] leading-snug transition-colors",
              st === "idle" && "border-hairline bg-glass hover:border-primary/40",
              st === "selected" && "border-primary bg-primary-soft",
              st === "correct" && "border-good bg-good-soft",
              st === "wrong" && "border-bad bg-bad-soft",
              st === "dim" && "border-hairline bg-glass opacity-60",
              disabled && "cursor-default",
            )}
          >
            <span
              className={cx(
                "grid size-8 shrink-0 place-items-center rounded-xl text-sm font-bold",
                st === "selected" && "bg-primary text-on-primary",
                st === "correct" && "bg-good text-white",
                st === "wrong" && "bg-bad text-white",
                (st === "idle" || st === "dim") && "bg-hairline text-muted",
              )}
            >
              {st === "correct" ? <Check size={17} strokeWidth={3} /> : st === "wrong" ? <X size={17} strokeWidth={3} /> : LETTERS[i]}
            </span>
            <span className="flex-1">{o}</span>
          </motion.button>
        );
      })}
    </div>
  );
}

export function Explanation({ q, verdict }: { q: Question; verdict?: "correct" | "wrong" | "skipped" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      {verdict && (
        <p
          className={cx(
            "mb-2 font-display text-base font-bold",
            verdict === "correct" ? "text-good" : verdict === "wrong" ? "text-bad" : "text-muted",
          )}
        >
          {verdict === "correct"
            ? "Correct!"
            : verdict === "wrong"
              ? `Not quite — the answer is ${LETTERS[q.answerIndex]}`
              : `Not attempted — the answer is ${LETTERS[q.answerIndex]}`}
        </p>
      )}
      <p className="text-xs font-bold uppercase tracking-wider text-faint">Explanation</p>
      <p className="mt-1.5 leading-relaxed">{q.explanation}</p>
      <p className="mt-3 text-xs text-muted">Source: {q.source}</p>
    </motion.div>
  );
}
