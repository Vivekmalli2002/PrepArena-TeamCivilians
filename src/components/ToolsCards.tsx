import { BookX, CalendarDays, ListChecks, PenLine } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./ui";

const TOOLS = [
  { href: "/mistakes", icon: BookX, title: "Error log book", text: "Every wrong answer, why it happened, your notes, retry and export" },
  { href: "/calendar", icon: CalendarDays, title: "Exam calendar", text: "Group-1 Prelims 24 Jan, Group-2 Prelims 21 Feb: days left, your plan day by day, ✅ on finished days" },
  { href: "/checklist", icon: ListChecks, title: "Subjects checklist", text: "Every subject of your exam; tick one off and it is struck off in every exam that carries it" },
  { href: "/mains", icon: PenLine, title: "Group-I Mains checklist", text: "60-day PYQ-recurrence plan: read each day's past and expected questions, then tick them off" },
];

export function ToolsCards() {
  return (
    <>
      <SectionTitle>Study tools</SectionTitle>
      <div className="grid gap-3 sm:grid-cols-3">
        {TOOLS.map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="glass flex items-start gap-3 rounded-3xl p-4 transition hover:-translate-y-0.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Icon size={20} />
            </span>
            <span>
              <span className="block font-semibold">{title}</span>
              <span className="block text-sm text-muted">{text}</span>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
