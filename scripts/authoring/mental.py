from datetime import date
from fractions import Fraction as F
from lib import Subject

s = Subject("mental", "Mental Ability & Aptitude", 80001, [
    "Logical reasoning & mental ability",
    "Quantitative aptitude, basic maths & data interpretation",
])
fmt = lambda x: (str(int(x)) if float(x).is_integer() else f"{float(x):g}")

def num(unit, question, ans, distractors, expl, suffix=""):
    opts = [fmt(ans) + suffix] + [fmt(d) + suffix for d in distractors]
    s.q(unit, question, opts, fmt(ans) + suffix, expl, shuffle=True)

# ---- Series & patterns (computed)
seq = [3]
for _ in range(5): seq.append(seq[-1] * 2 + 1)
num(1, f"Find the next term: {', '.join(map(str, seq[:5]))}, ?", seq[5], [seq[5] - 2, seq[5] + 4, seq[4] * 2], "Each term is (previous × 2) + 1: 63 × 2 + 1 = 127.")
seq = [n * (n + 1) for n in range(1, 7)]
num(1, f"Find the next term: {', '.join(map(str, seq[:5]))}, ?", seq[5], [40, 44, 36], "Terms are n(n+1): 1×2, 2×3, 3×4, 4×5, 5×6, so the next is 6×7 = 42.")
primes = [2, 3, 5, 7, 11, 13]
seq = [p * p for p in primes]
num(1, f"Find the next term: {', '.join(map(str, seq[1:5]))}, ?", seq[5], [144, 196, 156], "Squares of consecutive primes: 3², 5², 7², 11², so next is 13² = 169. (12² = 144 is the trap.)")
pos = [1]
for k in range(2, 7): pos.append(pos[-1] + k)
series = [chr(64 + p) for p in pos]
s.q(1, f"Find the next letter: {', '.join(series[:5])}, ?", [series[5], "T", "V", "S"], series[5],
    f"Positions {', '.join(map(str, pos[:5]))} increase by 2, 3, 4, 5; the next step is +6, giving {pos[5]} = {series[5]}.", shuffle=True)
s.q(1, "Find the odd one out: 121, 169, 196, 250, 225",
    ["250", "196", "169", "225"], "250", "All others are perfect squares (11², 13², 14², 15²); 250 is not.", shuffle=True)

# ---- Coding–decoding (computed)
def shift(word, steps):
    return "".join(chr((ord(c) - 65 + k) % 26 + 65) for c, k in zip(word, steps))
cold = shift("COLD", [1, 2, 3, 4])
warm = shift("WARM", [1, 2, 3, 4])
s.q(1, f"In a certain code, COLD is written as {cold}. How is WARM written in that code?",
    [warm, shift("WARM", [1, 1, 1, 1]), shift("WARM", [1, 2, 3, 3]), shift("WARM", [2, 2, 3, 4])], warm,
    f"Letters are shifted forward by +1, +2, +3, +4: W→X, A→C, R→U, M→Q, giving {warm}.", shuffle=True)
apple = shift("APPLE", [1] * 5)
s.q(1, "If MANGO is coded as NBOHP, how is APPLE coded?",
    [apple, "BQQME", "ZOOKD", "BQPMF"], apple, "Each letter moves one step forward: A→B, P→Q, P→Q, L→M, E→F.", shuffle=True)

# ---- Relations
s.q(1, "Pointing to a man, Lakshmi said, “He is the son of my grandfather's only son.” How is the man related to Lakshmi?",
    ["Brother", "Cousin", "Uncle", "Father"], "Brother",
    "Her grandfather's only son is her father; his son is her brother.", shuffle=True)
s.q(1, "A is the sister of B. C is the mother of B. D is the father of C. How is A related to D?",
    ["Granddaughter", "Daughter", "Niece", "Grandmother"], "Granddaughter",
    "A is a daughter of C (as B's sister), and C is D's daughter, so A is D's granddaughter.", shuffle=True)

# ---- Logical reasoning
s.q(1, "Statements: All engineers are graduates. Some graduates are teachers. Conclusions: I. Some engineers are teachers. II. Some teachers are graduates. Which conclusion(s) follow?",
    ["Only II follows", "Only I follows", "Both I and II follow", "Neither I nor II follows"], "Only II follows",
    "II is the converse of ‘some graduates are teachers’, so it follows. I need not follow: the graduates who are teachers may not include any engineers.")
s.q(1, "Statements: All cats are dogs. No dog is a rat. Conclusions: I. No cat is a rat. II. Some rats are cats. Which conclusion(s) follow?",
    ["Only I follows", "Only II follows", "Both I and II follow", "Neither I nor II follows"], "Only I follows",
    "Every cat is inside ‘dogs’, and dogs and rats do not overlap, so no cat is a rat. II therefore cannot follow.")
s.q(1, "Statement: “Use public transport to reduce traffic congestion” — an appeal by the city traffic police. Assumptions: I. Many people will respond to the appeal. II. Public transport occupies less road space per passenger than private vehicles. Which assumption(s) are implicit?",
    ["Both I and II are implicit", "Only I is implicit", "Only II is implicit", "Neither is implicit"], "Both I and II are implicit",
    "An appeal is made expecting a response (I), and recommending public transport for congestion assumes it uses less road space per passenger (II).")

# ---- Calendar & clock (computed)
d1, d2 = date(2026, 1, 1), date(2027, 1, 1)
s.q(1, f"If 1 January 2026 was a {d1.strftime('%A')}, what day of the week is 1 January 2027?",
    [d2.strftime("%A"), "Saturday", "Thursday", "Wednesday"], d2.strftime("%A"),
    "2026 is not a leap year, so it has 365 days = 52 weeks + 1 odd day. The day advances by one: Thursday → Friday.", shuffle=True)
h, m = 3, 40
angle = abs(30 * h - F(11, 2) * m); angle = min(angle, 360 - angle)
num(1, "What is the angle between the hour and minute hands of a clock at 3:40?", angle, [120, 140, 125], f"Angle = |30H − 5.5M| = |90 − 220| = {fmt(angle)}°.", suffix="°")

# ---- Arithmetic (computed)
p = F(25)
dec = p / (100 + p) * 100
num(2, "The price of sugar rises by 25%. By what percentage must a family reduce its consumption so that its expenditure on sugar does not change?", dec, [25, 15, F(45, 2)], "Reduction = 25/(100 + 25) × 100 = 20%.", suffix="%")
eq = 100 - (100 * F(80, 100) * F(90, 100))
num(2, "Two successive discounts of 20% and 10% are equivalent to a single discount of", eq, [30, 29, 27], "100 × 0.8 × 0.9 = 72, so the single discount is 28% (not 30%).", suffix="%")
P, r, t = 8000, 6, 3
num(2, f"What is the simple interest on ₹{P:,} at {r}% per annum for {t} years?", F(P * r * t, 100), [1500, 1488, 1240], f"SI = PRT/100 = {P}×{r}×{t}/100 = ₹1440.", suffix="")
P, r = 10000, 10
ci = P * (1 + F(r, 100)) ** 2 - P
num(2, f"What is the compound interest on ₹{P:,} at {r}% per annum, compounded annually, for 2 years?", ci, [2000, 2200, 2050], "Amount = 10000 × 1.1² = 12100, so CI = ₹2100.")
P, r = 5000, 8
diff = P * F(r, 100) ** 2
num(2, f"The difference between compound interest and simple interest on ₹{P:,} for 2 years at {r}% per annum is", diff, [40, 16, 64], f"For 2 years, CI − SI = P(r/100)² = 5000 × 0.0064 = ₹32.")
days = 1 / (F(1, 12) + F(1, 18))
num(2, "A can finish a work in 12 days and B in 18 days. Working together, in how many days will they finish it?", days, [15, 6, 7.5], "Combined rate = 1/12 + 1/18 = 5/36 per day, so time = 36/5 = 7.2 days.", suffix=" days")
b = 1 / (F(1, 10) - F(1, 15))
num(2, "A and B together can do a job in 10 days; A alone can do it in 15 days. In how many days can B alone do it?", b, [25, 20, 5], "B's rate = 1/10 − 1/15 = 1/30, so B takes 30 days.", suffix=" days")
fill = 1 / (F(1, 20) - F(1, 30))
num(2, "A pipe can fill a tank in 20 minutes and another can empty it in 30 minutes. If both are opened together on an empty tank, it will be full in", fill, [50, 12, 10], "Net rate = 1/20 − 1/30 = 1/60 per minute, so 60 minutes.", suffix=" minutes")
length, kmph = 360, 72
num(2, f"A train {length} m long, running at {kmph} km/h, crosses a pole in", F(length) / (F(kmph) * 5 / 18), [5, 20, 36], "72 km/h = 20 m/s; time = 360/20 = 18 s.", suffix=" seconds")
tl, pl, sec = 240, 360, 30
num(2, f"A {tl} m long train crosses a {pl} m long platform in {sec} seconds. Its speed is", F(tl + pl, sec) * 18 / 5, [28.8, 60, 20], "Distance = 240 + 360 = 600 m in 30 s = 20 m/s = 72 km/h. (Forgetting the platform gives 28.8; forgetting to convert gives 20.)", suffix=" km/h")
avg = F(2 * 60 * 40, 60 + 40)
num(2, "A car goes from A to B at 60 km/h and returns at 40 km/h. Its average speed for the whole journey is", avg, [50, 45, 52], "For equal distances, average speed = 2xy/(x + y) = 2×60×40/100 = 48 km/h — not the arithmetic mean 50.", suffix=" km/h")
removed = 5 * 24 - 4 * 22
num(2, "The average of five numbers is 24. If one number is removed, the average of the rest becomes 22. The number removed is", removed, [2, 26, 30], "Total = 5 × 24 = 120; remaining total = 4 × 22 = 88; removed = 32.")
s.q(2, "If A : B = 2 : 3 and B : C = 4 : 5, then A : B : C is",
    ["8 : 12 : 15", "2 : 3 : 5", "8 : 12 : 10", "6 : 12 : 15"], "8 : 12 : 15",
    "Make B common: A:B = 8:12 and B:C = 12:15, so A:B:C = 8:12:15.", shuffle=True)

# ---- Data analysis (Paper-I item 10)
data = [2, 4, 4, 4, 5, 5, 7, 9]
mean = F(sum(data), len(data)); var = sum((x - mean) ** 2 for x in data) / len(data)
s.q(2, f"For the data {', '.join(map(str, data))}, which of the following is correct (population variance)?",
    [f"Mean = {fmt(mean)}, mode = 4, variance = {fmt(var)}", "Mean = 5, mode = 5, variance = 4", "Mean = 5, mode = 4, variance = 2", "Mean = 4.5, mode = 4, variance = 4"],
    f"Mean = {fmt(mean)}, mode = 4, variance = {fmt(var)}",
    f"Mean = 40/8 = 5; mode = 4 (occurs three times); variance = Σ(x − 5)²/8 = 32/8 = 4, so the standard deviation is 2.", shuffle=True)
prod = {2021: 400, 2022: 460, 2023: 437, 2024: 520}
inc = F(prod[2024] - prod[2023], prod[2023]) * 100
best = max([(F(prod[y] - prod[y - 1], prod[y - 1]), y) for y in (2022, 2023, 2024)])[1]
s.q(2, "A district's paddy production (thousand tonnes) was: 2021 — 400, 2022 — 460, 2023 — 437, 2024 — 520. In which year was the percentage increase over the previous year the highest?",
    ["2024", "2022", "2023", "2021"], str(best),
    "2022: +60/400 = 15%; 2023: −23/460 = −5%; 2024: +83/437 ≈ 19%. The highest growth is in 2024 — a larger absolute rise on a smaller base.", shuffle=True)
med = sorted([4, 8, 6, 5, 3, 8, 9])
s.q(2, "The median and mode of 4, 8, 6, 5, 3, 8, 9 are respectively",
    ["6 and 8", "5 and 8", "6 and 9", "8 and 6"], f"{med[3]} and 8",
    "Sorted: 3, 4, 5, 6, 8, 8, 9 — the middle (4th) value is 6; 8 occurs most often.", shuffle=True)

s.write("mental.json")
