"""Builds data/numericals.json: which structured questions are numericals, their formula family and a book reference.

    python3 -I scripts/extract/classify_numericals.py

The question files themselves are not touched; scripts/prepare-content.mjs moves the listed ids into the
"Technical Subjects Numericals" subject, one topic per (subject, formula family).
"""
import json, re, sys, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from numerical_detect import is_numerical
from numerical_families import F, OTHER

root = Path(__file__).resolve().parents[2]
FILES = ["civil-vol1", "civil-vol2", "gs-civil-pyq", "civil-vol1-unverified", "civil-vol2-unverified", "gs-civil-pyq-unverified",
         "mech-thermo", "mech-materials", "chem-process", "chem-materials"]
SUBJ_NAME = {
    "civil-som": "Strength of Materials", "civil-em": "Engineering Mechanics", "civil-fm": "Fluid Mechanics", "civil-hm": "Hydraulic Machines",
    "civil-sa": "Structural Analysis", "civil-rcc": "Reinforced Cement Concrete", "civil-ss": "Design of Steel Structures", "civil-geo": "Geotechnical Engineering",
    "civil-ee": "Environmental Engineering", "civil-hyd": "Hydrology", "civil-irr": "Irrigation Engineering", "civil-sur": "Surveying",
    "civil-tra": "Transportation Engineering", "civil-est": "Estimation & Costing", "civil-cpm": "Construction Planning & Management",
    "civil-bm": "Building Materials", "civil-other": "Other Civil", "mech-thermo": "Process Calculations & Thermodynamics", "mech-mat": "Engineering Materials",
}
SOLVED = re.compile(r"[=×÷]|\bformula\b|\bsolution\b|∴|\bhence\b|\bso\b|\bthus\b", re.I)
BAD = re.compile(r"[-•■]")

def family(sid, q):
    # the stem decides the family; the options are only a fallback
    for text in (q["question"], q["question"] + " " + " ".join(q["options"])):
        for title, formula, rx in F.get(sid, []):
            if re.search(rx, text, re.I):
                return title, formula
    return OTHER

def solved(q):
    e = q.get("explanation") or ""
    return len(e) >= 45 and bool(re.search(r"\d", e)) and bool(SOLVED.search(e)) and not BAD.search(e) and not re.search(r"\bAns\b", e)

out, stats = {}, collections.Counter()
for f in FILES:
    for q in json.loads((root / "data/questions" / f"{f}.json").read_text("utf8")):
        sid = q.get("subjectId") or {"mech-thermo": "mech-thermo", "chem-process": "mech-thermo", "mech-materials": "mech-mat", "chem-materials": "mech-mat"}.get(f)
        if sid not in F or not is_numerical(q):
            continue
        fam, formula = family(sid, q)
        m = re.match(r"^(CIV1|CIV2|PYQ)-(\d+)$", q["id"])
        out[q["id"]] = {
            "subject": sid, "subjectName": SUBJ_NAME[sid], "family": fam, "formula": formula,
            "solved": solved(q), "qno": int(m.group(2)) if m else None,
        }
        stats[(sid, fam)] += 1
(root / "data/numericals.json").write_text(json.dumps(out, ensure_ascii=False, indent=0) + "\n", "utf8")
print(len(out), "numericals;", sum(1 for v in out.values() if v["solved"]), "with a usable worked solution")
for sid in SUBJ_NAME:
    row = sorted(((n, fam) for (s, fam), n in stats.items() if s == sid), reverse=True)
    if row: print(f"{SUBJ_NAME[sid]:42s}", sum(n for n, _ in row), "|", "; ".join(f"{fam[:28]} {n}" for n, fam in row))
