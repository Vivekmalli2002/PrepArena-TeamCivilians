"""Builds src/content/mains-checklist.json for the Group-I Mains progress checklist.

Sources merged (every Group-I question we have):
  scripts/data/compilation.json   APPSC Mains PYQ compilation (paper > section > microtheme)      -> the theme structure
  scripts/data/ghissu_index.json  Ghissu model-answer books, every APPSC question incl. sub-parts  (Papers II-V)
  scripts/data/civiccentre.json   CivicCentre PYQ books, APPSC + TGPSC (2007-2024)
  scripts/data/workbooks.json     OCR of the CivicCentre "Mission 1000" workbooks (optional)
Near-duplicates are merged (character n-gram similarity); each question keeps the years and boards it was asked in.
Questions that are not in the compilation join the theme of their nearest neighbours.
For every theme: dimensions asked so far, dimensions never asked ("unseen"), and a list of EXPECTED questions
(at most 10; fewer for small themes) = the dimensions most likely to come next, plus the hand-written model answers.
usage: python3 -I build_checklist.py
"""
import json, re, math, glob, os, collections
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

D = "scripts/data/"
PAPERS = {1: "Paper I — General Essay", 2: "Paper II — History, Culture & Geography", 3: "Paper III — Polity, Governance, Law & Ethics",
          4: "Paper IV — Economy & Development of India and AP", 5: "Paper V — Science, Technology & Environment"}
DIMS = [
    ("concept", r"\b(define|what is|what are|meaning|meant by|differentiate|distinguish|difference|classif|types of|what do you understand)"),
    ("mechanism", r"\b(describe|explain|working|procedure|mechanism|process|life cycle|function|principle|stages|how (does|do|is|are))"),
    ("policy", r"\b(polic(y|ies)|initiative|scheme|mission|\bact\b|framework|regulat|programme|legislat|plan\b|authority|board|tribunal|agreement|salient features|objectives)"),
    ("issues", r"\b(challenge|issue|problem|threat|risk|concern|disadvantage|barrier|constraint|demerit|hazard|resistance|worse|adverse)"),
    ("impact", r"\b(impact|effect|consequence|implication|influence|role of|relevance|significance|importance|benefit|advantage|application|uses of|contribution)"),
    ("measures", r"\b(measure|suggest|strateg|prevent|control|mitigat|solution|steps|action plan|propose|conserv|management)"),
    ("critical", r"\b(critical|evaluate|assess|examine|do you think|comment|justif|investigate|analy[sz]e)"),
    ("short", r"\b(short note|brief note|write a note|short notes|write on|give a brief|brief account)"),
]
AP = re.compile(r"andhra|\bap\b|telangana|rajamahendra|tirupati|visakha|amaravati|polavaram", re.I)
norm = lambda s: re.sub(r"[^a-z0-9 ]+", " ", re.sub(r"(?<=[a-z])(?=[A-Z])", " ", s).lower())
sq = lambda s: re.sub(r"\s+", " ", s).strip()

# ---------------------------------------------------------------- collect
recs = []  # dict(q, paper, years, boards, micro, section, trunc)
for r in json.load(open(D + "compilation.json")):
    recs.append(dict(q=r["question"], paper=r["paper"], years={r["year"]}, boards={"APPSC"}, micro=r["micro"], section=r["section"], trunc=False, src="comp"))
for r in json.load(open(D + "ghissu_index.json")):
    recs.append(dict(q=r["question"], paper=r["paper"], years={r["year"]}, boards={"APPSC"}, micro=None, section=None, trunc=r["truncated"], src="ghissu"))
for r in json.load(open(D + "civiccentre.json")):
    if r["paper"] in PAPERS and len(r["question"]) > 25:
        recs.append(dict(q=r["question"], paper=r["paper"], years={r["year"]} if r["year"] else set(), boards={r["source"] or "APPSC"}, micro=None, section=None, trunc=False, src="cc"))
if os.path.exists(D + "workbooks.json"):
    for r in json.load(open(D + "workbooks.json")):
        recs.append(dict(q=r["question"], paper=r["paper"], years={r["year"]} if r["year"] else set(), boards={r["board"]} if r["board"] else set(), micro=None, section=None, trunc=False, src="ocr"))
print("raw", collections.Counter(r["src"] for r in recs))
# order in which the compilation PDF lists its themes (paper, then microtheme by first appearance) = syllabus order
ORDER = {}
for r in json.load(open(D + "compilation.json")):
    ORDER.setdefault((r["paper"], r["micro"]), len(ORDER))

# ---------------------------------------------------------------- de-duplicate (per paper, char n-grams)
groups = []
for paper in PAPERS:
    rs = [r for r in recs if r["paper"] == paper]
    texts = [norm(re.sub(r"\.\.\.|…", "", r["q"])).replace(" ", "") for r in rs]
    v = TfidfVectorizer(analyzer="char", ngram_range=(4, 5), sublinear_tf=True, min_df=1).fit(texts)
    X = v.transform(texts)
    S = cosine_similarity(X)
    parent = list(range(len(rs)))
    def find(i):
        while parent[i] != i: parent[i] = parent[parent[i]]; i = parent[i]
        return i
    for i in range(len(rs)):
        for j in np.where(S[i] > 0.80)[0]:
            if j > i:
                # a year clash with a different board/year still means the same wording asked again -> same question
                parent[find(j)] = find(i)
    by = collections.defaultdict(list)
    for i in range(len(rs)): by[find(i)].append(rs[i])
    groups += [m for m in by.values()]
print("unique questions", len(groups))

def best_text(ms):
    pri = sorted(ms, key=lambda r: (r["src"] != "comp", r["trunc"], r["src"] == "ocr", -len(r["q"])))
    return sq(pri[0]["q"])

U = []
for ms in groups:
    micro = next((m["micro"] for m in ms if m["micro"]), None)
    section = next((m["section"] for m in ms if m["section"]), None)
    U.append(dict(q=best_text(ms), paper=ms[0]["paper"], years=sorted({y for m in ms for y in m["years"] if y}), boards=sorted({b for m in ms for b in m["boards"] if b}),
                  micro=micro, section=section, srcs=sorted({m["src"] for m in ms})))

# ---------------------------------------------------------------- put every question in a theme (paper > subject > theme)
for paper in PAPERS:
    us = [u for u in U if u["paper"] == paper]
    known = [u for u in us if u["micro"]]
    if not known: continue
    v = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True).fit([u["q"] for u in us])
    K = v.transform([u["q"] for u in known])
    for u in us:
        if u["micro"]: continue
        sims = cosine_similarity(v.transform([u["q"]]), K)[0]
        top = sims.argsort()[::-1][:4]
        votes = collections.Counter()
        for t in top:
            if sims[t] > 0.05: votes[(known[t]["micro"], known[t]["section"])] += sims[t]
        if votes: (u["micro"], u["section"]), _ = votes.most_common(1)[0]
        else: u["micro"], u["section"] = "Miscellaneous", None
for u in U:
    if not u["section"]:
        sec = collections.Counter(x["section"] for x in U if x["paper"] == u["paper"] and x["section"])
        u["section"] = sec.most_common(1)[0][0] if sec else ""

def label(m):
    """Short human title from the compilation's syllabus line (they run to 200 characters)."""
    m = re.sub(r"\s+", " ", m).replace("\\", "").strip(" .;,")
    m = re.sub(r"\([^)]*\)?", "", m)                                  # drop parentheticals (also unbalanced ones)
    head = re.split(r"\s[-–—]\s|[-–—]\s|:|;", m)[0].strip(" ,.;")
    if len(head) < 14: head = m
    if len(head) > 72:
        cut = head[:72]
        head = (cut.rsplit(",", 1)[0] if "," in cut[30:] else cut.rsplit(" ", 1)[0]).strip(" ,.;")
    head = re.sub(r"\s+(and|of|the|in|for|to|with|on)$", "", head).strip(" ,.;")
    return head or m[:60]

def subject_name(sec):
    s = re.sub(r"^SECTION [A-Z0-9IVX]+\s*:\s*", "", sec or "").strip()
    if not s: return "Other"
    s = s.title()
    for a, b in ((" And ", " and "), (" Of ", " of "), (" In ", " in "), ("Ap ", "AP "), ("Ict", "ICT"), ("Ipr", "IPR"), ("& ", "& ")):
        s = s.replace(a, b)
    return s

themes = {}
for u in U:
    key = (u["paper"], u["micro"])
    t = themes.setdefault(key, dict(paper=u["paper"], subject=subject_name(u["section"]), label=label(u["micro"]), full=sq(u["micro"]), asked=[]))
    t["asked"].append(u)

def dims_of(q):
    ql = q.lower()
    return [d for d, rx in DIMS if re.search(rx, ql)] or ["mechanism"]

SLUG = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]
out = []
for (paper, micro), t in themes.items():
    asked = sorted(t["asked"], key=lambda u: (-(max(u["years"]) if u["years"] else 0), u["q"]))
    cnt = collections.Counter(d for u in asked for d in dims_of(u["q"]))
    years = sorted({y for u in asked for y in u["years"]})
    t.update(order=ORDER.get((paper, micro), 9999), id=f"t{paper}-{SLUG(micro)}", dims=dict(cnt), years=years, n=len(asked),
             asked=[dict(q=u["q"], years=u["years"], boards=u["boards"], dims=dims_of(u["q"])) for u in asked])
    out.append(t)
out.sort(key=lambda t: (t["paper"], -t["n"], t["label"]))
json.dump(out, open("scripts/data/themes_asked.json", "w"), ensure_ascii=False)
print("themes", len(out), "questions", sum(t["n"] for t in out))
print(collections.Counter(t["paper"] for t in out))
print([ (t["label"], t["n"]) for t in sorted(out, key=lambda t: -t["n"])[:12]])
