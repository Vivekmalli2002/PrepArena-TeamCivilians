"""Questions of the CivicCentre 'AP G1 Mains Paper-N PYQs' books (APPSC and TGPSC, 2007-2024) -> json
usage: python3 -I civiccentre_pyq.py <pdf-dir> <out.json>"""
import sys, re, json, glob, os, pdfplumber
ROMAN = {"I": 1, "II": 2, "III": 3, "IV": 4, "V": 5}
out = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], "*Mains-Paper-*-PYQs-ModelAnswers*.pdf"))):
    paper = ROMAN[re.search(r"Mains-Paper-([IV]+)-PYQs", f).group(1)]
    cur = None
    with pdfplumber.open(f) as d:
        # column positions of this book: question numbers, and the APPSC/TGPSC source column
        xs, rs = [], []
        for pg in d.pages[4:9]:
            for w in pg.extract_words():
                if re.fullmatch(r"\d+\.", w["text"]) and w["top"] > 50: xs.append(round(w["x0"]))
                if w["text"] in ("APPSC", "TGPSC"): rs.append(round(w["x0"]))
        NUMX = max(set(xs), key=xs.count); RX = max(set(rs), key=rs.count)
        for pi, pg in enumerate(d.pages[:150]):
            ws = pg.extract_words()
            head = " ".join(w["text"] for w in ws[:14])
            if pi >= 4 and re.search(r"Model (Essays|Answers)", head): break      # the answers start here
            if pi < 4: continue
            nums = sorted([w for w in ws if re.fullmatch(r"\d+\.", w["text"]) and abs(w["x0"] - NUMX) <= 6], key=lambda w: w["top"])
            if not nums and not cur: continue
            bounds = [(w["top"] - 2, w) for w in nums]
            def block_of(top):
                k = None
                for i, (t, w) in enumerate(bounds):
                    if top >= t: k = i
                return k
            blocks = {}
            for w in ws:
                if w["top"] < 50 or w["top"] > 730: continue
                k = block_of(w["top"])
                if NUMX + 15 <= w["x0"] < RX - 38:
                    if k is None:
                        if cur: cur["q"].append(w["text"])
                    else: blocks.setdefault(k, []).append(w)
                elif w["x0"] >= RX - 4:
                    tgt = cur if k is None else None
                    if k is not None: blocks.setdefault(("r", k), []).append(w)
                    elif cur: cur["r"].append(w["text"])
            for i, (t, nw) in enumerate(bounds):
                q = " ".join(w["text"] for w in sorted(blocks.get(i, []), key=lambda w: (round(w["top"]), w["x0"])))
                r = " ".join(w["text"] for w in sorted(blocks.get(("r", i), []), key=lambda w: (w["top"], w["x0"])))
                cur = dict(paper=paper, no=nw["text"].rstrip("."), q=[q], r=[r], page=pi + 1)
                out.append(cur)
for r in out:
    r["question"] = re.sub(r"\s+", " ", " ".join(r.pop("q"))).strip()
    rr = " ".join(r.pop("r"))
    r["source"] = (re.search(r"APPSC|TGPSC|TSPSC", rr) or [None])[0]
    y = re.findall(r"(?:19|20)\d\d", rr)
    r["year"] = int(y[0]) if y else 0
out = [r for r in out if len(r["question"]) > 15]
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
import collections
print(collections.Counter((r["paper"], r["source"]) for r in out))
print(collections.Counter(r["year"] for r in out))
