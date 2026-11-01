"""Engineering Drawing MCQs with explanations -> data/questions/engineering-drawing.json (live) + data/review/ (held).

    pdftotext -layout "QuestionBanks_RawFiles/Engineering_Drawing_Questions Read only Green Mark.pdf" /tmp/draw.txt
    python3 -I scripts/extract/build_drawing.py /tmp/draw.txt

Only chapters that match a notified syllabus are kept:
  * AEE PR & TW / Tribal Welfare, Paper-3 "Engineering Drawing": conic sections incl. rectangular hyperbola, cycloid, epicycloid,
    hypocycloid, involute, plain/diagonal/vernier scales, orthographic projection and conventions, projections of points, lines,
    planes and solids, auxiliary views, sections of solids, development of surfaces, isometric projection, AutoCAD basics.
  * Draughtsman Grade-II, Paper-II "Drawing": BIS code (IS 962), layout of drawing, lines, lettering, dimensioning, scales, projection.
Chapters of the book outside both lists (tools, geometric constructions of polygons/circles/spirals, helix, cams, loci, intersection of
surfaces, oblique and perspective projection, centre of gravity, screw threads, nuts, bolts, rivets, welds) are left out.
Each kept unit carries the exams whose syllabus lists it; the app shows a student only the units of their own exam.
"""
import json, pathlib, re, sys

root = pathlib.Path(__file__).resolve().parents[2]
AEE, DM = "aee-prtw", "draughtsman"

# (unit name, exams, [(first line, last line)] of the book text)
UNITS = [
    ("Sheet Layout and Types of Drawing (IS 962 layout of drawing)", [DM], [(252, 371)]),
    ("Types of Lines", [DM], [(372, 639)]),
    ("Dimensioning", [DM], [(640, 1564)]),
    ("Scales (plain, diagonal, vernier)", [AEE, DM], [(1565, 2695)]),
    ("Conic Sections including the Rectangular Hyperbola", [AEE], [(3538, 3966), (4416, 4876)]),
    ("Cycloid, Epicycloid, Hypocycloid and Involute", [AEE], [(3967, 4266), (4877, 5050)]),
    ("Orthographic Projection: Principles, Conventions and BIS Code", [AEE, DM], [(5800, 6689)]),
    ("Projection of Points and Lines", [AEE], [(6690, 8791)]),
    ("Projection of Planes", [AEE], [(8792, 9404)]),
    ("Projection of Solids and Auxiliary Views", [AEE], [(9405, 10558)]),
    ("Sections of Solids", [AEE], [(10559, 11511)]),
    ("Development of Surfaces", [AEE], [(11512, 11648)]),
    ("Isometric Projection", [AEE], [(11806, 13919)]),
    ("Computer Aided Drawing (AutoCAD basics)", [AEE], [(15891, 99999)]),
]
# in the "Evolutes and Helix" block only the involute / evolute questions are on the syllabus
ONLY_IF = {(4877, 5050): re.compile(r"involute|evolute", re.I)}

SETS = [(252, "Sheet Layout and Types of Drawing"), (372, "Different Types of Lines"), (640, "System of Dimensioning"), (839, "Types of Dimensioning"),
        (1096, "Basic Principles of Dimensioning"), (1322, "Terminology of Dimensioning"), (1565, "Representative Factor"), (1827, "Types of Scales"),
        (2158, "Plane Scales"), (2461, "Diagonal Scales"), (3538, "Construction of Ellipse"), (3769, "Construction of Parabola"),
        (3863, "Construction of Hyperbola"), (4416, "Basics of Conic Sections"), (3967, "Cycloidal Curves"), (4877, "Evolutes and Involutes"),
        (5800, "Basics of Orthographic Projections"), (5957, "Planes of Projection and Four Quadrants"), (6107, "First Angle Projection"),
        (6255, "Third Angle Projection"), (6403, "BIS Code of Practice"), (6514, "Problems on Orthographic Projection"),
        (6690, "Projection of Points"), (7465, "Projection of Straight Lines"), (8792, "Basics of Planes"), (8934, "Projection of Planes"),
        (9405, "Basics of Solids"), (9669, "Projection of Solids"), (10559, "Basics of Sections"), (10695, "Sections of Prisms"),
        (10880, "Sections of Pyramids"), (11053, "Sections of Cylinders"), (11210, "Sections of Cones"), (11375, "Sections of Spheres"),
        (11512, "Development of Surfaces"), (11806, "Isometric Axes, Lines and Planes"), (11947, "Isometric Drawings"), (12232, "Isometric Drawing of Planes"),
        (13195, "Isometric Drawing of Cones"), (13588, "Isometric Drawing of Spheres"), (15891, "Computer Aided Drawing")]
SETS.sort()

FIG = re.compile(r"\b(figure|fig\.|shown (in|below)|diagram|as shown|following (figure|diagram)|image|match the following|match)\b", re.I)
OPT = re.compile(r"(?:(?<=\s)|^)\(?([a-d])\)\s")
START = re.compile(r"^\s*(\d{1,3})\.\s+(?=\S)")

def clean(s):
    return re.sub(r"\s+", " ", s).strip()

def setname(line):
    nm = SETS[0][1]
    for ln, n in SETS:
        if ln <= line: nm = n
    return nm

def parse_range(lines, a, b):
    """Questions whose first line lies in [a, b] (1-based book-text lines)."""
    idx = [(i, int(m.group(1))) for i in range(a - 1, min(b, len(lines))) if (m := START.match(lines[i]))]
    blocks = []
    for k, (i, n) in enumerate(idx):
        j = idx[k + 1][0] if k + 1 < len(idx) else min(b, len(lines))
        txt = "\n".join(lines[i:j])
        if re.search(r"^\s*Answer\s*:", txt, re.M | re.I):
            blocks.append((i + 1, n, txt))
    return blocks

def build_item(line, n, txt):
    flags = []
    txt = re.sub(r"^\s*\d{1,3}\.\s+", "", txt, count=1)
    txt = re.sub(r"^\s*\d{1,3}\s*$", "", txt, flags=re.M)           # printed page numbers
    txt = re.sub(r"Engineering Drawing Questions and Answers[^\n]*\n?", "", txt)
    am = re.search(r"^\s*Answer\s*:\s*\(?([a-dA-D])\)?", txt, re.M)
    if not am:
        return None
    head = txt[:am.start()]
    tail = txt[am.end():]
    pos, want, seq = None, "a", []
    for m in OPT.finditer(head):
        if m.group(1) == want:
            seq.append((m.start(), m.end())); want = chr(ord(want) + 1)
    nopt = 4 if len(seq) >= 4 else (2 if len(seq) == 2 else 0)   # True/False questions have two options
    if not nopt:
        flags.append("options"); stem = clean(head); opts = []
    else:
        stem = clean(head[:seq[0][0]])
        opts = []
        for k in range(nopt):
            e = seq[k + 1][0] if k < nopt - 1 else len(head)
            opts.append(clean(head[seq[k][1]:e]))
        if nopt == 2 and [o.lower() for o in opts] != ["true", "false"]:
            flags.append("options")
    expl = clean(re.sub(r"^\s*Explanation\s*:", "", tail.strip(), flags=re.I))
    expl = re.sub(r"\s+\d{1,3}\s*$", "", expl)
    if len(stem) < 12: flags.append("stem")
    if FIG.search(stem) or any(FIG.search(o) for o in opts): flags.append("figure")
    if opts and (len(set(opts)) < len(opts) or any(not o or len(o) > 200 for o in opts)): flags.append("options")
    if opts and "abcd".index(am.group(1).lower()) >= len(opts): flags.append("no-key")
    if len(stem) > 700: flags.append("long-stem")
    if re.search(r"[-]", stem + " ".join(opts)): flags.append("symbols")
    if not expl: flags.append("no-explanation")
    return {"line": line, "question": stem, "options": opts, "key": am.group(1).lower(), "explanation": expl[:1500], "flags": flags}

def run(text):
    lines = text.split("\n")
    # pdf page of a text line, for the source note
    page_at, p = [], 1
    for l in lines:
        page_at.append(p)
        p += l.count("\f")
    live, held, seen = [], [], set()
    for ui, (uname, exams, ranges) in enumerate(UNITS, 1):
        for a, b in ranges:
            for line, n, txt in parse_range(lines, a, b):
                it = build_item(line, n, txt)
                if not it: continue
                if (a, b) in ONLY_IF and not ONLY_IF[(a, b)].search(it["question"] + " " + it["explanation"]):
                    continue
                key = re.sub(r"\W", "", (it["question"] + "|".join(it["options"])).lower())
                fl = list(it["flags"]) + (["duplicate"] if key in seen else [])
                seen.add(key)
                d = {
                    "id": f"DRW-{len(live) + len(held) + 1:05d}", "exam": exams, "subject": "Engineering Drawing", "subjectId": "drawing-survey",
                    "topic": uname, "unit": ui, "subtopic": setname(line), "question": it["question"], "options": it["options"],
                    "answerIndex": "abcd".index(it["key"]), "explanation": it["explanation"],
                    "source": f"Engineering Drawing MCQs with explanations · p.{page_at[line - 1]}", "sourcePage": page_at[line - 1], "sourceKey": it["key"].upper(),
                }
                if fl:
                    d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl); held.append(d)
                else:
                    d["keyCheck"] = "auto-clean"; live.append(d)
    return live, held

if __name__ == "__main__":
    live, held = run(open(sys.argv[1], encoding="utf8", errors="ignore").read())
    (root / "data/questions/engineering-drawing.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
    (root / "data/review").mkdir(exist_ok=True)
    (root / "data/review/engineering-drawing-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
    from collections import Counter
    print("live", len(live), "held", len(held))
    for k, v in Counter(q["topic"] for q in live).items(): print(" ", k, v)
    print(Counter(x for q in held for x in q["flag"].split(": ")[1].split(", ")).most_common())
