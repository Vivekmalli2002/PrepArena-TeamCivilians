/**
 * Presentation-only helpers. They never change the stored text — they only decide
 * where to break lines so "1. … 2. … 3. …" statement questions read like the paper.
 */

export interface QuestionBlock {
  kind: "text" | "item";
  label?: string;
  text: string;
}

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
const ALPHA = "abcdefgh".split("");

interface Marker {
  /** Start of the marker (after the whitespace before it). */
  at: number;
  /** Length of the marker including the space after it. */
  len: number;
  label: string;
}

/** Ascending runs of one numbering style: "1. 2. 3.", "(1) (2)", "I. II. III.", "(i) (ii)", "(a) (b)", "A. B. C." */
const FAMILIES: { re: RegExp; label: (idx: number) => string }[] = [
  { re: /(^|\s)(\d{1,2})[.)](?=\s)/g, label: (i) => String(i + 1) },
  { re: /(^|\s)\((\d{1,2})\)(?=\s)/g, label: (i) => String(i + 1) },
  { re: /(^|\s)\(?(I{1,3}|IV|VI{0,3}|IX|X)[.)](?=\s)/g, label: (i) => ROMAN[i] ?? "" },
  { re: /(^|\s)\((i{1,3}|iv|vi{0,3}|ix|x)\)(?=\s)|(^|\s)(i{1,3}|iv|vi{0,3}|ix|x)\)(?=\s)/g, label: (i) => (ROMAN[i] ?? "").toLowerCase() },
  { re: /(^|\s)\(([a-h])\)(?=\s)|(^|\s)([a-h])\)(?=\s)/g, label: (i) => ALPHA[i] ?? "" },
  { re: /(^|\s)\(?([A-H])[.)](?=\s)/g, label: (i) => (ALPHA[i] ?? "").toUpperCase() },
];

const TAIL =
  /(?<=[.?!:)])\s+(?=(?:Which|How many|Select|Choose|Identify|Find|What|Pick|Mark|Match|Arrange|Using|Based|On the basis|From the above|In the light|Of the above|Codes?\s*:|The correct|Give|Examine|Decide)\b)|\s(?=Of the above|Codes?\s*:)/;
const TAIL_LOOSE = /\s(?=(?:Which|How many|Select|Choose|Of the above|Codes?\s*:|Identify the|Find the|Using the code)\b)/;
const HEADING = /\s+((?:List|Column|Group)[\s-]*(?:I{1,3}|[1-3A-C])\b[^.?!]{0,30})$/i;

/**
 * Splits a question into its stem, its numbered / lettered statements (1. 2. · I. II. · (a) (b) · (i) (ii) · A. B.)
 * and the closing instruction, so each statement reads on its own line. Otherwise returns the text as-is.
 */
export function splitStatements(text: string): QuestionBlock[] {
  const hits = FAMILIES.flatMap((fam) => {
    fam.re.lastIndex = 0;
    const out: Marker[] = [];
    let idx = 0;
    let m: RegExpExecArray | null;
    while ((m = fam.re.exec(text))) {
      const lead = m[1] ?? m[3] ?? "";
      const label = m[2] ?? m[4];
      if (label === fam.label(idx)) {
        out.push({ at: m.index + lead.length, len: m[0].length - lead.length, label });
        idx++;
      }
    }
    return out.length >= 2 ? out : [];
  }).sort((a, b) => a.at - b.at);
  // drop overlaps (a marker inside another marker's span)
  const marks: Marker[] = [];
  for (const h of hits) if (!marks.length || h.at >= marks[marks.length - 1].at + marks[marks.length - 1].len) marks.push(h);
  if (marks.length < 2) return splitLabelled(text);

  const blocks: QuestionBlock[] = [];
  let stem = text.slice(0, marks[0].at).trim();
  const sh = stem.match(HEADING);
  if (sh && sh.index! > 0) {
    blocks.push({ kind: "text", text: stem.slice(0, sh.index!).trim() });
    stem = sh[1].trim();
  }
  if (stem) blocks.push({ kind: "text", text: stem });
  marks.forEach((h, i) => {
    const end = i + 1 < marks.length ? marks[i + 1].at : text.length;
    let body = text.slice(h.at + h.len, end).trim();
    let tail = "";
    let heading = "";
    // a caption such as "List-II" at the end of an item belongs to the next group, not to this item
    const hm = i + 1 < marks.length ? body.match(HEADING) : null;
    if (hm) {
      heading = hm[1].trim();
      body = body.slice(0, body.length - hm[0].length).trim();
    }
    // pull a trailing instruction ("Identify the incorrect statement(s):") off the last item
    if (i === marks.length - 1) {
      const t = body.match(TAIL) ?? body.match(TAIL_LOOSE);
      if (t && t.index! > 0) {
        tail = body.slice(t.index!).trim();
        body = body.slice(0, t.index!).trim();
      }
    }
    blocks.push({ kind: "item", label: h.label, text: body });
    if (heading) blocks.push({ kind: "text", text: heading });
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
