"""Second step of the checklist build: expected questions per theme.
usage: python3 -I build_expected.py     (after build_checklist.py)  -> src/content/mains-checklist.json
Rules
  * at most 10 expected questions per theme, fewer for small themes: n = round(0.9 x questions asked), 1..10
  * dimensions never asked on the theme come first, then dimensions asked recently (2020+), then standard ones
  * 'current developments' stems are marked dynamic and ranked last (factual, repeating themes first)
  * hand-written model answers (src/content/mains-model-*.json) are attached to their nearest theme and counted first
"""
import json, re, glob, collections
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

themes = json.load(open("scripts/data/themes_asked.json"))
models = [m for f in sorted(glob.glob("src/content/mains-model-*.json")) for m in json.load(open(f))]
CORE = ["concept", "mechanism", "policy", "issues", "impact", "measures"]
DYN = re.compile(r"polic|scheme|mission|programme|e-?govern|cyber|digital|\bict\b|space|isro|satellite|defence|energy|nuclear|renewable|solar|climate|"
                 r"disaster|pollution|waste|disease|health|vaccin|biotech|genetic|nano|budget|finance|tax|fiscal|monetary|inflation|growth|gdp|poverty|"
                 r"employment|welfare|infrastructure|industr|agricultur|irrigation|governance|ethic|rights|gender|women|education|skill|startup|trade|federal|election", re.I)

def domain(paper, subject):
    s = subject.lower()
    if paper == 1: return "essay"
    if paper == 2: return "geo" if "geograph" in s else "history"
    if paper == 3: return "ethics" if "ethic" in s else ("admin" if "administ" in s or "governance" in s else "polity")
    if paper == 4: return "econ"
    return "sci"

POLICY = {  # econ / sci / polity / admin share the policy-type stems
    "concept": "Explain the concept and scope of {T}. Why does it matter for India and Andhra Pradesh?",
    "mechanism": "Describe how {T} works in practice, with suitable examples.",
    "policy": "Evaluate the major policies, schemes and laws relating to {T}.",
    "issues": "Discuss the major issues and challenges in {T} and suggest remedies.",
    "impact": "Examine the impact of {T} on the economy, society and environment.",
    "measures": "What measures are needed to strengthen {T}? Suggest a way forward.",
    "critical": "Critically evaluate {T}: achievements, shortcomings and the reforms required.",
    "ap": "Discuss {T} with special reference to Andhra Pradesh.",
    "current": "Analyse the recent developments in {T} and their implications.",
    "short": "Write short notes on the salient features of {T}.",
}
STEMS = {
    "econ": POLICY, "sci": POLICY, "polity": {**POLICY, "mechanism": "Explain the constitutional and legal provisions relating to {T}.",
                                                 "policy": "Examine the role of the courts and the legislature in {T}.", "impact": "Assess the significance of {T} for Indian democracy."},
    "admin": {**POLICY, "mechanism": "Explain the institutional framework of {T}.", "impact": "Assess the effectiveness of {T} in ensuring accountability and good governance."},
    "ethics": {**POLICY, "concept": "What do you understand by {T}? Explain with examples from public life.",
               "mechanism": "How do values and codes of conduct shape {T} in public service?", "issues": "Discuss the ethical dilemmas that arise in {T}.",
               "impact": "How does {T} influence the quality of governance?", "policy": "Examine the institutional and legal safeguards relating to {T}."},
    "history": {"concept": "Describe the main features of {T}.", "mechanism": "Explain the political, social and economic conditions under {T}.",
                "policy": "Discuss the administration and institutions associated with {T}.", "issues": "Critically examine the causes of the decline or the limitations of {T}.",
                "impact": "Assess the cultural and historical contribution of {T}.", "measures": "Compare {T} with the preceding and contemporary periods.",
                "critical": "Critically evaluate the historical significance of {T}.", "ap": "Trace the influence of {T} on the history and culture of Andhra Pradesh.",
                "short": "Write short notes on the important aspects of {T}."},
    "geo": {"concept": "Describe the physical and geographical features of {T}.", "mechanism": "Explain the factors and processes behind {T}.",
            "policy": "Discuss the resources, distribution and utilisation relating to {T}.", "issues": "Discuss the problems and hazards associated with {T}.",
            "impact": "Examine the economic and social importance of {T}.", "measures": "Suggest measures for sustainable management of {T}.",
            "critical": "Critically evaluate {T} with reference to India.", "ap": "Discuss {T} with special reference to Andhra Pradesh.",
            "short": "Write short notes on the main features of {T}."},
    "essay": {"concept": "Essay: What does {T} mean today? Explain its significance for society.", "mechanism": "Essay: {T} — how it shapes everyday life in India.",
              "policy": "Essay: The role of government and institutions in {T}.", "issues": "Essay: {T} — challenges and the way ahead.",
              "impact": "Essay: The impact of {T} on India's development.", "measures": "Essay: Making {T} work for all — a roadmap.",
              "critical": "Essay: {T} — a critical reflection.", "ap": "Essay: {T} and the future of Andhra Pradesh.",
              "current": "Essay: {T} in a changing world.", "short": "Essay: {T} — lessons from history for today."},
}
STRUCT = {
    "concept": ["Introduction: define {T} in two lines, with a source (Constitution, committee, report)", "Body: meaning, features, types and scope; why it matters", "Conclusion: its place in the larger system"],
    "mechanism": ["Introduction: one-line context and the key actor/institution", "Body: step-by-step working with a suitable example or diagram", "Conclusion: what makes it work or fail"],
    "policy": ["Introduction: the problem the policy addresses", "Body: main schemes/laws (name, year, objective) in a table", "Evaluation: outcomes achieved, gaps", "Conclusion: reform direction"],
    "issues": ["Introduction: set the context with one fact or figure", "Body: group the issues (economic, social, institutional, environmental) with causes", "Way forward: 3–4 specific, workable measures", "Conclusion: balanced and forward-looking"],
    "impact": ["Introduction: what changed and why it matters", "Body: impact in separate heads — economic, social, environmental, regional (include AP)", "Positives and negatives", "Conclusion: net assessment"],
    "measures": ["Introduction: the gap that needs fixing", "Body: institutional, legal, technological and financial measures", "Best practice from a state or country", "Conclusion: a vision with a timeline"],
    "critical": ["Introduction: the claim to be tested", "Body: achievements, then shortcomings, with evidence", "Reform agenda", "Conclusion: a balanced verdict"],
    "ap": ["Introduction: why Andhra Pradesh is distinctive here", "Body: state data, schemes, institutions and projects", "State-specific issues and the way forward", "Conclusion: link to national goals"],
    "current": ["Introduction: the latest development in one line", "Body: what is new, the numbers, the government response", "Implications and open questions", "Conclusion: what to watch next"],
    "short": ["Definition / origin (2 lines)", "5–6 salient features as bullets", "One example or recent fact", "Significance (1 line)"],
}
WHY = {
    "concept": "The basic definition and scope of this theme has not been asked directly — the commission often starts a theme with its concept.",
    "mechanism": "How it works has not been asked; a mechanism or framework question is a standard way to re-ask a known theme.",
    "policy": "Policies, schemes and laws on this theme have not been asked in this form.",
    "issues": "Issues and challenges are the commonest way the commission re-asks a repeating theme; this angle is still open.",
    "impact": "Impact and implications have not been asked on this theme yet.",
    "measures": "A way-forward question is the next step after issues; not asked so far.",
    "critical": "A critical evaluation is a typical 10-mark form for a theme that has already been asked descriptively.",
    "ap": "Andhra Pradesh-specific questions are frequent in recent papers (2017–2025) and this theme has no AP-specific question yet.",
    "current": "Recent developments are a dynamic angle — read the latest data before the exam.",
    "short": "Short-note form appears in older papers and in Paper V; cheap to prepare.",
}

# attach the hand-written model answers to their nearest theme (same paper)
attach = collections.defaultdict(list)
for paper in range(1, 6):
    ts = [t for t in themes if t["paper"] == paper and t.get("kind") != "upsc"]
    ms = [m for m in models if m["paper"] == paper]
    if not ts or not ms: continue
    v = TfidfVectorizer(stop_words="english", ngram_range=(1, 2), sublinear_tf=True).fit([t["label"] + " " + t["full"] + " " + " ".join(a["q"] for a in t["asked"]) for t in ts] + [m["question"] + " " + m["theme"] for m in ms])
    T = v.transform([t["label"] + " " + t["full"] + " " + " ".join(a["q"] for a in t["asked"][:12]) for t in ts])
    for m in ms:
        s = cosine_similarity(v.transform([m["question"] + " " + m["theme"]]), T)[0]
        attach[ts[int(s.argmax())]["id"]].append(m)

SLUG = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:48]
for t in themes:
    dom = domain(t["paper"], t["subject"])
    stems = STEMS[dom]
    T = t["label"].rstrip("…").strip()
    cnt = collections.Counter(t["dims"])
    recent = collections.Counter(d for a in t["asked"] if a["years"] and max(a["years"]) >= 2020 for d in a["dims"])
    ap_asked = any(re.search(r"andhra|\bap\b", a["q"], re.I) for a in t["asked"])
    dyn_ok = dom not in ("history", "geo") and bool(DYN.search(t["label"] + " " + t["full"]))
    t["legacy"] = "not there in new syllabus" in t["full"].lower() and not re.search(r"bio-? ?diversity", t["label"], re.I)   # topics the commission dropped from the syllabus
    n_exp = 0 if (t["label"].startswith("Miscellaneous") or t["legacy"]) else max(1, min(10, round(t["n"] * 0.9)))
    cand = []
    for d, stem in stems.items():
        if d == "current" and not dyn_ok: continue
        if d == "ap" and ap_asked and dom != "essay": continue
        sc = {"concept": 0.3, "mechanism": 0.2, "policy": 0.4, "issues": 0.9, "impact": 0.5, "measures": 0.6, "critical": 0.7, "ap": 0.5, "short": 0.1, "current": -1}.get(d, 0)
        if d in CORE and cnt[d] == 0: sc += 3
        if d not in CORE and cnt[d] == 0 and d != "current": sc += 1
        sc += 0.8 * recent[d]
        cand.append((sc, d))
    cand.sort(key=lambda x: -x[0])
    exp = []
    for m in attach.get(t["id"], [])[:n_exp]:
        exp.append(dict(id=m["id"], q=m["question"], dim=m["dim"], why=m.get("why", ""), model=True, dynamic=bool(m.get("updates"))))
    used = {e["dim"] for e in exp}
    for sc, d in cand:
        if len(exp) >= n_exp: break
        if d in used: continue
        used.add(d)
        exp.append(dict(id=f"x-{t['id']}-{d}", q=stems[d].format(T=T), dim=d, why=("Never asked on this theme in eight sittings — " if cnt[d] == 0 and d in CORE else "") + WHY[d],
                        structure=[s.format(T=T) for s in STRUCT[d]], dynamic=(d == "current")))
    t["expected"] = exp
    t["unseen"] = [d for d in CORE if cnt[d] == 0]
    t["domain"] = dom
    t["dynamic"] = dyn_ok

themes.sort(key=lambda t: (t["paper"], -t["n"], t["label"]))
json.dump(themes, open("src/content/mains-checklist.json", "w"), ensure_ascii=False, separators=(",", ":"))
tot = sum(len(t["expected"]) for t in themes)
print("themes", len(themes), "asked", sum(t["n"] for t in themes), "expected", tot, "of which hand-written", sum(1 for t in themes for e in t["expected"] if e.get("model")))
print(collections.Counter(len(t["expected"]) for t in themes))
unattached = sum(len(v) for v in attach.values()) - sum(1 for t in themes for e in t["expected"] if e.get("model"))
print("models over the cap:", unattached)
