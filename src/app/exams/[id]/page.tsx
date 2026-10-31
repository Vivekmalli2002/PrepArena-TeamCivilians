import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EXAMS, examById, papersForExam, SUBJECTS } from "@/content/catalog";
import { fmtDate, notificationFor } from "@/content/notifications";
import { ApplyBadge } from "@/components/ApplyBadge";
import { ExamCta } from "@/components/ExamCta";

export const dynamicParams = false;

export function generateStaticParams() {
  return EXAMS.map((e) => ({ id: e.id }));
}

export async function generateMetadata(props: PageProps<"/exams/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  const e = examById(id);
  return { title: e ? `${e.name} — notification, pattern & syllabus` : "Exam" };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass mt-3 rounded-3xl p-4 sm:p-5">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default async function Page(props: PageProps<"/exams/[id]">) {
  const { id } = await props.params;
  const exam = examById(id);
  const n = notificationFor(id);
  if (!exam || !n) notFound();
  const papers = papersForExam(id);

  return (
    <div>
      <Link href="/exams" className="mb-3 inline-flex items-center gap-1 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={16} /> All exams
      </Link>
      <div className="glass-strong relative overflow-hidden rounded-3xl p-5 sm:p-6">
        <div className="absolute -right-12 -top-12 size-44 rounded-full bg-primary/15 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {n.number} · {n.dated}
        </p>
        <h1 className="mt-1 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{exam.name}</h1>
        <p className="mt-1 text-sm text-muted">{n.title}</p>
        <div className="mt-3">
          <ApplyBadge n={n} long />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted">Vacancies</dt>
            <dd className="font-display text-xl font-bold tabular">{n.totalVacancies}</dd>
          </div>
          <div>
            <dt className="text-muted">Apply</dt>
            <dd className="font-semibold">
              {fmtDate(n.apply.from)} – {fmtDate(n.apply.to)}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Age</dt>
            <dd className="font-semibold">{n.age.range}</dd>
          </div>
          <div>
            <dt className="text-muted">Exam</dt>
            <dd className="font-semibold">{n.stages[0].mode.split(" · ")[0]}</dd>
          </div>
        </dl>
        <ExamCta examId={exam.id} />
      </div>

      {n.examDate && (
        <Section title="Important dates">
          <ul className="space-y-1 text-sm">
            <li>
              Online application: <b>{fmtDate(n.apply.from)}</b> to <b>{fmtDate(n.apply.to)}</b> (11:59 PM)
            </li>
            <li>{n.examDate}</li>
          </ul>
        </Section>
      )}

      <Section title="Posts & pay">
        {/* A stacked list rather than a table, so vacancies and pay stay visible on phones. */}
        <ul className="divide-y divide-[var(--hairline)]">
          {n.posts.map((p) => (
            <li key={p.name} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug">{p.name}</div>
                <div className="mt-0.5 text-xs text-muted">
                  ₹{p.pay}
                  {p.age && <> · Age {p.age}</>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-display text-lg font-bold leading-none tabular">{p.vacancies}</div>
                <div className="text-[11px] text-muted">posts</div>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Eligibility">
        <h3 className="text-sm font-bold">Education</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {n.qualification.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <h3 className="mt-4 text-sm font-bold">
          Age: {n.age.range}
          {n.age.asOn !== "—" && <span className="font-normal text-muted"> as on {n.age.asOn}</span>}
        </h3>
        <ul className="mt-1 list-disc space-y-1 pl-5 text-sm">
          {n.age.relaxation.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </Section>

      <Section title="Application fee">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {n.fee.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </Section>

      <Section title="Exam pattern">
        <div className="space-y-4">
          {n.stages.map((s) => (
            <div key={s.name}>
              <h3 className="font-semibold">{s.name}</h3>
              <p className="text-xs text-muted">{s.mode}</p>
              <ul className="mt-2 divide-y divide-[var(--hairline)]">
                {s.papers.map((p) => (
                  <li key={p.paper + p.subject} className="flex items-start gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm leading-snug">
                        <b>{p.paper}</b> · {p.subject}
                        {p.note && <span className="ml-1 text-xs text-muted">({p.note})</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {[p.questions && `${p.questions} questions`, p.minutes && `${p.minutes} min`].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="font-display text-lg font-bold leading-none tabular">{p.marks}</div>
                      <div className="text-[11px] text-muted">marks</div>
                    </div>
                  </li>
                ))}
              </ul>
              {s.note && <p className="mt-1.5 text-xs text-muted">{s.note}</p>}
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl bg-bad-soft p-3 text-sm">
          <b>Negative marking:</b> {n.negativeMarking}
        </p>
      </Section>

      <Section title="Selection & cut-off">
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {n.selection.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        {n.minQualifying ? (
          <>
            <h3 className="mt-4 text-sm font-bold">Minimum qualifying marks (aggregate)</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {n.minQualifying.map((m) => (
                <div key={m.category} className="rounded-2xl bg-hairline p-3">
                  <div className="font-display text-2xl font-bold tabular">{m.percent}%</div>
                  <div className="text-xs text-muted">{m.category}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm text-muted">Minimum qualifying marks will be printed in the detailed notification.</p>
        )}
        <p className="mt-3 text-xs text-muted">
          Securing the minimum qualifying marks does not by itself guarantee selection. Actual cut-off marks are known
          only after APPSC publishes results for this recruitment; they are not part of the notification.
        </p>
      </Section>

      <Section title="Syllabus">
        <div className="space-y-3">
          {papers.map((p) => (
            <div key={p.id}>
              <h3 className="text-sm font-semibold">
                {p.name}
                {p.marks && <span className="font-normal text-muted"> · {p.marks} marks</span>}
              </h3>
              {p.syllabus ? (
                <ol className="mt-1.5 space-y-1">
                  {p.syllabus.map((u) => (
                    <li key={u} className="rounded-2xl bg-hairline px-3 py-2 text-sm">
                      {u}
                    </li>
                  ))}
                </ol>
              ) : (
              <ul className="mt-1.5 space-y-1.5">
                {p.subjects.map((sid) => {
                  const s = SUBJECTS[sid];
                  const units = s.units.filter((u) => u.exams.includes(exam.id));
                  return (
                    <li key={sid} className="rounded-2xl bg-hairline px-3 py-2 text-sm">
                      <span className="font-semibold">{s.name}</span>
                      {units.length > 0 && <span className="text-muted"> — {units.map((u) => u.title).join("; ")}</span>}
                    </li>
                  );
                })}
              </ul>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">Headings condensed from the notification&apos;s syllabus annexure.</p>
      </Section>

      {n.centres && (
        <Section title="Exam centres">
          <p className="text-sm">{n.centres}</p>
        </Section>
      )}
      {n.extra && (
        <Section title="Good to know">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {n.extra.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </Section>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <a href="https://psc.ap.gov.in" className="glass inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 font-semibold">
          <ExternalLink size={15} /> Apply at psc.ap.gov.in
        </a>
        <span className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-muted">
          <FileText size={15} /> Source: {n.kind === "brief" ? "brief" : "detailed"} notification ({n.pdf})
        </span>
      </div>
      <p className="mt-3 text-xs text-faint">
        Summarised from the official notification for convenience. If anything differs, the APPSC notification and its
        corrigenda prevail.
      </p>
    </div>
  );
}
