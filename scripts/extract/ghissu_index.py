"""Question index of the Ghissu model-answer books (Papers II-V, every APPSC Mains question 2008-2025 incl. sub-parts)
-> [{paper, year, no, question, truncated}]   usage: python3 -I ghissu_index.py <txt-dir> <out.json>"""
import re, sys, json, os
P = {2: "II", 3: "III", 4: "IV", 5: "V"}
out = []
for paper, rn in P.items():
    lines = open(os.path.join(sys.argv[1], f"APPSC_Group_I_Mains_Paper_{rn}_Model_Answers_2008_2025.pdf.txt")).read().split("\n")
    year, cur, extra = None, None, 0
    for l in lines:
        m = re.match(r"^\s*(20\d\d)\s+\d+ answers", l)
        if m: year, cur = int(m.group(1)), None; continue
        if year is None: continue
        m = re.match(r"^\s*((?:P-[IV]+\s+)?\d+\s*\([a-z]\)|Q?\d+)\s{2,}(\S.*?)\s{2,}(\d{1,4})\s+Practice\s*$", l)
        if m:
            cur = dict(paper=paper, year=year, no=re.sub(r"\s+", " ", m.group(1)), question=m.group(2).strip(), old=False)
            out.append(cur); extra = 0; continue
        if not l.strip(): cur = None; continue
        mo = re.match(r"^\s*old P-[IV]+\s{2,}(\S.*)$", l)
        if cur and mo and not re.search(r"Practice", l):
            cur["old"] = True; cur["question"] += " " + mo.group(1).strip(); continue
        if cur and extra < 2 and re.match(r"^\s{10,}\S", l) and "Index" not in l and "ghissu" not in l.lower():
            extra += 1
            t = l.strip()
            if t.lower().startswith("old p-"): cur["old"] = t
            elif not re.search(r"Practice|sign in|To practice", t): cur["question"] += " " + t
for r in out:
    r["truncated"] = r["question"].rstrip().endswith("...") or r["question"].rstrip().endswith("…")
    r["question"] = re.sub(r"\s+", " ", r["question"]).strip()
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
import collections
print(collections.Counter(r["paper"] for r in out), sum(r["truncated"] for r in out))
