"""Maps each Mains question (src/content/mains.json) onto a latest-syllabus sub-topic of the Ghissu matrix by TF-IDF
similarity of (question + microtheme) with the sub-topic title and its chapter. Paper I stays on its microtheme.
usage: python3 -I map_subtopics.py <matrix.json> <out.json>"""
import json, sys, re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
M = json.load(open(sys.argv[1])); Q = json.load(open("src/content/mains.json"))
out = {}
for p in (2, 3, 4, 5):
    subs = [r for r in M if r["paper"] == p and r["chapter"]]
    qs = [q for q in Q if q["paper"] == p]
    docs = [s["title"] + " " + (s["chapter"] or "") for s in subs]
    qd = [(q.get("themeFull") or q["theme"]) + " " + q["question"] for q in qs]
    v = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True).fit(docs + qd)
    S = cosine_similarity(v.transform(qd), v.transform(docs))
    for q, row in zip(qs, S):
        j = int(row.argmax()); out[q["id"]] = dict(code=subs[j]["code"], score=round(float(row[j]), 3))
json.dump(out, open(sys.argv[2], "w"))
import collections
print(len(out), sum(1 for v in out.values() if v["score"] < .08), "weak")
# compare to the matrix totals
for p in (2, 3, 4, 5):
    c = collections.Counter(v["code"] for k, v in out.items() if k.startswith(f"g1p{p}-"))
    subs = [r for r in M if r["paper"] == p and r["chapter"]]
    err = sum(abs(c[s["code"]] - s["total"]) for s in subs)
    print("paper", p, "abs diff vs matrix", err, "of", sum(s["total"] for s in subs))
