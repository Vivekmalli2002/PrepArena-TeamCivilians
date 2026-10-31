"use client";

import { Eraser, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fmtClock, LETTERS } from "@/lib/format";
import { useSession } from "@/lib/store";
import type { Question, Session } from "@/lib/types";
import { QuestionText } from "@/components/QuestionView";
import { Button, Card, Segmented, Sheet, cx } from "@/components/ui";

/**
 * OMR practice: the printed paper (all questions, options in fixed order) beside a bubble sheet.
 * Tap a bubble to fill it, tap it again to rub it out — like the pen-and-paper exam.
 */
export function OmrConsole({ session, byId }: { session: Session; byId: Map<number, Question> }) {
  const router = useRouter();
  const S = useSession.getState;
  const cfg = session.config;
  const n = cfg.qids.length;
  const [view, setView] = useState<"paper" | "sheet">("paper");
  const [submitOpen, setSubmitOpen] = useState(false);
  const timed = cfg.durationSec > 0 && cfg.mode === "exam";
  const remaining = cfg.durationSec * 1000 - session.elapsedMs;
  const answered = session.responses.filter((r) => r != null).length;

  const finish = () => {
    const id = S().submit(byId);
    if (id) router.replace(`/results?id=${id}`);
  };
  const last = useRef(0);
  useEffect(() => {
    last.current = performance.now();
    const t = setInterval(() => {
      const now = performance.now();
      S().tick(now - last.current);
      last.current = now;
    }, 1000);
    return () => clearInterval(t);
  }, [S]);
  const auto = useRef(false);
  useEffect(() => {
    if (timed && remaining <= 0 && !auto.current) {
      auto.current = true;
      finish();
    }
  });

  const sheet = (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between text-sm">
        <b>OMR sheet</b>
        <span className="text-muted tabular">
          {answered}/{n} filled
        </span>
      </div>
      <div className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-1">
        {cfg.qids.map((id, i) => {
          const q = byId.get(id)!;
          return (
            <div key={id} className="flex items-center gap-3" role="group" aria-label={`Question ${i + 1}`}>
              <span className="w-7 text-right text-sm font-bold tabular text-muted">{i + 1}</span>
              <div className="flex gap-2">
                {q.options.map((_, o) => {
                  const on = session.responses[i] === o;
                  return (
                    <button
                      key={o}
                      aria-label={`Question ${i + 1} option ${LETTERS[o]}`}
                      aria-pressed={on}
                      onClick={() => S().fill(i, on ? null : o)}
                      className={cx(
                        "grid size-9 place-items-center rounded-full border-2 text-xs font-bold transition",
                        on ? "border-fg bg-fg text-bg" : "border-hairline text-muted hover:border-primary",
                      )}
                    >
                      {LETTERS[o]}
                    </button>
                  );
                })}
              </div>
              {session.responses[i] != null && (
                <button aria-label={`Clear question ${i + 1}`} className="text-faint hover:text-bad" onClick={() => S().fill(i, null)}>
                  <Eraser size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 py-4">
      <div className="glass sticky top-2 z-20 flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <div className="min-w-0">
          <div className="truncate font-semibold">{cfg.title}</div>
          <div className="text-xs text-muted">OMR practice · {answered}/{n} filled</div>
        </div>
        <div className="font-display text-xl font-bold tabular">{timed ? fmtClock(Math.max(0, remaining)) : fmtClock(session.elapsedMs)}</div>
        <Button size="sm" onClick={() => setSubmitOpen(true)}>
          <Send size={15} /> Submit
        </Button>
      </div>
      <Segmented
        label="Paper or sheet"
        className="mt-3 max-w-xs lg:hidden"
        value={view}
        onChange={setView}
        options={[
          { value: "paper", label: "Question paper" },
          { value: "sheet", label: "OMR sheet" },
        ]}
      />
      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className={cx("space-y-4", view === "sheet" && "hidden lg:block")}>
          {cfg.qids.map((id, i) => {
            const q = byId.get(id)!;
            return (
              <Card key={id} className="p-4">
                <div className="flex gap-3">
                  <span className="font-display text-lg font-bold">{i + 1}.</span>
                  <div className="min-w-0 flex-1">
                    <QuestionText text={q.question} className="text-base" />
                    {q.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={q.image} alt="Figure for the question" className="mt-2 max-h-64 rounded-xl" />
                    )}
                    <ol className="mt-3 grid gap-1.5 text-[15px]">
                      {q.options.map((o, k) => (
                        <li key={k} className="flex gap-2">
                          <b className="w-5 shrink-0">{LETTERS[k]}</b>
                          <span>{o}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className={cx("lg:sticky lg:top-20 lg:self-start", view === "paper" && "hidden lg:block")}>{sheet}</div>
      </div>
      <Sheet open={submitOpen} onClose={() => setSubmitOpen(false)} title="Submit the test?">
        <p className="text-muted">
          You have filled <b className="text-fg">{answered}</b> of {n} bubbles. {n - answered > 0 && `${n - answered} will be marked unanswered.`}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => setSubmitOpen(false)}>
            Keep going
          </Button>
          <Button onClick={finish}>Submit</Button>
        </div>
      </Sheet>
    </div>
  );
}
