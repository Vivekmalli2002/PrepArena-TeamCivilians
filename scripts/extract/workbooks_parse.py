"""Turns the OCR output of the Mission-1000 workbooks into questions -> scripts/data/workbooks.json
usage: python3 -I workbooks_parse.py <ocr-dir> <out.json>"""
import sys, re, json, glob, os
import wordsegment
wordsegment.load()
PAPER = {"Paper-I-": 1, "Paper-II-": 2, "Paper-III-": 3, "Paper-IV-": 4, "Paper-V-": 5}
BOARD = re.compile(r"\(?\s*(APPSC|TGPSC|TSPSC|APpsc|APPsC|AppSC|TGpsc)\s*(?:Prelims\s*)?((?:19|20)\d\d)?\s*\)?", re.I)

def fix_spaces(t):
    t = re.sub(r"(?<=[a-z])\.(?=[A-Z])", ". ", t)
    t = re.sub(r"(?<=[a-z,?;])(?=[A-Z][a-z])", " ", t)
    t = re.sub(r"(?<=[.?,;:])(?=[A-Za-z])", " ", t)
    out = []
    for tok in t.split(" "):
        m = re.fullmatch(r"([^A-Za-z]*)([A-Za-z]{7,})([^A-Za-z]*)", tok)
        if m and (m.group(2).lower() not in wordsegment.UNIGRAMS or len(m.group(2)) > 22):
            seg = wordsegment.segment(m.group(2))
            if m.group(2)[0].isupper(): seg[0] = seg[0].capitalize()
            tok = m.group(1) + " ".join(seg) + m.group(3)
        out.append(tok)
    return " ".join(out)

def clean_line(l):
    l = l.strip()
    if not l or re.search(r"India.?s Leading|Indlia|UPSC", l, re.I): return ""
    letters = sum(c.isalpha() and c.isascii() for c in l)
    if letters < 0.6 * len(l.replace(" ", "")): return ""        # Telugu / noise
    return l

res = []
for f in sorted(glob.glob(os.path.join(sys.argv[1], "*.jsonl"))):
    paper = next((v for k, v in PAPER.items() if k in f), 0)
    cur = None
    for line in open(f):
        r = json.loads(line)
        ls = [clean_line(x) for x in r["text"].split("\n")]
        ls = [x for x in ls if x]
        if not ls: continue
        k = next((i for i, x in enumerate(ls) if re.match(r"^Q\s*\d+\s*[.)]?$|^Q\s*\d+\s*[.)]\s*\S", x)), None)
        if k is not None:
            if cur: res.append(cur)
            first = re.sub(r"^Q\s*\d+\s*[.)]?\s*", "", ls[k])
            cur = dict(paper=paper, file=os.path.basename(f), page=r["page"], text=[first] + ls[k + 1:])
        elif cur and not cur.get("closed") and r["page"] - cur["page"] <= 2 and not any(BOARD.search(" ".join(cur["text"]))): 
            cur["text"] += ls
        if cur and any(BOARD.search(x) for x in cur["text"]): cur["closed"] = True
    if cur: res.append(cur)
out = []
for c in res:
    txt = " ".join(c["text"]); txt = re.sub(r"\s+", " ", txt)
    m = BOARD.search(txt)
    board = year = None
    if m:
        board = "TGPSC" if m.group(1).upper().startswith(("TG", "TS")) else "APPSC"
        year = int(m.group(2)) if m.group(2) else 0
        txt = txt[:m.start()]
    txt = re.sub(r"\(\s*$", "", txt).strip(" ,;")
    txt = fix_spaces(txt)
    if len(txt) > 25 and c["paper"]: out.append(dict(paper=c["paper"], question=txt, board=board, year=year or 0, src=c["file"], page=c["page"]))
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
import collections
print(len(out), collections.Counter(o["paper"] for o in out), collections.Counter(o["board"] for o in out))
