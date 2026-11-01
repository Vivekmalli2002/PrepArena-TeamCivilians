"""Builds the Mechanical-volume question files for the AEE (Pollution Control Board) Paper-II subjects:
  * Engineering Materials  <- YCT Mechanical Engineering Vol-1, chapter 'Material Science' (pdf pp. 744-846)
  * Process Calculations & Thermodynamics  <- YCT Mechanical Engineering Vol-2, chapter 'Thermodynamics' (pdf pp. 15-165)
Only these chapters are read: they are the YCT chapters that match the notified topics ("structure and properties of
engineering materials, phase diagrams, heat treatment, stress-strain diagrams" and "first & second law of thermodynamics and
their applications; equations of state and thermodynamic properties of real systems").

    python3 -I scripts/extract/build_mech.py <vol1-pages.txt> <vol2-pages.txt>

The inputs are page-marked text files ("===== PAGE n =====", n = pdf page) of just those page ranges. The two-column parser
is the one used for the Civil volumes; flagged items go to data/review/, never into the bank.
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import civil_columns as C

root = pathlib.Path(__file__).resolve().parents[2]

# chapter name, first pdf page (book page = pdf page in these two volumes)
MAT = [("Material Properties", 744), ("Atomic Structures, Crystallography and Phase Diagrams", 757), ("Mechanical Testing", 789),
       ("Heat Treatment Process", 797), ("Engineering Materials", 811)]
THR = [("Basic Concepts & Zeroth Law of Thermodynamics", 15), ("First Law of Thermodynamics", 60), ("Second Law of Thermodynamics", 82),
       ("Entropy", 114), ("Availability and Irreversibility", 127), ("Properties of Pure Substances, Gases and Gas Mixture", 136),
       ("Thermodynamic Relations", 158)]

def chapter(pdf_page, chapters):
    k = 0
    for i, (_, p) in enumerate(chapters):
        if p <= pdf_page: k = i
    return k

def src_clean(s):
    return re.sub(r"\bMechanical Engg\.? Volume.*$", "", s).strip(" ,;[]")

def run(path, tag, vol, first_pdf, chapters, subject_id, subject_name):
    text = open(path, encoding="utf8", errors="ignore").read()
    markers = [int(m) for m in re.findall(r"===== PAGE (\d+) =====", text)]
    items, stats = C.parse(text, tag)
    live, held, seen = [], [], set()
    for it in items:
        pdf_page = markers[it["page"] - 1]
        # the first question of a chapter carries the printed chapter heading in front of its number
        stem = re.sub(r"^(?:" + "|".join(re.escape(c) for c, _ in chapters) + r")\s+\d{1,3}\.\s*", "", it["question"])
        it = {**it, "question": stem}
        key = re.sub(r"\W", "", (it["question"] + "|".join(it["options"])).lower())
        dup = key in seen
        seen.add(key)
        k = chapter(pdf_page, chapters)
        d = {
            "id": f"{tag}-{len(live) + len(held) + 1:05d}", "exam": ["aee-pcb"], "subject": subject_name, "subjectId": subject_id,
            "topic": chapters[k][0], "unit": k + 1, "question": it["question"], "options": it["options"],
            "answerIndex": "abcd".index(it["key"]) if it["key"] else -1, "explanation": it["explanation"],
            "source": (src_clean(it["source"]) or f"Mechanical Engineering Vol-{vol}") + f" · Mechanical Engg. Vol-{vol} p.{pdf_page}",
            "sourcePage": pdf_page, "sourceKey": (it["key"] or "?").upper(),
        }
        fl = list(it["flags"]) + (["duplicate"] if dup else [])
        if fl:
            d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl)
            held.append(d)
        else:
            d["keyCheck"] = "auto-clean"; live.append(d)
    return live, held, stats

if __name__ == "__main__":
    jobs = [(sys.argv[1], "MAT", 1, 744, MAT, "mech-mat", "Engineering Materials", "mech-materials"),
            (sys.argv[2], "THR", 2, 15, THR, "mech-thermo", "Process Calculations & Thermodynamics", "mech-thermo")]
    (root / "data/review").mkdir(exist_ok=True)
    for path, tag, vol, first, chs, sid, sname, slug in jobs:
        live, held, stats = run(path, tag, vol, first, chs, sid, sname)
        (root / "data/questions" / f"{slug}.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
        (root / "data/review" / f"{slug}-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
        from collections import Counter
        print(slug, "live", len(live), "flagged", len(held), dict(Counter(q["topic"] for q in live)))
