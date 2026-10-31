from lib import Subject, HOW_MANY, HOW_MANY_PAIRS, AR

s = Subject("geography", "Geography", 60001, [
    "General & physical geography (world, India, AP)",
    "Economic & human geography (India & AP)",
])

s.q(1, "Match the discontinuity with the boundary it marks: A. Mohorovičić (Moho) B. Gutenberg C. Lehmann — 1. Outer core and inner core 2. Crust and mantle 3. Mantle and outer core",
    ["A-2, B-3, C-1", "A-3, B-2, C-1", "A-2, B-1, C-3", "A-1, B-3, C-2"], "A-2, B-3, C-1",
    "Moho separates crust from mantle; the Gutenberg discontinuity (~2,900 km) separates mantle and outer core — S-waves do not pass beyond it; the Lehmann discontinuity separates the liquid outer core from the solid inner core.")
s.q(1, "Consider the following statements: 1. The ozone layer lies mainly in the stratosphere. 2. Temperature generally decreases with height in the troposphere. 3. Most weather phenomena occur in the stratosphere. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "Weather occurs mainly in the troposphere, where temperature falls at about 6.5 °C per km (the normal lapse rate). The stratosphere, containing the ozone layer, warms with height.")
s.q(1, "Which of the following ocean currents are cold currents? 1. Labrador Current 2. Humboldt (Peru) Current 3. Kuroshio Current 4. Benguela Current",
    ["1, 2 and 4 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 4 only",
    "The Kuroshio is a warm current off Japan. The Labrador, Humboldt and Benguela currents are cold; the Humboldt and Benguela support rich fisheries through upwelling.")
s.q(1, "Spring tides occur when",
    ["the Sun, Moon and Earth are in a straight line, at new moon and full moon", "the Sun and Moon are at right angles to the Earth", "the Moon is at apogee", "the Earth is at aphelion"],
    "the Sun, Moon and Earth are in a straight line, at new moon and full moon",
    "At syzygy (new and full moon) the solar and lunar pulls reinforce each other, giving spring tides; at the quarter phases they act at right angles, giving neap tides.")
s.q(1, "The Tropic of Cancer passes through how many Indian States?",
    ["Six", "Seven", "Eight", "Nine"], "Eight",
    "Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura and Mizoram — eight States. It does not pass through Andhra Pradesh, Odisha or Bihar.")
s.q(1, "Consider the following statements about Andhra Pradesh: 1. It has the second longest coastline among Indian States, after Gujarat. 2. Kolleru Lake lies between the Godavari and Krishna deltas. 3. Pulicat Lake is shared by Andhra Pradesh and Odisha. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "Pulicat Lake, India's second-largest brackish-water lagoon (after Chilika), is shared by Andhra Pradesh and Tamil Nadu; Sriharikota lies between it and the sea.")
s.q(1, "Which one of the following is the highest peak of the Eastern Ghats in Andhra Pradesh?",
    ["Mahendragiri", "Arma Konda", "Doddabetta", "Horsley Hills"], "Arma Konda",
    "Arma Konda (Sitamma Konda, about 1,680 m) in the Visakhapatnam Agency is the highest peak in Andhra Pradesh. Mahendragiri is in Odisha; Doddabetta is in the Nilgiris (Tamil Nadu); Horsley Hills is a hill station in Annamayya district, AP.")
s.q(1, "Black (regur) soils are generally",
    ["rich in lime, iron, magnesia and potash but poor in nitrogen and phosphorus", "rich in nitrogen and humus", "highly leached and acidic, rich in iron and aluminium oxides", "sandy with very low clay content"],
    "rich in lime, iron, magnesia and potash but poor in nitrogen and phosphorus",
    "Regur soils, formed from Deccan basalt, are clayey, moisture-retentive and self-ploughing, and suit cotton. Option C describes laterite soils.")
s.q(1, "Assertion (A): Coastal Andhra Pradesh and Tamil Nadu receive a large part of their rainfall during October–December. Reason (R): The retreating (north-east) monsoon winds pick up moisture over the Bay of Bengal.",
    AR, AR[0],
    "Both are true and R explains A. The retreating monsoon and Bay of Bengal cyclones of October–December bring much of the rainfall to the south-east coast.")
s.q(1, "Which of the following rivers of Andhra Pradesh are east-flowing and drain directly into the Bay of Bengal? 1. Vamsadhara 2. Nagavali 3. Pennar 4. Tungabhadra",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "The Tungabhadra is a tributary of the Krishna and does not reach the sea on its own. The Vamsadhara, Nagavali and Pennar (Penna) flow directly into the Bay of Bengal.")

s.q(2, "According to Census 2011, India's sex ratio (females per 1,000 males) was",
    ["927", "933", "940", "943"], "943",
    "Census 2011 recorded 943 (provisional figures had shown 940). The child sex ratio (0–6 years) was 919.")
s.q(2, "Match the crop with the leading producing region characteristic: A. Rice B. Cotton C. Tea D. Jute — 1. Black soils of the Deccan 2. Well-drained hill slopes with heavy rainfall 3. Alluvial delta lands such as the Godavari–Krishna deltas 4. Ganga–Brahmaputra delta",
    ["A-3, B-1, C-2, D-4", "A-1, B-3, C-2, D-4", "A-3, B-1, C-4, D-2", "A-4, B-1, C-2, D-3"], "A-3, B-1, C-2, D-4",
    "Rice — alluvial deltas (Godavari–Krishna, the ‘rice bowl’ of AP); cotton — black soils; tea — well-drained slopes (Assam, Darjeeling, Nilgiris); jute — the Ganga–Brahmaputra delta.")
s.q(2, "Visakhapatnam Steel Plant is notable as",
    ["India's first shore-based integrated steel plant", "a public sector unit set up with Soviet help in 1959", "a mini steel plant using scrap", "a private sector plant of Tata Steel"], "India's first shore-based integrated steel plant",
    "Rashtriya Ispat Nigam Ltd's Visakhapatnam plant is India's first coastal (shore-based) integrated steel plant, commissioned in 1992.")
s.q(2, "Which of the following are major ports under the Union Government in Andhra Pradesh?",
    ["Visakhapatnam only", "Visakhapatnam and Kakinada", "Visakhapatnam and Krishnapatnam", "Kakinada, Krishnapatnam and Gangavaram"], "Visakhapatnam only",
    "Visakhapatnam is the only major port in AP administered under the Major Port Authorities Act, 2021. Kakinada, Krishnapatnam and Gangavaram are non-major (State/private) ports.")
s.q(2, "Consider the following statements about urbanisation in India as per Census 2011: 1. About 31% of the population lived in urban areas. 2. ‘Census towns’ are settlements without statutory urban status that meet the demographic criteria for urban areas. 3. A census town must have at least 75% of the male main workforce engaged in non-agricultural work. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. Census towns need a population of at least 5,000, a density of at least 400 per sq km and at least 75% of male main workers in non-farm activity. The urban share in 2011 was 31.16%.")

s.write("geography.json")
