from lib import Subject, HOW_MANY, AR

s = Subject("economy", "Indian & AP Economy", 40001, [
    "National income, growth, planning & inclusive development",
    "Money, banking, public finance, GST & trade",
    "Indian agriculture, industry & services",
    "AP economy, GSDP, public finance & bifurcation",
    "AP agriculture, allied sectors, industry & services",
    "Infrastructure (India & AP)",
])

s.q(1, "Which one of the following relations is correct?",
    ["GDP at market prices = GVA at basic prices + product taxes − product subsidies", "GDP at market prices = GVA at basic prices − product taxes + product subsidies", "NNP = GNP + depreciation", "GNP = GDP − net factor income from abroad"],
    "GDP at market prices = GVA at basic prices + product taxes − product subsidies",
    "GDP (market prices) = GVA (basic prices) + product taxes − product subsidies. NNP = GNP − depreciation, and GNP = GDP + net factor income from abroad.")
s.q(1, "Consider the following statements about NITI Aayog: 1. It replaced the Planning Commission on 1 January 2015. 2. The Prime Minister is its ex-officio Chairperson. 3. It allocates plan funds to the States. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1 and 2 only",
    "NITI Aayog is a policy think-tank promoting cooperative federalism; unlike the Planning Commission it does not allocate funds to States. Devolution now flows mainly through the Finance Commission.")
s.q(1, "Match the Five-Year Plan with the model it is chiefly associated with: A. First Plan B. Second Plan — 1. Harrod–Domar model 2. P.C. Mahalanobis model",
    ["A-1, B-2", "A-2, B-1", "Both with the Harrod–Domar model", "Both with the Mahalanobis model"], "A-1, B-2",
    "The First Plan (1951–56) used a Harrod–Domar framework with emphasis on agriculture; the Second Plan (1956–61) followed the Mahalanobis model with emphasis on heavy industry.")
s.q(1, "Assertion (A): The New Economic Policy of 1991 is described by the acronym ‘LPG’. Reason (R): It combined liberalisation, privatisation and globalisation, including the abolition of industrial licensing for most industries.",
    AR, AR[0],
    "Both are true and R explains A. The 1991 Industrial Policy abolished licensing for all but a short list of industries and opened the economy to foreign investment and trade.")

s.q(2, "Consider the following statements: 1. The Cash Reserve Ratio (CRR) is maintained by banks with the Reserve Bank of India. 2. The Statutory Liquidity Ratio (SLR) is maintained by banks in the form of liquid assets such as cash, gold and approved securities. 3. An increase in the repo rate generally makes borrowing costlier for banks. How many of the above statements are correct?",
    ["Only one", "Only two", "All three", "None"], "All three",
    "All three are correct. CRR is kept as balances with the RBI and earns no interest; SLR is maintained by banks themselves; the repo rate is the rate at which the RBI lends to banks against securities.")
s.q(2, "Fiscal deficit is best defined as",
    ["total expenditure minus revenue receipts and non-debt capital receipts", "revenue expenditure minus revenue receipts", "fiscal deficit minus interest payments", "total expenditure minus total receipts including borrowings"],
    "total expenditure minus revenue receipts and non-debt capital receipts",
    "Fiscal deficit = total expenditure − (revenue receipts + non-debt capital receipts); it equals the government's borrowing requirement. Revenue deficit = revenue expenditure − revenue receipts; primary deficit = fiscal deficit − interest payments.")
s.q(2, "Consider the following statements about GST: 1. It was introduced by the 101st Constitutional Amendment Act, 2016. 2. The GST Council is a constitutional body under Article 279A. 3. GST came into force on 1 July 2017. 4. Alcoholic liquor for human consumption is within the scope of GST. How many of the above statements are correct?",
    HOW_MANY, "Only three",
    "1, 2 and 3 are correct. Alcoholic liquor for human consumption is constitutionally outside GST (Art. 366(12A)); petroleum products are within the definition but GST on them applies only from a date recommended by the Council.")
s.q(2, "The Fiscal Responsibility and Budget Management (FRBM) Act was enacted in",
    ["1991", "2003", "2008", "2017"], "2003",
    "The FRBM Act, 2003 set targets for fiscal and revenue deficits; the N.K. Singh Committee (2017) reviewed it and recommended a debt-based anchor.")
s.q(2, "Under the current account of India's balance of payments, which of the following items are included? 1. Merchandise exports and imports 2. Software services exports 3. Private remittances from Indians abroad 4. Foreign direct investment",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "The current account covers trade in goods and services plus income and transfers (remittances). FDI is a capital/financial account flow.")
s.q(2, "In India, an investment by a foreign investor is generally classified as Foreign Direct Investment (FDI) rather than Foreign Portfolio Investment (FPI) if it amounts to",
    ["5% or more of the paid-up equity of a listed company", "10% or more of the paid-up equity of a listed company", "26% or more of the paid-up equity", "51% or more of the paid-up equity"],
    "10% or more of the paid-up equity of a listed company",
    "Following the Arvind Mayaram Committee, an investment of 10% or more in a listed company is treated as FDI; below 10% it is FPI.")
s.q(2, "The nationalisation of 14 major commercial banks in India took place in",
    ["1949", "1955", "1969", "1980"], "1969",
    "Fourteen banks were nationalised in July 1969 and six more in 1980. The RBI itself was nationalised in 1949; the Imperial Bank became the State Bank of India in 1955.")

s.q(3, "Minimum Support Prices (MSP) for notified crops are announced by the Government of India on the basis of the recommendations of the",
    ["Food Corporation of India", "Commission for Agricultural Costs and Prices", "NABARD", "NITI Aayog"], "Commission for Agricultural Costs and Prices",
    "The CACP recommends MSPs; the Cabinet Committee on Economic Affairs approves them. The FCI handles procurement and storage.")
s.q(3, "Consider the following statements: 1. Disinvestment means the sale of the Government's equity in public sector enterprises. 2. Strategic disinvestment involves the transfer of management control along with the sale of equity. 3. Proceeds from disinvestment are a non-debt capital receipt. Which of the above are correct?",
    ["1 and 2 only", "2 and 3 only", "1 and 3 only", "1, 2 and 3"], "1, 2 and 3",
    "All three are correct. Disinvestment proceeds reduce the fiscal deficit as non-debt capital receipts. Strategic sales (e.g. Air India in 2022) transfer management control.")
s.q(3, "Which sector contributes the largest share of India's Gross Value Added?",
    ["Agriculture and allied", "Industry", "Services", "Mining"], "Services",
    "Services account for well over half of India's GVA, while agriculture employs the largest share of the workforce — a key structural feature of the Indian economy.")

s.q(4, "Gross State Domestic Product (GSDP) measures",
    ["the value of all final goods and services produced within the State's geographical boundaries", "the income of all residents of the State wherever earned", "the State Government's tax revenue", "the State's exports to other countries"],
    "the value of all final goods and services produced within the State's geographical boundaries",
    "GSDP is a territorial (domestic) measure. Per-capita income is derived from the net state domestic product divided by population.")
s.q(4, "Which of the following are part of a State Government's own tax revenue? 1. State GST (SGST) 2. Stamp duties and registration fees 3. Excise duty on alcoholic liquor 4. Share in central taxes",
    ["1, 2 and 3 only", "1 and 2 only", "2, 3 and 4 only", "1, 2, 3 and 4"], "1, 2 and 3 only",
    "The share in central taxes is devolved by the Union on Finance Commission recommendations — it is not the State's own tax revenue. SGST, stamp duties and State excise are own taxes.")
s.q(4, "Under the Andhra Pradesh Reorganisation Act, 2014, the Union committed to declaring which irrigation project a national project?",
    ["Polavaram", "Handri–Neeva", "Galeru–Nagari", "Veligonda"], "Polavaram",
    "Section 90 of the AP Reorganisation Act, 2014 declares the Polavaram Irrigation Project a national project, with the Union to execute it and obtain clearances.")

s.q(5, "MSMEs in India are currently classified on the basis of",
    ["investment in plant and machinery only", "annual turnover only", "both investment in plant and machinery and annual turnover", "number of employees"],
    "both investment in plant and machinery and annual turnover",
    "Since 2020 the MSME definition uses composite criteria of investment and turnover, with no distinction between manufacturing and services.")
s.q(5, "Rural credit cooperatives in India follow a three-tier short-term structure. Which of the following is the correct order from the State level downward?",
    ["State Cooperative Bank → District Central Cooperative Bank → Primary Agricultural Credit Society", "District Central Cooperative Bank → State Cooperative Bank → Primary Agricultural Credit Society", "NABARD → State Cooperative Bank → Regional Rural Bank", "Primary Agricultural Credit Society → District Central Cooperative Bank → State Cooperative Bank"],
    "State Cooperative Bank → District Central Cooperative Bank → Primary Agricultural Credit Society",
    "StCBs at the apex, DCCBs at the district level and PACS at the village level; NABARD refinances and supervises them.")

s.q(6, "Which one of the following industrial corridors passes through Andhra Pradesh?",
    ["Delhi–Mumbai Industrial Corridor", "Visakhapatnam–Chennai Industrial Corridor", "Amritsar–Kolkata Industrial Corridor", "Bengaluru–Mumbai Economic Corridor"], "Visakhapatnam–Chennai Industrial Corridor",
    "The Visakhapatnam–Chennai Industrial Corridor (part of the East Coast Economic Corridor, supported by the ADB) runs along coastal Andhra Pradesh. The Chennai–Bengaluru corridor also touches AP through its Krishnapatnam node.")

s.write("economy.json")
