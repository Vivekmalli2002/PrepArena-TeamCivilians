"""Chapter weightage from real previous papers. Source: the previous-paper questions (gs-civil-pyq files, one topic per
exam paper) after chapter classification. Only papers of Assistant Executive Engineer (civil) are counted by default.
    python3 -I scripts/extract/civil_weights.py   ->  src/content/civilWeights.json
Nothing in the AEE notification states per-topic question counts (see docs); these shares are measured, not official."""
import json, re, sys, collections
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from civil_classify_const import SUBS, SLUG

M = json.load(open("data/civil-chapter-map.json"))
rows = []
for f in ("gs-civil-pyq", "gs-civil-pyq-unverified"):
    for q in json.load(open(f"data/questions/{f}.json")):
        rows.append((q.get("bookUnit", q["topic"]), M[str(q["id"])]))
AEE = re.compile(r"Assistant Executive Engineer", re.I)
ENV = re.compile(r"Environmental", re.I)
sel = [(e, r) for e, r in rows if AEE.search(e) and not ENV.search(e) and r[0]]
papers = collections.Counter(e for e, _ in sel)
print("AEE civil past-paper questions:", len(sel), "in", len(papers), "papers")
sub_ct = collections.Counter(); ch_ct = collections.defaultdict(collections.Counter)
for e, (n, c, how) in sel:
    sub_ct[n] += 1; ch_ct[n][c or "Miscellaneous"] += 1
tot = sum(sub_ct.values())
out = {"basis": f"{len(sel)} classified questions from {len(papers)} past AEE (civil) papers", "papers": dict(papers), "subjects": {}}
for s in SUBS:
    n = s["n"]; k = sub_ct.get(n, 0)
    chs = {c["name"]: ch_ct[n].get(c["name"], 0) for c in s["chapters"]}
    chs["Miscellaneous"] = chs.get("Miscellaneous", 0) + ch_ct[n].get("Miscellaneous", 0) if "Miscellaneous" not in chs else chs["Miscellaneous"]
    out["subjects"][f"civil-{SLUG[n]}"] = {
        "name": s["name"], "questions": k, "share": round(k / tot, 4),
        "chapters": {c: v for c, v in chs.items()},
    }
json.dump(out, open("src/content/civilWeights.json", "w"), ensure_ascii=False, indent=1)
for s, v in sorted(out["subjects"].items(), key=lambda kv: -kv[1]["questions"]): print(f"{s:10} {v['questions']:4} {v['share']*150:5.1f}/150  {v['name']}")
