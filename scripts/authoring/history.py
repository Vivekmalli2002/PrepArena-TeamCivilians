from lib import Subject, HOW_MANY, HOW_MANY_PAIRS, AR

s = Subject("history", "AP & Indian History", 30001, [
    "AP: prehistoric & early dynasties",
    "AP: medieval Andhradesa (11th–16th c.)",
    "AP: Europeans, 1857 & freedom struggle",
    "AP: Andhra movement & the 1953 state",
    "AP: formation (1956) to bifurcation (2014)",
    "Indian history: ancient India",
    "Indian history: medieval India",
    "Indian history: modern India",
])

# ---- AP early
s.q(1, "Consider the following statements about the Satavahanas: 1. The Nasik inscription of Gautami Balasri describes the achievements of Gautamiputra Satakarni. 2. King Hala compiled the Gathasaptasati in Prakrit. 3. Their inscriptions are mainly in Sanskrit. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "Satavahana inscriptions are overwhelmingly in Prakrit, not Sanskrit. The Nasik prashasti by Gautami Balasri praises her son Gautamiputra Satakarni, and the Gathasaptasati is attributed to Hala.")
s.q(1, "The capital of the Ikshvakus of the Krishna valley, where a king performed the Asvamedha sacrifice while queens patronised Buddhism, was",
    ["Dhanyakataka", "Vijayapuri", "Pithapuram", "Vengi"], "Vijayapuri",
    "The Ikshvakus ruled from Vijayapuri (Nagarjunakonda). Vasishthiputra Chamtamula performed Vedic sacrifices including the Asvamedha, while the royal women endowed the Buddhist establishments at Nagarjunakonda.")
s.q(1, "Who founded the Eastern Chalukya dynasty of Vengi?",
    ["Pulakesin II", "Kubja Vishnuvardhana", "Vijayaditya II", "Rajaraja Narendra"], "Kubja Vishnuvardhana",
    "Kubja Vishnuvardhana, younger brother of Pulakesin II of Badami, founded the line at Vengi (c. 624 CE).")
s.q(1, "Assertion (A): Nannaya is called the ‘Adikavi’ of Telugu literature. Reason (R): He began the Telugu rendering of the Mahabharata under the patronage of the Eastern Chalukya king Rajaraja Narendra.",
    AR, AR[0],
    "Both are true and R explains A. Nannaya's Andhra Mahabharatamu (11th century, at Rajamahendravaram) is the earliest major literary work in Telugu; Tikkana and Errana completed it.")
s.q(1, "The rock-cut cave temples at Undavalli near Vijayawada are generally attributed to the",
    ["Satavahanas", "Ikshvakus", "Vishnukundins", "Kakatiyas"], "Vishnukundins",
    "The Undavalli caves, with a large reclining Vishnu, are usually attributed to the Vishnukundins (5th–6th century CE).")

# ---- AP medieval
s.q(2, "Consider the following statements about the Kakatiyas: 1. Their capital was Orugallu (Warangal). 2. Marco Polo visited Motupalli port during the reign of Rudramadevi. 3. The Ramappa temple, a UNESCO World Heritage Site, was built during the reign of Ganapatideva. How many of the above statements are correct?",
    ["Only one", "Only two", "All three", "None"], "All three",
    "All three are correct. The Ramappa (Rudreswara) temple at Palampet was built in 1213 by Recharla Rudra, a general of Ganapatideva, and was inscribed as a World Heritage Site in 2021.")
s.q(2, "Srinatha, the celebrated Telugu poet who wrote Srungara Naishadham, adorned the court of the",
    ["Kakatiyas", "Reddi kings of Kondavidu", "Musunuri Nayakas", "Gajapatis of Odisha"], "Reddi kings of Kondavidu",
    "Srinatha was the court poet (Vidyadhikari) of the Reddi king Pedakomati Vema Reddi of Kondavidu in the late 14th–early 15th century.")
s.q(2, "Which of the following works was written in Telugu by Krishnadevaraya?",
    ["Manucharitra", "Amuktamalyada", "Panduranga Mahatmyam", "Vasucharitra"], "Amuktamalyada",
    "Krishnadevaraya wrote Amuktamalyada (on Andal). Manucharitra is by Allasani Peddana, Panduranga Mahatmyam by Tenali Ramakrishna and Vasucharitra by Ramarajabhushana.")
s.q(2, "Arrange the following events in chronological order: 1. Foundation of the Vijayanagara empire 2. Battle of Talikota (Rakkasa–Tangadi) 3. Death of Prataparudra II of the Kakatiya dynasty",
    ["3, 1, 2", "1, 3, 2", "3, 2, 1", "1, 2, 3"], "3, 1, 2",
    "The Kakatiya kingdom fell to the Tughlaqs in 1323 (Prataparudra died soon after); Vijayanagara was founded in 1336; the Battle of Talikota was fought in 1565.")

# ---- AP colonial & freedom struggle
s.q(3, "Consider the following statements about European trade in Andhra: 1. The Dutch set up a factory at Masulipatnam in 1605. 2. The English set up their first factory on the east coast at Masulipatnam in 1611. 3. Yanam remained a French possession until 1954. 4. Bheemunipatnam was a Danish settlement. How many of the above statements are correct?",
    HOW_MANY, "Only three",
    "Statements 1–3 are correct. Bheemunipatnam was a Dutch settlement (its Dutch cemetery survives); the Danes' main base in the region was Tranquebar in Tamil Nadu. Yanam, with the other French settlements, was transferred de facto to India in 1954.")
s.q(3, "The Northern Circars were granted to the English East India Company by a Mughal farman in",
    ["1757", "1765", "1766", "1800"], "1765",
    "Emperor Shah Alam II granted the Northern Circars by farman in 1765; the Nizam's formal agreement followed in 1766. The Ceded Districts (Rayalaseema) were ceded by the Nizam in 1800.")
s.q(3, "Consider the following statements about Kandukuri Veeresalingam: 1. He performed the first widow remarriage in Andhra at Rajahmundry in 1881. 2. He started the journal Vivekavardhini. 3. He wrote the play Kanyasulkam. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "Kanyasulkam (1892) was written by Gurajada Apparao. Veeresalingam (‘Gadya Tikkana’) founded Vivekavardhini and championed widow remarriage and women's education.")
s.q(3, "Match List-I (Movement) with List-II (Leader): A. Chirala–Perala movement B. Rampa rebellion (1922–24) C. Pedanandipadu no-tax campaign D. Vandemataram movement in Rajahmundry — 1. Alluri Sitarama Raju 2. Duggirala Gopalakrishnayya 3. Parvataneni Veeraiah Chowdary 4. Visit of Bipin Chandra Pal (1907)",
    ["A-2, B-1, C-3, D-4", "A-3, B-1, C-2, D-4", "A-2, B-4, C-3, D-1", "A-1, B-2, C-3, D-4"], "A-2, B-1, C-3, D-4",
    "Duggirala Gopalakrishnayya led the Chirala–Perala protest (1921); Alluri Sitarama Raju led the Rampa rebellion; Parvataneni Veeraiah Chowdary led the Pedanandipadu no-tax campaign (1922); Bipin Chandra Pal's 1907 speeches in Rajahmundry sparked the Vandemataram movement.")

# ---- Andhra movement
s.q(4, "The first Andhra Mahasabha (Andhra Conference) was held in 1913 at",
    ["Bapatla", "Nellore", "Guntur", "Kakinada"], "Bapatla",
    "The first Andhra Mahasabha met at Bapatla in 1913 under the presidency of Biyyala Narasimha Sarma, beginning the organised demand for a separate Andhra province.")
s.q(4, "Consider the following statements about the Sri Bagh Pact (1937): 1. It was signed between leaders of coastal Andhra and Rayalaseema. 2. It was named after the residence of Kasinathuni Nageswara Rao in Madras. 3. It provided that the capital of a future Andhra State could be located in Rayalaseema if the High Court went to coastal Andhra. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "Signed on 16 November 1937 at ‘Sri Bagh’, Kasinathuni Nageswara Rao's house, the pact assured Rayalaseema of irrigation priority and a choice between the capital and the High Court. Kurnool became the capital of Andhra State in 1953.")
s.q(4, "Arrange in chronological order: 1. Death of Potti Sriramulu after his fast 2. Formation of Andhra State 3. Sri Bagh Pact 4. Formation of the Justice Party",
    ["4, 3, 1, 2", "3, 4, 1, 2", "4, 3, 2, 1", "3, 1, 4, 2"], "4, 3, 1, 2",
    "Justice Party (South Indian Liberal Federation) — 1916–17; Sri Bagh Pact — 1937; Potti Sriramulu died on 15 December 1952 after a 58-day fast; Andhra State was formed on 1 October 1953.")
s.q(4, "Who is known as the father of the Library Movement in Andhra?",
    ["Iyyanki Venkata Ramanayya", "Komarraju Venkata Lakshmana Rao", "Kasinathuni Nageswara Rao", "Gadicherla Harisarvottama Rao"], "Iyyanki Venkata Ramanayya",
    "Iyyanki Venkata Ramanayya organised the Andhra Desa Library Association (1914) and the library movement; Komarraju Lakshmana Rao and Gadicherla Harisarvottama Rao were also associated with it.")
s.q(4, "Who was the first Chief Minister of Andhra State (1953)?",
    ["Neelam Sanjiva Reddy", "Tanguturi Prakasam", "Bezawada Gopala Reddy", "Kala Venkata Rao"], "Tanguturi Prakasam",
    "Tanguturi Prakasam (‘Andhra Kesari’) became Chief Minister of Andhra State on 1 October 1953, with Kurnool as the capital. Neelam Sanjiva Reddy was the first Chief Minister of Andhra Pradesh (1956).")

# ---- 1956–2014
s.q(5, "Consider the following statements about the States Reorganisation Commission: 1. It was chaired by Fazl Ali. 2. K.M. Panikkar and H.N. Kunzru were its members. 3. It recommended the immediate merger of Telangana with Andhra State. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "The SRC (1953–55) favoured keeping Telangana as a separate State for the time being, with a possible merger after the 1961 elections if its legislature agreed. Andhra Pradesh was nevertheless formed on 1 November 1956 after the Gentlemen's Agreement.")
s.q(5, "The Gentlemen's Agreement of 1956 was concerned with",
    ["safeguards for Telangana in the new State of Andhra Pradesh", "sharing of Krishna river waters between Andhra and Mysore", "the location of the High Court of Andhra State", "the transfer of Bhadrachalam to Andhra State"],
    "safeguards for Telangana in the new State of Andhra Pradesh",
    "Signed in February 1956 by leaders of Andhra and Telangana, it promised safeguards such as a Regional Council, domicile rules for jobs and use of Telangana's surplus revenue for the region.")
s.q(5, "Under the Andhra Pradesh Reorganisation Act, 2014, the ‘appointed day’ on which the residuary State of Andhra Pradesh and Telangana came into existence was",
    ["1 November 2013", "1 March 2014", "2 June 2014", "15 August 2014"], "2 June 2014",
    "The appointed day was 2 June 2014. Hyderabad was made the common capital for a period not exceeding ten years.")

# ---- Ancient India
s.q(6, "Which of the following Harappan sites is correctly matched with its feature? 1. Lothal — dockyard 2. Dholavira — sophisticated water reservoirs 3. Kalibangan — ploughed field 4. Mohenjo-daro — Great Bath. How many of the above pairs are correctly matched?",
    HOW_MANY_PAIRS, "All four pairs",
    "All four are correct. Dholavira (Kutch) was inscribed as a UNESCO World Heritage Site in 2021 for its water management system.")
s.q(6, "Which of the Rock Edicts of Ashoka describes the Kalinga war and his remorse?",
    ["Rock Edict II", "Rock Edict VIII", "Rock Edict XIII", "Pillar Edict VII"], "Rock Edict XIII",
    "Major Rock Edict XIII records the conquest of Kalinga, the suffering it caused and Ashoka's turn to Dhamma-vijaya. The Kalinga edicts at Dhauli and Jaugada omit this edict.")
s.q(6, "The Prayaga Prashasti (Allahabad Pillar inscription), which describes the conquests of Samudragupta, was composed by",
    ["Kalidasa", "Harisena", "Ravikirti", "Banabhatta"], "Harisena",
    "Harisena, Samudragupta's court poet, composed the Prayaga Prashasti. Ravikirti composed the Aihole inscription of Pulakesin II; Banabhatta wrote Harshacharita.")
s.q(6, "Consider the following statements about Harshavardhana: 1. Hiuen Tsang visited India during his reign. 2. He convened a religious assembly at Kannauj. 3. He was defeated on the Narmada by the Chalukya king Pulakesin II. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. The Aihole inscription records Pulakesin II's victory over Harsha on the Narmada.")

# ---- Medieval India
s.q(7, "The Uttaramerur inscriptions are an important source for",
    ["the Chola system of village self-government", "Rashtrakuta temple architecture", "Pallava–Chalukya wars", "the Vijayanagara Nayankara system"],
    "the Chola system of village self-government",
    "Inscriptions of Parantaka I at Uttaramerur describe the election of village committees (variyams) of the sabha by lot (kudavolai).")
s.q(7, "Consider the following measures: 1. Market control and fixed prices 2. Branding of horses (dagh) and descriptive rolls of soldiers (chehra) 3. Token currency of copper and brass. Which of the above were introduced by Alauddin Khalji?",
    ["1 and 2 only", "2 and 3 only", "1 only", "1, 2 and 3"], "1 and 2 only",
    "Alauddin Khalji introduced market control, dagh and chehra. Token currency was introduced by Muhammad bin Tughlaq.")
s.q(7, "Annamacharya, the composer of thousands of sankirtanas, was a devotee of",
    ["Lord Venkateswara of Tirumala", "Lord Rama of Bhadrachalam", "Lord Narasimha of Ahobilam", "Lord Shiva of Srisailam"], "Lord Venkateswara of Tirumala",
    "Tallapaka Annamacharya (15th century) composed sankirtanas in praise of Lord Venkateswara. Bhakta Ramadas (Kancherla Gopanna) was associated with Bhadrachalam.")
s.q(7, "Shivaji's council of eight ministers was known as",
    ["Ashtadiggajas", "Ashtapradhan", "Panchayat", "Navaratnas"], "Ashtapradhan",
    "The Ashtapradhan, headed by the Peshwa, advised Shivaji. The Ashtadiggajas were the eight poets of Krishnadevaraya's court; the Navaratnas were associated with Akbar's court.")

# ---- Modern India
s.q(8, "Arrange the following in chronological order: 1. Lucknow Pact 2. Formation of the Indian National Congress 3. Chauri Chaura incident 4. Dandi March",
    ["2, 1, 3, 4", "2, 3, 1, 4", "1, 2, 3, 4", "2, 1, 4, 3"], "2, 1, 3, 4",
    "INC — December 1885 (Bombay); Lucknow Pact — 1916; Chauri Chaura — February 1922 (Non-Cooperation called off); Dandi March — March–April 1930.")
s.q(8, "Match List-I (Organisation) with List-II (Founder): A. Brahmo Samaj B. Arya Samaj C. Satyashodhak Samaj D. Ramakrishna Mission — 1. Jyotirao Phule 2. Swami Vivekananda 3. Raja Rammohun Roy 4. Swami Dayananda Saraswati",
    ["A-3, B-4, C-1, D-2", "A-4, B-3, C-1, D-2", "A-3, B-4, C-2, D-1", "A-3, B-1, C-4, D-2"], "A-3, B-4, C-1, D-2",
    "Brahmo Samaj (1828) — Rammohun Roy; Arya Samaj (1875) — Dayananda Saraswati; Satyashodhak Samaj (1873) — Jyotirao Phule; Ramakrishna Mission (1897) — Vivekananda.")
s.q(8, "The Revolt of 1857 began on 10 May 1857 at",
    ["Barrackpore", "Meerut", "Delhi", "Kanpur"], "Meerut",
    "The sepoys at Meerut revolted on 10 May 1857 and marched to Delhi. Mangal Pandey's act at Barrackpore (29 March 1857) came earlier but did not begin the general revolt.")

s.write("history.json")
