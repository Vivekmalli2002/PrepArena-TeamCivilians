import { BookX, PenLine } from "lucide-react";
import Link from "next/link";
import { SectionTitle } from "./ui";

const TOOLS = [
  { href: "/mistakes", icon: BookX, title: "Error log book", text: "Every wrong answer, why it happened, your notes, retry and export" },
  { href: "/mains", icon: PenLine, title: "Group-I Mains checklist", text: "Paper → subject → theme: past questions, expected questions, tick as you learn" },
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
