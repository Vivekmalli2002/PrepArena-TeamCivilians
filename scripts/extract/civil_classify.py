"""Assign every civil-engineering question to a subject + chapter of data/civil-chapters.json.
    python3 -I scripts/extract/civil_classify.py [--write]
Books (civil-vol1/2) carry their own unit/sub-section -> chapter prior, refined by keyword rules. Previous-paper
questions (gs-civil-pyq, no unit info) are placed by nearest neighbours among the book questions (TF-IDF), and a
keyword check inside the chosen subject. Questions that match nothing go to the "Other civil" bucket, never forced."""
import json, re, sys, collections, glob
sys.path.insert(0, __file__.rsplit("/", 1)[0])
import civil_rules as CR
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
        if c == hint: sc[c] += 3
    best = max(sc.items(), key=lambda kv: (kv[1], kv[0] == hint))
    return (best[0], best[1]) if best[1] > 0 else (None, 0)

def main(write):
    items = []
    for f in FILES:
        for q in json.load(open(f"data/questions/{f}.json")):
            items.append((f, q))
    lab, unl = [], []
    for f, q in items:
        n = CR.BOOK_SUBJECT.get(q["topic"])
        (lab if n else unl).append((f, q, n))
    res = {}
    # 1. books: subject from the book, chapter from sub-section prior + keywords
    for f, q, n in lab:
        t = text(q)
        sub = q.get("subtopic")
        hint = CR.SUBTOPIC_HINT.get(sub)
        if n == 14:  # surveying + geology volume
            g, gs = pick_chapter(16, t)
            s14, ss = pick_chapter(14, t, hint)
            if gs >= 2 and gs > ss: res[q["id"]] = (16, CH[16][0], "book+kw"); continue
        c, sc = pick_chapter(n, t, hint if hint in CH[n] else None)
        if c is None:
            c = hint if hint in CH[n] else ("Miscellaneous" if "Miscellaneous" in CH[n] else None)
        res[q["id"]] = (n, c, "book+kw" if c else "book") if c else (n, None, "book")
    # unlabelled by book topic (Building Construction, "Civil Engineering", PYQ) -> neighbours
    labelled = [(q, res[q["id"]]) for f, q, n in lab if q["id"] in res and res[q["id"]][1]]
    vec = TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True, stop_words="english")
    X = vec.fit_transform([text(q) for q, _ in labelled])
    lab_key = [(r[0], r[1]) for _, r in labelled]
    allkw = {n: RX[n] for n in RX}
    def score(vrow_idx, sims, t):
        w = collections.Counter()
        for j, sv in zip(vrow_idx, sims): w[lab_key[j]] += sv
        for n in allkw:
            for c, k in kw(n, t).items():
                if k: w[(n, c)] += 0.35 * min(k, 4)
        return w
    def classify(v, t, skip=None):
        sims = (v @ X.T).toarray()[0]
        if skip is not None: sims[skip] = 0
        idx = np.argsort(-sims)[:12]
        w = score(idx, sims[idx], t)
        if not w: return None, 0.0
        (best, bw) = w.most_common(1)[0]
        return best, bw
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
        if best is None or bw < 0.35:
            res[q["id"]] = (0, None, "unmatched"); continue
        res[q["id"]] = (best[0], best[1], "knn+kw" if bw >= 0.9 else "knn+kw-weak")
    cnt = collections.Counter((SLUG.get(v[0], "other"), v[2]) for v in res.values())
    print(sorted(cnt.items()))
    print("total", len(res), "unmatched", sum(1 for v in res.values() if v[0] == 0 or v[1] is None))
    if write:
        json.dump({str(k): v for k, v in res.items()}, open("data/civil-chapter-map.json", "w"), ensure_ascii=False)

main("--write" in sys.argv)
