import { cx } from "./ui";

/** Renders a model answer written in light markdown: ## headings, - bullets, **bold**, blank-line paragraphs. */
export function AnswerView({ text, className }: { text: string; className?: string }) {
  const bold = (s: string) =>
    s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : part));
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className={cx("space-y-3 leading-relaxed", className)}>
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-•*]\s+/.test(l)))
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((l, j) => (
                <li key={j}>{bold(l.replace(/^\s*[-•*]\s+/, ""))}</li>
              ))}
            </ul>
          );
        if (/^#{1,3}\s/.test(b)) return <h4 key={i} className="pt-1 font-display text-base font-bold">{bold(b.replace(/^#{1,3}\s+/, ""))}</h4>;
        return <p key={i}>{bold(b)}</p>;
      })}
    </div>
  );
}
