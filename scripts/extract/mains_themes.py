"""Builds src/content/mains.json from the parsed Group-I Mains compilation (scripts/extract/mains_compilation.py):
    python3 -I scripts/extract/mains_themes.py <all.json>
The compilation's own "microtheme" is the theme; dimensions (angles asked) and an Andhra-Pradesh flag come from
keyword rules below. Recurrence per theme = number of questions and sittings."""
import json, re, collections

DIMS = [  # (id, label, regex)
 ("concept", "Concept / definition", r"\b(define|what is|what are|meaning|meant by|differentiate|distinguish|difference|classif|types of|what do you understand)"),
 ("mechanism", "How it works", r"\b(describe|explain|working|procedure|mechanism|process|life cycle|function|principle|stages|how (does|do|is|are))"),
 ("policy", "Policy, schemes & law", r"\b(polic(y|ies)|initiative|scheme|mission|\bact\b|framework|regulat|programme|legislat|plan\b|authority|board|tribunal|agreement|salient features|objectives)"),
 ("issues", "Issues & challenges", r"\b(challenge|issue|problem|threat|risk|concern|disadvantage|barrier|constraint|demerit|hazard|resistance|worse|adverse)"),
 ("impact", "Impact & implications", r"\b(impact|effect|consequence|implication|influence|role of|relevance|significance|importance|benefit|advantage|application|uses of)"),
 ("measures", "Measures & way forward", r"\b(measure|suggest|strateg|prevent|control|mitigat|solution|steps|action plan|propose|conserv|management)"),
 ("critical", "Critical evaluation", r"\b(critical|evaluate|assess|examine|do you think|comment|justif|investigate|analy[sz]e)"),
 ("short", "Short note", r"\b(short note|brief note|write a note|short notes|write on|give a brief|brief account)"),
]
AP = r"andhra|\bap\b|telangana|rajamahendra|tirupati|visakha|amaravati|polavaram"


import sys
PAPERS = {1: "Paper I — General Essay", 2: "Paper II — History, Culture & Geography", 3: "Paper III — Polity, Governance & Ethics",
          4: "Paper IV — Indian & Andhra Pradesh Economy", 5: "Paper V — Science, Technology & Environment"}

def label(m):
    """Short theme name from the compilation's microtheme (syllabus lines can run to 200 characters)."""
    m = re.sub(r"\s+", " ", m).strip(" .;")
    m = re.sub(r"\\", "", m)
    if len(m) <= 64: return m
    cut = re.split(r"\s[-–—]\s|[:;(]", m)[0].strip()
    return cut if 16 <= len(cut) <= 64 else m[:62].rsplit(" ", 1)[0] + "…"

def clean(q):
    q = re.sub(r"\bOR\s+\d{1,2}\s*\([a-d]\)", " ", q)
    q = re.sub(r"(?<=\s)\d{1,2}\s*\([a-d]\)(?=\s|$)", " ", q)
    return re.sub(r"\s+", " ", q).strip()

src = json.load(open(sys.argv[1]))
rows, seen = [], collections.Counter()
for r in src:
    q = clean(r["question"]); t = q.lower()
    seen[(r["paper"], r["year"])] += 1
    rows.append(dict(
        id=f"g1p{r['paper']}-{r['year']}-{seen[(r['paper'], r['year'])]}", year=r["year"], paper=r["paper"],
        paperName=PAPERS[r["paper"]], section=r["section"].split(":", 1)[-1].strip().title(), marks=None, question=q,
        theme=label(r["micro"]), themeFull=re.sub(r"\s+", " ", r["micro"]).strip(),
        dims=[d for d, _, rx in DIMS if re.search(rx, t)] or ["mechanism"], ap=bool(re.search(AP, t))))
json.dump(rows, open("src/content/mains.json", "w"), ensure_ascii=False, indent=0)
c = collections.Counter((r["paper"], r["theme"]) for r in rows)
print(len(rows), "questions,", len(c), "themes")
for (pp, k), v in c.most_common(25):
    yrs = sorted({r["year"] for r in rows if r["theme"] == k})
    print(f"{v:3} P{pp} {k:50} sittings={len(yrs)}")
