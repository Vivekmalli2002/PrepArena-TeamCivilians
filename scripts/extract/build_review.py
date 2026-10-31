"""Writes the books whose text export has interleaved columns (no reliable gutter) as REVIEW-ONLY files in data/review/.
Every item carries the flag 'layout-interleaved' because stems/options/explanations can be mixed with the neighbouring column.
Run: python3 -I scripts/extract/build_review.py <extraction-dir>   (dir holds the *.json written by civil_columns.py)
"""
import json, pathlib, sys
root = pathlib.Path(__file__).resolve().parents[2]
src = pathlib.Path(sys.argv[1])
BOOKS = {
    "13_CivilEng_APPSC_EM_TEXT": ("civil-appsc-em", "Civil Engineering Core", "APPSC AEE Civil (English medium) book"),
    "14_APPSC_TSPSC_PYQ_EM": ("appsc-tspsc-pyq", "General Studies", "APPSC/TSPSC PYQ book"),
    "06_IndianEconomy": ("gs-indian-economy", "Indian & AP Economy", "Indian Economy GS-6"),
    "07_ModernIndia": ("gs-modern-india", "AP & Indian History", "Modern India GS"),
    "08_AncientMedievalHistory": ("gs-ancient-medieval", "AP & Indian History", "Ancient & Medieval History GS"),
    "09_GeneralScience_Tech": ("gs-science-tech", "Science & Technology", "General Science & Technology GS"),
    "10_Geography": ("gs-geography", "Geography", "Geography GS"),
}
(root / "data/review").mkdir(exist_ok=True)
total = 0
for f, (slug, subject, label) in BOOKS.items():
    data = json.load(open(src / f"{f}.json"))["items"]
    out = []
    for n, it in enumerate(data, 1):
        out.append({
            "id": f"{slug.upper()}-{n:05d}", "subject": subject, "question": it["question"], "options": it["options"],
            "answerIndex": "abcd".index(it["key"]) if it["key"] else -1, "explanation": it["explanation"],
            "source": (it["source"] or label) + f" · {label} p.{it['page']}", "sourcePage": it["page"],
            "flags": ["layout-interleaved"] + it["flags"],
        })
    (root / "data/review" / f"{slug}.json").write_text(json.dumps(out, ensure_ascii=False), encoding="utf8")
    total += len(out)
    print(slug, len(out))
print("review-only total", total)
