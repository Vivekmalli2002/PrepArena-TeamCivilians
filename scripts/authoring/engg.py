import math
from lib import Subject, AR

s = Subject("engg-core", "SOM, Fluid Mechanics & Materials", 90001, [
    "Engineering mechanics, stresses, SFD/BMD & bending",
    "Principal stresses, columns, torsion, springs & shells",
    "Fluid statics, kinematics, dynamics & pipe flow",
    "Hydraulic turbines, pumps & hydro plants",
    "Open channel flow, similitude, hydrology & irrigation",
    "Engineering materials & process thermodynamics",
])
g = 9.81
r = lambda x, n=2: f"{round(x, n):g}"

def num(unit, q, ans, wrongs, expl, unit_txt):
    opts = [f"{r(ans)} {unit_txt}"] + [f"{r(w)} {unit_txt}" for w in wrongs]
    s.q(unit, q, opts, opts[0], expl, shuffle=True)

# ---- Unit 1: stresses, bending
P, L, A, E = 100e3, 2000, 500, 200e3  # N, mm, mm², N/mm²
d = P * L / (A * E)
num(1, "A steel bar 2 m long and 500 mm² in cross-section carries an axial tensile load of 100 kN. If E = 200 GPa, the elongation is",
    d, [d / 10, d * 10, d / 2], "δ = PL/AE = (100×10³ × 2000)/(500 × 2×10⁵) = 2 mm. (Mixing up GPa and MPa gives 0.2 or 20.)", "mm")
E, nu = 200, 0.3
K = E / (3 * (1 - 2 * nu)); G = E / (2 * (1 + nu))
num(1, "For a material with E = 200 GPa and Poisson's ratio 0.3, the bulk modulus K is about",
    K, [G, E / (3 * (1 + nu)), E / (2 * (1 - nu))], f"K = E/3(1 − 2ν) = 200/(3 × 0.4) ≈ {r(K)} GPa. (E/2(1 + ν) ≈ {r(G)} GPa is the shear modulus G.)", "GPa")
w, Ls = 10, 6
M = w * Ls ** 2 / 8
num(1, "A simply supported beam of span 6 m carries a uniformly distributed load of 10 kN/m over the whole span. The maximum bending moment is",
    M, [w * Ls ** 2 / 2, w * Ls ** 2 / 12, w * Ls / 4 * Ls], "M_max = wL²/8 = 10 × 36/8 = 45 kN·m at mid-span. (wL²/2 = 180 is the cantilever value; wL²/12 = 30 is the fixed-end moment.)", "kN·m")
b, dd, Mm = 200, 300, 45e6
Z = b * dd ** 2 / 6; sig = Mm / Z
num(1, "A rectangular beam section 200 mm wide and 300 mm deep is subjected to a bending moment of 45 kN·m. The maximum bending stress is",
    sig, [Mm / (b * dd ** 2 / 12), Mm / (dd * b ** 2 / 6), sig / 2], f"Z = bd²/6 = 200 × 300²/6 = 3×10⁶ mm³; σ = M/Z = 45×10⁶/3×10⁶ = {r(sig)} N/mm².", "N/mm²")
s.q(1, "For a beam of rectangular cross-section, the ratio of maximum shear stress to average shear stress is",
    ["1.5", "1.33", "2.0", "1.0"], "1.5",
    "τ_max = 1.5 τ_avg for a rectangle (at the neutral axis). For a solid circular section it is 4/3 ≈ 1.33.", shuffle=True)
s.q(1, "A point of contraflexure is most likely to occur in",
    ["an overhanging beam", "a cantilever with a point load at the free end", "a simply supported beam with a central point load", "a simply supported beam with a uniformly distributed load"], "an overhanging beam",
    "Contraflexure is where the bending moment changes sign. In an overhanging beam the moment is sagging between the supports and hogging over the overhang, so it passes through zero.", shuffle=True)
s.q(1, "Assertion (A): The stress produced by a suddenly applied load is twice that produced by the same load applied gradually. Reason (R): For a suddenly applied load, the work done by the load (P × δ) equals the strain energy stored (½ × σ × A × δ).",
    AR, AR[0],
    "Both are true and R explains A: Pδ = ½σAδ gives σ = 2P/A, twice the gradual-loading value P/A.")

# ---- Unit 2: principal stresses, columns, torsion, shells
sx, sy, t = 80, 20, 40
c, rad = (sx + sy) / 2, math.hypot((sx - sy) / 2, t)
s.q(2, f"At a point, σx = {sx} MPa, σy = {sy} MPa and τxy = {t} MPa. The principal stresses are",
    [f"{r(c + rad)} MPa and {r(c - rad)} MPa", "120 MPa and −20 MPa", "90 MPa and 10 MPa", "80 MPa and 20 MPa"], f"{r(c + rad)} MPa and {r(c - rad)} MPa",
    f"σ₁,₂ = (σx + σy)/2 ± √[((σx − σy)/2)² + τ²] = 50 ± √(30² + 40²) = 50 ± 50, giving 100 and 0 MPa. Maximum shear stress = 50 MPa.", shuffle=True)
s.q(2, "Compared with the same column hinged at both ends, the Euler crippling load of a column fixed at both ends is",
    ["4 times", "2 times", "½ times", "¼ times"], "4 times",
    "Effective length: both ends hinged — L; both fixed — L/2. Since P = π²EI/Le², halving Le multiplies P by 4. A column fixed at one end and free at the other (Le = 2L) carries ¼ of the hinged load.", shuffle=True)
E_, I_, L_ = 200e3, 8e6, 3000
Pcr = math.pi ** 2 * E_ * I_ / L_ ** 2 / 1e3
num(2, "The Euler crippling load of a 3 m long column, hinged at both ends, with E = 200 GPa and least I = 8 × 10⁶ mm⁴, is about",
    Pcr, [Pcr * 4, Pcr / 4, Pcr * 2], f"P = π²EI/L² = π² × 2×10⁵ × 8×10⁶ / 3000² ≈ {r(Pcr, 0)} kN.", "kN")
T, D = 1e6, 50
tau = 16 * T / (math.pi * D ** 3)
num(2, "A solid circular shaft of 50 mm diameter transmits a torque of 1 kN·m. The maximum shear stress is about",
    tau, [tau / 2, tau * 2, 32 * T / (math.pi * D ** 3) * 2], f"τ = 16T/πd³ = 16 × 10⁶/(π × 50³) ≈ {r(tau, 1)} N/mm².", "N/mm²")
N, Tq = 300, 1.5
Pw = 2 * math.pi * N * Tq / 60
num(2, "A shaft running at 300 rpm transmits a torque of 1.5 kN·m. The power transmitted is about",
    Pw, [N * Tq / 60, Pw * 2, 2 * math.pi * N * Tq], f"P = 2πNT/60 = 2π × 300 × 1.5/60 ≈ {r(Pw, 1)} kW.", "kW")
p_, d_, t_ = 2, 1000, 10
num(2, "A thin cylindrical shell of 1 m diameter and 10 mm wall thickness is subjected to an internal pressure of 2 MPa. The circumferential (hoop) stress is",
    p_ * d_ / (2 * t_), [p_ * d_ / (4 * t_), p_ * d_ / t_, p_ * d_ / (8 * t_)], "σ_c = pd/2t = 2 × 1000/(2 × 10) = 100 MPa. The longitudinal stress pd/4t = 50 MPa is half of it.", "MPa")

# ---- Unit 3: fluids
h = 10
num(3, "The gauge pressure at a depth of 10 m in fresh water (ρ = 1000 kg/m³, g = 9.81 m/s²) is",
    1000 * g * h / 1000, [1000 * h / 1000, 1000 * g * h / 1e4, 101.3 + 98.1], "p = ρgh = 1000 × 9.81 × 10 = 98,100 Pa = 98.1 kPa (gauge). Adding atmospheric pressure (≈101.3 kPa) would give absolute pressure.", "kPa")
num(3, "The pressure of 760 mm of mercury (relative density 13.6) expressed as a head of water is about",
    13.6 * 0.76, [0.76, 13.6, 7.6], "h_w = 13.6 × 0.76 ≈ 10.34 m of water.", "m")
s.q(3, "For a vertical rectangular plane surface whose top edge lies at the free water surface, the centre of pressure is located at a depth of (H = height of the plane)",
    ["2H/3", "H/2", "H/3", "3H/4"], "2H/3",
    "h_cp = h̄ + I_G/(A h̄) = H/2 + (bH³/12)/(bH × H/2) = H/2 + H/6 = 2H/3. The centre of pressure is always below the centroid.", shuffle=True)
v1, d1, d2 = 2, 200, 100
num(3, "Water flows through a pipe that reduces from 200 mm to 100 mm diameter. If the velocity in the larger pipe is 2 m/s, the velocity in the smaller pipe is",
    v1 * (d1 / d2) ** 2, [v1 * d1 / d2, v1 * (d1 / d2) ** 3, v1 / 2], "By continuity, A₁V₁ = A₂V₂ and A ∝ d², so V₂ = 2 × (200/100)² = 8 m/s.", "m/s")
V, Dp, nu_ = 0.5, 0.05, 1e-6
Re = V * Dp / nu_
s.q(3, f"Water (kinematic viscosity 1 × 10⁻⁶ m²/s) flows at 0.5 m/s in a 50 mm pipe. The flow is",
    [f"turbulent (Re = {Re:,.0f})", f"laminar (Re = {Re / 10:,.0f})", "laminar (Re = 1,250)", f"in transition (Re = {Re / 10:,.0f})"], f"turbulent (Re = {Re:,.0f})",
    "Re = VD/ν = 0.5 × 0.05/10⁻⁶ = 25,000 — far above about 4,000, so the flow is turbulent. Pipe flow is laminar below about 2,000.", shuffle=True)
f, Lp, Dd, Vv = 0.02, 100, 0.1, 2
hf = f * Lp * Vv ** 2 / (2 * g * Dd)
num(3, "Using Darcy–Weisbach with f = 0.02, the head loss in a 100 m long pipe of 100 mm diameter carrying water at 2 m/s is about",
    hf, [hf / 4, hf * 4, f * Lp * Vv / (2 * g * Dd)], f"h_f = fLV²/2gD = 0.02 × 100 × 4/(2 × 9.81 × 0.1) ≈ {r(hf)} m. (Here f is the Darcy friction factor; with Fanning's f the formula is 4fLV²/2gD.)", "m")
s.q(3, "Match the device with what it measures: A. Venturimeter B. Pitot tube C. Piezometer D. Rotameter — 1. Velocity at a point 2. Discharge in a pipe (by pressure difference) 3. Static pressure (low, gauge) 4. Discharge (variable-area)",
    ["A-2, B-1, C-3, D-4", "A-1, B-2, C-3, D-4", "A-2, B-1, C-4, D-3", "A-4, B-1, C-3, D-2"], "A-2, B-1, C-3, D-4",
    "Venturimeter — discharge from the pressure difference across a throat; Pitot tube — point velocity from stagnation pressure; piezometer — small gauge pressures; rotameter — variable-area flow meter.")
s.q(3, "For fully developed laminar flow in a circular pipe, the ratio of maximum velocity to mean velocity is",
    ["2.0", "1.5", "1.2", "1.0"], "2.0",
    "The Hagen–Poiseuille profile is parabolic with u_max = 2 × u_mean. For turbulent flow the profile is flatter, with u_max ≈ 1.2 × u_mean.", shuffle=True)
s.q(3, "A floating body is in stable equilibrium when its metacentre is",
    ["above its centre of gravity", "below its centre of gravity", "coincident with its centre of gravity", "coincident with its centre of buoyancy"], "above its centre of gravity",
    "Positive metacentric height (GM > 0) means a restoring couple when the body tilts. M coinciding with G is neutral; M below G is unstable.", shuffle=True)

# ---- Unit 4: turbines & pumps
s.q(4, "Match the turbine with its typical application: A. Pelton wheel B. Francis turbine C. Kaplan turbine — 1. Medium head, medium discharge (mixed flow) 2. High head, low discharge (impulse) 3. Low head, high discharge (axial flow)",
    ["A-2, B-1, C-3", "A-1, B-2, C-3", "A-3, B-1, C-2", "A-2, B-3, C-1"], "A-2, B-1, C-3",
    "Pelton — impulse turbine for high heads; Francis — mixed-flow reaction turbine for medium heads; Kaplan — axial-flow reaction turbine with adjustable blades for low heads and large flows.")
s.q(4, "The specific speed of a hydraulic turbine is given by",
    ["N√P / H^(5/4)", "N√Q / H^(3/4)", "N√P / H^(3/4)", "N√Q / H^(5/4)"], "N√P / H^(5/4)",
    "Turbine: Ns = N√P/H^(5/4) (based on power). Centrifugal pump: Ns = N√Q/H^(3/4) (based on discharge). Mixing up the two is the common trap.", shuffle=True)
s.q(4, "Cavitation in a hydraulic machine occurs when",
    ["the local pressure falls below the vapour pressure of the liquid", "the local pressure exceeds atmospheric pressure", "the velocity of flow becomes zero", "the liquid temperature falls below its freezing point"], "the local pressure falls below the vapour pressure of the liquid",
    "Vapour bubbles form where pressure drops below vapour pressure and collapse violently in higher-pressure zones, pitting the blades. Draft-tube design and adequate NPSH prevent it.", shuffle=True)
s.q(4, "The main function of a draft tube in a reaction turbine is to",
    ["recover kinetic energy at exit and allow the turbine to be set above the tail-race", "increase the pressure at the inlet of the runner", "regulate the flow into the runner", "prevent water hammer in the penstock"], "recover kinetic energy at exit and allow the turbine to be set above the tail-race",
    "The diverging draft tube converts exit kinetic energy into pressure energy (raising the effective head) and lets the runner be placed above the tail-water level without losing head.", shuffle=True)

s.write("engg.json")
