"""Mental ability & aptitude: every answer is computed in code (never typed by hand)."""
import random
from fractions import Fraction
SUBJECT = "mental"
R = random.Random(20261031)
PC, RA, AV, TS, WK, SR, CD, DI, SI = "Percentages & profit-loss","Ratio & proportion","Averages","Time, speed & distance","Time & work","Number series","Coding-decoding & clocks","Data interpretation","Simple & compound interest"
ITEMS = []
def fmt(x):
    x = Fraction(x)
    return str(int(x)) if x.denominator == 1 else f"{float(x):.2f}".rstrip("0").rstrip(".")
def add(topic, stem, correct, wrongs, expl):
    ws = []
    for w in wrongs:
        if w != correct and w not in ws: ws.append(w)
    assert len(ws) >= 3, (stem, correct, wrongs)
    ITEMS.append((topic, stem, correct, ws[:3], expl))
def near(v, steps):
    v = Fraction(v)
    out = []
    for s in steps:
        k = Fraction(round(s)) if v.denominator == 1 else Fraction(s)
        if k == 0: k = Fraction(1)
        out.append(fmt(v + k))
    return out
# percentages
for _ in range(4):
    p = R.choice([5, 12, 15, 20, 25, 35, 45, 60, 75]); n = R.choice([80, 120, 160, 240, 360, 480, 600])
    ans = Fraction(p * n, 100)
    add(PC, f"What is {p}% of {n}?", fmt(ans), near(ans, [Fraction(n, 100) * 2, -Fraction(n, 100) * 3, Fraction(n, 10)]), f"{p}% of {n} = {p}/100 × {n} = {fmt(ans)}.")
for _ in range(3):
    cp = R.choice([200, 250, 400, 500, 800]); pr = R.choice([10, 15, 20, 25])
    sp = Fraction(cp * (100 + pr), 100)
    add(PC, f"An article bought for ₹{cp} is sold at a profit of {pr}%. What is the selling price (in ₹)?", fmt(sp), near(sp, [-cp * Fraction(pr, 100) * 2, cp * Fraction(pr, 100), -cp * Fraction(pr, 100) * 3]), f"SP = {cp} × (100 + {pr})/100 = ₹{fmt(sp)}.")
for _ in range(2):
    mp = R.choice([500, 800, 1000, 1200]); d = R.choice([10, 20, 25])
    sp = Fraction(mp * (100 - d), 100)
    add(PC, f"A shirt marked at ₹{mp} is sold at a discount of {d}%. What is the sale price (in ₹)?", fmt(sp), near(sp, [mp * Fraction(d, 100) * 2, -mp * Fraction(d, 100), mp * Fraction(d, 100)]), f"Sale price = {mp} × (100 − {d})/100 = ₹{fmt(sp)}.")
# ratio
for _ in range(3):
    a, b = R.choice([(2, 3), (3, 5), (4, 7), (5, 8)]); t = R.choice([4, 6, 8, 10]) * (a + b)
    sa = Fraction(t * a, a + b)
    add(RA, f"₹{t} is divided between A and B in the ratio {a}:{b}. What is A's share (in ₹)?", fmt(sa), near(sa, [t // (a + b), -t // (a + b), t // (a + b) * 2]), f"A's share = {t} × {a}/({a}+{b}) = ₹{fmt(sa)}.")
for _ in range(2):
    x, y = R.choice([(3, 4), (5, 7), (2, 9)]); k = R.choice([4, 6, 8])
    add(RA, f"Two numbers are in the ratio {x}:{y} and their sum is {k*(x+y)}. What is the larger number?", str(k * y), [str(k * y + k), str(k * y - k), str(k * y + 2 * k)], f"Parts = {x}+{y}; one part = {k}; larger number = {y}×{k} = {k*y}.")
# averages
for _ in range(3):
    n = R.choice([5, 6, 8]); avg = R.choice([12, 15, 18, 24, 30])
    m = avg + R.choice([1, 2, 3])
    x = m * (n + 1) - n * avg
    new = Fraction(n * avg + x, n + 1)
    add(AV, f"The average of {n} numbers is {avg}. If a new number {x} is added, what is the new average?", fmt(new), near(new, [1, -1, 2]), f"New average = ({n}×{avg} + {x})/{n+1} = {fmt(new)}.")
# speed
for _ in range(3):
    s = R.choice([36, 45, 54, 60, 72]); t = R.choice([2, 3, 4, 5])
    d = s * t
    add(TS, f"A train travels at {s} km/h for {t} hours. What distance does it cover (in km)?", str(d), [str(d + s), str(d - s), str(d + 2 * s)], f"Distance = speed × time = {s} × {t} = {d} km.")
for _ in range(2):
    s = R.choice([36, 54, 72]); ms = Fraction(s * 5, 18)
    add(TS, f"Convert {s} km/h into m/s.", fmt(ms), near(ms, [2, -3, 5]), f"1 km/h = 5/18 m/s, so {s} km/h = {s}×5/18 = {fmt(ms)} m/s.")
# work
for a, b in [(10, 15), (12, 24), (20, 30), (6, 12)]:
    t = Fraction(a * b, a + b)
    add(WK, f"A can finish a job in {a} days and B in {b} days. Working together, in how many days will they finish it?", fmt(t), near(t, [1, -1, 2]), f"Combined rate = 1/{a} + 1/{b}; time = {a}×{b}/({a}+{b}) = {fmt(t)} days.")
# series
for _ in range(3):
    a = R.choice([3, 5, 7, 11]); d = R.choice([4, 6, 9]); seq = [a + d * i for i in range(5)]
    nxt = a + d * 5
    add(SR, f"Find the next number: {', '.join(map(str, seq))}, ?", str(nxt), [str(nxt + d), str(nxt - d), str(nxt + 1)], f"Common difference = {d}; next = {seq[-1]} + {d} = {nxt}.")
for _ in range(2):
    a = R.choice([2, 3, 5]); r = R.choice([2, 3]); seq = [a * r ** i for i in range(4)]
    nxt = a * r ** 4
    add(SR, f"Find the next number: {', '.join(map(str, seq))}, ?", str(nxt), [str(nxt + a), str(nxt // 2 + 1), str(nxt - r)], f"Each term is multiplied by {r}; next = {seq[-1]} × {r} = {nxt}.")
# coding / clocks
for w in ["CAT", "BOX", "SUN"]:
    enc = "".join(chr((ord(c) - 65 + 1) % 26 + 65) for c in w)
    other = "MAP"; ans = "".join(chr((ord(c) - 65 + 1) % 26 + 65) for c in other)
    add(CD, f"If {w} is coded as {enc} (each letter shifted one place forward), how is {other} coded?", ans, ["NBQ".replace("N", "O"), "LZO", "MAQ"], f"Each letter moves one step forward: M→N, A→B, P→Q, so {other} → {ans}.")
for h, m in [(3, 0), (6, 0), (9, 0), (4, 0)]:
    ang = abs(30 * h - 5.5 * m); ang = ang if ang <= 180 else 360 - ang
    add(CD, f"What is the angle between the hour and minute hands of a clock at {h}:{m:02d}?", f"{int(ang)}°", [f"{int(ang)+30}°", f"{abs(int(ang)-30)}°", f"{int(ang)+60}°"], f"Angle = |30h − 5.5m| = |30×{h} − 5.5×{m}| = {int(ang)}°.")
# interest
for _ in range(3):
    P = R.choice([2000, 5000, 8000]); r = R.choice([5, 8, 10]); t = R.choice([2, 3, 4])
    si = Fraction(P * r * t, 100)
    add(SI, f"What is the simple interest on ₹{P} at {r}% per annum for {t} years (in ₹)?", fmt(si), near(si, [P // 100 * 5, -P // 100 * 5, P // 10]), f"SI = P×R×T/100 = {P}×{r}×{t}/100 = ₹{fmt(si)}.")
P = 10000; ci = Fraction(P * 121, 100) - P
add(SI, "What is the compound interest on ₹10,000 at 10% per annum for 2 years, compounded annually (in ₹)?", fmt(ci), [fmt(ci - 100), fmt(ci + 100), fmt(ci + 200)], "Amount = 10000 × (1.1)² = ₹12,100, so CI = ₹2,100.")
