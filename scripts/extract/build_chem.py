"""Chemical Engineering (YCT chapterwise solved papers) -> the AEE Pollution Control Board Paper-II topics that the Mechanical
volumes do not cover:

  * Engineering materials             <- 'Process Equipment Design' C, Material of Construction (selection and characteristics)  (mech-mat unit 6)
  * Process calculations (mass and energy balance, recycle/bypass/purge)          <- 'Material and Energy Balance' A-E  (mech-thermo units 8-12)
  * Thermodynamic properties of real systems (relations, EOS, solutions)           <- 'Chemical Engineering Thermodynamics' F-H (mech-thermo units 13-15)
  * Air, water, noise, solid-waste pollution and control equipment               <- 'Environmental pollution monitoring & control' A-E  (env units 4 and 5)

Fluid mechanics is taken from the Civil Engineering volumes, not from this book. Pumps, solids handling, fuels and combustion, reaction equilibrium, fire/HAZOP/safety are outside the notified syllabus.

    python3 -I scripts/extract/build_chem.py <dir with mat_pl.txt, proc_pl.txt, poll_pl.txt>

The three inputs are page-marked text of pdf pages 112-119, 120-153 and 210-225, each page cut at its real column gutter with pdfplumber
(scripts/extract/chem_columns.py), because pdftotext's layout mode merges the two columns of these pages.
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import civil_columns as C

root = pathlib.Path(__file__).resolve().parents[2]

# chapter name, first question number, last question number (numbering as printed in the book)
MATS = [("Materials of Construction (selection and characteristics)", 43, 9999)]
PROC1 = [("Units and Dimensions", 1, 8), ("Basic Chemical Calculations", 9, 41), ("Material Balance without Reaction, Recycle, Bypass and Purge", 42, 74),
         ("Material Balance with Chemical Reaction", 75, 91), ("Energy Balance", 92, 103)]
PROC2 = [("Thermodynamic Relations (Maxwell and Clapeyron equations)", 146, 160), ("Pure Substances and Equations of State", 161, 195), ("Solution Thermodynamics", 196, 246)]
POLL = [("Air Pollution and Control (chemical engineering)", 1, 52), ("Water Pollution and Control (chemical engineering)", 53, 116), ("Noise Pollution (chemical engineering)", 117, 123),
        ("Solid Waste: Hazards and Disposal (chemical engineering)", 124, 140), ("Pollution Control Equipment (chemical engineering)", 141, 147)]

def src_clean(s):
    return re.sub(r"\bChemical Engineering\b.*$", "", s).strip(" ,;[]")

def build(items, markers, chapters, tag, subject_id, subject_name, unit0, start, live, held, seen, only_after=None):
    for it in items:
        n = it["n"]
        ch = next((i for i, (_, a, b) in enumerate(chapters) if a <= n <= b), None)
        if ch is None:
            continue
        pdf_page = markers[it["page"] - 1]
        stem = it["question"]
        foot = lambda t: re.sub(r"\s*Chemical Engineering(?:\s+\d+)?(?:\s+YCT)?\s*$", "", t).strip()   # running page footer glued to the last option
        it = {**it, "options": [foot(o) for o in it["options"]]}
        key = re.sub(r"\W", "", (stem + "|".join(it["options"])).lower())
        fl = list(it["flags"]) + (["duplicate"] if key in seen else [])
        blob = " ".join([stem] + it["options"])
        if re.search(r"(?:^|\s)\d\s+\d(?:\s|$)", blob):      # chemical-formula subscripts came out as loose digits ("H O" with "2 2" elsewhere)
            fl.append("formula")
        if it["options"] and all(len(o) <= 2 for o in it["options"]):   # options are the letters of a figure
            fl.append("figure-options")
        seen.add(key)
        # the book prints the next chapter heading after the last question of a chapter; remove it from the explanation
        expl = re.sub(r"\s*(?:Chemical Engineering\s+)?[A-P]\.\s+[A-Z][A-Za-z ,&/()-]{6,70}$", "", it["explanation"]).strip()
        expl = re.sub(r"^(?:Ans\.?\s*\(?[a-d]\)?\s*:?\s*)", "", expl, flags=re.I).strip()
        if len(expl) < 6 or expl.startswith("Chemical Engineering") or re.fullmatch(r"[\d\s.]+", expl):   # page furniture, not an explanation
            expl = ""
        d = {
            "id": f"{tag}-{len(live) + len(held) + 1:05d}", "exam": ["aee-pcb"], "subject": subject_name, "subjectId": subject_id,
            "topic": chapters[ch][0], "unit": unit0 + ch, "question": stem, "options": it["options"],
            "answerIndex": "abcd".index(it["key"]) if it["key"] else -1, "explanation": expl[:900],
            "source": (src_clean(it["source"]) or "Chemical Engineering previous-year papers") + f" · Chemical Engg. p.{pdf_page}",
            "sourcePage": pdf_page, "sourceKey": (it["key"] or "?").upper(),
        }
        if fl:
            d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl); held.append(d)
        else:
            d["keyCheck"] = "auto-clean"; live.append(d)

def items_of(path):
    text = open(path, encoding="utf8", errors="ignore").read()
    markers = [int(m) for m in re.findall(r"===== PAGE (\d+) =====", text)]
    items, _ = C.parse(text, "X", presplit=True)
    return items, markers

if __name__ == "__main__":
    base = sys.argv[1]
    (root / "data/review").mkdir(exist_ok=True)
    def run(fname, chapter_sets, slug, tag):
        live, held, seen = [], [], set()
        for path_key, chapters, sid, sname, unit0, split in chapter_sets:
            items, markers = items_of(path_key)
            if split == "first":     # numbering restarts where the thermodynamics block begins
                cut = next((i for i in range(1, len(items)) if items[i]["n"] < items[i - 1]["n"] - 20), len(items))
                items = items[:cut]
            elif split == "second":
                cut = next((i for i in range(1, len(items)) if items[i]["n"] < items[i - 1]["n"] - 20), 0)
                items = items[cut:]
            build(items, markers, chapters, tag, sid, sname, unit0, 0, live, held, seen)
        (root / "data/questions" / f"{slug}.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
        (root / "data/review" / f"{slug}-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
        from collections import Counter
        print(slug, "live", len(live), "held", len(held), dict(Counter(q["topic"][:40] for q in live)))
    run(None, [(base + "/mat_pl.txt", MATS, "mech-mat", "Engineering Materials", 6, None)], "chem-materials", "CHM")
    run(None, [(base + "/proc_pl.txt", PROC1, "mech-thermo", "Process Calculations & Thermodynamics", 8, "first"),
               (base + "/proc_pl.txt", PROC2, "mech-thermo", "Process Calculations & Thermodynamics", 13, "second")], "chem-process", "CHP")
    run(None, [(base + "/poll_pl.txt", POLL, "env", "Environmental Science & Ecology", 1, None)], "chem-pollution", "CHE")
