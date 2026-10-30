/**
 * Presentation-only helpers. They never change the stored text — they only decide
 * where to break lines so "1. … 2. … 3. …" statement questions read like the paper.
 */

export interface QuestionBlock {
  kind: "text" | "item";
  label?: string;
  text: string;
}

/**
 * Splits a question into its stem and numbered statements when it contains an
 * ascending run "1. … 2. …" (at least two items). Otherwise returns the text as-is.
 */
export function splitStatements(text: string): QuestionBlock[] {
  const re = /(^|\s)(\d{1,2})\.\s/g;
  const hits: { at: number; n: number; len: number }[] = [];
  let m: RegExpExecArray | null;
  let expect = 1;
  while ((m = re.exec(text))) {
    const n = Number(m[2]);
    if (n === expect) {
      hits.push({ at: m.index + m[1].length, n, len: m[0].length - m[1].length });
      expect++;
    }
  }
  if (hits.length < 2) return splitLabelled(text);

  const blocks: QuestionBlock[] = [];
  const stem = text.slice(0, hits[0].at).trim();
  if (stem) blocks.push({ kind: "text", text: stem });
  hits.forEach((h, i) => {
    const end = i + 1 < hits.length ? hits[i + 1].at : text.length;
    let body = text.slice(h.at + h.len, end).trim();
    let tail = "";
    // Pull a trailing instruction ("Which of the statements given above…") off the last item.
    if (i === hits.length - 1) {
      const q = body.search(/\s(Which|How many|Select|Choose|Of the above|Consider|Codes?\s*:)/);
      if (q > 0) {
        tail = body.slice(q).trim();
        body = body.slice(0, q).trim();
      }
    }
    blocks.push({ kind: "item", label: String(h.n), text: body });
    if (tail) blocks.push({ kind: "text", text: tail });
  });
  return blocks;
}

/** "Statement-I : … Statement-II : …" and "Assertion (A) : … Reason (R) : …" pairs. */
function splitLabelled(text: string): QuestionBlock[] {
  const re = /(Statement\s*-?\s*(?:I{1,3}|[1-3])\b|Assertion\s*\(A\)|Reason\s*\(R\))\s*:/g;
  const starts = [...text.matchAll(re)].map((m) => m.index!);
  if (starts.length < 2) return [{ kind: "text", text }];
  const blocks: QuestionBlock[] = [];
  const stem = text.slice(0, starts[0]).trim();
  if (stem) blocks.push({ kind: "text", text: stem });
  starts.forEach((at, i) => {
    let body = text.slice(at, i + 1 < starts.length ? starts[i + 1] : text.length).trim();
    if (i === starts.length - 1) {
      const q = body.search(/\s(In the light of|Which|Select|Choose|Codes?\s*:)/);
      if (q > 0) {
        blocks.push({ kind: "item", text: body.slice(0, q).trim() });
        body = body.slice(q).trim();
        blocks.push({ kind: "text", text: body });
        return;
      }
    }
    blocks.push({ kind: "item", text: body });
  });
  return blocks;
}

export function fmtClock(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

export function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}m ${r}s` : `${m}m`;
}

export function pct(x: number, digits = 0) {
  return `${(x * 100).toFixed(digits)}%`;
}

export const LETTERS = ["A", "B", "C", "D", "E"];
