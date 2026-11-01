/**
 * Exam ↔ Paper → Subject → Unit map, transcribed from the APPSC 2026 notifications
 * (docs/notifications/) and the YUDDAM 2027 overlap masters (docs/syllabus/). Papers are authored once and shared by many exams: the common GS Paper-I
 * (AEE, ASWO/ATWO, Endowment EO) and the AEE common Paper-II (R&B, Irrigation, PR & TW).
 *
 * Question topics come from the data; `ENV_TOPIC_UNITS` maps them onto the syllabus units.
 * Phase 2 moves this into the admin panel.
 */

export type ExamId = "group1" | "group2" | "aee-pcb" | "aee-prtw" | "aee-rbi" | "aswo" | "eo" | "draughtsman";

export interface Exam {
  id: ExamId;
  name: string;
  short: string;
  blurb: string;
  /** Launch-priority exams get content first and are listed first. */
  priority: boolean;
  papers: string[];
  /** Default marking scheme for this exam's mocks. */
  schemeId: string;
}

export interface Paper {
  id: string;
  name: string;
  /** Total marks, where the notification mapping states it. */
  marks?: number;
  subjects: string[];
  /** Unit / section headings exactly as the notification lists them. */
  syllabus?: string[];
}

export interface Unit {
  title: string;
  /** Exams whose papers include this unit — the "read once" overlap. */
  exams: ExamId[];
}

export interface Subject {
  id: string;
  name: string;
  /** Whether practice questions exist yet. */
  hasContent: boolean;
  units: Unit[];
}

const ALL_GS: ExamId[] = ["aee-pcb", "aee-prtw", "aee-rbi", "aswo", "eo"];

export const SUBJECTS: Record<string, Subject> = {
  env: {
    id: "env",
    name: "Environmental Science & Ecology",
    hasContent: true,
    units: [
      { title: "Ecosystem structure & functions", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Biodiversity & biotic resources", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Natural resources & energy management", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Environmental pollution & control technologies", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Solid, industrial & e-waste management", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Climate change & global environmental issues", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Environmental policies, conventions & laws", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "EIA, sustainability & social issues", exams: ["group2", "aee-prtw", "aee-pcb", "aee-rbi"] },
      { title: "Human population, health & environment", exams: ["group2", "aee-prtw", "aee-pcb", "group1"] },
      { title: "Disaster management", exams: ["aee-prtw", ...ALL_GS, "draughtsman"] },
    ],
  },
  scitech: {
    id: "scitech",
    name: "Science & Technology",
    hasContent: false,
    units: [
      { title: "S&T policies, missions, institutes & IPR", exams: ["group2", "group1"] },
      { title: "Space technology (ISRO) & defence (DRDO)", exams: ["group2", "group1"] },
      { title: "ICT, Digital India, e-governance & cyber security", exams: ["group2", "group1"] },
      { title: "Nuclear technology & energy management", exams: ["group2", "group1"] },
      { title: "Biotechnology, nanotech & agri-revolutions", exams: ["group2", "group1"] },
      { title: "Human health, diseases, vaccines & everyday science", exams: ["group2", "group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  polity: {
    id: "polity",
    name: "Indian Constitution, Polity & Welfare",
    hasContent: false,
    units: [
      { title: "Constitutional development, Preamble & rights", exams: ["group2", "aswo", "group1"] },
      { title: "Legislature, executive & judiciary", exams: ["group2", "aswo", "group1"] },
      { title: "Union–State powers & constitutional bodies", exams: ["group2", "aswo", "group1"] },
      { title: "Centre–State reforms, parties & elections", exams: ["group2", "aswo", "group1"] },
      { title: "Amendments & local government (PRI/ULB)", exams: ["group2", "aswo", "group1"] },
      { title: "Welfare of weaker sections & social laws", exams: ["aswo", "group2"] },
      { title: "Polity, public administration, ethics & law (GS line)", exams: [...ALL_GS, "draughtsman", "group1"] },
    ],
  },
  history: {
    id: "history",
    name: "AP & Indian History",
    hasContent: false,
    units: [
      { title: "AP: prehistoric & early dynasties", exams: ["group2", "aswo", "group1"] },
      { title: "AP: medieval Andhradesa (11th–16th c.)", exams: ["group2", "aswo", "group1"] },
      { title: "AP: Europeans, 1857 & freedom struggle", exams: ["group2", "aswo", "group1"] },
      { title: "AP: Andhra movement & the 1953 state", exams: ["group2", "aswo", "group1"] },
      { title: "AP: formation (1956) to bifurcation (2014)", exams: ["group2", "aswo", "group1"] },
      { title: "Indian history: ancient India", exams: ["group2", "group1"] },
      { title: "Indian history: medieval India", exams: ["group2", "group1"] },
      { title: "Indian history: modern India", exams: ["group2", "group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  economy: {
    id: "economy",
    name: "Indian & AP Economy",
    hasContent: false,
    units: [
      { title: "National income, growth, planning & inclusive development", exams: ["group2", "group1"] },
      { title: "Money, banking, public finance, GST & trade", exams: ["group2", "group1"] },
      { title: "Indian agriculture, industry & services", exams: ["group2", "group1"] },
      { title: "AP economy, GSDP, public finance & bifurcation", exams: ["group2", "group1"] },
      { title: "AP agriculture, allied sectors, industry & services", exams: ["group2", "group1"] },
      { title: "Infrastructure (India & AP)", exams: ["group1", ...ALL_GS, "draughtsman"] },
    ],
  },
  geography: {
    id: "geography",
    name: "Geography",
    hasContent: false,
    units: [
      { title: "General & physical geography (world, India, AP)", exams: ["group2", "group1", ...ALL_GS] },
      { title: "Economic & human geography (India & AP)", exams: ["group2", "group1", ...ALL_GS] },
    ],
  },
  society: {
    id: "society",
    name: "Indian Society",
    hasContent: false,
    units: [
      { title: "Structure: family, marriage, kinship, caste, tribe, ethnicity, religion, women", exams: ["group2"] },
      { title: "Social issues: casteism, communalism, regionalism, crimes against women, child labour, youth unrest", exams: ["group2"] },
      { title: "Welfare mechanisms: policies, programmes, constitutional & statutory safeguards", exams: ["group2", "aswo"] },
    ],
  },
  "civil-em": {
    id: "civil-em",
    name: "Engineering Mechanics",
    hasContent: true,
    units: [
      { title: "Engineering Mechanics", exams: ["aee-prtw", "aee-rbi"] },
    ],
  },
  "civil-som": {
    id: "civil-som",
    name: "Strength of Materials",
    hasContent: true,
    units: [
      { title: "Simple Stresses and Strains (Elastic Constants and their relationship; Linear and volumetric changes of bodies; Thermal Stresses)", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Complex Stresses and Strains", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Shear Force and Bending Moment", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Centre of Gravity and Moment of Inertia", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Theory of Simple Bending", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Shear Stress Distribution in Beams", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Torsion", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Springs", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Slopes and Deflection", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Thin Cylinders", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Columns and Struts", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Strain Energy and Resilience", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Propped Beams and Fixed Beams", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Shear Centre and Unsymmetric Bending", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Theories of Failures", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Miscellaneous (Strength of Materials)", exams: ["aee-prtw", "aee-rbi"] },
    ],
  },
  "civil-fm": {
    id: "civil-fm",
    name: "Fluid Mechanics",
    hasContent: true,
    units: [
      { title: "Properties of Fluids", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Pressure Measurement and Fluid Statics", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Buoyancy and Metacentric Height", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Fluid Kinematics", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Energy Equation and Its Applications", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Momentum Equation and Its Applications", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Flow Through Pipes", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Laminar Flow", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Elementary Turbulent Flow", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Flow Through Orifices and Mouthpieces", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Flow Over Notches and Weirs", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Compressible Flow", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Dimensional Analysis", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Open Channel Flow", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Boundary Layer Theory, Drag and Lift", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Miscellaneous (Fluid Mechanics)", exams: ["aee-prtw", "aee-rbi"] },
    ],
  },
  "civil-hm": {
    id: "civil-hm",
    name: "Hydraulic Machines",
    hasContent: true,
    units: [
      { title: "Introduction to Hydraulic Machines", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Hydro-Electric Power Plant", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Water Turbines (Impulse Turbines)", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Reaction Turbines (Francis and Kaplan Turbines)", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Governing of Turbines", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Specific Speed and Performance of Turbines", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Cavitation in Turbines", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Centrifugal Pumps", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Reciprocating Pumps", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Miscellaneous Pumps", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Hydraulic Directional Control Valves", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Hydraulic Pressure Control Valves", exams: ["aee-prtw", "aee-rbi"] },
    ],
  },
  "civil-bm": {
    id: "civil-bm",
    name: "Building Materials",
    hasContent: true,
    units: [
      { title: "Cement", exams: ["aee-rbi"] },
      { title: "Aggregates", exams: ["aee-rbi"] },
      { title: "Concrete", exams: ["aee-rbi"] },
      { title: "Cement Mortar", exams: ["aee-rbi"] },
      { title: "Timber", exams: ["aee-rbi"] },
      { title: "Bricks", exams: ["aee-rbi"] },
      { title: "Bricks Masonry", exams: ["aee-rbi"] },
      { title: "Stones", exams: ["aee-rbi"] },
      { title: "Paints", exams: ["aee-rbi"] },
      { title: "Tiles", exams: ["aee-rbi"] },
      { title: "Miscellaneous (Building Materials)", exams: ["aee-rbi"] },
    ],
  },
  "civil-sa": {
    id: "civil-sa",
    name: "Structural Analysis",
    hasContent: true,
    units: [
      { title: "Introduction to Structures and Static Indeterminacy", exams: ["aee-rbi"] },
      { title: "Kinematic Indeterminacy", exams: ["aee-rbi"] },
      { title: "Analysis of Trusses (Determinate)", exams: ["aee-rbi"] },
      { title: "Basic Methods of Structural Analysis", exams: ["aee-rbi"] },
      { title: "Strain Energy Methods", exams: ["aee-rbi"] },
      { title: "Moment Distribution Method", exams: ["aee-rbi"] },
      { title: "Slope Deflection Method", exams: ["aee-rbi"] },
      { title: "Kani's Method", exams: ["aee-rbi"] },
      { title: "Moving Loads and Influence Lines", exams: ["aee-rbi"] },
      { title: "Arches and Suspension Bridges", exams: ["aee-rbi"] },
      { title: "Matrix Method", exams: ["aee-rbi"] },
      { title: "Plastic Theory", exams: ["aee-rbi"] },
      { title: "Column Analogy Method", exams: ["aee-rbi"] },
    ],
  },
  "civil-rcc": {
    id: "civil-rcc",
    name: "Reinforced Cement Concrete",
    hasContent: true,
    units: [
      { title: "Materials, Workmanship, Inspection and Testing", exams: ["aee-rbi"] },
      { title: "Limit State Design Method \u2013 Fundamentals", exams: ["aee-rbi"] },
      { title: "Limit State \u2013 Singly Reinforced Sections", exams: ["aee-rbi"] },
      { title: "Basic Concepts \u2013 Working Stress", exams: ["aee-rbi"] },
      { title: "Doubly Reinforced Beams \u2013 LSM", exams: ["aee-rbi"] },
      { title: "Doubly Reinforced Beams \u2013 WSM", exams: ["aee-rbi"] },
      { title: "Limit State Design \u2013 Flanged Beams", exams: ["aee-rbi"] },
      { title: "Limit State of Collapse \u2013 Shear", exams: ["aee-rbi"] },
      { title: "Bond Limit State and Working Stress", exams: ["aee-rbi"] },
      { title: "Limit State of Collapse \u2013 Torsion", exams: ["aee-rbi"] },
      { title: "Slabs", exams: ["aee-rbi"] },
      { title: "Limit State of Collapse \u2013 Compression", exams: ["aee-rbi"] },
      { title: "Footings", exams: ["aee-rbi"] },
      { title: "Limit State of Serviceability", exams: ["aee-rbi"] },
      { title: "Fundamentals of Prestressed Concrete", exams: ["aee-rbi"] },
      { title: "Analysis of Prestressed Concrete Members", exams: ["aee-rbi"] },
      { title: "Losses in Prestressed Concrete", exams: ["aee-rbi"] },
      { title: "Miscellaneous (Reinforced Cement Concrete)", exams: ["aee-rbi"] },
    ],
  },
  "civil-ss": {
    id: "civil-ss",
    name: "Design of Steel Structures",
    hasContent: true,
    units: [
      { title: "Materials and Specifications", exams: ["aee-rbi"] },
      { title: "Riveted and Bolted Connections", exams: ["aee-rbi"] },
      { title: "Welded Connections", exams: ["aee-rbi"] },
      { title: "Eccentric Connections", exams: ["aee-rbi"] },
      { title: "Tension Members", exams: ["aee-rbi"] },
      { title: "Compression Members", exams: ["aee-rbi"] },
      { title: "Column Bases and Column Splices", exams: ["aee-rbi"] },
      { title: "Beams", exams: ["aee-rbi"] },
      { title: "Plate Girders", exams: ["aee-rbi"] },
      { title: "Gantry Girders", exams: ["aee-rbi"] },
      { title: "Roof Trusses", exams: ["aee-rbi"] },
    ],
  },
  "civil-cpm": {
    id: "civil-cpm",
    name: "Construction Planning & Management",
    hasContent: true,
    units: [
      { title: "Introduction to Project Management", exams: ["aee-rbi"] },
      { title: "PERT", exams: ["aee-rbi"] },
      { title: "CPM", exams: ["aee-rbi"] },
      { title: "CPM Cost Analysis", exams: ["aee-rbi"] },
      { title: "Valuation", exams: ["aee-rbi"] },
    ],
  },
  "civil-geo": {
    id: "civil-geo",
    name: "Geotechnical Engineering",
    hasContent: true,
    units: [
      { title: "Origin of Soils", exams: ["aee-rbi"] },
      { title: "Definitions and Properties of Soils", exams: ["aee-rbi"] },
      { title: "Soil Structures and Clay Mineralogy", exams: ["aee-rbi"] },
      { title: "Index Properties of Soils", exams: ["aee-rbi"] },
      { title: "Soil Classification", exams: ["aee-rbi"] },
      { title: "Permeability", exams: ["aee-rbi"] },
      { title: "Effective Stress", exams: ["aee-rbi"] },
      { title: "Seepage Pressure and Critical Hydraulic Gradient", exams: ["aee-rbi"] },
      { title: "Seepage Analysis", exams: ["aee-rbi"] },
      { title: "Stress Distribution", exams: ["aee-rbi"] },
      { title: "Consolidation", exams: ["aee-rbi"] },
      { title: "Compaction", exams: ["aee-rbi"] },
      { title: "Shear Strength", exams: ["aee-rbi"] },
      { title: "Earth Pressure", exams: ["aee-rbi"] },
      { title: "Stability of Slopes", exams: ["aee-rbi"] },
      { title: "Bearing Capacity", exams: ["aee-rbi"] },
      { title: "Pile Foundation", exams: ["aee-rbi"] },
      { title: "Soil Exploration", exams: ["aee-rbi"] },
      { title: "Sheet Piles", exams: ["aee-rbi"] },
      { title: "Foundations in Expansive Soils", exams: ["aee-rbi"] },
    ],
  },
  "civil-ee": {
    id: "civil-ee",
    name: "Environmental Engineering",
    hasContent: true,
    units: [
      { title: "Population Forecasting and Water Demands", exams: ["aee-rbi"] },
      { title: "Sources and Conveyance of Water", exams: ["aee-rbi"] },
      { title: "Quality of Water", exams: ["aee-rbi"] },
      { title: "Plain Sedimentation", exams: ["aee-rbi"] },
      { title: "Coagulation", exams: ["aee-rbi"] },
      { title: "Filtration", exams: ["aee-rbi"] },
      { title: "Disinfection", exams: ["aee-rbi"] },
      { title: "Miscellaneous Water Treatment", exams: ["aee-rbi"] },
      { title: "Distribution System", exams: ["aee-rbi"] },
      { title: "Water Supply Arrangements", exams: ["aee-rbi"] },
      { title: "Introduction to Waste Water Engineering and Estimation of DWF & WWF", exams: ["aee-rbi"] },
      { title: "Design of Sewers", exams: ["aee-rbi"] },
      { title: "Characteristics of Sewage", exams: ["aee-rbi"] },
      { title: "Treatment of Sewage", exams: ["aee-rbi"] },
      { title: "Sludge Digestion", exams: ["aee-rbi"] },
      { title: "Septic Tanks", exams: ["aee-rbi"] },
      { title: "Trickling Filters", exams: ["aee-rbi"] },
      { title: "Activated Sludge Process", exams: ["aee-rbi"] },
      { title: "Oxidation Ponds", exams: ["aee-rbi"] },
      { title: "Disposal of Sewage Effluents", exams: ["aee-rbi"] },
      { title: "Solid Waste Management", exams: ["aee-rbi"] },
      { title: "Air Pollution and Control", exams: ["aee-rbi"] },
      { title: "House Drainage Arrangements in Buildings", exams: ["aee-rbi"] },
      { title: "Noise Pollution", exams: ["aee-rbi"] },
      { title: "Environmental Impact Assessments", exams: ["aee-rbi"] },
    ],
  },
  "civil-hyd": {
    id: "civil-hyd",
    name: "Hydrology",
    hasContent: true,
    units: [
      { title: "Precipitation", exams: ["aee-rbi"] },
      { title: "Mean Precipitation Calculation", exams: ["aee-rbi"] },
      { title: "Frequency of Point Rainfall and Probability", exams: ["aee-rbi"] },
      { title: "Evaporation and Evapotranspiration", exams: ["aee-rbi"] },
      { title: "Infiltration", exams: ["aee-rbi"] },
      { title: "Runoff", exams: ["aee-rbi"] },
      { title: "Catchment and Its Characteristics", exams: ["aee-rbi"] },
      { title: "Hydrographs", exams: ["aee-rbi"] },
      { title: "Maximum Flood Estimation", exams: ["aee-rbi"] },
      { title: "Flood Routing", exams: ["aee-rbi"] },
      { title: "Well Hydraulics", exams: ["aee-rbi"] },
      { title: "River Gauging", exams: ["aee-rbi"] },
    ],
  },
  "civil-irr": {
    id: "civil-irr",
    name: "Irrigation",
    hasContent: true,
    units: [
      { title: "Water Requirements of Crops", exams: ["aee-rbi"] },
      { title: "Methods of Irrigation", exams: ["aee-rbi"] },
      { title: "Spillways", exams: ["aee-rbi"] },
      { title: "Dams", exams: ["aee-rbi"] },
      { title: "Diversion Head Works", exams: ["aee-rbi"] },
      { title: "Design of Unlined Alluvial Canals by Silt Theories", exams: ["aee-rbi"] },
      { title: "Cross Drainage Works", exams: ["aee-rbi"] },
      { title: "Canal Regulation Works", exams: ["aee-rbi"] },
      { title: "Canals", exams: ["aee-rbi"] },
      { title: "Water Logging and Land Drainage", exams: ["aee-rbi"] },
      { title: "Quality of Irrigation Water and Sodic Soils", exams: ["aee-rbi"] },
      { title: "Power Plants", exams: ["aee-rbi"] },
    ],
  },
  "civil-sur": {
    id: "civil-sur",
    name: "Surveying",
    hasContent: true,
    units: [
      { title: "Fundamental Concepts", exams: ["aee-rbi"] },
      { title: "Linear Measurements Including Chain Survey", exams: ["aee-rbi"] },
      { title: "Compass Survey", exams: ["aee-rbi"] },
      { title: "Theodolite Survey", exams: ["aee-rbi"] },
      { title: "Traverse Surveying and Omitted Measurements", exams: ["aee-rbi"] },
      { title: "Levelling", exams: ["aee-rbi"] },
      { title: "Curves", exams: ["aee-rbi"] },
      { title: "Tacheometry", exams: ["aee-rbi"] },
      { title: "Contours", exams: ["aee-rbi"] },
      { title: "Areas and Volumes", exams: ["aee-rbi"] },
      { title: "Plane Table Survey", exams: ["aee-rbi"] },
      { title: "Field Astronomy", exams: ["aee-rbi"] },
      { title: "Global Positioning System", exams: ["aee-rbi"] },
      { title: "Photogrammetric Surveying", exams: ["aee-rbi"] },
      { title: "Remote Sensing", exams: ["aee-rbi"] },
      { title: "Theory of Errors and Adjustments", exams: ["aee-rbi"] },
      { title: "Total Station", exams: ["aee-rbi"] },
    ],
  },
  "civil-tra": {
    id: "civil-tra",
    name: "Transportation Engineering",
    hasContent: true,
    units: [
      { title: "Highway Development and Planning", exams: ["aee-rbi"] },
      { title: "Highway Alignment and Surveys", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Basic Elements", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Gradients", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Sight Distances", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Horizontal Curves", exams: ["aee-rbi"] },
      { title: "Horizontal Curves (Extra Widening)", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Transition Curves", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Summit Curves", exams: ["aee-rbi"] },
      { title: "Highway Geometric Design \u2013 Valley Curves", exams: ["aee-rbi"] },
      { title: "Highway Materials and Testing", exams: ["aee-rbi"] },
      { title: "Flexible Pavements", exams: ["aee-rbi"] },
      { title: "Rigid Pavements", exams: ["aee-rbi"] },
      { title: "Traffic Engineering", exams: ["aee-rbi"] },
      { title: "Highway Construction and Maintenance", exams: ["aee-rbi"] },
      { title: "Railway Engineering", exams: ["aee-rbi"] },
      { title: "Airport Engineering", exams: ["aee-rbi"] },
    ],
  },
  "civil-gel": {
    id: "civil-gel",
    name: "Geology",
    hasContent: true,
    units: [
      { title: "Geology (only for TGPSC)", exams: [] },
    ],
  },
  "civil-est": {
    id: "civil-est",
    name: "Estimation, Costing & Valuation",
    hasContent: true,
    units: [
      { title: "Types of Estimation", exams: ["aee-rbi"] },
      { title: "General Specification of Civil Works", exams: ["aee-rbi"] },
      { title: "Estimation of Civil Works", exams: ["aee-rbi"] },
      { title: "Schedule of Rates (Lead and Lifts)", exams: ["aee-rbi"] },
      { title: "Computation of Earth Work", exams: ["aee-rbi"] },
      { title: "Contracts and Tenders", exams: ["aee-rbi"] },
      { title: "Valuations", exams: ["aee-rbi"] },
    ],
  },
  "civil-other": {
    id: "civil-other",
    name: "Other Civil & General (not in chapter list)",
    hasContent: true,
    units: [{ title: "Questions that do not fit a listed chapter", exams: ["aee-rbi"] }],
  },
  current: {
    id: "current",
    name: "Current Affairs",
    hasContent: false,
    units: [{ title: "Regional, national & international events", exams: ["group2", "group1", ...ALL_GS] }],
  },
  mental: {
    id: "mental",
    name: "Mental Ability & Aptitude",
    hasContent: false,
    units: [
      { title: "Logical reasoning & mental ability", exams: ["group2", "group1", ...ALL_GS] },
      { title: "Quantitative aptitude, basic maths & data interpretation", exams: ["group2", "group1", ...ALL_GS] },
    ],
  },
  essay: {
    id: "essay",
    name: "Essay & Qualifying Languages",
    hasContent: false,
    units: [
      { title: "General essay (three essays)", exams: ["group1"] },
      { title: "Qualifying Telugu & English", exams: ["group1"] },
    ],
  },
  hindu: {
    id: "hindu",
    name: "Hindu Philosophy, Temples & Endowments",
    hasContent: false,
    units: [
      { title: "Ramayana", exams: ["eo"] },
      { title: "Mahabharata & the Gita", exams: ["eo"] },
      { title: "Bhagavata Purana", exams: ["eo"] },
      { title: "Hindu philosophy: Vedas, Upanishads & Darshanas", exams: ["eo"] },
      { title: "Agama Sastras: Vaishnava, Saiva & Sakta", exams: ["eo"] },
      { title: "Temple system, rituals, festivals & mathas", exams: ["eo"] },
      { title: "AP Endowments Act 30 of 1987 & administration", exams: ["eo"] },
    ],
  },
  "engg-core": {
    id: "engg-core",
    name: "SOM, Fluid Mechanics & Materials",
    hasContent: false,
    units: [
      { title: "Engineering mechanics, stresses, SFD/BMD & bending", exams: ["aee-prtw", "aee-rbi", "aee-pcb"] },
      { title: "Principal stresses, columns, torsion, springs & shells", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Fluid statics, kinematics, dynamics & pipe flow", exams: ["aee-prtw", "aee-rbi", "aee-pcb"] },
      { title: "Hydraulic turbines, pumps & hydro plants", exams: ["aee-prtw", "aee-rbi"] },
      { title: "Open channel flow, similitude, hydrology & irrigation", exams: ["aee-rbi", "aee-prtw", "aee-pcb"] },
      { title: "Engineering materials & process thermodynamics", exams: ["aee-pcb"] },
    ],
  },
  "drawing-survey": {
    id: "drawing-survey",
    name: "Drawing, Surveying & Computers",
    hasContent: false,
    units: [
      { title: "Engineering drawing, projections & AutoCAD", exams: ["aee-prtw", "draughtsman"] },
      { title: "Surveying fundamentals, levelling & contouring", exams: ["aee-rbi", "draughtsman"] },
      { title: "Theodolite, traversing, total station & GPS", exams: ["aee-rbi", "draughtsman"] },
      { title: "Principles of electrical engineering", exams: ["aee-prtw"] },
      { title: "Computer fundamentals", exams: ["aee-prtw"] },
      { title: "Units, arithmetic, algebra & geometry", exams: ["draughtsman"] },
    ],
  },
};

export const PAPERS: Record<string, Paper> = {
  // Shared
  "gs-common": {
    id: "gs-common",
    name: "Paper-I · General Studies & Mental Ability (common)",
    marks: 150,
    subjects: ["current", "scitech", "history", "geography", "polity", "economy", "env", "mental"],
    syllabus: ["Major current events — International, National, Andhra Pradesh", "General Science in daily life; contemporary S&T and IT", "History of India (social, economic, cultural, political) with focus on AP and the National Movement", "Geography of India with focus on AP", "Indian Polity & Governance: constitutional issues, public policy, reforms, e-Governance", "Indian Economy and Planning", "Sustainable Development and Environmental Protection", "Disaster management: vulnerability, prevention & mitigation, Remote Sensing & GIS", "Logical reasoning, analytical ability and logical interpretation", "Data analysis: tabulation, visual representation, mean/median/mode/variance"],
  },
  "aee-common-2": {
    id: "aee-common-2",
    name: "Paper-2 · Civil & Mechanical Engineering (common to PR & TW, R&B, WRD, PH&ME, RWS)",
    marks: 150,
    subjects: ["civil-em", "civil-som", "civil-fm", "civil-hm"],
    syllabus: ["Strength of Materials: equilibrium, trusses, friction, stresses & strains, SFD/BMD, bending & shear stresses, principal stresses, columns, torsion, springs, thin & thick cylinders", "Fluid Mechanics & Machinery: statics, kinematics, dynamics, flow measurement, pipe flow, boundary layer, jets & turbines, pumps, hydraulic valves, hydro projects"],
  },
  // Group-2
  "g2-screening": {
    id: "g2-screening",
    name: "Screening Test · General Studies & Mental Ability",
    marks: 150,
    subjects: ["history", "geography", "society", "current", "mental"],
    syllabus: ["Indian History (30): ancient, medieval, modern", "Geography (30): general & physical, economic, human — India & AP", "Indian Society (30): structure, social issues, welfare mechanisms", "Current Affairs (30): international, national, AP", "Mental Ability (30): logical reasoning, mental ability, basic numeracy, data analysis"],
  },
  "g2-mains-1": { id: "g2-mains-1", name: "Mains Paper-I · AP History & Indian Constitution", marks: 150, subjects: ["history", "polity"],
    syllabus: ["A1 · Pre-historic cultures to Andhra Cholas", "A2 · Dynasties of Andhradesa, 11th–16th c.", "A3 · Europeans, 1857, British rule, nationalist & social movements (1885–1947)", "A4 · Andhra Movement and the formation of Andhra State, 1953", "A5 · Formation of AP: Visalandhra, SRC, Gentlemen Agreement, 1956–2014", "B6 · Nature, features, Preamble, FRs, DPSPs, FDs, amendment, basic structure", "B7 · Legislature, Executive, Judiciary; judicial review & activism", "B8 · Union–State distribution of powers; constitutional bodies; NHRC, RTI, Lokpal", "B9 · Centre–State reforms (Rajamannar, Sarkaria, Punchhi); parties; elections; anti-defection", "B10 · Decentralisation: CDP, Balwant Rai Mehta, Ashok Mehta, 73rd & 74th Amendments"] },
  "g2-mains-2": {
    id: "g2-mains-2",
    name: "Mains Paper-II · Indian & AP Economy, Science & Technology",
    marks: 150,
    subjects: ["economy", "scitech", "env"],
    syllabus: ["A1 · Structure of the economy, national income, planning, 1991 reforms, NITI Aayog", "A2 · Money, banking, RBI, inflation, fiscal policy, taxes & GST, budget, BoP, FDI", "A3 · Agriculture, industry and services in India", "A4 · AP economy: GSDP, per-capita income, revenue, expenditure, debt, budget", "A5 · AP agriculture & allied, industry, MSMEs, corridors, services & IT policy", "B1 · Technology missions: STI policy, space, DRDO/IGMDP, ICT & Digital India, cyber security, nuclear", "B2 · Energy management: capacities, policies, biofuels, BS norms, renewables", "B3 · Ecosystem & biodiversity: hotspots, CITES, biosphere reserves, conservation", "B4 · Waste management & pollution control: solid waste, transgenics, bioremediation", "B5 · Environment & health: climate change, conventions, SDGs, disease burden, public health"],
  },
  // Group-1
  "g1-prelims-1": { id: "g1-prelims-1", name: "Screening Paper-I · General Studies", marks: 120, subjects: ["history", "polity", "economy", "geography", "current"],
    syllabus: ["A · History & Culture (30)", "B · Constitution, Polity, Social Justice & International Relations (30)", "C · Indian & AP Economy and Planning (30)", "D · Geography (30)"] },
  "g1-prelims-2": { id: "g1-prelims-2", name: "Screening Paper-II · General Aptitude", marks: 120, subjects: ["mental", "scitech", "current"],
    syllabus: ["A · General Mental Ability, Administrative & Psychological Abilities (60)", "B(i) · Science & Technology (30)", "B(ii) · Current events of regional, national & international importance (30)"] },
  "g1-mains-1": { id: "g1-mains-1", name: "Mains Paper-I · General Essay", marks: 150, subjects: ["essay"] },
  "g1-mains-2": { id: "g1-mains-2", name: "Mains Paper-II · History & Culture of India and AP", marks: 150, subjects: ["history"] },
  "g1-mains-3": { id: "g1-mains-3", name: "Mains Paper-III · Polity, Governance, Law & Ethics", marks: 150, subjects: ["polity"] },
  "g1-mains-4": { id: "g1-mains-4", name: "Mains Paper-IV · Economy & Development of India and AP", marks: 150, subjects: ["economy"] },
  "g1-mains-5": { id: "g1-mains-5", name: "Mains Paper-V · Science, Technology & Environment", marks: 150, subjects: ["scitech", "env"] },
  "g1-qualifying": { id: "g1-qualifying", name: "Qualifying · Telugu & English (150 each)", subjects: ["essay"] },
  // AEE department papers
  "aee-pcb-2": { id: "aee-pcb-2", name: "Paper-II · Common Subject — Environmental Science & Engineering", marks: 150, subjects: ["env", "engg-core"],
    syllabus: ["1 · Ecosystems", "2 · Natural resources", "3 · Biodiversity and biotic resources", "4 · Engineering materials", "5 · Fluid mechanics and hydraulics", "6 · Process calculations and thermodynamics", "7 · Air, water, soil and noise pollution & control technologies", "8 · Solid and industrial waste management", "9 · Global environmental problems, policies and legislations", "10 · Environmental impact assessment towards sustainable development"] },
  "aee-prtw-3": { id: "aee-prtw-3", name: "Paper-3 · Civil & Mechanical (PR & TW) — Drawing, Env. Science, Electrical, Computers", marks: 150, subjects: ["drawing-survey", "env"],
    syllabus: ["1 · Engineering drawing & AutoCAD basics", "2 · Environmental science: natural resources", "3 · Ecosystems", "4 · Biodiversity & conservation; pollution", "5 · Solid waste management", "6 · Disaster management", "7 · Social issues & the environment; environmental Acts", "8 · Human population & the environment", "9 · Principles of electrical & electronic engineering", "10 · Computer fundamentals"] },
  "aee-rbi-3": { id: "aee-rbi-3", name: "Paper-3 · Civil Engineering (R&B, WRD, PH&ME, RWS)", marks: 150, subjects: ["civil-bm", "civil-sa", "civil-ss", "civil-rcc", "civil-cpm", "civil-geo", "civil-ee", "civil-hyd", "civil-irr", "civil-sur", "civil-tra", "civil-est", "civil-gel", "civil-fm", "civil-other"],
    syllabus: ["1 · Building materials", "2 · Structural analysis", "3 · Design of steel structures", "4 · Design of concrete & masonry structures", "5 · Construction planning & management", "6 · Hydraulics & water resources engineering", "7 · Environmental engineering", "8 · Soil mechanics & foundation engineering", "9 · Surveying & transport engineering"] },
  // Other posts
  "aswo-2": { id: "aswo-2", name: "Paper-II · Social & Cultural History of AP (135) and Welfare Mechanisms (15)", marks: 150, subjects: ["history", "society"],
    syllabus: ["1 · Social & cultural history of AP: early dynasties", "2 · Kingdoms of Andhra, 11th–16th c.", "3 · Europeans, 1857 and the freedom movement in Andhra", "4 · Andhra Movement and the Andhra Mahasabhas", "5 · Formation of Andhra Pradesh", "6 · State priorities for welfare and economic development"] },
  "aswo-3": { id: "aswo-3", name: "Paper-III · Constitution & Polity (135) and Welfare Mechanisms (15)", marks: 150, subjects: ["polity", "society"],
    syllabus: ["1 · Nature and salient features of the Constitution", "2 · Legislature, Executive and Judiciary", "3 · Union–State distribution of powers", "4 · Centre–State relations and reform committees", "5 · Amendments; centralisation vs decentralisation", "6 · Political parties and party systems", "7 · Constitutional provisions & welfare mechanisms for SC/ST", "8 · Legislative Acts against social evils"] },
  "eo-2": { id: "eo-2", name: "Paper-II · Hindu Philosophy & Temple System", marks: 150, subjects: ["hindu"],
    syllabus: ["01 · Ramayanam", "02 · Mahabharatham", "03 · Bhagavatham", "04 · Hindu Puranams", "05 · Temple Agamas", "06 · Hindu festivals and classical fine arts", "07 · Vedic culture: yagnas, Vedas, Upavedas", "08 · Philosophies, cults and gurus", "09 · Hindu family structure, adoption, succession", "10 · Sources of income for temples; allocation of funds", "11 · Duties of Executive Officers (Sec. 29 of Act 30/1987)", "12 · Land records and law on endowment lands"] },
  "dm-1": { id: "dm-1", name: "Paper-I · General Studies & Mental Ability (same as the AEE technical papers)", marks: 150, subjects: ["current", "scitech", "history", "geography", "polity", "economy", "env", "mental"] },
  "dm-2": { id: "dm-2", name: "Paper-II · Surveying (90), Engineering Drawing (15), ITI Basic Maths (45)", marks: 150, subjects: ["civil-sur", "drawing-survey", "mental"],
    syllabus: ["1 · Drawing (IS 962-1989, layout, lines, lettering, dimensioning, scales, projection)", "2 · Surveying", "3 · Levelling", "4 · Theodolite survey", "5 · Total station", "6 · GPS", "7 · Units, arithmetic, algebra, geometry, mensuration"] },
};

/** In the order the brief lists them; `priority` exams are shown first in pickers. */
export const EXAMS: Exam[] = [
  {
    id: "group2",
    name: "APPSC Group-2",
    short: "Group-2",
    blurb: "Deputy Tahsildar, Municipal Commissioner & other posts",
    priority: true,
    papers: ["g2-screening", "g2-mains-1", "g2-mains-2"],
    schemeId: "appsc",
  },
  {
    id: "aee-pcb",
    name: "AEE – AP Pollution Control Board",
    short: "AEE · PCB",
    blurb: "Assistant Environmental Engineer",
    priority: true,
    papers: ["gs-common", "aee-pcb-2"],
    schemeId: "appsc",
  },
  {
    id: "aee-prtw",
    name: "AEE Civil – Panchayat Raj & Tribal Welfare",
    short: "AEE · PR & TW",
    blurb: "Paper-2 common with R&B / Irrigation; own Paper-3",
    priority: true,
    papers: ["gs-common", "aee-common-2", "aee-prtw-3"],
    schemeId: "appsc",
  },
  {
    id: "group1",
    name: "APPSC Group-1",
    short: "Group-1",
    blurb: "Deputy Collector, Municipal Commissioner, DEO & other posts",
    priority: false,
    papers: ["g1-prelims-1", "g1-prelims-2", "g1-mains-1", "g1-mains-2", "g1-mains-3", "g1-mains-4", "g1-mains-5", "g1-qualifying"],
    schemeId: "appsc",
  },
  {
    id: "aee-rbi",
    name: "AEE Civil – R&B / Irrigation (WRD) & allied",
    short: "AEE · R&B / Irr.",
    blurb: "Also PH&ME and RWS · Paper-2 common with PR & TW; own Paper-3",
    priority: false,
    papers: ["gs-common", "aee-common-2", "aee-rbi-3"],
    schemeId: "appsc",
  },
  {
    id: "aswo",
    name: "ASWO / ATWO",
    short: "ASWO / ATWO",
    blurb: "Assistant Social / Tribal Welfare Officer",
    priority: false,
    papers: ["gs-common", "aswo-2", "aswo-3"],
    schemeId: "appsc",
  },
  {
    id: "eo",
    name: "Endowment Executive Officer Grade-III",
    short: "Endowment EO",
    blurb: "Hindu philosophy, temples & the AP Endowments Act",
    priority: false,
    papers: ["gs-common", "eo-2"],
    schemeId: "appsc",
  },
  {
    id: "draughtsman",
    name: "Draughtsman Grade-II",
    short: "Draughtsman",
    blurb: "Drawing, surveying & general studies",
    priority: false,
    papers: ["dm-1", "dm-2"],
    schemeId: "appsc",
  },
];

/** Question-bank topics → Environmental Science syllabus unit (1-based). */
export const ENV_TOPIC_UNITS: Record<string, number> = {
  "Ecology & Ecosystem": 1,
  "Biodiversity & Conservation": 2,
  "Sanctuary / Biosphere Reserve": 2,
  Forest: 2,
  "Non-conventional Energy Sources": 3,
  Pollution: 4,
  "Climate Change & Green House Gases": 6,
  "Ozone Layer": 6,
  "Environment Legislation & Conventions": 7,
  "Environment Conservation": 8,
  "Sustainable Development": 8,
};

export function examById(id: string | undefined): Exam | undefined {
  return EXAMS.find((e) => e.id === id);
}

export function papersForExam(examId: string | undefined): Paper[] {
  const exam = examById(examId) ?? EXAMS[0];
  return exam.papers.map((p) => PAPERS[p]).filter(Boolean);
}

/** Subjects reachable from an exam through its papers, de-duplicated. */
export function subjectsForExam(examId: string | undefined): Subject[] {
  const ids = new Set(papersForExam(examId).flatMap((p) => p.subjects));
  return [...ids].map((id) => SUBJECTS[id]).filter(Boolean);
}

/** Other exams that share a paper with this one (e.g. AEE PR & TW ↔ R&B on Paper-II). */
export function examsSharingPaper(paperId: string, except?: string): Exam[] {
  return EXAMS.filter((e) => e.id !== except && e.papers.includes(paperId));
}
