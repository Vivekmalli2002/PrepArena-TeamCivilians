"""Reads the "chapter and sub-topic (latest syllabus) x year" matrices printed in the Ghissu model-answer books (Papers II-V)
-> src/content/mains-matrix.json  [{paper, code, title, years:{2008..2025}, total, chapter}]
usage: python3 -I ghissu_matrix.py <txt-dir> <out.json>"""
import re, sys, json, glob, os
YEARS = [2008, 2011, 2012, 2016, 2017, 2020, 2023, 2025]
rows = []
for paper in (2, 3, 4, 5):
    f = [p for p in glob.glob(os.path.join(sys.argv[1], f"APPSC_Group_I_Mains_Paper_{ {2:'II',3:'III',4:'IV',5:'V'}[paper] }_Model_Answers_2008_2025.pdf.txt"))][0]
    txt = open(f).read().split("\n")
    start = next(i for i, l in enumerate(txt) if "C H A P T E R A N D S U B" in l)
    chap = ""
    cont = None
    for l in txt[start + 1:start + 400]:
        m = re.match(r"^\s*(\d+(?:\.\d+)?)\.?\s+(.*?)\s{2,}((?:[\d·]+\s+){7}[\d·]+)\s+(\d+)\s*$", l)
        if not m:
            if re.match(r"^\s*(Note|ghissu|Index)", l) or "Paper" in l and "Mains" in l and start: pass
            continue
        code, title, cells, total = m.groups()
        vals = [0 if c == "·" else int(c) for c in cells.split()]
        if sum(vals) != int(total): continue
        d = dict(paper=paper, code=code.rstrip("."), title=re.sub(r"\s+", " ", title).strip(), years=dict(zip(map(str, YEARS), vals)), total=int(total))
        if "." not in code.rstrip("."): chap = d["title"]; d["chapter"] = None
        else: d["chapter"] = chap
        rows.append(d)
json.dump(rows, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
import collections
print(collections.Counter((r["paper"], r["chapter"] is None) for r in rows))
