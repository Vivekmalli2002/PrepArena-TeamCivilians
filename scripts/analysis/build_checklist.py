import re
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
ORDER, PDFN = {}, collections.Counter()
for r in json.load(open(D + "compilation.json")):
    ORDER.setdefault((r["paper"], r["micro"]), len(ORDER))
    PDFN[(r["paper"], r["micro"])] += 1          # questions the PDF itself lists under this microtheme = importance

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
    t.update(pdfn=PDFN.get((paper, micro), 0), order=ORDER.get((paper, micro), 9999), id=f"t{paper}-{SLUG(micro)}", dims=dict(cnt), years=years, n=len(asked),
             asked=[dict(q=u["q"], years=u["years"], boards=u["boards"], dims=dims_of(u["q"])) for u in asked])
    out.append(t)
out.sort(key=lambda t: (t["paper"], -t["pdfn"], -t["n"], t["label"]))
# ---------------------------------------------------------------- UPSC Mains questions (2013-2026), filed under our subjects
# The UPSC compilation groups its questions under its own headings; each heading is mapped to the Mains subject(s) it belongs to
# (headings with no counterpart in the APPSC syllabus - world history, international relations, security, ethics case studies - are left out).
S2, S3, S4, S5 = 2, 3, 4, 5
HIS, GEO = "History and Culture of India", "Geography: India and Andhra Pradesh"
POL, ADM, ETH = "Indian Polity and Constitution", "Public Administration and Governance", "Ethics in Public Service and Knowledge of Law"
ECO, FIN = "Major Challenges of Indian Economy", "Resource Mobilization and Public Finance"
ICT, SCI, BIO, ENV = "Information and Communication Technology (ICT) & Emerging Tech", "Science & Technology in Everyday Life & National Security", "Biotechnology, Health and Intellectual Property Rights", "Environmental Ecology, Pollution & Disaster Management"
UMAP = {
    (1, "Indian Art, Culture & Heritage"): [(2, HIS)], (1, "Modern Indian History"): [(2, HIS)], (1, "The Freedom Struggle"): [(2, HIS)], (1, "Post-Independence Consolidation"): [(2, HIS)],
    (1, "Geophysical Phenomena & Geography Features"): [(2, GEO)], (1, "Natural Resources & Industrial Location"): [(2, GEO)], (1, "Women, Population & Urbanization"): [(2, GEO)],
    (2, "Indian Constitution"): [(3, POL)], (2, "Parliament & State Legislatures"): [(3, POL)], (2, "Union-State Relations & Federalism"): [(3, POL)], (2, "Constitutional Posts & Bodies"): [(3, POL)],
    (2, "Executive & Judiciary"): [(3, POL)], (2, "Separation of Powers"): [(3, POL)], (2, "Representation of People's Act"): [(3, POL)],
    (2, "Statutory & Regulatory Bodies"): [(3, ADM)], (2, "Development Processes & NGOs"): [(3, ADM)], (2, "Governance, Transparency & e-Governance"): [(3, ADM)], (2, "Government Policies & Interventions"): [(3, ADM)],
    (2, "Role of Civil Services"): [(3, ADM)], (2, "Health, Education & Social Sector"): [(3, ADM)], (2, "Welfare Schemes for Vulnerable Sections"): [(3, ADM)], (2, "Poverty & Hunger"): [(3, ADM)],
    (3, "Indian Economy & Planning"): [(4, ECO)], (3, "Inclusive Growth"): [(4, ECO)], (3, "Liberalization & Industrial Policy"): [(4, ECO)], (3, "Investment Models"): [(4, ECO)], (3, "Infrastructure"): [(4, ECO)],
    (3, "Agriculture & Cropping Patterns"): [(4, ECO)], (3, "Farm Subsidies, MSP & PDS"): [(4, ECO)], (3, "Land Reforms"): [(4, ECO)], (3, "Food Processing Industries"): [(4, ECO)], (3, "Government Budgeting"): [(4, FIN)],
    (3, "IT, Space, Biotech & IPR"): [(5, ICT), (5, SCI), (5, BIO)], (3, "Science & Technology"): [(5, SCI), (5, ICT), (5, BIO)], (3, "Cyber Security & Money Laundering"): [(5, ICT)],
    (3, "Environment, Conservation & Pollution"): [(5, ENV)], (3, "Disaster Management"): [(5, ENV)],
}
for h in ("Aptitude & Foundational Values", "Attitude", "Civil Service Values & Ethics in Administration", "Emotional Intelligence", "Ethics & Human Interface", "Human Values", "Moral Thinkers & Philosophers", "Probity in Governance"):
    UMAP[(4, h)] = [(3, ETH)]
MIN_SIM = float(os.environ.get("UPSC_MIN_SIM", "0.07"))
EXPAND = {"aqg": "air pollution", "aqi": "air pollution", "ncap": "national clean air programme air pollution", "pm2": "air pollution particulate", "smog": "air pollution", "stubble": "air pollution crop residue",
          "gst": "goods services tax", "mgnrega": "employment guarantee rural", "nrega": "employment guarantee rural", "rti": "right to information transparency",
          "pil": "public interest litigation", "mnc": "multinational corporations", "fdi": "foreign direct investment", "msp": "minimum support price",
          "sez": "special economic zones", "ppp": "public private partnership", "ngo": "non governmental organisations civil society", "cag": "comptroller auditor general"}
def _stem(w):
    for suf in ("ations", "ation", "ings", "ing", "ies", "es", "ed", "al", "s"):
        if len(w) > len(suf) + 3 and w.endswith(suf): return w[: -len(suf)]
    return w
def prep(text):
    words = re.findall(r"[a-z0-9]+", text.lower())
    extra = [EXPAND[w] for w in words if w in EXPAND]
    return " ".join(_stem(w) for w in words + " ".join(extra).split())
if os.path.exists(D + "upsc.json"):
    UP = json.load(open(D + "upsc.json"))
    by_subject = collections.defaultdict(list)
    for t in out: by_subject[(t["paper"], t["subject"])].append(t)
    placed = loose = skipped = 0
    for gs in (1, 2, 3, 4):
        qs = [q for q in UP if q["gs"] == gs and (gs, q["subject"]) in UMAP]
        skipped += sum(1 for q in UP if q["gs"] == gs) - len(qs)
        for q in qs:
            targets = [t for key in UMAP[(gs, q["subject"])] for t in by_subject.get(key, []) if not t["label"].startswith("Misc")]
            if not targets: continue
            docs = [prep(t["label"] + " " + t["full"] + " " + " ".join(a["q"] for a in t["asked"][:15])) for t in targets]
            v = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True).fit(docs + [prep(q["question"])])
            sims = cosine_similarity(v.transform([prep(q["question"])]), v.transform(docs))[0]
            j = int(sims.argmax())
            entry = dict(q=q["question"], years=[q["year"]], boards=["UPSC"], dims=dims_of(q["question"]))
            if sims[j] >= MIN_SIM:
                targets[j]["asked"].append(entry); placed += 1
            else:
                paper, subj = UMAP[(gs, q["subject"])][0]
                key = (paper, subj, "upsc")
                holder = next((t for t in out if t.get("kind") == "upsc" and t["paper"] == paper and t["subject"] == subj), None)
                if holder is None:
                    holder = dict(kind="upsc", paper=paper, subject=subj, label="Miscellaneous · UPSC questions on this subject", full="UPSC Mains questions on this subject that match no single theme", asked=[],
                                  id=f"u{paper}-{SLUG(subj)}", pdfn=0, order=9999, dims={}, years=[], n=0)
                    out.append(holder)
                holder["asked"].append(entry); loose += 1
    for t in out:  # refresh the counters of every theme that received UPSC questions
        own = [a for a in t["asked"] if "UPSC" not in a["boards"]]   # UPSC questions must not hide an angle APPSC has never taken
        t["n"] = len(own)
        t["years"] = sorted({y for a in own for y in a["years"]})
        t["dims"] = dict(collections.Counter(d for a in own for d in a["dims"]))
        t["asked"].sort(key=lambda a: (-(max(a["years"]) if a["years"] else 0), a["q"]))
    print("UPSC:", len(UP), "questions;", placed, "placed in a theme,", loose, "kept at subject level,", skipped, "left out (no counterpart in the APPSC syllabus)")

json.dump(out, open("scripts/data/themes_asked.json", "w"), ensure_ascii=False)
print("themes", len(out), "questions", sum(t["n"] for t in out))
print(collections.Counter(t["paper"] for t in out))
print([ (t["label"], t["n"]) for t in sorted(out, key=lambda t: -t["n"])[:12]])
