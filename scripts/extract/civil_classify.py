"""Assign every civil-engineering question to a subject + chapter of data/civil-chapters.json.
    python3 -I scripts/extract/civil_classify.py [--write]
Books (civil-vol1/2) carry their own unit/sub-section -> chapter prior, refined by keyword rules. Previous-paper
questions (gs-civil-pyq, no unit info) are placed by nearest neighbours among the book questions (TF-IDF), and a
keyword check inside the chosen subject. Questions that match nothing go to the "Other civil" bucket, never forced."""
import json, re, sys, collections, glob
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import civil_rules as CR
import civil_yct as YCT
from sklearn.feature_extraction.text import TfidfVectorizer
import numpy as np

SUBS = json.load(open("data/civil-chapters.json"))
SLUG = {1: "em", 2: "som", 3: "fm", 4: "hm", 5: "bm", 6: "sa", 7: "rcc", 8: "ss", 9: "cpm", 10: "geo", 11: "ee", 12: "hyd", 13: "irr", 14: "sur", 15: "tra", 16: "gel", 17: "est"}
CH = {s["n"]: [c["name"] for c in s["chapters"]] for s in SUBS}
RX = {n: {c: re.compile(p, re.I) for c, p in d.items()} for n, d in CR.R.items()}
FILES = ["civil-vol1", "civil-vol2", "civil-vol1-unverified", "civil-vol2-unverified", "gs-civil-pyq", "gs-civil-pyq-unverified"]

def text(q): return (q["question"] + " " + " ".join(q["options"])).replace("\n", " ")

def kw(n, t):
    return {c: len({m.group(0).lower() for m in rx.finditer(t)}) for c, rx in RX.get(n, {}).items()}

def pick_chapter(n, t, hint=None):
    sc = kw(n, t)
    if not sc: return None, 0
    for c in sc:
        if c == hint: sc[c] += 1.5
    best = max(sc.items(), key=lambda kv: (kv[1], kv[0] == hint))
    return (best[0], best[1]) if best[1] > 0 else (None, 0)

def main(write):
    items = []
    for f in FILES:
        for q in json.load(open(f"data/questions/{f}.json")):
            items.append((f, q))
    lab, unl = [], []
    for f, q in items:
        (lab if f.startswith("civil-vol") else unl).append((f, q, 1))
    res = {}
    # 1. books: the YCT index decides the subject and the set of chapters a heading may belong to;
    #    keywords choose among them (first listed = default)
    NAMES = {n: set(v) for n, v in CH.items()}
    for f, q, n in lab:
        t = text(q)
        bu = q.get("bookUnit", q["topic"]); sub = q.get("subtopic")
        n0, cands = YCT.lookup(bu, sub)
        if cands == "unknown" or n0 is None:
            res[q["id"]] = (0, None, "yct-other"); continue
        if cands is None:
            res[q["id"]] = (0, None, "yct-other"); continue
        opts = []
        for x in cands:
            nn, nm = (int(x.split(":")[0]), x.split(":", 1)[1]) if x[:3].split(":")[0].isdigit() and ":" in x[:3] else (n0, x)
            opts.append((nn, nm))
        best, bs = opts[0], -1.0
        for i, (nn, nm) in enumerate(opts):
            rx = RX.get(nn, {}).get(nm)
            score = len({m.group(0).lower() for m in rx.finditer(t)}) if rx else 0
            score += 0.5 if i == 0 else 0
            if score > bs: best, bs = (nn, nm), score
        res[q["id"]] = (best[0], best[1], "yct")
    # unlabelled by book topic (Building Construction, "Civil Engineering", PYQ) -> neighbours
    labelled = [(q, res[q["id"]]) for f, q, n in lab if q["id"] in res and res[q["id"]][1]]
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words="english")
    X = vec.fit_transform([text(q) for q, _ in labelled])
    lab_key = [(r[0], r[1]) for _, r in labelled]
    def classify(v, t, skip=None):
        sims = (v @ X.T).toarray()[0]
        if skip is not None: sims[skip] = 0
        idx = np.argsort(-sims)[:15]
        vote = collections.Counter()
        for j in idx: vote[lab_key[j]] += sims[j]
        subj = collections.Counter()
        for (n, c), x in vote.items(): subj[n] += x
        kws = {n: kw(n, t) for n in RX}
        for n, d in kws.items(): subj[n] += 0.15 * min(sum(1 for k in d.values() if k), 6)
        if not subj: return None, 0.0
        n, sw = subj.most_common(1)[0]
        cs = {c: vote.get((n, c), 0.0) + 0.45 * min(k, 4) for c, k in kws[n].items()}
        if not cs: return None, 0.0
        c, cw = max(cs.items(), key=lambda kv: kv[1])
        return (n, c), sw + 0.0 * cw
    rng = np.random.default_rng(1); sample = rng.choice(len(labelled), 600, replace=False)
    ok_s = ok_c = 0
    for i in sample:
        best, _ = classify(X[i], text(labelled[i][0]), skip=i)
        ok_s += best and best[0] == lab_key[i][0]; ok_c += best == lab_key[i]
    print(f"held-out (kNN+keywords): subject {ok_s/6:.1f}%  chapter {ok_c/6:.1f}%")
    un = [(f, q) for f, q, n in unl]
    V = vec.transform([text(q) for f, q in un])
    for i, (f, q) in enumerate(un):
        best, bw = classify(V[i], text(q))
        if best is None or bw < 0.3:
            res[q["id"]] = (0, None, "unmatched"); continue
        res[q["id"]] = (best[0], best[1], "knn+kw" if bw >= 0.9 else "knn+kw-weak")
    cnt = collections.Counter((SLUG.get(v[0], "other"), v[2]) for v in res.values())
    print(sorted(cnt.items()))
    print("total", len(res), "unmatched", sum(1 for v in res.values() if v[0] == 0 or v[1] is None))
    if write:
        json.dump({str(k): v for k, v in res.items()}, open("data/civil-chapter-map.json", "w"), ensure_ascii=False)

main("--write" in sys.argv)
