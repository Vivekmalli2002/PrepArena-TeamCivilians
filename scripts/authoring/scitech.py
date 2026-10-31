from lib import Subject, HOW_MANY, HOW_MANY_PAIRS, AR

s = Subject("scitech", "Science & Technology", 50001, [
    "S&T policies, missions, institutes & IPR",
    "Space technology (ISRO) & defence (DRDO)",
    "ICT, Digital India, e-governance & cyber security",
    "Nuclear technology & energy management",
    "Biotechnology, nanotech & agri-revolutions",
    "Human health, diseases, vaccines & everyday science",
])

s.q(2, "Consider the following statements about Chandrayaan-3: 1. Its lander Vikram soft-landed near the lunar south pole on 23 August 2023. 2. India became the first country to soft-land near the lunar south polar region. 3. 23 August is now observed as National Space Day. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. India was the fourth country to soft-land on the Moon (after the USSR, USA and China) and the first near the south polar region.")
s.q(2, "Aditya-L1, India's first space-based solar observatory, is placed in a halo orbit around",
    ["the Sun–Earth Lagrange point L1", "the Earth–Moon Lagrange point L1", "the Sun–Earth Lagrange point L2", "a geostationary orbit"], "the Sun–Earth Lagrange point L1",
    "Aditya-L1 (launched 2 September 2023 on PSLV-C57) orbits the Sun–Earth L1 point, about 1.5 million km from Earth, giving an uninterrupted view of the Sun.")
s.q(2, "Which of the following missiles were developed under the Integrated Guided Missile Development Programme (IGMDP)? 1. Prithvi 2. Agni 3. Akash 4. BrahMos",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "IGMDP (launched 1983 under Dr A.P.J. Abdul Kalam) produced Prithvi, Agni, Trishul, Akash and Nag. BrahMos is an Indo-Russian joint venture, not an IGMDP missile.")
s.q(2, "Match the launch vehicle with its notable mission: A. PSLV-C37 B. PSLV-C25 C. LVM3-M4 D. PSLV-C57 — 1. Chandrayaan-3 2. Aditya-L1 3. 104 satellites in a single launch 4. Mars Orbiter Mission",
    ["A-3, B-4, C-1, D-2", "A-4, B-3, C-1, D-2", "A-3, B-4, C-2, D-1", "A-1, B-4, C-3, D-2"], "A-3, B-4, C-1, D-2",
    "PSLV-C37 (Feb 2017) launched 104 satellites; PSLV-C25 (Nov 2013) launched Mangalyaan; LVM3-M4 (July 2023) launched Chandrayaan-3; PSLV-C57 (Sept 2023) launched Aditya-L1.")

s.q(3, "Which agency is India's national nodal agency for responding to cyber security incidents under the IT Act, 2000?",
    ["NCIIPC", "CERT-In", "NTRO", "C-DAC"], "CERT-In",
    "CERT-In (Section 70B of the IT Act) is the national agency for incident response. NCIIPC protects critical information infrastructure (Section 70A).")
s.q(3, "Consider the following statements: 1. The Digital India programme was launched on 1 July 2015. 2. The National Cyber Security Policy was released in 2013. 3. UPI is operated by the Reserve Bank of India. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "UPI is operated by the National Payments Corporation of India (NPCI), an RBI- and IBA-promoted not-for-profit company — not by the RBI itself.")

s.q(4, "India's three-stage nuclear power programme, envisioned by Homi J. Bhabha, aims ultimately to utilise",
    ["uranium-235", "plutonium-239", "thorium-232", "deuterium"], "thorium-232",
    "Stage 1: PHWRs using natural uranium; Stage 2: fast breeder reactors using plutonium; Stage 3: thorium-based reactors producing and burning U-233 — India has large thorium reserves.")
s.q(4, "Match the radioisotope with its use: A. Cobalt-60 B. Iodine-131 C. Carbon-14 D. Technetium-99m — 1. Dating of archaeological samples 2. Diagnostic imaging 3. Radiotherapy of cancer 4. Diagnosis and treatment of thyroid disorders",
    ["A-3, B-4, C-1, D-2", "A-4, B-3, C-1, D-2", "A-3, B-4, C-2, D-1", "A-2, B-4, C-1, D-3"], "A-3, B-4, C-1, D-2",
    "Co-60 gamma rays are used in radiotherapy and food irradiation; I-131 for thyroid disorders; C-14 for radiocarbon dating; Tc-99m is the most widely used diagnostic imaging isotope.")
s.q(4, "Assertion (A): India moved directly from Bharat Stage IV to Bharat Stage VI emission norms. Reason (R): BS-VI norms came into force nationwide from 1 April 2020.",
    AR, AR[1],
    "Both are true but R does not explain A. India leapfrogged BS-V to cut vehicular pollution faster; the date of implementation is a fact about BS-VI, not the reason for skipping BS-V.")
s.q(4, "The Kudankulam Nuclear Power Plant has been built in collaboration with",
    ["France", "Russia", "the United States", "Canada"], "Russia",
    "Kudankulam (Tamil Nadu) uses Russian VVER pressurised water reactors. Canada assisted India's first PHWR at Rawatbhata (RAPS-1).")

s.q(5, "Consider the following statements about Bt cotton: 1. It carries a gene from the bacterium Bacillus thuringiensis. 2. The gene produces a protein toxic to bollworms. 3. It was approved for commercial cultivation in India in 2002. 4. It is resistant to all sucking pests. How many of the above statements are correct?",
    HOW_MANY, "Only three",
    "1–3 are correct; Bt cotton was approved by the GEAC in 2002. Statement 4 is wrong: the Cry toxins target lepidopteran pests (bollworms), not sucking pests such as whitefly — and pink bollworm has since developed resistance.")
s.q(5, "Which body under the Ministry of Environment, Forest and Climate Change approves the environmental release of genetically engineered organisms in India?",
    ["Indian Council of Agricultural Research", "Genetic Engineering Appraisal Committee", "Department of Biotechnology", "Food Safety and Standards Authority of India"], "Genetic Engineering Appraisal Committee",
    "The GEAC, constituted under the Rules, 1989 of the Environment (Protection) Act, 1986, appraises large-scale use and environmental release of GM organisms.")

s.q(6, "Match the disease with its causative agent: A. Tuberculosis B. Malaria C. Dengue D. Ringworm — 1. Virus 2. Fungus 3. Bacterium 4. Protozoan",
    ["A-3, B-4, C-1, D-2", "A-3, B-1, C-4, D-2", "A-4, B-3, C-1, D-2", "A-3, B-4, C-2, D-1"], "A-3, B-4, C-1, D-2",
    "TB — Mycobacterium tuberculosis (bacterium); malaria — Plasmodium (protozoan); dengue — flavivirus; ringworm — dermatophyte fungi (not a worm).")
s.q(6, "Consider the following statements: 1. Ayushman Bharat – PM-JAY provides health cover of up to ₹5 lakh per family per year for secondary and tertiary hospitalisation. 2. Mission Indradhanush was launched to increase full immunisation coverage of children and pregnant women. 3. The BCG vaccine protects against tuberculosis. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. PM-JAY was launched in 2018; Mission Indradhanush in December 2014.")
s.q(6, "Which vitamin is synthesised in the human skin on exposure to sunlight and whose deficiency causes rickets in children?",
    ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin K"], "Vitamin D",
    "UV-B converts 7-dehydrocholesterol in the skin to vitamin D3. Deficiency causes rickets in children and osteomalacia in adults.")
s.q(6, "Why does a person feel cooler under a running fan even though the fan does not lower the air temperature?",
    ["The fan absorbs heat from the air", "Moving air speeds up evaporation of sweat, which takes latent heat from the body", "The fan increases the humidity of the room", "The fan reduces the air pressure around the body"],
    "Moving air speeds up evaporation of sweat, which takes latent heat from the body",
    "A fan actually adds a little heat to the room. It cools the body by increasing evaporation from the skin and by convection.")

s.q(1, "Which of the following are forms of intellectual property protected by separate statutes in India? 1. Patents 2. Geographical Indications 3. Plant varieties 4. Trade secrets",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "India has the Patents Act, 1970; the Geographical Indications of Goods Act, 1999; and the Protection of Plant Varieties and Farmers' Rights Act, 2001. There is no separate statute for trade secrets; they are protected through contract law and equity.")
s.q(1, "Tirupati Laddu, Banganapalle mangoes and Kondapalli toys from Andhra Pradesh are examples of",
    ["Patents", "Geographical Indications", "Trademarks", "Copyrights"], "Geographical Indications",
    "All three are registered GIs, which identify goods whose quality or reputation is linked to their place of origin. GI registration is valid for 10 years and renewable.")

s.write("scitech.json")
