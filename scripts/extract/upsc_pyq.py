"""UPSC Mains GS-I..IV previous-year questions 2013-2026 (UnlockIAS compilations; text extracted with `pdftotext -layout`)
-> scripts/data/upsc.json  [{gs, year, marks, words, no, subject, question}]
usage: python3 -I upsc_pyq.py <dir with gs1_1.txt gs2.txt gs3.txt gs4.txt> <out.json>"""
import re, sys, json, os
files = {1: "gs1_1.txt", 2: "gs2.txt", 3: "gs3.txt", 4: "gs4.txt"}
HDR = re.compile(r"^\s*(20\d\d)\s+GS-([IV]+)\b(.*)$")
out, stated = [], {}
for gs, fn in files.items():
    lines = open(os.path.join(sys.argv[1], fn), encoding="utf-8", errors="ignore").read().split("\n")
    m = re.search(r"(\d+)\s+Questions", "\n".join(lines[:6])); stated[gs] = int(m.group(1)) if m else None
    subject, cur, buf = "", None, []
    def flush():
        global cur, buf
        if cur:
            text = re.sub(r"\s+", " ", " ".join(buf)).strip()
            text = re.sub(r"^Q\s*\d+\s*(\([a-z]\))?\s*\.\s*", "", text)
            if len(text) > 15: out.append({**cur, "question": text})
        cur, buf = None, []
    for l in lines:
        s = l.rstrip()
        if not s.strip() or re.search(r"UnlockIAS", s): continue
        h = HDR.match(s)
        if h:
            flush()
            mk = re.search(r"([\d.]+)\s*M", h.group(3)); wd = re.search(r"(\d+)\s*W", h.group(3))
            cur = dict(gs=gs, year=int(h.group(1)), marks=float(mk.group(1)) if mk else None, words=int(wd.group(1)) if wd else None, subject=subject)
            no = re.search(r"Q\s*(\d+\s*(?:\([a-z]\))?)", "")  # number is on the next line
            continue
        if cur is None:
            if not s.startswith("  ") and len(s.strip()) < 70 and not s.strip().startswith("UPSC Mains") and "Questions" not in s and "Verbatim" not in s:
                subject = s.strip()
            continue
        if not s.startswith(" ") and len(s.strip()) < 70 and not re.match(r"^Q\d", s.strip()):   # a new subject heading at column 0
            flush(); subject = s.strip(); continue
        buf.append(s.strip())
    flush()
import collections
print("parsed", collections.Counter(q["gs"] for q in out), "stated", stated)
print(collections.Counter(q["year"] for q in out))
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
