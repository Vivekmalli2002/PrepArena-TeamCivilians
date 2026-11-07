"""Parses the APPSC Group-1 60-Day Drill Sheet PDF text (pdftotext -layout) into src/content/drill-60.json.
usage: python3 -I drill_sheet.py drill.txt src/content/drill-60.json
"""
import json, re, sys

txt = open(sys.argv[1]).read()
lines = [l.rstrip() for l in txt.split("\n") if "Drill Sheet v2 | page" not in l]
text = "\n".join(lines).replace("\f", "")
text = text.split("Selection rules behind the A/B picks")[0]
PAPER = {"Paper II": 2, "Paper III": 3, "Paper IV": 4, "Paper V": 5}

# split into day blocks
parts = re.split(r"(?m)^\s*DAY (\d+)\s+Rank (\d+): (.+)$", text)
days = []
for i in range(1, len(parts), 4):
    n, rank, theme, body = int(parts[i]), int(parts[i + 1]), parts[i + 2].strip(), parts[i + 3]
    # paper = last "Paper X:" heading before this block
    head = text[: re.search(rf"(?m)^\s*DAY {n}\s+Rank", text).start()]
    paper = PAPER[re.findall(r"(?m)^(Paper (?:II|III|IV|V)):", head)[-1]]
    m = re.search(r"Recurrence: (.+?)\. Usual slot: (.+?)\. Expected questions today: (\d+)", body, re.S)
    recurrence = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""
    slot = re.sub(r"\s+", " ", m.group(2)).strip() if m else ""
    ab = re.search(r"A/B pick:\s*(.+?)\n\s*\n", body, re.S)
    ab = re.sub(r"\s+", " ", ab.group(1)).strip() if ab else ""
    reading_sec = body.split("PYQ READING (parallel)")[1].split("Other PYQ dimensions asked:")[0]
    other = re.search(r"Other PYQ dimensions asked:(.+?)\n\s*\n", body, re.S)
    other = re.sub(r"\s+", " ", other.group(1)).strip() if other else ""
    reading = []
    for blk in re.split(r"(?m)^(?=\d+\s{2,}PYQ )", reading_sec):
        b = re.match(r"(\d+)\s{2,}(PYQ .*?)\s{2,}(.+)", blk.split("\n")[0])
        if not b:
            continue
        rest = [l for l in blk.split("\n")[1:] if l.strip()]
        yrs, q = b.group(2), b.group(3)
        for l in rest:  # wrapped lines: left column continues the years, right column the question
            m2 = re.match(r"\s{3,}(\S.*?)\s{2,}(\S.*)$", l)
            if m2:
                yrs += " " + m2.group(1); q += " " + m2.group(2)
            else:
                m3 = re.match(r"\s+(\S.*)$", l)
                if m3:
                    (q := q + " " + m3.group(1)) if len(l) - len(l.lstrip()) > 20 else (yrs := yrs + " " + m3.group(1))
        reading.append({"years": re.sub(r"\s+", " ", yrs.replace("PYQ ", "")).strip(), "q": re.sub(r"\s+", " ", q).strip()})
    exp_sec = body.split("EXPECTED QUESTIONS")[1]
    expected = []
    for blk in re.split(r"(?m)^(?=\d+\s{2,}(?:MUST|STRETCH|RESERVE))", exp_sec):
        b = re.match(r"(\d+)\s{2,}(MUST|STRETCH|RESERVE)\s{2,}(.+?)\s{2,}(\S.*)", blk.split("\n")[0])
        if not b:
            continue
        tag, q = b.group(3), b.group(4)
        for l in [l for l in blk.split("\n")[1:] if l.strip()]:
            ind = len(l) - len(l.lstrip())
            m2 = re.match(r"\s{3,}(\S.*?)\s{2,}(\S.*)$", l) if ind < 35 else None
            if m2:  # tag column and question column both wrap
                tag += " " + m2.group(1); q += " " + m2.group(2)
            elif ind >= 35:  # only the question column wraps
                q += " " + l.strip()
            else:  # only the tag column wraps
                tag += " " + l.strip()
        expected.append({"n": int(b.group(1)), "tier": b.group(2).lower(), "tag": re.sub(r"\s+", " ", tag).strip(), "q": re.sub(r"\s+", " ", q).strip()})
    seen = set()  # the sheet repeats a MUST "gap angle" question as a RESERVE: keep the first copy only
    expected = [e for e in expected if not (e["q"] in seen or seen.add(e["q"]))]
    days.append({"day": n, "paper": paper, "rank": rank, "theme": theme, "recurrence": recurrence, "slot": slot, "ab": ab,
                 "reading": reading, "other": other, "expected": expected})
days.sort(key=lambda d: d["day"])
json.dump(days, open(sys.argv[2], "w"), indent=1, ensure_ascii=False)
print(len(days), "days;", sum(len(d["expected"]) for d in days), "expected;", sum(len(d["reading"]) for d in days), "reading")
for d in days:
    tiers = [e["tier"] for e in d["expected"]]
    if tiers.count("must") != 4 or not d["reading"] or not d["other"]:
        print("CHECK", d["day"], tiers.count("must"), len(d["reading"]), bool(d["other"]))
