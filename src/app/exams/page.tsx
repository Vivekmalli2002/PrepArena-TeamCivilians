import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EXAMS } from "@/content/catalog";
import { notificationFor } from "@/content/notifications";
import { ApplyBadge } from "@/components/ApplyBadge";

export const metadata: Metadata = {
  title: "APPSC exams 2026",
  description: "Vacancies, eligibility, exam pattern, dates and syllabus for APPSC Group-I, Group-II, AEE and other 2026 notifications.",
};

export default function Page() {
  return (
    <div>
      <h1 className="font-display text-[28px] font-extrabold sm:text-4xl">APPSC exams 2026</h1>
      <p className="mt-1 text-sm text-muted">From the official notifications — vacancies, eligibility, pattern, dates and syllabus.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {EXAMS.map((e) => {
          const n = notificationFor(e.id)!;
          return (
            <Link key={e.id} href={`/exams/${e.id}`} className="glass flex flex-col rounded-3xl p-4 transition hover:-translate-y-0.5">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  {e.priority && <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Priority</p>}
                  <h2 className="font-semibold leading-snug">{e.name}</h2>
                  <p className="mt-0.5 text-xs text-muted">{n.number}</p>
                </div>
                <ChevronRight size={18} className="mt-1 shrink-0 text-muted" />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span>
                  <b className="font-display text-lg tabular">{n.totalVacancies}</b> <span className="text-muted">posts</span>
                </span>
                <span className="text-muted">{n.stages[0].mode.split(" · ").slice(0, 2).join(" · ")}</span>
              </div>
              <div className="mt-3">
                <ApplyBadge n={n} />
              </div>
            </Link>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-faint">
        Always confirm on the official website <a className="underline" href="https://psc.ap.gov.in">psc.ap.gov.in</a> before applying.
      </p>
    </div>
  );
}
