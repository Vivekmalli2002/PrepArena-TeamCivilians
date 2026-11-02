"""Re-reads the civil questions whose first extraction failed the column-layout check ('layout' flag).

The first pass cut each page at a gutter found from the text layout. On pages where the two columns nearly touch, that cut was wrong,
so a question could pick up the answer line of its neighbour (the answer key, the explanation or both came from another question).
Here every such page is cut at its real gutter with pdfplumber (word positions), parsed again, and matched back to the existing
question by its text. A question is updated in place (same id, so progress and bookmarks are untouched) only when the new parse is
clean and the text agrees; its key, options and explanation then come from the re-read page.

    python3 -I scripts/extract/civil_relayout.py <vol1.pdf> <vol2.pdf>
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import civil_columns as C

root = pathlib.Path(__file__).resolve().parents[2]

def gutter(pg):
    w = pg.width
    cov = [0] * (int(w) + 2)
    for ch in pg.chars:
        for x in range(int(ch["x0"]), min(int(ch["x1"]) + 1, int(w))):
            cov[x] += 1
    return min(range(int(w * 0.4), int(w * 0.6)), key=lambda x: (cov[x], abs(x - w / 2)))

def page_text(pg):
    g = gutter(pg)
    return "\n".join((pg.crop(b).extract_text(x_tolerance=1.5, y_tolerance=3) or "") for b in [(0, 0, g, pg.height), (g, 0, pg.width, pg.height)])

def toks(s):
    return set(w for w in re.findall(r"[a-z0-9]+", s.lower()) if len(w) > 2)

def run(pdf_path, slug, tag):
    import pdfplumber
    path = root / "data/questions" / f"{slug}-unverified.json"
    items = json.load(open(path, encoding="utf8"))
    todo = [q for q in items if "layout" in q.get("flag", "")]
    pages = sorted({p for q in todo for p in (q["sourcePage"] - 1, q["sourcePage"], q["sourcePage"] + 1)})
    pdf = pdfplumber.open(pdf_path)
    parsed = {}
    runs, cur = [], []
    for p in pages:
        if cur and p != cur[-1] + 1:
            runs.append(cur); cur = []
        cur.append(p)
    if cur: runs.append(cur)
    for r in runs:
        text = "".join(f"===== PAGE {p} =====\n{page_text(pdf.pages[p - 1])}\n" for p in r if 1 <= p <= len(pdf.pages))
        its, _ = C.parse(text, tag, presplit=True)
        for it in its:
            it["page"] = r[it["page"] - 1]            # parse() numbers pages from 1 within the text it was given
            parsed.setdefault(it["page"], []).append(it)
    stats = {"todo": len(todo), "matched": 0, "key_changed": 0, "no_match": 0, "still_flagged": 0}
    for q in todo:
        want = toks(q["question"] + " " + " ".join(q["options"]))
        best, score = None, 0.0
        for p in (q["sourcePage"] - 1, q["sourcePage"], q["sourcePage"] + 1):
            for it in parsed.get(p, []):
                have = toks(it["question"] + " " + " ".join(it["options"]))
                if not have: continue
                s = len(have & want) / len(have)
                if s > score: best, score = it, s
        if not best or score < 0.8:
            stats["no_match"] += 1; continue
        if best["flags"] or not best["key"] or len(best["options"]) != 4:
            stats["still_flagged"] += 1; continue
        stats["matched"] += 1
        new = "abcd".index(best["key"])
        if new != q["answerIndex"]: stats["key_changed"] += 1
        q["question"], q["options"], q["answerIndex"] = best["question"], best["options"], new
        q["explanation"], q["sourceKey"] = best["explanation"], best["key"].upper()
        q["keyCheck"] = "relayout-clean"
        q["flag"] = "Re-read from the page with a corrected column cut; the first extraction had mixed neighbouring questions."
    json.dump(items, open(path, "w", encoding="utf8"), ensure_ascii=False)
    print(slug, stats)

if __name__ == "__main__":
    run(sys.argv[1], "civil-vol1", "CIV1")
    run(sys.argv[2], "civil-vol2", "CIV2")
