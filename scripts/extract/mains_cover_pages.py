"""The first question table of each paper sits under the paper's trend table on its cover page, where table detection
fails (pages 2, 10, 24, 36, 56 of the compilation). Read those by word position and put the rows in front of their section.
usage: python3 -I mains_cover_pages.py <pdf> scripts/data/compilation.json"""
import sys, re, json, pdfplumber
pdf, dst = sys.argv[1], sys.argv[2]
data = json.load(open(dst))
if any(r.get("cover") for r in data): sys.exit("already merged")
clean = lambda s: re.sub(r"\s+", " ", s or "").strip()
PAGES = {1: 1, 9: 2, 23: 3, 35: 4, 55: 5}
new = []
with pdfplumber.open(pdf) as d:
    for pi, paper in PAGES.items():
        pg = d.pages[pi]
        lines = pg.extract_text_lines()
        hdr = [l for l in lines if re.match(r"Microtheme", l["text"])]
        if not hdr: print("no header on page", pi); continue
        top = hdr[0]["bottom"]
        sec = next((re.match(r"(SECTION [A-Z0-9IVX]+\s*:.*)$", l["text"].strip()).group(1) for l in lines if re.match(r"SECTION [A-Z0-9IVX]+\s*:", l["text"].strip())), "")
        topics = [(l["top"], clean(l["text"])) for l in lines if re.match(r"^\d\d\.\s", l["text"].strip()) and l["top"] > 150]
        ws = [w for w in pg.extract_words() if w["top"] > top - 1 and w["bottom"] < pg.height - 40]
        qs = sorted([w for w in ws if 170 <= w["x0"] <= 188 and re.fullmatch(r"\d+\.", w["text"])], key=lambda w: w["top"])
        for i, q in enumerate(qs):
            t0 = q["top"] - 2
            t1 = qs[i + 1]["top"] - 2 if i + 1 < len(qs) else pg.height
            text = " ".join(w["text"] for w in sorted([w for w in ws if 188 <= w["x0"] < 497 and t0 <= w["top"] < t1], key=lambda w: (round(w["top"]), w["x0"])))
            yr = [w["text"] for w in ws if w["x0"] >= 497 and re.fullmatch(r"(19|20)\d\d", w["text"]) and t0 <= w["top"] < t1]
            new.append(dict(paper=paper, num=int(q["text"].rstrip(".")), top=t0, nxt=t1, question=clean(text), year=int(yr[0]) if yr else 0, section=sec, cover=True,
                            topic=next((t for tt, t in reversed(topics) if tt <= t0), ""), left=[w for w in ws if w["x0"] < 170 and t0 - 3 <= w["top"] < t1]))
# micro text: left-column words from a question numbered 1 until the next numbered 1
out, grp = [], []
for r in new:
    if r["num"] == 1 and grp: out.append(grp); grp = []
    grp.append(r)
if grp: out.append(grp)
final = []
for g in out:
    words = sorted([w for r in g for w in r["left"]], key=lambda w: (round(w["top"]), w["x0"]))
    micro = clean(" ".join(w["text"] for w in words))
    micro = re.sub(r"^\d\d\.\s.*?(?=[A-Z][a-z])", "", micro) if re.match(r"^\d\d\.\s", micro) else micro
    for r in g:
        final.append(dict(paper=r["paper"], section=r["section"], topic=r["topic"], micro=micro, year=r["year"], question=r["question"], cover=True))
print(len(final), "rows recovered;", sum(1 for r in final if not r["year"]), "without a year;", [r["micro"][:40] for r in final if r["num"] == 1] if False else "")
import collections
print(collections.Counter(r["paper"] for r in final))
for r in final[:6]: print(r["paper"], r["micro"][:50], "|", r["year"], "|", r["question"][:70])
# put them in front of their paper's first row so that the PDF order is kept
res = []
done = set()
for r in data:
    if r["paper"] not in done:
        done.add(r["paper"]); res += [x for x in final if x["paper"] == r["paper"]]
    res.append(r)
json.dump(res, open(dst, "w"), ensure_ascii=False, indent=0)
