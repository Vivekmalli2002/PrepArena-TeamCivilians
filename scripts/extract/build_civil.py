"""Turns the column-aware extraction of the Civil Engineering volumes into data/questions/*.json (clean items, live) and
data/review/*.json (flagged items, held for an editor). Run from the repo root:
    python3 -I scripts/extract/build_civil.py <vol1.txt> <vol2.txt>
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import civil_columns as C

root = pathlib.Path(__file__).resolve().parents[2]

def toc_entries(pages):
    out = []
    for pn in range(2, 8):
        for l in pages[pn].split("\n"):
            m = re.match(r"^(\s*)(.+?)\s*[.\-]{3,}\s*(\d+)(?:\s*-\s*(\d+))?\s*$", l)
            if m:
                name = re.sub(r"^\d+\.\s*", "", m.group(2).strip())
                if name.lower().startswith(("syllabus", "civil ae", "trend analysis")):
                    continue
                out.append({"name": name, "page": int(m.group(3)), "chapter": m.group(4) is not None})
    return out

def pdf_offset(pages, entries):
    offs = []
    for e in entries:
        if e["page"] < 19:
            continue
        key = re.sub(r"[^a-z]", "", e["name"].lower())[:18]
        if len(key) < 8:
            continue
        for pdfp in range(e["page"], min(e["page"] + 12, len(pages))):
            txt = re.sub(r"[^a-z]", "", pages[pdfp - 1].lower()) if pdfp - 1 < len(pages) else ""
            if key in txt[:600]:
                offs.append(pdfp - e["page"]); break
    if not offs:
        return 2
    offs.sort()
    return offs[len(offs) // 2]

def topic_for(page, entries, off):
    book = page - off
    chap, sub = None, None
    for e in entries:
        if e["page"] <= book:
            if e["chapter"]: chap, sub = e["name"], None
            else: sub = e["name"]
        else:
            break
    return chap or "Civil Engineering", sub

def src_clean(s):
    s = re.sub(r"\bAE Civil Engg\.? Volume.*$", "", s).strip(" ,;[]")
    return s

def run(path, tag, vol):
    text = open(path, encoding="utf8", errors="ignore").read()
    pages = re.split(r"===== PAGE \d+ =====\n", text)[1:]
    entries = toc_entries(pages)
    off = pdf_offset(pages, entries)
    items, stats = C.parse(text, tag)
    live, held, seen = [], [], set()
    for it in items:
        key = re.sub(r"\W", "", (it["question"] + "|".join(it["options"])).lower())
        dup = key in seen
        seen.add(key)
        chap, sub = topic_for(it["page"], entries, off)
        d = {
            "id": f"{tag}-{len(live) + len(held) + 1:05d}", "exam": ["aee-rbi"], "subject": "Civil Engineering Core", "topic": chap,
            "question": it["question"], "options": it["options"], "answerIndex": "abcd".index(it["key"]) if it["key"] else -1,
            "explanation": it["explanation"], "source": (src_clean(it["source"]) or f"Civil Engineering Vol-{vol}") + f" · Civil Engg. Vol-{vol} p.{it['page']}",
            "sourcePage": it["page"], "sourceKey": (it["key"] or "?").upper(),
        }
        if sub: d["subtopic"] = sub
        fl = list(it["flags"]) + (["duplicate"] if dup else [])
        if fl:
            d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl)
            held.append(d)
        else:
            d["keyCheck"] = "auto-clean"; live.append(d)
    return live, held, stats, off

if __name__ == "__main__":
    for path, tag, vol, slug in [(sys.argv[1], "CIV1", 1, "civil-vol1"), (sys.argv[2], "CIV2", 2, "civil-vol2")]:
        live, held, stats, off = run(path, tag, vol)
        (root / "data/questions" / f"{slug}.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
        (root / "data/review").mkdir(exist_ok=True)
        (root / "data/review" / f"{slug}-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
        print(slug, "offset", off, "live", len(live), "flagged", len(held), stats)
