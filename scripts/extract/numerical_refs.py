"""Finds the printed question number (and checks the PDF page) of every numerical in the source books, so a student who gets a
numerical wrong can open the book at that page.  Updates data/numericals.json (fields `qno`, `page`).

    python3 -I scripts/extract/numerical_refs.py <raw-files-dir>
"""
import json, re, subprocess, sys
from difflib import SequenceMatcher
from pathlib import Path

root = Path(__file__).resolve().parents[2]
raw = Path(sys.argv[1] if len(sys.argv) > 1 else root / "QuestionBanks_RawFiles")
BOOKS = {
    "CIV1": raw / "6997837869_Civil Engineering Volume 1 .pdf",
    "CIV2": raw / "6997837869_Civil Engineering Volume 2 .pdf",
    "PYQ": raw / "DOC-20260429-WA0088..pdf",
    "THR1": raw / "Mechanical Engineering Volume 1.pdf", "THR2": raw / "Mechanical Engineering Volume 2.pdf",
    "MAT1": raw / "Mechanical Engineering Volume 1.pdf", "MAT2": raw / "Mechanical Engineering Volume 2.pdf",
    "CHP": next(raw.glob("ilide.info-chemical*.pdf")), "CHM": next(raw.glob("ilide.info-chemical*.pdf")),
}
_cache = {}
def pages(path):
    if path not in _cache:
        out = subprocess.run(["pdftotext", str(path), "-"], capture_output=True, text=True).stdout
        _cache[path] = out.split("\f")
    return _cache[path]
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())

def find_number(text, stem):
    """number printed just before the stem on this page text, or None"""
    key = norm(stem)[:28]
    if len(key) < 12:
        return None
    best = (0.0, None)
    for m in re.finditer(r"(?<![\d.])(\d{1,4})\s*[.)]\s*(?=\S)", text):
        seg = norm(text[m.end(): m.end() + 140])[:28]
        r = SequenceMatcher(None, key, seg).ratio() if seg else 0
        if r > best[0]:
            best = (r, int(m.group(1)))
    return best[1] if best[0] >= 0.78 else None

num = json.loads((root / "data/numericals.json").read_text("utf8"))
meta = {}
for f in ["civil-vol1", "civil-vol2", "gs-civil-pyq", "civil-vol1-unverified", "civil-vol2-unverified", "gs-civil-pyq-unverified", "mech-thermo", "mech-materials", "chem-process", "chem-materials"]:
    for q in json.loads((root / "data/questions" / f"{f}.json").read_text("utf8")):
        if q["id"] in num:
            meta[q["id"]] = q
BOOKNAME = {"CIV1": "Civil Engineering Volume-1", "CIV2": "Civil Engineering Volume-2", "PYQ": "APPSC/TSPSC Civil Engineering PYQ book (English medium)",
            "CHP": "Chemical Engineering objective book", "CHM": "Chemical Engineering objective book"}
found = miss = 0
for qid, v in num.items():
    q = meta[qid]
    pre = qid.split("-")[0]
    vol = re.search(r"Vol-(\d)", q["source"])
    book = BOOKS.get(pre + (vol.group(1) if pre in ("THR", "MAT") and vol else ""))
    p = q.get("sourcePage")
    v["page"] = p
    v["qno"] = None
    v["book"] = BOOKNAME.get(pre) or (f"Mechanical Engineering Volume-{vol.group(1)}" if vol else "Mechanical Engineering book")
    if not book or not p:
        miss += 1
        continue
    pg = pages(book)
    for k in (p, p + 1, p - 1):  # the question may begin on the neighbouring page
        if 1 <= k <= len(pg):
            n = find_number(pg[k - 1], q["question"])
            if n:
                v["qno"], v["page"] = n, k
                break
    found += v["qno"] is not None
    miss += v["qno"] is None
(root / "data/numericals.json").write_text(json.dumps(num, ensure_ascii=False, indent=0) + "\n", "utf8")
print("question numbers found", found, "of", len(num), "| page only", miss)
