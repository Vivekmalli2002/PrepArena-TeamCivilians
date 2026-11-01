"""Tags every Group-I Mains question in src/content/mains.json with a fine theme, the dimensions it asks about and an
Andhra Pradesh flag, so the learning tool can rank themes by how often the commission returns to them.
    python3 -I scripts/extract/mains_themes.py
Rules are written for Paper-V (Science, Technology & Environment). Questions that match no rule fall back to
"Other topics"; extend THEMES when other papers are added."""
import json, re, collections

THEMES = [  # first match wins — specific before general
 ("Space technology & satellites", r"\b(isro|satellite|space|chandrayaan|mangalyaan|mars orbiter|\bmom\b|\bgps\b|gslv|pslv|cartosat|insat|\birs\b|gsat|remote sensing|band ?width|geo, leo|launch vehicle)"),
 ("Intellectual property & patents", r"\b(intellectual property|\bipr\b|patent|copyright|trademark|\bgi tags?)"),
 ("Nuclear energy & non-proliferation", r"\b(nuclear|npt\b|no first use|reactor)"),
 ("Renewable & clean energy", r"\b(renewable|solar|wind power|biofuel|green energy|clean energy|shale|smart grid|energy (sources|resources|security|sector|demand|crisis)|non-conventional|conventional|biomass|ocean energy|national solar|coal based|thermal power|power generation)"),
 ("Climate change & global warming", r"\b(climate|global warming|\bcop ?2?1?6?\b|paris|carbon credit|carbon|el nino|greenhouse|napcc|cryogenic indicators|1.5)"),
 ("Disaster management", r"\b(disaster|earthquake|tsunami|flood|sendai|ndma|hazard|coastal erosion|cyclone)"),
 ("Air, ozone & noise pollution", r"\b(air pollut|environmental pollution|pollutants|pm2\.5|ozone|noise|acid rain|electrostatic|particulate)"),
 ("Waste management", r"\b(solid waste|municipal solid|e-waste|waste management|pyrolysis|incineration|iswm|waste hierarchy)"),
 ("Water, soil & marine pollution", r"\b(water pollution|bod\b|eutrophication|marine pollution|soil pollution|soil erosion|water resources|watershed|water management|water user|integrated water|dams?\b|water \(prevention)"),
 ("Environmental law, EIA & institutions", r"\b(environmental impact|\beia\b|environmental clearance|pollution control board|green tribunal|\bngt\b|forest act|environment(al)? protection|legislat|brundtland|environmentalism|sustainable development|project tiger|environmental awareness|\bact\b|awareness and in educating)"),
 ("Biodiversity, forests & ecology", r"\b(bio-?diversit|biodivers|ecosystem|eco system|ecolog|forest|deforestation|species|wild-?life|gene sanctuar|ecotourism|food chain|natural selection|nbpgr|plant generic|biogeochemical|terrestrial plants|segments of environment|wild and domestic)"),
 ("Mining & mineral resources", r"\b(mining|mineral|sand mining|open cast)"),
 ("Natural resources, land & urbanisation", r"\b(natural resources|wasteland|urbani[sz]ation|urban governance|cropping|agricultur(e|al) research|sustainable agriculture)"),
 ("GM crops & genetic engineering", r"\b(genetically|\bgm\b|transgenic|genetic engineering|recombinant|crispr|gene therapy|gene transfer|golden rice|tissue culture|stem cell|cloning|dna finger|biopharma|nbds|biotechnology development|biotechnology (has|in|and)|gene enhancement|old and modern biotechnology)"),
 ("Biofertilisers & biopesticides", r"\b(bio-?pesticide|bio-?insecticide|bio ?-?fertili[sz]er|biological control)"),
 ("Vaccines & immunology", r"\b(vaccin|immun|antibod|\bmhc\b|histocompat|elisa|autoimmune|monoclonal)"),
 ("Infectious diseases & antibiotics", r"\b(disease|infect|virus|viral|bacteri|malaria|cholera|tubercul|\bhiv\b|antibiotic|covid|chikungunya|measles|hydrophobia|mycos|protozoa|pathogenesis|sterili[sz]ation|respiratory|outbreak|diarrhoea|microbial)"),
 ("Fermentation & industrial biotechnology", r"\b(ferment|yeast|penicillin|low volume|interferon|insulin|lactic)"),
 ("Health, nutrition & medicine", r"\b(health|vitamin|hormone|life expectancy|medicin|mushroom|essential oils|drugs|medical|telemedicine|homeostasis)"),
 ("Plant & animal sciences", r"\b(plants?|animals?|lichens|symbiosis|phytohormone|autotrophic|classification|domestication|insects)"),
 ("Nanotechnology & emerging technology", r"\b(nanotechnolog|blockchain|block chain|artificial intelligence|\bai\b|technology (translated|plays)|knowledge (creation|consumption))"),
 ("Information technology & digital governance", r"\b(information technology|\bit\b|fib(er|re) grid|digital|cyber|e-governance|egovernance|big data|\biot\b|internet of things|cloud|\berp\b|\blan\b|modem|wireless|network|uidai|aadhaar|negp|software|computer|telemedicine|atmanirbhar|data sharing|broadband|mobile)"),
 ("Science & technology policy & institutions", r"\b(science and technology|technology missions?|\bsti\b|science congress|csir|drdo|iiser|nirca|raman|literacy mission|institutes?|technology policy|diffusion of technology|scientific|science, technology|technological missions?|publications|science and engineering)"),
 ("Agriculture technology & food", r"\b(agricultur|crop|food|post harvest|oilseeds|farming)"),
]

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

rows = json.load(open("src/content/mains.json"))
def clean(q):
    q = re.sub(r"\bOR\s+\d{1,2}\s*\([a-d]\)", " ", q)          # "OR 12(b)" printed between alternatives
    q = re.sub(r"(?<=\s)\d{1,2}\s*\([a-d]\)(?=\s|$)", " ", q)  # question label that leaked into the text
    return re.sub(r"\s+", " ", q).strip()

for r in rows:
    r["question"] = clean(r["question"])
    t = r["question"].lower()
    r["theme"] = next((n for n, rx in THEMES if re.search(rx, t)), "Other topics")
    r["dims"] = [d for d, _, rx in DIMS if re.search(rx, t)] or ["mechanism"]
    r["ap"] = bool(re.search(AP, t))
    r["paperName"] = r.get("paperName") or "Paper V — Science, Technology & Environmental Issues"
json.dump(rows, open("src/content/mains.json", "w"), ensure_ascii=False, indent=0)
c = collections.Counter(r["theme"] for r in rows)
for k, v in c.most_common(): 
    yrs = sorted({r["year"] for r in rows if r["theme"] == k})
    print(f"{v:3} {k:46} sittings={len(yrs)} {yrs}")
print(collections.Counter(d for r in rows for d in r["dims"]))
