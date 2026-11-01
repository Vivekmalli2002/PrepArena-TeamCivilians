import { BookX, Timer, PenLine } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./ui";

const TOOLS = [
  { href: "/countdown", icon: Timer, title: "Countdowns", text: "Confirmed exam dates and your own deadlines — days, hours, minutes" },
  { href: "/mistakes", icon: BookX, title: "Mistake notebook", text: "Every wrong answer, why it happened, and a retry test" },
  { href: "/mains", icon: PenLine, title: "Mains answer writing", text: "Real Group-I Mains questions, timer, word count, checklist" },
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
