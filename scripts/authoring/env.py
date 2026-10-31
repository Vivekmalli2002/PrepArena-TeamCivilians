from lib import Subject, HOW_MANY, HOW_MANY_PAIRS, AR

units = {4: "Environmental pollution & control technologies", 5: "Solid, industrial & e-waste management",
         7: "Environmental policies, conventions & laws", 8: "EIA, sustainability & social issues"}
s = Subject("env", "Environmental Science & Ecology", 10001, [units.get(i, f"unit {i}") for i in range(1, 11)])

# ---- Unit 4: control technologies
s.q(4, "Which air pollution control device is most efficient (often above 99%) for removing fine particulate matter from large volumes of flue gas in thermal power plants?",
    ["Electrostatic precipitator", "Cyclone separator", "Gravity settling chamber", "Packed-bed wet scrubber"], "Electrostatic precipitator",
    "ESPs charge particles and collect them on plates, achieving very high efficiencies even for sub-micron particles. Cyclones and settling chambers are effective mainly for coarse particles.", shuffle=True)
s.q(4, "Consider the following statements about BOD and COD: 1. COD is usually higher than BOD for the same wastewater. 2. BOD is conventionally measured over 5 days at 20 °C. 3. A high BOD/COD ratio indicates that the waste is readily biodegradable. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "COD oxidises both biodegradable and non-biodegradable matter chemically, so COD ≥ BOD. BOD₅ at 20 °C is the standard test. A BOD/COD ratio above about 0.5 suggests good biodegradability.")
s.q(4, "In the activated sludge process, a part of the settled sludge is returned to the aeration tank in order to",
    ["maintain a high concentration of active microorganisms (MLSS)", "remove grit from the influent", "disinfect the effluent", "reduce the dissolved oxygen in the tank"], "maintain a high concentration of active microorganisms (MLSS)",
    "Return activated sludge keeps the mixed-liquor suspended solids, and so the food-to-microorganism (F/M) ratio, in the desired range. Excess sludge is wasted to sludge treatment.", shuffle=True)
s.q(4, "Match the wastewater treatment unit with the stage it belongs to: A. Screens and grit chamber B. Primary clarifier C. Trickling filter D. Chlorination — 1. Secondary (biological) treatment 2. Preliminary treatment 3. Disinfection 4. Primary treatment",
    ["A-2, B-4, C-1, D-3", "A-4, B-2, C-1, D-3", "A-2, B-1, C-4, D-3", "A-2, B-4, C-3, D-1"], "A-2, B-4, C-1, D-3",
    "Screens and grit chambers are preliminary; primary clarifiers remove settleable solids; trickling filters (attached growth) and activated sludge (suspended growth) are secondary biological processes; chlorination disinfects.")
s.q(4, "Under the National Ambient Air Quality Standards (2009), the annual average limit for PM2.5 in residential and industrial areas is",
    ["40 µg/m³", "60 µg/m³", "50 µg/m³", "100 µg/m³"], "40 µg/m³",
    "NAAQS 2009 cover 12 pollutants. PM2.5: 40 µg/m³ (annual) and 60 µg/m³ (24-hour); PM10: 60 (annual) and 100 (24-hour).", shuffle=True)
s.q(4, "As per the Noise Pollution (Regulation and Control) Rules, 2000, the ambient noise limits for a residential area are",
    ["55 dB(A) by day and 45 dB(A) by night", "65 dB(A) by day and 55 dB(A) by night", "50 dB(A) by day and 40 dB(A) by night", "75 dB(A) by day and 70 dB(A) by night"], "55 dB(A) by day and 45 dB(A) by night",
    "Limits (day/night, dB(A) Leq): industrial 75/70, commercial 65/55, residential 55/45, silence zone 50/40. Day time is 6 a.m. to 10 p.m.", shuffle=True)
s.q(4, "The Indian Standard for drinking water specification is",
    ["IS 10500", "IS 456", "IS 800", "IS 3025"], "IS 10500",
    "IS 10500:2012 specifies drinking water quality. IS 456 is the code for plain and reinforced concrete, IS 800 for steel structures, and IS 3025 covers methods of sampling and testing water.", shuffle=True)

# ---- Unit 5: waste rules
s.q(5, "Under the Bio-Medical Waste Management Rules, 2016, match the colour of container with the waste it receives: A. Yellow B. Red C. White (translucent) D. Blue — 1. Contaminated recyclable plastic waste (tubing, bottles, catheters) 2. Waste sharps including metals 3. Glassware 4. Human anatomical waste, soiled waste, expired medicines",
    ["A-4, B-1, C-2, D-3", "A-1, B-4, C-2, D-3", "A-4, B-1, C-3, D-2", "A-4, B-2, C-1, D-3"], "A-4, B-1, C-2, D-3",
    "Yellow — anatomical and soiled waste for incineration; red — contaminated recyclable plastics; white puncture-proof containers — sharps; blue cardboard boxes — glassware.")
s.q(5, "Consider the following statements: 1. The E-Waste (Management) Rules, 2022 are based on Extended Producer Responsibility (EPR). 2. The Solid Waste Management Rules, 2016 require waste generators to segregate waste into at least three streams. 3. The Hazardous and Other Wastes Rules, 2016 use a manifest system to track the movement of hazardous waste. How many of the above statements are correct?",
    ["Only one", "Only two", "All three", "None"], "All three",
    "All three are correct. The SWM Rules require segregation into biodegradable, non-biodegradable (dry) and domestic hazardous waste; the manifest system tracks hazardous waste from generator to disposal facility.")
s.q(5, "In the hierarchy of solid waste management, which is the MOST preferred option?",
    ["Waste prevention / reduction at source", "Recycling", "Energy recovery by incineration", "Disposal in a sanitary landfill"], "Waste prevention / reduction at source",
    "The hierarchy is reduce → reuse → recycle → recover (energy) → dispose. Landfill is the least preferred option.", shuffle=True)

# ---- Unit 7: laws & conventions
s.q(7, "Arrange the following Indian environmental laws in chronological order of enactment: 1. Environment (Protection) Act 2. Water (Prevention and Control of Pollution) Act 3. Air (Prevention and Control of Pollution) Act 4. Wild Life (Protection) Act",
    ["4, 2, 3, 1", "2, 4, 3, 1", "4, 3, 2, 1", "2, 3, 4, 1"], "4, 2, 3, 1",
    "Wild Life (Protection) Act — 1972; Water Act — 1974; Air Act — 1981; Environment (Protection) Act — 1986 (after the Bhopal gas tragedy).", shuffle=False)
s.q(7, "The Central Pollution Control Board was originally constituted under",
    ["the Water (Prevention and Control of Pollution) Act, 1974", "the Air (Prevention and Control of Pollution) Act, 1981", "the Environment (Protection) Act, 1986", "the Forest (Conservation) Act, 1980"],
    "the Water (Prevention and Control of Pollution) Act, 1974",
    "The CPCB (initially the Central Board for the Prevention and Control of Water Pollution) was set up in 1974 under the Water Act; the Air Act, 1981 later gave it air-pollution functions too.", shuffle=True)
s.q(7, "Match the international agreement with its focus: A. Montreal Protocol (1987) B. Kigali Amendment (2016) C. Basel Convention (1989) D. Stockholm Convention (2001) — 1. Phase-down of hydrofluorocarbons (HFCs) 2. Persistent organic pollutants 3. Transboundary movement of hazardous wastes 4. Substances that deplete the ozone layer",
    ["A-4, B-1, C-3, D-2", "A-1, B-4, C-3, D-2", "A-4, B-1, C-2, D-3", "A-4, B-3, C-1, D-2"], "A-4, B-1, C-3, D-2",
    "Montreal — ozone-depleting substances; Kigali — HFC phase-down under the Montreal Protocol (HFCs are potent greenhouse gases, not ozone depleters); Basel — hazardous waste trade; Stockholm — POPs such as DDT and PCBs.")
s.q(7, "Assertion (A): The Kigali Amendment to the Montreal Protocol is regarded as a major climate measure. Reason (R): HFCs do not deplete the ozone layer but have very high global warming potential.",
    AR, AR[0],
    "Both are true and R explains A. HFCs replaced CFCs and HCFCs because they are ozone-safe, but their high GWP made their phase-down an important climate action — estimated to avoid up to about 0.4 °C of warming by 2100.")

# ---- Unit 8: EIA
s.q(8, "Under the EIA Notification, 2006, consider the following: 1. Category ‘A’ projects are appraised at the Central level by the Expert Appraisal Committee of MoEFCC. 2. Category ‘B’ projects are appraised by the State-level Expert Appraisal Committee and cleared by the SEIAA. 3. Public consultation is one of the four stages of the EIA process. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. The four stages are screening, scoping, public consultation and appraisal.")
s.q(8, "The Leopold matrix is a tool used in",
    ["Environmental Impact Assessment, to identify and rate project–environment interactions", "life-cycle costing of buildings", "designing activated sludge plants", "measuring ambient noise levels"], "Environmental Impact Assessment, to identify and rate project–environment interactions",
    "The Leopold matrix (1971) cross-tabulates about 100 project actions against about 88 environmental characteristics and scores the magnitude and importance of each impact.", shuffle=True)
s.q(8, "Which of the following are Indian green building rating systems? 1. GRIHA 2. IGBC 3. LEED 4. BREEAM",
    ["1 and 2 only", "1, 2 and 3 only", "3 and 4 only", "1, 2, 3 and 4"], "1 and 2 only",
    "GRIHA (developed by TERI with MNRE) and IGBC (CII) are Indian. LEED is American (USGBC) and BREEAM is British, though both are used in India.")
s.q(8, "Life Cycle Assessment (LCA) of a product evaluates environmental impacts",
    ["from raw material extraction through manufacture and use to final disposal (‘cradle to grave’)", "only during the manufacturing stage", "only during the use phase", "only at the time of disposal"], "from raw material extraction through manufacture and use to final disposal (‘cradle to grave’)",
    "LCA (ISO 14040/44) covers the whole life cycle — goal and scope, inventory analysis, impact assessment and interpretation.", shuffle=True)

s.write("env-engineering.json")
