from lib import Subject, HOW_MANY, HOW_MANY_PAIRS, AR

s = Subject("society", "Indian Society", 70001, [
    "Structure: family, marriage, kinship, caste, tribe, ethnicity, religion, women",
    "Social issues: casteism, communalism, regionalism, crimes against women, child labour, youth unrest",
    "Welfare mechanisms: policies, programmes, constitutional & statutory safeguards",
])

s.q(1, "The concept of ‘Sanskritisation’, the process by which a lower caste adopts the customs and rituals of a higher caste, was introduced by",
    ["G.S. Ghurye", "M.N. Srinivas", "Andre Beteille", "Louis Dumont"], "M.N. Srinivas",
    "M.N. Srinivas introduced Sanskritisation in his study of the Coorgs (1952) and also the idea of the ‘dominant caste’. Louis Dumont wrote Homo Hierarchicus.")
s.q(1, "Match the concept with the scholar associated with it: A. Little and Great Traditions B. Dominant caste C. Homo Hierarchicus D. Caste and Race in India — 1. M.N. Srinivas 2. Robert Redfield 3. G.S. Ghurye 4. Louis Dumont",
    ["A-2, B-1, C-4, D-3", "A-1, B-2, C-4, D-3", "A-2, B-1, C-3, D-4", "A-4, B-1, C-2, D-3"], "A-2, B-1, C-4, D-3",
    "Redfield proposed Little and Great Traditions (applied to India by McKim Marriott); Srinivas — dominant caste; Dumont — Homo Hierarchicus (1966); Ghurye — Caste and Race in India (1932).")
s.q(1, "Which of the following communities traditionally follow a matrilineal system of descent? 1. Khasi 2. Garo 3. Nair 4. Toda",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "The Khasi and Garo of Meghalaya and the Nairs of Kerala (marumakkathayam) were traditionally matrilineal. The Todas of the Nilgiris are patrilineal and were known for fraternal polyandry.")
s.q(1, "The rule that requires a person to marry outside his or her own clan or gotra is called",
    ["Endogamy", "Exogamy", "Hypergamy", "Polyandry"], "Exogamy",
    "Exogamy — marriage outside the clan, gotra or village. Endogamy — marriage within the caste or group. Hypergamy — a woman marrying into a higher-status group.")

s.q(2, "Consider the following statements: 1. The Child and Adolescent Labour (Prohibition and Regulation) Act prohibits employment of children below 14 years in all occupations except helping family enterprises after school hours. 2. Adolescents (14–18 years) are prohibited from working in hazardous occupations. 3. Article 24 prohibits employment of children below 14 in factories, mines and other hazardous employment. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. The 1986 Act was amended in 2016 and renamed to cover adolescents; Article 24 is a Fundamental Right against exploitation.")
s.q(2, "Match the Act with the year it was enacted: A. Dowry Prohibition Act B. Pre-Conception and Pre-Natal Diagnostic Techniques (PCPNDT) Act C. Protection of Women from Domestic Violence Act D. Protection of Children from Sexual Offences (POCSO) Act — 1. 1961 2. 1994 3. 2005 4. 2012",
    ["A-1, B-2, C-3, D-4", "A-2, B-1, C-3, D-4", "A-1, B-3, C-2, D-4", "A-1, B-2, C-4, D-3"], "A-1, B-2, C-3, D-4",
    "Dowry Prohibition Act — 1961; PCPNDT (originally PNDT) Act — 1994; Domestic Violence Act — 2005; POCSO Act — 2012.")
s.q(2, "Assertion (A): A declining child sex ratio is a serious social concern in India. Reason (R): Sex-selective abortion is driven by son preference and is prohibited under the PCPNDT Act, 1994.",
    AR, AR[0],
    "Both are true and R explains A. Son preference and the misuse of diagnostic techniques for sex selection are major causes of the falling child sex ratio (919 in Census 2011).")

s.q(3, "Under the Rights of Persons with Disabilities Act, 2016, consider the following: 1. The number of specified disabilities is 21. 2. Not less than 4% of vacancies in government establishments are reserved for persons with benchmark disabilities. 3. A ‘benchmark disability’ means not less than 40% of a specified disability. How many of the above statements are correct?",
    ["Only one", "Only two", "All three", "None"], "All three",
    "All three are correct. The 2016 Act replaced the 1995 Act (7 disabilities, 3% reservation).")
s.q(3, "Which of the following communities are notified as minorities by the Union Government under the National Commission for Minorities Act, 1992? 1. Muslims 2. Christians 3. Sikhs 4. Buddhists 5. Parsis (Zoroastrians) 6. Jains",
    ["1, 2, 3 and 4 only", "1, 2, 3, 4 and 5 only", "1, 2, 3, 4, 5 and 6", "1, 2 and 6 only"], "1, 2, 3, 4, 5 and 6",
    "Five communities were notified in 1993; Jains were added in 2014, making six.")
s.q(3, "Which Article of the Constitution empowers the State to make special provisions for women and children?",
    ["Article 14", "Article 15(3)", "Article 15(4)", "Article 21A"], "Article 15(3)",
    "Article 15(3) permits special provisions for women and children. Article 15(4) covers socially and educationally backward classes, SCs and STs; Article 21A is the right to education.")
s.q(3, "The National Commission for Women was set up as a statutory body under an Act passed in",
    ["1986", "1990", "1993", "2005"], "1990",
    "The National Commission for Women Act, 1990 created the NCW, which was constituted in January 1992.")

s.write("society.json")
