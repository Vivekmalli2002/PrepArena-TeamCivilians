"""Publishes the PDF-column extraction of the GS books / PYQ collections.
    python3 -I scripts/extract/build_gs.py <extraction dir>
Clean items -> data/questions/gs-<book>.json (live); flagged items -> data/review/gs-<book>-flagged.json (held).
Topics: Economy uses the book's own table of contents; the other books have chapter banners drawn as images, so topics are
assigned from the question text with keyword rules (automatic: re-check before relying on them for study planning).
"""
import json, pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
import civil_columns as C

root = pathlib.Path(__file__).resolve().parents[2]
src = pathlib.Path(sys.argv[1])
G12 = ["group2", "group1"]

RULES = {
 "history-ancient": [
  ("Indus Valley civilisation", r"harapp|indus valley|mohenjo|lothal|kalibangan|dholavira|chanhudaro"),
  ("Vedic age", r"vedic|rigveda|rig veda|brahmana|upanishad|aryan|\bveda"),
  ("Buddhism & Jainism", r"buddh|jain|mahavira|tirthankar|tripitaka|stupa|sangha"),
  ("Mahajanapadas, Mauryas & Post-Mauryan", r"mahajanapada|maurya|ashoka|chandragupta maurya|kautilya|arthashastra|shunga|kushan|satavahana|kanishka|magadh|nanda"),
  ("Gupta & Harsha", r"gupta|harsha|vardhana|hiuen|fa-?hien|kalidasa|nalanda"),
  ("South India & Sangam", r"sangam|chola|chera|pandya|pallava|chalukya|rashtrakuta|hoysala|kakatiya|vijayanagar|krishnadevaraya|cheras"),
  ("Delhi Sultanate", r"sultanate|iltutmish|balban|khalji|tughlaq|alauddin|lodi|razia|qutub|qutb"),
  ("Mughal & regional powers", r"mughal|akbar|babur|humayun|jahangir|shah jahan|aurangzeb|sher shah|maratha|shivaji|peshwa|rajput|sikh"),
  ("Bhakti, Sufi & medieval culture", r"bhakti|sufi|kabir|nanak|chaitanya|mirabai|chishti|suhrawardi|din-i-ilahi|medieval"),
  ("Art, architecture & literature", r"architect|temple|sculpture|painting|minar|fort|mosque|inscription|coin|script|literature|travell?er|ibn battuta|al-?beruni"),
 ],
 "history-modern": [
  ("Advent of Europeans & East India Company", r"portuguese|dutch|french|east india company|plassey|buxar|carnatic war|robert clive|warren hastings|cornwallis|dalhousie|subsidiary alliance|doctrine of lapse|governor.?general|viceroy"),
  ("Revolt of 1857", r"1857|sepoy|mangal pandey|nana sahib|rani laxmi|tatya tope|mutiny"),
  ("Socio-religious reform movements", r"brahmo|arya samaj|ramakrishna|vivekananda|prarthana|aligarh|theosoph|reform|raja ram mohan|dayanand|phule|ambedkar|satyashodhak|sati"),
  ("Early nationalism & Indian National Congress", r"indian national congress|moderate|extremist|surendranath|dadabhai|gokhale|tilak|swadeshi|partition of bengal|muslim league|lucknow pact|home rule"),
  ("Gandhian era", r"gandhi|non-?cooperation|civil disobedience|dandi|quit india|champaran|kheda|khilafat|rowlatt|jallianwala|simon commission|round table|poona pact|salt"),
  ("Revolutionaries, INA & Left movements", r"bhagat singh|chandrashekhar|azad hind|subhas|bose|ghadar|anushilan|hsra|communist|socialist party|revolutionar"),
  ("Constitutional developments & Independence", r"regulating act|pitt|charter act|government of india act|cripps|cabinet mission|mountbatten|partition|independence act|1947|wavell|interim government"),
  ("Economic & social history of British India", r"drain of wealth|permanent settlement|ryotwari|mahalwari|famine|railway|education|macaulay|wood.?s despatch|press act|zamindar"),
  ("Personalities & miscellaneous modern India", r".*"),
 ],
 "science": [
  ("Physics: mechanics, heat & sound", r"velocity|acceleration|newton|force|pressure|friction|gravit|momentum|work|energy|power|heat|temperature|thermo|sound|wave|frequency|density|buoyan|pendulum|elastic"),
  ("Physics: light, electricity & magnetism", r"light|lens|mirror|refraction|reflection|spectrum|electric|current|resistance|voltage|magnet|circuit|battery|transformer|ohm|capacitor|laser|x-?ray|radioactiv|nuclear|atom"),
  ("Chemistry", r"acid|base|\bsalt\b|ph\b|element|compound|periodic|alloy|metal|carbon|organic|polymer|plastic|chemical|oxid|reaction|molecule|valency|isotope|catalyst|petroleum|fuel|fertili[sz]er|soap|glass|cement"),
  ("Biology: cell, genetics & botany", r"cell|chromosom|\bdna\b|\brna\b|gene|plant|photosynth|leaf|root|flower|seed|enzyme|hormone|tissue|evolution|cloning|biotechnology|bacteria|virus|fungi"),
  ("Human body, health & diseases", r"vitamin|disease|blood|heart|kidney|liver|brain|digest|vaccine|antibiotic|cancer|diabetes|malaria|tuberculosis|aids|deficiency|nutrition|protein|hormone|organ"),
  ("Space, defence & technology", r"isro|satellite|rocket|launch|space|chandrayaan|mangalyaan|missile|drdo|agni|brahmos|nuclear power|computer|internet|software|digital|cyber|robot|artificial intelligence|5g|laser|mobile|aadhaar"),
  ("Environment & ecology (science)", r"ecosystem|pollut|ozone|greenhouse|climate|biodiversity|wildlife|forest|species|global warming|renewable|solar|wind energy|waste"),
  ("General science & miscellaneous", r".*"),
 ],
 "geography": [
  ("Physical geography & geomorphology", r"earth|rock|mountain|plate|earthquake|volcano|mineral|erosion|continent|lithosphere|himalaya|plateau|desert|glacier|landform|island"),
  ("Climate & oceans", r"monsoon|rainfall|climate|cyclone|atmosphere|temperature|wind|ocean|sea|current|tide|humid|season"),
  ("Rivers, lakes & drainage", r"river|lake|dam|canal|tributary|waterfall|drainage|basin|delta|estuary|strait|gulf|bay"),
  ("Soils, agriculture & irrigation", r"soil|crop|agricultur|irrigation|wheat|rice|cotton|sugarcane|tea|coffee|rubber|jute|millet|pulse|cultivation|kharif|rabi|green revolution"),
  ("Minerals, industry & energy", r"coal|iron|mineral|steel|industry|oil|petroleum|mica|bauxite|copper|manganese|power plant|energy|mining|refinery|manufactur"),
  ("Population, cities, transport & states", r"census|population|literacy|density|city|railway|highway|port|airport|state|union territor|capital|district|tribe|boundary|border|national park|sanctuary|biosphere"),
  ("World geography & miscellaneous", r".*"),
 ],
 "env": [
  ("Ecology & ecosystem", r"ecosystem|food chain|food web|trophic|ecolog|succession|niche|population|community|habitat|biome"),
  ("Biodiversity & conservation", r"biodiversity|species|wildlife|sanctuary|national park|biosphere|iucn|red data|endangered|conservation|forest|mangrove|wetland|ramsar"),
  ("Pollution & waste", r"pollut|waste|aqi|smog|ozone|noise|water quality|effluent|sewage|plastic|e-waste|bod\b|cod\b"),
  ("Climate change & energy", r"climate|greenhouse|global warming|carbon|unfccc|kyoto|paris|cop\d|renewable|solar|wind|biofuel|energy|ipcc"),
  ("Laws, conventions & institutions", r"act,? 19|act,? 20|convention|protocol|treaty|tribunal|ngt|cites|cbd|montreal|rio|stockholm|ministry|policy|authority|board|programme|scheme|mission"),
  ("General environment", r".*"),
 ],
}

def classify(rule, text):
    t = text.lower()
    for name, pat in RULES[rule]:
        if re.search(pat, t):
            return name
    return RULES[rule][-1][0]

BOOKS = {
  "economy": dict(slug="gs-indian-economy", subject="Indian & AP Economy", label="Indian Economy GS-6", exam=G12, rule=None),
  "ancient": dict(slug="gs-ancient-medieval", subject="AP & Indian History", label="Ancient & Medieval History GS", exam=G12, rule="history-ancient"),
  "modern": dict(slug="gs-modern-india", subject="AP & Indian History", label="Modern India GS", exam=G12, rule="history-modern"),
  "science": dict(slug="gs-science-tech", subject="Science & Technology", label="General Science & Technology GS", exam=G12, rule="science"),
  "geography": dict(slug="gs-geography", subject="Geography", label="Indian & World Geography GS", exam=G12, rule="geography"),
  "envgs": dict(slug="gs-environment", subject="Environmental Science & Ecology", label="Environment & Ecology GS", exam=["aee-pcb", "group2", "group1"], rule="env"),
}

def economy_toc(pages):
    out = []
    for pn in range(1, 6):
        for l in pages[pn].split("\n"):
            m = re.match(r"^Chapter\s*[−\-–]\s*(\d+)\s*:\s*(.+?)\s*\.{3,}\s*(\d+)", l)
            if m:
                out.append((int(m.group(3)), f"{int(m.group(1))}. {m.group(2).strip()}"))
    return sorted(out)

EXPL_SEE = re.compile(r"^(?:kindly\s+)?(?:see|refer)\s+the\s+explanation\s+of\s+(?:the\s+)?above\s+question\.?$", re.I)

def build(key, cfg):
    path = src / f"{key}.txt"
    if not path.exists():
        print(key, "missing"); return 0, 0
    text = path.read_text(encoding="utf8")
    pages = re.split(r"===== PAGE \d+ =====\n", text)[1:]
    items, stats = C.parse(text, key, presplit=True)
    toc = economy_toc(pages) if key == "economy" else None
    live, held, seen = [], [], set()
    for it in items:
        k = re.sub(r"\W", "", (it["question"] + "|".join(it["options"])).lower())
        dup = k in seen; seen.add(k)
        if toc:
            topic = [n for p, n in toc if p <= it["page"]][-1] if any(p <= it["page"] for p, n in toc) else toc[0][1]
        else:
            topic = classify(cfg["rule"], it["question"] + " " + " ".join(it["options"]))
        expl = it["explanation"]
        if EXPL_SEE.match(expl.strip()):
            expl = ""
        opts = [re.sub(r"\b(only|above|these|the|all|none|both)(st|nd|rd)\b", r"\1", o, flags=re.I) for o in it["options"]]
        d = {
            "id": f"{key.upper()}-{len(live) + len(held) + 1:05d}", "exam": cfg["exam"], "subject": cfg["subject"], "topic": topic,
            "question": it["question"], "options": opts, "answerIndex": "abcd".index(it["key"]) if it["key"] else -1,
            "explanation": expl, "source": (it["source"] or cfg["label"]) + f" · {cfg['label']} p.{it['page']}",
            "sourcePage": it["page"], "sourceKey": (it["key"] or "?").upper(),
        }
        fl = list(it["flags"]) + (["duplicate"] if dup else [])
        if fl:
            d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl); held.append(d)
        else:
            d["keyCheck"] = "auto-clean"; live.append(d)
    (root / "data/questions" / f"{cfg['slug']}.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
    (root / "data/review").mkdir(exist_ok=True)
    (root / "data/review" / f"{cfg['slug']}-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
    print(f"{cfg['slug']}: live {len(live)}, flagged {len(held)}")
    return len(live), len(held)

def pyq_papers(pages):
    out = []
    for pn in range(0, 4):
        for l in pages[pn].split("\n"):
            m = re.match(r"^(?:\(cid:\d+\)\s*)?(.+?)\s*\.{4,}\s*\.?\.?(\d+)\s*[-–]\s*(\d+)\s*$", l.strip())
            if m:
                out.append((int(m.group(2)), int(m.group(3)), re.sub(r"\s+", " ", m.group(1)).strip()))
    return sorted(out)

def build_pyq():
    path = src / "docwa88.txt"
    text = path.read_text(encoding="utf8")
    pages = re.split(r"===== PAGE \d+ =====\n", text)[1:]
    papers = pyq_papers(pages)
    items, stats = C.parse(text, "PYQ", presplit=True)
    live, held, seen = [], [], set()
    label = "APPSC/TSPSC Civil Engineering PYQ (English medium)"
    for it in items:
        k = re.sub(r"\W", "", (it["question"] + "|".join(it["options"])).lower())
        dup = k in seen; seen.add(k)
        paper = next((n for a, b, n in papers if a <= it["page"] <= b), "APPSC/TSPSC AEE papers")
        env = "Environmental" in paper
        d = {"id": f"PYQ-{len(live) + len(held) + 1:05d}", "exam": ["aee-pcb"] if env else ["aee-rbi"], "subject": "Civil Engineering Core",
             "topic": paper, "question": it["question"], "options": it["options"], "answerIndex": "abcd".index(it["key"]) if it["key"] else -1,
             "explanation": it["explanation"], "source": f"{paper} · {label} p.{it['page']}", "sourcePage": it["page"], "sourceKey": (it["key"] or "?").upper()}
        fl = list(it["flags"]) + (["duplicate"] if dup else [])
        if fl:
            d["keyCheck"] = "auto-flagged"; d["flag"] = "Automatic extraction check failed: " + ", ".join(fl); held.append(d)
        else:
            d["keyCheck"] = "auto-clean"; live.append(d)
    (root / "data/questions/gs-civil-pyq.json").write_text(json.dumps(live, ensure_ascii=False), encoding="utf8")
    (root / "data/review/gs-civil-pyq-flagged.json").write_text(json.dumps(held, ensure_ascii=False), encoding="utf8")
    print(f"gs-civil-pyq: live {len(live)}, flagged {len(held)}, papers {len(papers)}")
    return len(live), len(held)

if __name__ == "__main__":
    tl = th = 0
    for key, cfg in BOOKS.items():
        a, b = build(key, cfg); tl += a; th += b
    a, b = build_pyq(); tl += a; th += b
    print("TOTAL live", tl, "flagged", th)
