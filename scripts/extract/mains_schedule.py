"""Builds src/content/mains-schedule.json (the day-wise Group-I Mains checklist) from the three Theme Dossier booklets.

    python3 -I scripts/extract/mains_schedule.py <Booklet_1.pdf> <Booklet_2.pdf> <Booklet_3.pdf>

Each booklet has a contents table (day, date, theme, PYQ count, cycles) and, for every theme, a "Top 5" expected-question table
and a "Next 7" reserve table. Days 49-54 are rewrite sprints (no dossier).
"""
import json, re, sys
from pathlib import Path
import pdfplumber

root = Path(__file__).resolve().parents[2]
norm = lambda s: re.sub(r"\s+", " ", (s or "")).strip()
PAPERS = {"II": "Paper II · History, Culture & Geography", "III": "Paper III · Polity, Governance, Law & Ethics",
          "IV": "Paper IV · Economy of India & Andhra Pradesh", "V": "Paper V · Science, Technology & Environment"}
DATES = {}  # day -> ISO date
import datetime
d0 = datetime.date(2026, 11, 7)
for day in range(1, 61):
    DATES[day] = (d0 + datetime.timedelta(days=day - 1)).isoformat()

def read(path):
    rows, tops, nexts = [], [], []
    for p in pdfplumber.open(path).pages:
        for t in p.extract_tables():
            if not t:
                continue
            head = [norm(c) for c in t[0]]
            if head[:1] == ["Day"]:
                rows += [[norm(x) for x in r] for r in t[1:] if norm(r[0]).isdigit()]
            elif re.match(r"^\d\.\s", norm(t[0][0])):
                tops.append([[norm(x) for x in r] for r in t])
            elif head[:1] == ["#"]:
                nexts.append([[norm(x) for x in r if x is not None] for r in t[1:]])
    assert len(rows) == len(tops) == len(nexts), (path, len(rows), len(tops), len(nexts))
    return rows, tops, nexts

themes = {}
for path, phase in zip(sys.argv[1:4], "ABD"):
    rows, tops, nexts = read(path)
    for r, top, nxt in zip(rows, tops, nexts):
        day, _, title_paper, pyqs, cycles = r[:5]
        m = re.match(r"^(.*?)\s+Paper (II|III|IV|V)$", title_paper)
        assert m, title_paper
        entry = {
            "title": m.group(1), "paper": PAPERS[m.group(2)], "pyqs": int(pyqs), "cycles": cycles,
            "top": [{"n": int(t[0].split(".")[0]), "topic": t[0].split(".", 1)[1].strip(), "q": re.sub(r"\s*\(10 marks\)\s*Why:.*$", "", t[1]).strip(), "chance": t[2]} for t in top],
            "more": [{"n": int(x[0]), "q": x[1], "chance": next((c for c in x[2:] if c), "")} for x in nxt],
        }
        themes.setdefault(int(day), []).append(entry)

days = []
for day in range(1, 61):
    phase = "A" if day <= 24 else "B" if day <= 48 else "R" if day <= 54 else "D"
    d = datetime.date.fromisoformat(DATES[day])
    days.append({
        "day": day, "date": DATES[day], "label": d.strftime("%a %d %b"), "phase": phase,
        "themes": themes.get(day, []),
    })
out = {
    "source": "Team Civilians · APPSC Group-1 Mains theme dossiers (PYQ cycles 2008-2025)",
    "phases": {
        "A": "Phase A · Days 1-24 · the most-repeated themes first · 4 answers a day",
        "B": "Phase B · Days 25-48 · 3 answers a day",
        "R": "Rewrite sprints · Days 49-54",
        "D": "Phase D · Days 55-60 · two themes a day, 1 answer each",
    },
    "days": days,
}
(root / "src/content/mains-schedule.json").write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", "utf8")
print(sum(len(d["themes"]) for d in days), "themes in", len(days), "days")
