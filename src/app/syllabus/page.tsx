import type { Metadata } from "next";
import { EXAMS, PAPERS } from "@/content/catalog";
import { commonSubjects, patternRows, sharedPapers, VERIFICATION_LABEL } from "@/content/registry";

export const metadata: Metadata = {
  title: "Syllabus & overlap",
  description: "Exam patterns with their official source page, and the papers and subjects shared between APPSC exams.",
};

const short = (id: string) => EXAMS.find((e) => e.id === id)?.short ?? id;

export default function Page() {
  const rows = patternRows();
  const common = commonSubjects();
  const shared = sharedPapers();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">Syllabus &amp; overlap</h1>
        <p className="mt-1 text-sm text-muted">
          Every pattern below cites the notification page it was read from. Overlap here means “the subject appears in a paper of both exams” —
          it does not say the depth is the same.
        </p>
      </div>

      <section className="glass rounded-3xl p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Papers shared between exams</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {shared.map(({ paper, exams }) => (
            <li key={paper.id}>
              <b>{paper.name}</b>
              <div className="text-muted">{exams.map((e) => e.short).join(" · ")}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="glass rounded-3xl p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Subjects by number of exams</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs text-muted">
                <th className="py-1 pr-3">Subject</th>
                {EXAMS.map((e) => (
                  <th key={e.id} className="px-1 text-center">{e.short}</th>
                ))}
                <th className="px-1 text-center">Exams</th>
              </tr>
            </thead>
            <tbody>
              {common.map((s) => (
                <tr key={s.subjectId} className="border-t border-black/5">
                  <td className="py-1.5 pr-3 font-medium">{s.name}</td>
                  {EXAMS.map((e) => (
                    <td key={e.id} className="px-1 text-center" title={s.via.filter((v) => v.examId === e.id).map((v) => PAPERS[v.paperId].name).join("; ")}>
                      {s.exams.includes(e.id) ? "●" : ""}
                    </td>
                  ))}
                  <td className="px-1 text-center font-bold tabular">{s.exams.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-faint">Hover a dot for the paper that carries the subject. Subject↔paper mapping: src/content/catalog.ts.</p>
      </section>

      <section className="glass rounded-3xl p-4 sm:p-5">
        <h2 className="font-display text-lg font-bold">Exam patterns &amp; sources</h2>
        <div className="mt-3 space-y-4">
          {rows.map(({ examId, stage, source }) => (
            <div key={examId + stage.name} className="text-sm">
              <p className="font-semibold">{short(examId)} · {stage.name} <span className="font-normal text-muted">— {stage.mode}</span></p>
              <ul className="mt-1 text-muted">
                {stage.papers.map((p) => (
                  <li key={p.paper}>
                    {p.paper}: {p.subject} — {p.questions ? `${p.questions} Q · ` : ""}{p.minutes ? `${p.minutes} min · ` : ""}{p.marks} marks{p.note ? ` (${p.note})` : ""}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-xs text-faint">
                Source: {source.doc}, p.{source.page} · {source.authority} · checked {source.checkedOn} ·{" "}
                <b className={source.status === "verified" ? "text-emerald-600" : "text-amber-600"}>{VERIFICATION_LABEL[source.status]}</b>
                {source.note ? ` — ${source.note}` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
