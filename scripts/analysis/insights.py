"""Prediction table for the Mains learning tool -> src/content/mains-insights.json
Per latest-syllabus sub-topic (Ghissu matrix, 8 sittings 2008-2025):
  score  = recency-weighted count (2025 x3, 2023 x2.5, 2020 x2, 2017 x1.5, 2016 x1.2, older x1) -> what the examiner keeps returning to
  due    = asked >=3 times overall but absent from both 2023 and 2025 (overdue for a return)
  rising = asked in 2025 and 2023 both, or 2+ in the latest sitting
  dims   = angles seen in the closest past questions (TF-IDF retrieval from the PYQ compilation); unseen = core angles never asked
  dynamic = the sub-topic moves with current affairs (schemes, missions, technology, economy data, disasters ...)
usage: python3 -I insights.py <matrix.json> <out.json>"""
import json, sys, re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

W = {"2008": 1, "2011": 1, "2012": 1, "2016": 1.2, "2017": 1.5, "2020": 2, "2023": 2.5, "2025": 3}
CORE = ["concept", "mechanism", "policy", "issues", "impact", "measures"]
DYN = re.compile(r"polic|scheme|mission|programme|e-?govern|cyber|digital|\bict\b|\bit\b|space|isro|satellite|defence|energy|nuclear|renewable|solar|"
                 r"climate|disaster|pollution|waste|biodivers|disease|health|vaccin|biotech|genetic|nano|\bipr\b|patent|budget|finance|tax|fiscal|monetary|"
                 r"inflation|growth|gdp|sgdp|poverty|employment|welfare|infrastructure|industr|agricultur|irrigation|polavaram|amaravati|reorganisation|"
                 r"federal|election|panchayat|governance|ethic|law|rights|gender|women|education|skill|startup|trade|export|foreign", re.I)
M = json.load(open(sys.argv[1])); Q = json.load(open("src/content/mains.json"))
out = []
for p in (2, 3, 4, 5):
    subs = [r for r in M if r["paper"] == p and r["chapter"]]
    qs = [q for q in Q if q["paper"] == p]
    v = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True).fit([s["title"] for s in subs] + [q["question"] for q in qs])
    S = cosine_similarity(v.transform([s["title"] + " " + s["chapter"] for s in subs]), v.transform([(q.get("themeFull") or q["theme"]) + " " + q["question"] for q in qs]))
    for s, row in zip(subs, S):
        idx = [i for i in row.argsort()[::-1][:6] if row[i] > .12]
        dims = {}
        for i in idx:
            for d in qs[i]["dims"]: dims[d] = dims.get(d, 0) + 1
        y = s["years"]
        out.append(dict(paper=p, code=s["code"], title=s["title"], chapter=s["chapter"], years=y, total=s["total"],
                        score=round(sum(W[k] * n for k, n in y.items()), 1),
                        due=s["total"] >= 3 and y["2023"] == 0 and y["2025"] == 0,
                        rising=(y["2025"] > 0 and y["2023"] > 0) or y["2025"] >= 2,
                        dims=dims, unseen=[d for d in CORE if d not in dims] if idx else CORE,
                        dynamic=bool(DYN.search(s["title"] + " " + s["chapter"])), pyqs=[qs[i]["id"] for i in idx[:4]]))
out.sort(key=lambda r: (-(r["score"] + (4 if r["due"] else 0) + (2 if r["rising"] else 0))))
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
for r in out[:40]:
    print(f'{r["score"]:5} P{r["paper"]} {r["code"]:5} {"DUE " if r["due"] else ""}{"UP " if r["rising"] else ""}{r["title"][:70]}  unseen={r["unseen"]}')
