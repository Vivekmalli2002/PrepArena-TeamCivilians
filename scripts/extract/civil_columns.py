"""Column-aware extractor for the two-column, layout-preserved 'Civil Engineering Chapterwise Solved Papers' text exports.

    python3 -I scripts/extract/civil_columns.py <text file> <out.json> <id-prefix>

For every page the gutter is found from the character-column histogram, each line is cut at the gutter and the left column
is read before the right column. Question blocks are then recognised by their running numbers (n, n+1, ...), and every block is
validated: a stem, exactly four distinct options, a keyed answer. Anything that fails a check is still written, with `flags`,
so nothing is silently dropped. Output is a JSON object {"items": [...], "stats": {...}}.
"""
import json, re, sys
from collections import Counter

FIG = re.compile(r"\b(figure|fig\.|shown (in|below)|diagram|graph|the (given )?(circuit|truss|frame|beam) (shown|below)|as shown|following (figure|diagram)|image)\b", re.I)
ANS = re.compile(r"\bAns\s*[.:\-]*\s*(?:\(?\s*([a-dA-D*])\s*\)?)?\s*[:.]?")
STARTQ = re.compile(r"^\s*(\d{1,4})\s*[.)]\s+(?=\S)")
OPT = re.compile(r"\(\s*([a-d])\s*\)")

def split_page(lines):
    n = len(lines)
    if n < 12:
        return lines, [], False
    W = max(len(l) for l in lines)
    cnt = [0] * (W + 2)
    for l in lines:
        for i, ch in enumerate(l):
            if ch != " ":
                cnt[i] += 1
    lo, hi = int(W * 0.3), int(W * 0.8)
    cand = [i for i in range(lo, hi) if cnt[i] <= 0.08 * n]
    runs, cur = [], []
    for i in cand:
        if cur and i == cur[-1] + 1:
            cur.append(i)
        else:
            if cur: runs.append(cur)
            cur = [i]
    if cur: runs.append(cur)
    runs = [r for r in runs if len(r) >= 2]
    if not runs:
        return lines, [], False
    mid = W / 2
    run = min(runs, key=lambda r: abs((r[0] + r[-1]) / 2 - mid))
    g = (run[0] + run[-1]) // 2
    left, right = [], []
    for l in lines:
        if len(l) <= g:
            left.append(l.strip())
            continue
        a, b = l[:g], l[g:]
        if a and b and a[-1] != " " and b[0] != " ":
            # cut falls inside a word: move the cut to the nearest space
            best = None
            for d in range(1, 10):
                for j in (g - d, g + d):
                    if 0 < j < len(l) and l[j] == " ":
                        best = j; break
                if best: break
            if best:
                a, b = l[:best], l[best:]
        left.append(a.strip())
        right.append(b.strip())
    return left, right, True

def stream(pages, presplit=False):
    out, flags = [], {}
    for pn, p in enumerate(pages, 1):
        lines = [l for l in p.split("\n") if l.strip()]
        if presplit:
            left, right, ok = lines, [], True
        else:
            left, right, ok = split_page(lines)
        for l in left + right:
            if l:
                out.append((pn, l))
        flags[pn] = ok
    return out, flags

def clean(s):
    return re.sub(r"\s+\)", ")", re.sub(r"\s+", " ", s)).strip()

WM = re.compile(r"(?:\b[A-Z][A-Za-z.&' ]{2,40}\s+\d{1,4}\s+)?Powered\s*by\s*TCPDF\s*\(www\.tcpdf\.org\)|\b(?:[A-Z][A-Za-z.&']+\s+){1,5}\d{1,4}\s+YCT\b|\bYCT\b|\bwww\.yct\w*\.com\b", re.I)

def parse(text, prefix, presplit=False):
    pages = re.split(r"===== PAGE \d+ =====\n", text)[1:]
    st, gut = stream(pages, presplit)
    cands = []
    for i, (pn, line) in enumerate(st):
        m = STARTQ.match(line)
        if m and int(m.group(1)) <= 1500:
            cands.append((i, int(m.group(1)), m.end()))
    accepted = []
    for k, (i, n, endm) in enumerate(cands):
        end = None
        for k2 in range(k + 1, min(k + 80, len(cands))):
            n2 = cands[k2][1]
            if n + 1 <= n2 <= n + 4:
                end = cands[k2][0]
                break
        seg_lines = [st[i][1][endm:]] + [l for _, l in st[i + 1:(end if end is not None else min(i + 70, len(st)))]]
        seg = "\n".join(seg_lines)
        am = ANS.search(seg)
        if am and re.search(r"\(\s*a\s*\)", seg[: am.start()]) and re.search(r"\(\s*b\s*\)", seg[: am.start()]):
            accepted.append(k)
    # An accepted anchor that sits inside the previous question's stem (numbered statements "1. 2. 3." of a
    # "Consider the following" question) is dropped: the previous block would otherwise have no answer.
    kept = []
    for k in accepted:
        if kept:
            pi = cands[kept[-1]][0]
            between = "\n".join(l for _, l in st[pi:cands[k][0]])
            if not ANS.search(between):
                continue
        kept.append(k)
    accepted = kept
    blocks = []
    for pos, k in enumerate(accepted):
        i, n, endm = cands[k]
        stop = cands[accepted[pos + 1]][0] if pos + 1 < len(accepted) else len(st)
        lines = [st[i][1][endm:]] + [l for _, l in st[i + 1:stop]]
        blocks.append({"n": n, "page": st[i][0], "lines": lines})
    items, stats = [], Counter()
    for b in blocks:
        flags = []
        full = WM.sub(" ", "\n".join(b["lines"]))
        am = ANS.search(full)
        if not am:
            stats["no_answer"] += 1
            continue
        head, tail = full[: am.start()], full[am.end():]
        key = am.group(1)
        # options
        pos = [(m.start(), m.group(1)) for m in OPT.finditer(head)]
        seq = []
        want = "a"
        for p_, ch in pos:
            if ch == want:
                seq.append((p_, ch)); want = chr(ord(want) + 1)
        if len(seq) < 4:
            flags.append("options")
            stem = clean(head.split("(a)")[0]) if "(a)" in head else clean(head)
            opts = []
        else:
            stem = clean(head[: seq[0][0]])
            opts = []
            for i, (p_, ch) in enumerate(seq[:4]):
                end = seq[i + 1][0] if i + 1 < 4 else len(head)
                seg = head[p_:end]
                seg = OPT.sub("", seg, count=1)
                opts.append(seg)
            # source/exam tag lines trail the last option
            lines_d = opts[3].split("\n")
            keep, src = [lines_d[0]], []
            for ln in lines_d[1:]:
                if re.search(r"\b(19|20)\d{2}\b|\b(PSC|AE|JE|SSC|GATE|ESE|IES|PSU|UPPSC|BPSC|GPSC|RPSC|MPPSC|APPSC|TSPSC|HPPSC|OPSC|WBPSC|KPSC|TNPSC|UKPSC|HSSC|DMRC|RRB|NHAI|BHEL|ISRO|IOCL)\b", ln) and len(ln) < 70:
                    src.append(ln)
                else:
                    keep.append(ln)
            opts[3] = "\n".join(keep)
            opts = [clean(o) for o in opts]
            b["src"] = clean(" ".join(src))
            # tags may also sit right after earlier options on their own lines; drop obvious ones from option text
            opts = [re.sub(r"\s+(?:[A-Z]{2,}[A-Za-z&() ]{0,25})?\b(?:19|20)\d{2}\b.*$", "", o) if len(o) > 60 else o for o in opts]
        def tidy(t):
            t = re.sub(r"\bYCT\b", "", t)
            t = re.sub(r"\s*:@\s*|\s+(?:TG|Se|ap|df)\s*$", " ", t)
            # a printed page number riding on the last option (page numbers are 1-4 digits near the block's page)
            t = re.sub(r"(?<=[A-Za-z%)\]°])\s+\d{2,4}\s*$", "", t)
            return clean(t)
        stem = tidy(stem)
        opts = [tidy(o) for o in opts]
        if re.search(r"\b(PSC|AE|GATE|ESE|SSC|IES|PSU)\b[^.?]{0,40}\b(19|20)\d{2}\b", stem):
            flags.append("source-in-stem")
        if key is None or key == "*":
            flags.append("no-key")
        if not stem or len(stem) < 12:
            flags.append("stem")
        if opts and (len(set(opts)) < 4 or any(not o for o in opts) or any(len(o) > 220 for o in opts)):
            flags.append("options")
        if re.search(r"\(\s*a\s*\).*\(\s*b\s*\)", tail) and re.search(r"\bAns\b.*\bAns\b", tail):
            flags.append("merged")
        if len(stem) > 900:
            flags.append("long-stem")
        if FIG.search(stem) or any(FIG.search(o) for o in opts):
            flags.append("figure")
        if not gut.get(b["page"], True):
            flags.append("layout")
        blob = " ".join([stem] + opts)
        if re.search(r"[\uf000-\uf8ff\u2022\u25a0]", blob):
            flags.append("symbols")
        if re.search(r"\s\d{2,4}\s*[.]\s+[A-Z]", stem) or re.search(r"\bAns\b", blob):
            flags.append("merged")
        short_ok = {"a","an","is","of","to","in","on","by","or","at","as","it","no","be","do","up","if","so","we","he","me","my","go","us","am","ph","pi","kn","mm","cm","km","kg","mg","hr","m3","m2"}
        def stray(t):
            m = re.search(r"\s([a-z]{1,2})$", t)
            return bool(m and m.group(1) not in short_ok)
        if stray(stem) or any(stray(o) for o in opts):
            flags.append("stray")
        if opts and any(re.search(r"\(\s*[a-e]\s*\)", o) for o in opts):
            flags.append("options")
        tail = re.sub(r"\bYCT\b|AE Civil Engg\.?\s*Volume\s*[-–]?\s*I{1,2}\s*\d*|Civil Engg\.?\s*Volume\s*[-–]?\s*I{1,2}\s*\d*", " ", tail)
        expl = clean(tail)
        # explanation runs up to the next question; trim obvious page furniture
        expl = re.sub(r"\s+\d{1,4}\s*$", "", expl)[:1500]
        it = {
            "n": b["n"], "page": b["page"], "question": stem, "options": opts,
            "key": key.lower() if key and key != "*" else None, "explanation": expl,
            "source": b.get("src", ""), "flags": sorted(set(flags)),
        }
        items.append(it)
        stats["blocks"] += 1
        stats["clean" if not flags else "flagged"] += 1
    stats["pages"] = len(pages)
    stats["pages_with_gutter"] = sum(1 for v in gut.values() if v)
    return items, dict(stats)

if __name__ == "__main__":
    text = open(sys.argv[1], encoding="utf8", errors="ignore").read()
    items, stats = parse(text, sys.argv[3] if len(sys.argv) > 3 else "X", presplit=("--presplit" in sys.argv))
    json.dump({"items": items, "stats": stats}, open(sys.argv[2], "w", encoding="utf8"), ensure_ascii=False)
    print(stats)
