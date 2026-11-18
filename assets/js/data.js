/* ============================================================
   THE ONLY FILE THE TEAM NEEDS TO EDIT.
   Every page of the portfolio renders from this object.
   Dates: always YYYY-MM-DD. Add newest entries at the TOP of arrays.
   Anything marked  // TODO  is a placeholder to be replaced with real team data.
   ============================================================ */
window.SITE = {
  title: "FPGA-Controlled Variable Gain Amplifier",
  subtitle: "Semester V Foundation Integration Mini Project · Academic Year 2026–27",
  dept: "Department of Electronics Engineering – VLSI Design and Technology",
  school: "School of Electrical and Electronics Engineering · KLE Technological University, Hubballi",
  slug: "vdt-mp-2026-T1A1-team02",
  theme: "Theme 1", artefact: "Artefact 1", teamNo: "02",

  /* Team photo: drop a file at assets/img/team.jpg and set this to "assets/img/team.jpg" */
  teamPhoto: "",

  members: [
    { name: "Swaroop T",       usn: "01FE24BEV012", email: "01fe24bev012@kletech.ac.in", subsystem: "TODO — subsystem owned" },
    { name: "Veerabhadrayya",  usn: "01FE24BEV020", email: "01fe24bev020@kletech.ac.in", subsystem: "TODO — subsystem owned" },
    { name: "Farhan B",        usn: "01FE24BEV022", email: "01fe24bev022@kletech.ac.in", subsystem: "TODO — subsystem owned" },
    { name: "Shrihari U",      usn: "01FE24BEV023", email: "01fe24bev023@kletech.ac.in", subsystem: "TODO — subsystem owned" }
  ],
  faculty: [
    { name: "Sujata S Kotabagi",       dept: "Department of VLSI" },
    { name: "Pooja Goudar",       dept: "Department of VLSI" },
    { name: "Vaishnavi Chandavari", dept: "Department of VLSI" },
    { name: "Asmita Aiholi",      dept: "Department of VLSI" }
  ],

  /* Contribution table — updated each review */
  contributions: [
    // { review: "Review 1", member: "Swaroop T", work: "Background study of ..." }
  ],

  /* Latest update shown on Home */
  latest: { date: "2026-11-18", text: "Portfolio site set up. Review 1 content in progress." },

  /* Date each page was last updated (readiness rule: must be earlier than the review date). */
  pageUpdated: {
    // problem: "2026-11-18"
  },
  defaultUpdated: "2026-11-18",

  /* Review dates — fill when announced. Keys: r1 r2 r3 r4 r5 final */
  reviewDates: { r1: "", r2: "", r3: "", r4: "", r5: "", final: "" },

  /* 16-step design chain.  status: "done" | "progress" | "next"
     (Step labels are working names for the ranges given in the Guide — rename freely.) */
  steps: [
    { n: 1,  label: "Problem & need",           status: "progress" },
    { n: 2,  label: "Concept choice",           status: "progress" },
    { n: 3,  label: "Functional requirements",  status: "next" },
    { n: 4,  label: "Architecture",             status: "next" },
    { n: 5,  label: "Subsystem selection",      status: "next" },
    { n: 6,  label: "Component selection",      status: "next" },
    { n: 7,  label: "Calculations",             status: "next" },
    { n: 8,  label: "Schematic & constraints",  status: "next" },
    { n: 9,  label: "BOM & simulation",         status: "next" },
    { n: 10, label: "Testbench & simulation",   status: "next" },
    { n: 11, label: "Subsystem build & test",   status: "next" },
    { n: 12, label: "Integration",              status: "next" },
    { n: 13, label: "Validation",               status: "next" },
    { n: 14, label: "Debug & improve",          status: "next" },
    { n: 15, label: "Reflection",               status: "next" },
    { n: 16, label: "Demonstration",            status: "next" }
  ],

  /* ---------- Page 2 · Problem and Need ---------- */
  problem: {
    need: "",   // TODO — need statement in terms of what is required, WITHOUT naming a circuit.
    inputs: [
      // { parameter: "Source amplitude range", value: "2.4 mV – 2.4 V pp", unit: "pp", source: "measured | datasheet | assumed", note: "" }
    ],
    background: [
      // { title: "OPA/Datasheet name", type: "datasheet | app note | reference design", learned: "What we learned from it", link: "" }
    ],
    candidateFRs: [
      // { id: "FR-A", text: "Each gain within ±5% of nominal" }
    ],
    unknowns: [ /* "Q10 list of what is still unknown" */ ]
  },

  /* ---------- Page 3 · Concept Choices ---------- */
  concepts: {
    criteria: [
      // { name: "Resolution", weight: 3 }
    ],
    alternatives: [
      // { name: "Concept A", sketch: "assets/img/conceptA.png", summary: "", rejectedBecause: "", scores: { "Resolution": 4 } }
    ],
    chosen: "", reason: "",
    scopeIn: [], scopeOut: []
  },

  /* ---------- Page 4 · Functional Requirements ---------- */
  frFrozen: "",   // date the FR table was frozen, e.g. "2026-12-05"
  fr: [
    // { id: "FR1", requirement: "Each gain within ±5% of nominal", target: "±5%", method: "DMM / scope at 1 kHz", source: "datasheet", status: "draft | frozen | changed",
    //   predicted: "", measured: "", deviation: "", explanation: "" }
  ],
  frHistory: [
    // { date: "", fr: "FR2", change: "", reason: "" }
  ],

  /* ---------- Page 5 · Architecture and Subsystems ---------- */
  architecture: {
    diagram: "",   // e.g. "assets/img/block-diagram.png"
    blocks: [
      // { name: "Gain stage", input: "...", output: "...", fr: "FR1" }
    ],
    subsystemChoices: [
      // { subsystem: "Gain switching", options: ["Analog mux", "Relay", "Digital pot"], chosen: "Analog mux", reason: "" }
    ]
  },

  /* ---------- Page 6 · Design and Calculations ---------- */
  design: {
    calcs: [
      // { title: "Gain resistor selection", fr: "FR1", equation: "G = 1 + Rf/Rg", values: "Rf = 90.9 kΩ, Rg = 10 kΩ", result: "10.09", margin: "0.9% vs ±5%", date: "2026-12-10" }
    ],
    components: [
      // { part: "", role: "", reason: "", alternatives: "", date: "" }
    ],
    media: [
      // { type: "image", src: "assets/img/schematic.png", caption: "Schematic rev A — shows ..." }
    ],
    bom: [
      // { part: "", value: "", qty: 1, source: "", cost: "" }
    ]
  },

  /* ---------- Page 7 · Foundation Integration ---------- */
  /* Nine-course set from Handbook §1.3 — replace the TODO names with the exact course names. */
  courses: [
    "Signals and Systems",
    "Analog Electronic Circuits",
    "Linear Integrated Circuits",
    "Digital Circuits",
    "TODO — Course 5 (Handbook §1.3)",
    "TODO — Course 6 (Handbook §1.3)",
    "TODO — Course 7 (Handbook §1.3)",
    "TODO — Course 8 (Handbook §1.3)",
    "TODO — Course 9 (Handbook §1.3)"
  ],
  coverageNote: "",   // explain any under-represented course (compare with Handbook Figure 3)

  /* One entry per significant decision.  page = page id where it was made:
     problem | concepts | requirements | architecture | design | build | validation | failures
     Level is computed automatically: Named → Applied (how + fr) → Verified (measured + learning). */
  decisions: [
    /* {
      id: "D1", page: "design", date: "2026-12-10",
      decision: "Four gain settings: ×1, ×10, ×50, ×100",
      options: [ { name: "One fixed gain", reason: "..." }, { name: "Eight settings", reason: "..." } ],
      fr: "FR1 — each gain within ±5% of nominal",
      courses: [ { course: "Analog Electronic Circuits", concept: "non-inverting closed-loop gain" } ],
      how: "Gain = 1 + Rf/Rg ...",
      meets: "Linear Integrated Circuits — GBW limits ×100 ...",
      predicted: "Worst-case gain error 1.0%", predictedDate: "2026-12-10",
      measured: "", instrument: "", learning: ""
    } */
  ],
  map: [
    // Foundation Integration Map (Appendix D) rows: { step: "03", decision: "D1", course: "", concept: "", level: "Applied" }
  ],

  /* ---------- Page 8 · Build and Verification ---------- */
  build: {
    sims:       [ /* { title, tool, result, caption, src } */ ],
    tests:      [ /* { subsystem, date, test, result, pass: true } */ ],
    media:      [ /* { type: "image|video|embed", src, caption } */ ],
    deviations: [ /* { date, what, reason } */ ]
  },

  /* ---------- Page 9 · Predicted vs Measured ---------- */
  validation: {
    instruments: [ /* { instrument: "Scope Model", settings: "..." } */ ],
    media: [ /* { type: "image", src, caption } */ ],
    improvement: ""   // the one improvement re-measured
  },

  /* ---------- Page 10 · Failures and Fixes ---------- */
  failures: [
    // { date, symptom, test, rootCause, correction, remeasured, learning, course }
  ],
  failuresRequired: 3,

  /* ---------- Page 11 · Engineering Notebook ---------- */
  notebook: [
    {
      date: "2026-11-18", author: "Team 02",
      objective: "Set up the portfolio site and structure.",
      decision: "Static site (HTML/CSS/JS) deployed on Vercel, instead of Google Sites.",
      course: "—",
      learning: "The Guide's 16-page structure maps cleanly to one page per design step.",
      next: "Fill Page 2 (Problem and Need) before Review 1."
    }
  ],

  /* ---------- Page 12 · Review Record ---------- */
  reviewRecord: [
    // { review: "Review 1", date: "", observation: "verbatim faculty observation", response: "what changed", where: "Page 4, FR2 row", href: "requirements.html" }
  ],

  /* ---------- Page 13 · Reflections ---------- */
  reflections: [
    // { member: "Swaroop T", review: "Review 1", date: "", text: "..." }
  ],
  lessons: {
    minor: [], cohort: [], carry: []
  },

  /* ---------- Page 14 · Final Demonstration ---------- */
  demo: {
    video: "",    // mp4 path, or a YouTube/Drive embed URL
    poster: ""    // image path of the summary poster
  },

  /* ---------- Page 15 · Project Files ---------- */
  files: [
    { label: "Formal report (Appendix A)",       href: "", note: "PDF" },
    { label: "RTL and firmware repository",      href: "", note: "Git" },
    { label: "Schematic files",                  href: "", note: "Appendix I naming" },
    { label: "Simulation files",                 href: "", note: "Appendix I naming" }
  ]
};
