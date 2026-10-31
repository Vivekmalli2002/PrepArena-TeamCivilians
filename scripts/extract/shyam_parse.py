"""Pass 2: parse shyam_lines.py output into questions. The answer is the option whose words are underlined.
    python3 -I scripts/extract/shyam_parse.py <lines.json>... --out <raw.json>"""
import json, re, sys

QN = re.compile(r"^(\d{1,3})(\.{0,3})$")
OPT = re.compile(r"^\(([1-4])\)$")
NEWLINE = re.compile(r"^(\(?[a-dA-D]\)|\(?[ivxIVX]+\)|\(?[A-E]\)|[1-9]\)|List|Statement|Assertion|Reason|Column|Directions?|Note)", re.I)

def flatten(files):
    pages = []
    for f in files:
        pages += json.load(open(f))
    pages.sort(key=lambda p: p["p"])
    return pages

def build(pages):
    qs, cur, test, sect, sect_title, expect, in_test, test_seq = [], None, 0, "", "", 1, False, 0
    log = []
    def close():
        nonlocal cur
        if cur: qs.append(cur)
        cur = None
    for pg in pages:
        if pg["test"]:
            close(); test = pg["test"]; in_test = False; expect = 1; sect = ""; sect_title = ""
        for ln in pg["lines"]:
            w = ln["w"]
            if ln["x"] < 55 and len(w) > 2 and re.fullmatch(r"\d{1,2}", w[0][0]) and re.fullmatch(r"\d{1,2}", w[1][0]):
                j = 2
                while j < len(w) and re.fullmatch(r"\.+", w[j][0]): j += 1
                w = [[w[0][0] + w[1][0] + ("." if j > 2 else ""), 0]] + w[j:]
                if len(w) > 2 and re.fullmatch(r"\d{1,2}", w[-2][0]) and re.fullmatch(r"\d{1,2}", w[-1][0]): w = w[:-2]
            first = w[0][0]
            if first.upper().startswith("SECTION-"):
                close(); sect = first.split("-")[-1].upper()[:1]; sect_title = ""
                if sect == "A" and in_test and expect > 1:
                    test_seq += 1; test += 1; expect = 1
                in_test = True
                continue
            if not in_test: continue
            m = QN.match(first)
            if m and ln["x"] < 55:
                n = int(m.group(1))
                if n == expect:
                    close()
                    if w[-1][0].rstrip(".") == first.rstrip("."): w = w[:-1]
                    cur = {"test": test, "n": n, "sect": sect, "title": sect_title.strip(), "lines": [], "page": pg["p"]}
                    cur["lines"].append(w[1:]); expect = n + 1
                    continue
                log.append(("odd-number", test, n, expect, pg["p"]))
            if cur is None:
                tx = " ".join(t for t, _ in w if t.isascii())
                if sect and not sect_title and re.fullmatch(r"[A-Z][A-Z ,&]{5,}", tx.strip()):
                    sect_title = tx.strip()
                continue
            cur["lines"].append(w)
    close()
    return qs, log

def finish(q):
    toks = []   # (text, ul, newline_before)
    for w in q["lines"]:
        if not w: continue
        txt0 = w[0][0]
        for i, (t, u) in enumerate(w):
            toks.append((t, u, i == 0 and bool(NEWLINE.match(txt0)) and toks != []))
    marks = [i for i, (t, _, _) in enumerate(toks) if OPT.match(t)]
    pick = None
    for a in range(len(marks) - 1, -1, -1):
        if OPT.match(toks[marks[a]][0]).group(1) != "1": continue
        seq, nxt = [marks[a]], 2
        for j in marks[a + 1:]:
            if OPT.match(toks[j][0]).group(1) == str(nxt):
                seq.append(j); nxt += 1
        if nxt >= 5:
            pick = seq; break
    flags = []
    if not pick:
        stem = " ".join(t for t, _, _ in toks)
        return dict(q, question=stem, options=[], answer=None, flags=["no-options"])
    stem = ""
    for t, u, nl in toks[:pick[0]]:
        stem += ("\n" if nl and stem else " " if stem else "") + t
    options, ulcount = [], []
    ends = pick[1:] + [len(toks)]
    for s, e in zip(pick, ends):
        body = toks[s + 1:e]
        options.append(" ".join(t for t, _, _ in body).strip())
        ulcount.append(sum(1 for _, u, _ in body if u) / max(1, len(body)))
    under = [i for i, f in enumerate(ulcount) if f >= 0.5]
    ans = under[0] if len(under) == 1 else None
    if not under: flags.append("no-underline")
    elif len(under) > 1: flags.append("multi-underline")
    if any(not o for o in options): flags.append("empty-option")
    return dict(q, question=stem.strip(), options=options, answer=ans, flags=flags)

if __name__ == "__main__":
    a = sys.argv[1:]
    out = a[a.index("--out") + 1]
    files = [x for x in a if x.endswith(".json") and x != out and x != a[a.index("--out") + 1]]
    qs, log = build(flatten(files))
    res = []
    for q in qs:
        r = finish(q); r.pop("lines", None); res.append(r)
    json.dump(res, open(out, "w"), ensure_ascii=False, indent=0)
    from collections import Counter
    print(len(res), "questions", Counter(f for r in res for f in r["flags"]), "answered", sum(r["answer"] is not None for r in res))
    print(Counter(r["test"] for r in res))
    print(Counter((r["sect"], r["title"]) for r in res).most_common(40))
    print(len(log), log[:15])
