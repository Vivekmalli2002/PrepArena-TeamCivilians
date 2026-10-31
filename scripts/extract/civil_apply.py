"""Writes the chapter assignment (data/civil-chapter-map.json) into the civil question files:
subjectId (civil-<slug>), topic = chapter name exactly as in the supplied chapter list, unit = chapter number,
bookUnit = the source book's own unit / the exam name (kept so the classification can be re-run).
    python3 -I scripts/extract/civil_apply.py"""
import json, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from civil_classify_const import SUBS, SLUG, FILES

M = json.load(open("data/civil-chapter-map.json"))
names = {s["n"]: [c["name"] for c in s["chapters"]] for s in SUBS}
dupes = {c for n in names for c in names[n] if sum(c in v for v in names.values()) > 1}
sname = {s["n"]: s["name"] for s in SUBS}

def topic_name(n, c):
    return f"{c} ({sname[n]})" if c in dupes else c

for f in FILES:
    path = f"data/questions/{f}.json"
    d = json.load(open(path))
    for q in d:
        n, c, how = M[str(q["id"])]
        book = q.get("bookUnit", q["topic"])
        q["bookUnit"] = book
        sub0 = q.get("subtopic")
        if f.startswith("gs-civil-pyq"):
            sub0 = book  # exam name -> lets students drill one past paper inside a chapter
        if n and c is None:
            c = "Miscellaneous"
        if n:
            q["subjectId"] = "civil-" + SLUG[n]
            q["topic"] = topic_name(n, c)
            if c in names[n]: q["unit"] = names[n].index(c) + 1
            else: q.pop("unit", None)
            q["subtopic"] = sub0
        else:
            q["subjectId"] = "civil-other"
            q["topic"] = "Other civil & general questions" if f.startswith("gs-civil-pyq") else book
            q.pop("unit", None)
            q["subtopic"] = sub0
        if q["subtopic"] is None: q.pop("subtopic")
        q["classified"] = how
    json.dump(d, open(path, "w"), ensure_ascii=False, indent=1)
    print(f, len(d))
