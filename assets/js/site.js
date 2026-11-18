/* EE-VDT portfolio renderer — builds every page from window.SITE (assets/js/data.js) */
(function () {
  "use strict";
  /* Admin working copy (set from admin.html in THIS browser only) overrides data.js for preview. */
  try {
    var ov = localStorage.getItem("vdt_site_override");
    if (ov && !/[?&]nooverride/.test(location.search)) { var parsed = JSON.parse(ov); if (parsed && typeof parsed === "object") window.SITE = Object.assign({}, window.SITE, parsed); }
  } catch (e) {}
  var S = window.SITE;
  /* Headline: stacked uppercase display type with one serif-italic word and a blinking underscore. */
  function titleHTML(text, hero) {
    var w = String(text == null ? "" : text).trim().split(/\s+/), k = w.length - 1;
    if (hero) { var g = w.findIndex(function (x) { return /gain/i.test(x); }); if (g > -1) k = g; }
    return w.map(function (x, i) { x = esc(x); return i === k && w.length > 1 ? "<em>" + x + "</em>" : x; }).join(" ") + '<span class="caret" aria-hidden="true">_</span>';
  }
  var esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- page map (from the Guide's site structure) ---------------- */
  var PAGES = [
    { id: "home", file: "index.html", num: 0, short: "Home", title: "Home", group: "Overview", steps: "—", due: "Review 1", holds: "" },
    { id: "team", file: "team.html", num: 1, short: "Team", title: "Team and Roles", group: "Overview", steps: "—", due: "Review 1", holds: "The team members, faculty guides and contact details." },
    { id: "problem", file: "problem.html", num: 2, short: "Problem", title: "Problem and Need", group: "Design chain", steps: "01", due: "Review 1", holds: "The need in terms of what is required, quantified design inputs, background study, and three candidate functional requirements." },
    { id: "concepts", file: "concepts.html", num: 3, short: "Concepts", title: "Concept Choices", group: "Design chain", steps: "02", due: "Review 2", holds: "At least three alternatives with sketches, a weighted comparison, the chosen concept and why, and what is in and out of scope." },
    { id: "requirements", file: "requirements.html", num: 4, short: "Requirements", title: "Functional Requirements", group: "Design chain", steps: "03", due: "Review 3", holds: "The live FR table with number, method, source and status, plus the change history of any FR after freeze." },
    { id: "architecture", file: "architecture.html", num: 5, short: "Architecture", title: "Architecture and Subsystems", group: "Design chain", steps: "04–05", due: "Review 3", holds: "Block diagram with input, output and governing FR per block, and the subsystem alternatives with the selection made for each." },
    { id: "design", file: "design.html", num: 6, short: "Design", title: "Design and Calculations", group: "Design chain", steps: "06–09", due: "Review 4", holds: "Each calculation as its own card, component selection with reasons, schematic, constraints and BOM." },
    { id: "integration", file: "integration.html", num: 7, short: "Integration", title: "Foundation Integration Map", group: "Design chain", steps: "03–13", due: "Review 3", holds: "The team-completed map plus one decision card per row, and the course coverage strip." },
    { id: "build", file: "build.html", num: 8, short: "Build", title: "Build and Verification", group: "Design chain", steps: "10–12", due: "Review 5", holds: "Simulation and testbench results, subsystem test records, integration photos and videos, and deviations from the schematic with reasons." },
    { id: "validation", file: "validation.html", num: 9, short: "Validation", title: "Predicted vs Measured", group: "Design chain", steps: "13", due: "Final Review", holds: "Predicted, measured, deviation and explanation for every FR, with instrument settings and setup photo." },
    { id: "failures", file: "failures.html", num: 10, short: "Failures", title: "Failures and Fixes", group: "Design chain", steps: "11–14", due: "Review 5", holds: "The debugging log: symptom, test, root cause, correction, re-measurement and learning. At least three cycles by the Final Review." },
    { id: "notebook", file: "notebook.html", num: 11, short: "Notebook", title: "Engineering Notebook", group: "Through the semester", steps: "all", due: "Weekly", holds: "Dated entries: objective, decision or calculation, course used, learning and next action." },
    { id: "reviews", file: "reviews.html", num: 12, short: "Reviews", title: "Review Record", group: "Through the semester", steps: "all", due: "After each review", holds: "Review sheet summary, faculty observations verbatim, the team response and the page where the change was made." },
    { id: "reflections", file: "reflections.html", num: 13, short: "Reflections", title: "Reflections and Forward Links", group: "Through the semester", steps: "15", due: "Each review; complete at Final", holds: "Individual reflections, lessons for the next cohort, and the concepts that carry into Sem VI–VII and the Minor Project." },
    { id: "demo", file: "demo.html", num: 14, short: "Demo", title: "Final Demonstration", group: "Finish", steps: "16", due: "Final Review", holds: "A 3–5 minute demo video walking through every FR, and the summary poster." },
    { id: "files", file: "files.html", num: 15, short: "Files", title: "Project Files", group: "Finish", steps: "—", due: "Final Review", holds: "Links to the formal report, RTL and firmware repository, schematic and simulation files." }
  ];
  var byId = {}; PAGES.forEach(function (p) { byId[p.id] = p; });

  var REVIEWS = [
    { id: "r1", name: "Review 1 — Theme Approval", marks: 5, weeks: "Wk 1", pages: "Home, 1, 2, 11, 12",
      evidence: "Need stated without naming a circuit; Design inputs with units and source (measured / datasheet / assumed); Three candidate FRs; First Notebook entry; Site shared with mentor" },
    { id: "r2", name: "Review 2 — Concept Selection", marks: 10, weeks: "Wk 1–2", pages: "+ 3",
      evidence: "Three alternatives with sketches; Comparison matrix; Rejected options kept with reasons; R1 feedback answered on page 12" },
    { id: "r3", name: "Review 3 — FR & Architecture (hard gate)", marks: 15, weeks: "Wk 2–3", pages: "+ 4, 5, 7",
      evidence: "FR table complete and frozen with date; Block diagram with governing FR per block; Subsystem alternatives; First decision cards at “Applied” level" },
    { id: "r4", name: "Review 4 — Component Design & Calculations", marks: 20, weeks: "Wk 3–6", pages: "+ 6",
      evidence: "Calculation cards traceable to FRs, dated before purchase; Schematic, constraints, BOM; Simulation of critical block; Predictions recorded" },
    { id: "r5", name: "Review 5 — Build, Simulation & Debugging", marks: 20, weeks: "Wk 7–11", pages: "+ 8, 10",
      evidence: "Build photos against schematic; Testbench and subsystem test records; At least two failure cycles with root cause; Deviations explained" },
    { id: "final", name: "Final Review — Validation & Viva", marks: "15 + 10 + 5", weeks: "Wk 12–15", pages: "All pages",
      evidence: "Predicted vs measured for every FR; One improvement re-measured; Three or more failure cycles; Decision cards at “Verified” level; Individual reflections; Demo video; Project files linked" }
  ];
  var QUALITY = [
    "Can a reader follow the project in time order, week by week, from the Home page?",
    "Does every significant decision show the options considered and the reason for the choice?",
    "Does every decision card name a specific concept from a foundation course and show it applied with the team's numbers?",
    "Are predictions dated before the matching measurement?",
    "Does the Failures and Fixes page show at least the required cycles, each with a root cause and a re-measurement?",
    "Is every faculty observation answered on the Review Record with a link to the change?",
    "Has every member written their own reflection after each review?",
    "Would a student in next year's cohort learn something useful from this site?"
  ];

  /* ---------------- helpers ---------------- */
  var d = 0;
  function rv(extra) { d = (d + 1) % 8; return 'reveal' + (extra ? " " + extra : "") + '" style="--d:' + d; }
  function sec(title, sub, body) {
    d = 0;
    return '<section class="section"><div class="sec-head reveal"><h2>' + title + "</h2>" + (sub ? "<p>" + sub + "</p>" : "") + "</div>" + body + "</section>";
  }
  function empty(title, hint) {
    return '<div class="empty reveal"><b>' + esc(title) + "</b><span>" + hint + "</span></div>";
  }
  function table(heads, rows, numCols) {
    numCols = numCols || [];
    var h = heads.map(function (x, i) { return "<th" + (numCols.indexOf(i) > -1 ? ' class="num"' : "") + ">" + esc(x) + "</th>"; }).join("");
    var r = rows.map(function (row, ri) {
      return "<tr" + (row.__cls ? ' class="' + row.__cls + '"' : "") + ">" + row.cells.map(function (c, i) {
        return "<td" + (numCols.indexOf(i) > -1 ? ' class="num"' : "") + ">" + c + "</td>";
      }).join("") + "</tr>";
    }).join("");
    return '<div class="tw glass ' + rv() + '"><table><thead><tr>' + h + "</tr></thead><tbody>" + r + "</tbody></table></div>";
  }
  function R(cells, cls) { return { cells: cells, __cls: cls }; }
  function fig(m) {
    var inner;
    if (m.type === "video") inner = '<video controls preload="metadata" src="' + esc(m.src) + '"></video>';
    else if (m.type === "embed") inner = '<iframe src="' + esc(m.src) + '" allowfullscreen loading="lazy"></iframe>';
    else inner = '<img loading="lazy" src="' + esc(m.src) + '" alt="' + esc(m.caption) + '">';
    return '<figure class="fig glass ' + rv() + '">' + inner + "<figcaption>" + esc(m.caption || "") + "</figcaption></figure>";
  }
  function mediaGrid(list, emptyTitle, emptyHint) {
    if (!list || !list.length) return empty(emptyTitle, emptyHint);
    return '<div class="grid g2">' + list.map(fig).join("") + "</div>";
  }
  function tpl(summary, items) {
    return '<details class="tpl ' + rv() + '"><summary>' + summary + '</summary><div class="inner glass"><ul>' +
      items.map(function (i) { return "<li>" + i + "</li>"; }).join("") + "</ul></div></details>";
  }
  function fmtDate(s) {
    if (!s) return "";
    var dt = new Date(s + "T00:00:00");
    if (isNaN(dt)) return s;
    return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }
  function link(p) { return p.file; }

  /* ---------------- decision cards ---------------- */
  function level(x) {
    if (x.measured && x.learning) return "Verified";
    if (x.how && x.fr) return "Applied";
    return "Named";
  }
  function todo(t) { return '<span class="todo">' + t + "</span>"; }
  function decisionCard(x) {
    var lv = level(x);
    var cls = lv === "Verified" ? "good" : lv === "Applied" ? "blue" : "warn";
    var opts = (x.options || []).map(function (o) { return "<li><b>" + esc(o.name) + "</b> — set aside: " + esc(o.reason) + "</li>"; }).join("");
    var crs = (x.courses || []).map(function (c) { return "<b>" + esc(c.course) + "</b> — " + esc(c.concept); }).join("<br>");
    return '<article class="dcard glass spot ' + rv() + '">' +
      '<div class="dcard-top"><span class="tag ' + cls + '">' + lv + '</span><span class="tag">' + esc(x.id || "") + '</span><span class="faint" style="font-size:13px">' + fmtDate(x.date) + "</span></div>" +
      "<h3>" + esc(x.decision) + "</h3>" +
      '<dl class="dl">' +
      "<dt>Options considered</dt><dd>" + (opts ? "<ul>" + opts + "</ul>" : todo("At least two, with the reason each was set aside")) + "</dd>" +
      "<dt>Functional requirement</dt><dd>" + (x.fr ? esc(x.fr) : todo("FR number and target")) + "</dd>" +
      "<dt>Course and concept</dt><dd>" + (crs || todo("Course name plus the specific concept")) + "</dd>" +
      "<dt>How it was applied</dt><dd>" + (x.how ? esc(x.how) : todo("Equation or reasoning with the team's numbers")) + "</dd>" +
      "<dt>Where courses meet</dt><dd>" + (x.meets ? esc(x.meets) : todo("Any second course the decision depended on")) + "</dd>" +
      "<dt>Predicted</dt><dd>" + (x.predicted ? esc(x.predicted) + (x.predictedDate ? ' <span class="faint">· dated ' + fmtDate(x.predictedDate) + "</span>" : "") : todo("Value expected, dated before the build")) + "</dd>" +
      "<dt>Measured</dt><dd>" + (x.measured ? esc(x.measured) + (x.instrument ? ' <span class="faint">· ' + esc(x.instrument) + "</span>" : "") : todo("Filled at Step 13")) + "</dd>" +
      "<dt>Learning</dt><dd>" + (x.learning ? esc(x.learning) : todo("Filled at Step 13")) + "</dd>" +
      "</dl></article>";
  }
  function decisionsFor(pageId) {
    var list = (S.decisions || []).filter(function (x) { return x.page === pageId; });
    if (!list.length) return "";
    return sec("Decision cards", "Each card names the foundation course and the concept, applies it with our numbers, and compares prediction with measurement.", list.map(decisionCard).join(""));
  }
  var DECISION_TPL = tpl("What goes on a decision card", [
    "<b>Decision</b> — one line, with the value",
    "<b>Options considered</b> — at least two, with the reason each was set aside",
    "<b>FR served</b> — number and target",
    "<b>Foundation course and concept</b> — e.g. <i>Analog Electronic Circuits — closed-loop gain of the non-inverting amplifier</i>",
    "<b>How it was applied</b> — the equation with the team's numbers",
    "<b>Where courses meet</b> — a second course the decision depended on",
    "<b>Predicted</b> (dated before build) → <b>Measured</b> (Step 13, with instrument) → <b>Learning</b>"
  ]);

  /* ---------------- views ---------------- */
  var views = {};

  views.home = function () {
    var done = S.steps.filter(function (s) { return s.status === "done"; }).length;
    var strip = S.steps.map(function (s, i) {
      return '<div class="seg ' + s.status + '" style="--i:' + i + '" title="' + s.n + " · " + esc(s.label) + '"><i></i></div>';
    }).join("");
    var labels = S.steps.map(function (s) { return "<span>" + String(s.n).padStart(2, "0") + "</span>"; }).join("");
    var list = S.steps.map(function (s) {
      return "<div><b>" + String(s.n).padStart(2, "0") + "</b>" + esc(s.label) + '<span class="s ' + s.status + '">' + (s.status === "done" ? "Done" : s.status === "progress" ? "In progress" : "Next") + "</span></div>";
    }).join("");
    var cards = PAGES.filter(function (p) { return p.num > 0; }).map(function (p, i) {
      return '<a class="pcard glass spot lift ' + rv() + '" href="' + link(p) + '"><div class="n"><span>' + String(p.num).padStart(2, "0") + "</span><span>" + (p.steps === "—" ? "" : (p.steps === "all" ? "All steps" : "Step " + p.steps)) + "</span></div><h3>" + esc(p.title) + "</h3><p>" + esc(p.due) + "</p></a>";
    }).join("");
    var photo = S.teamPhoto
      ? '<img src="' + esc(S.teamPhoto) + '" alt="Team ' + esc(S.teamNo) + '">'
      : '<div class="ph">Team photo</div>';
    var teamPhotoBlock = S.showTeamPhoto === false ? "" : '<div class="team-photo glass reveal" style="--d:5">' + photo + "</div>";
    var nb = (S.notebook && S.notebook[0]) || null;
    return '<section class="hero">' +
      '<div class="eyebrow reveal">' + esc(S.theme) + " · " + esc(S.artefact) + " · Team " + esc(S.teamNo) + "</div>" +
      '<h1 class="reveal" style="--d:1">' + titleHTML(S.title, true) + "</h1>" +
      '<p class="lede reveal" style="--d:2">' + esc(S.subtitle) + "</p>" +
      '<div class="chips reveal" style="--d:3"><span class="chip"><b>EE-VDT</b> · KLE Technological University, Hubballi</span>' + (S.slug ? '<span class="chip">' + esc(S.slug) + "</span>" : "") + "</div>" +
      '<div class="hero-cta reveal" style="--d:4"><a class="btn primary" href="problem.html">Start with the problem</a><a class="btn ghost" href="notebook.html">Read the notebook</a></div>' +
      teamPhotoBlock + "</section>" +
      aboutHTML() +
      chainHTML() +
      sec("Inside the <em>chip</em>", "Scroll to pull the FPGA apart, layer by layer.", anatomyHTML()) +
      sec("Progress", done + " of 16 design steps complete.",
        '<div class="glass pad ' + rv() + '"><div class="strip">' + strip + '</div><div class="strip-labels">' + labels + "</div>" +
        '<div class="legend"><span><i style="background:var(--good)"></i>Done</span><span><i style="background:var(--accent)"></i>In progress</span><span><i style="background:color-mix(in srgb,var(--fg) 20%,transparent)"></i>Next</span></div>' +
        '<div class="steplist">' + list + "</div></div>") +
      sec("Latest update", "", '<div class="callout glass ' + rv() + '"><div class="big">' + fmtDate(S.latest.date) + "</div><p>" + esc(S.latest.text) + "</p></div>" +
        (nb ? '<div class="callout glass ' + rv() + '" style="margin-top:12px"><div class="big">Notebook · ' + fmtDate(nb.date) + "</div><p>" + esc(nb.objective) + "</p></div>" : "")) +
      sec("The portfolio", "Fifteen pages, in the order the project happened. Pages 2 to 10 follow the sixteen-step design chain.", '<div class="grid g4">' + cards + "</div>") +
      sec("The team", "", teamCards() + '<h3 style="margin:34px 0 14px" class="reveal">Faculty guides</h3>' + facultyCards());
  };

  function ul(list) { return "<ul>" + (list || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>"; }
  function aboutHTML() {
    var A = S.about; if (!A) return "";
    var objs = (A.objectives || []).map(function (o, i) { return "<li><i>" + String(i + 1).padStart(2, "0") + "</i><span>" + esc(o) + "</span></li>"; }).join("");
    var chips = function (arr) { return (arr || []).map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join(""); };
    return sec("About the <em>project</em>", esc(S.fullTitle || S.title),
      '<div class="about"><div class="about-main glass pad ' + rv() + '"><span class="tag blue">Objective</span><p class="about-obj">' + esc(A.objective) + "</p>" +
      (A.summary ? '<p class="muted about-sum">' + esc(A.summary) + "</p>" : "") + '<div class="chips">' + chips(A.domain) + "</div></div>" +
      '<div class="about-goals ' + rv() + '"><h3>Technical objectives</h3><ol>' + objs + "</ol></div></div>" +
      ((A.technologies || []).length ? '<div class="tech ' + rv() + '"><small>Technologies</small>' + chips(A.technologies) + "</div>" : ""));
  }
  /* interactive signal chain (home). Behaviour lives in motion.js */
  function chainHTML() {
    var C = S.chain; if (!C || !C.length) return "";
    function btn(c, i) {
      var p = byId[c.page];
      return '<button type="button" class="cblock ' + (c.group === "control" ? "ctl" : "sig") + '" data-id="' + esc(c.id) + '"' + (p ? ' data-href="' + esc(p.file) + '" data-page="' + esc(p.title) + '"' : "") + ' aria-pressed="false">' +
        '<span class="cb-n">' + String(i + 1).padStart(2, "0") + '</span><span class="cb-t"><b>' + esc(c.name) + "</b><span>" + esc(c.sub) + '</span></span><canvas class="cviz" data-viz="' + esc(c.viz || "wave-in") + '" aria-hidden="true"></canvas></button>';
    }
    var idx = {}; C.forEach(function (c, i) { idx[c.id] = i; });
    var sig = C.filter(function (c) { return c.group !== "control"; }), ctl = C.filter(function (c) { return c.group === "control"; });
    var sigHTML = sig.map(function (c, i) { return (i ? '<div class="carrow" aria-hidden="true"><i></i></div>' : "") + btn(c, idx[c.id]); }).join("");
    var ctlHTML = ctl.length ? '<div class="chain-ctl"><small>Gain-control path</small><div class="ctl-row">' + ctl.map(function (c, i) { return (i ? '<div class="carrow h" aria-hidden="true"><i></i></div>' : "") + btn(c, idx[c.id]); }).join("") + "</div>" + (S.chainNote ? '<p class="chain-note">' + esc(S.chainNote) + "</p>" : "") + "</div>" : "";
    var first = C[0];
    return sec("Signal <em>chain</em>", "Click any block to see what it does, then jump to the page where it is designed.",
      '<div class="chain" data-sel="' + esc(first.id) + '"><div class="chain-diagram glass ' + rv() + '"><div class="cbus" aria-hidden="true"><i></i></div><div class="chain-sig">' + sigHTML + "</div>" + ctlHTML + "</div>" +
      '<aside class="chain-detail glass ' + rv() + '" aria-live="polite"><div class="cd-top"><span class="cd-n"></span><span class="tag blue cd-grp"></span></div><h3 class="cd-title"></h3><p class="cd-sub"></p><canvas class="cd-viz" aria-hidden="true"></canvas><p class="cd-info"></p><ul class="cd-facts"></ul>' +
      '<div class="cd-actions"><a class="btn primary cd-link" href="#">Open page</a><button type="button" class="btn ghost cd-next">Next block →</button></div></aside></div>');
  }
  function flowHTML(a) {
    if (!a.flow || !a.flow.length) return "";
    var nodes = a.flow.map(function (f, i) {
      return (i ? '<div class="farrow" aria-hidden="true"><i></i></div>' : "") + '<div class="fnode n' + i + '"><b>' + esc(f.name) + "</b><span>" + esc(f.sub) + "</span></div>";
    }).join("");
    var ctl = a.controlPath ? '<div class="fctl"><div class="fup" aria-hidden="true"><i></i></div><div class="fnode ctl"><b>' + esc(a.controlPath.name) + "</b><span>" + esc(a.controlPath.sub) + "</span></div></div>" : "";
    return '<div class="flow glass ' + rv() + '"><div class="flow-row">' + nodes + "</div>" + ctl + "</div>";
  }
  /* scroll-driven exploded view of the FPGA (animated by motion.js) */
  function anatomyHTML() {
    var steps = [
      ["Board", "The traces carry the signal in and the amplified result out."],
      ["Pins", "Every connection to the outside world passes through the package pins."],
      ["Die", "The logic that selects the gain lives here."],
      ["Package", "Sealed and labelled: the FPGA at the heart of the design."]
    ];
    var li = steps.map(function (s, i) { return '<li class="' + (i === 0 ? "on" : "") + '"><b><em>0' + (i + 1) + "</em>" + s[0] + "</b><p>" + s[1] + "</p></li>"; }).join("");
    return '<div class="anat" data-a="0"><div class="anat-track"><div class="anat-sticky">' +
      '<div class="anat-stage" aria-hidden="true"><div class="chip3d"><div class="idle">' +
      '<div class="layer l-board" style="--k:0"></div>' +
      '<div class="layer l-pins" style="--k:1"><i></i><i></i><i></i><i></i></div>' +
      '<div class="layer l-die" style="--k:2"></div>' +
      '<div class="layer l-lid" style="--k:3"><span>FPGA</span><small>Variable gain</small></div>' +
      '</div></div></div>' +
      '<div><ol class="anat-steps">' + li + '</ol><div class="anat-bar" aria-hidden="true"><i></i></div></div>' +
      "</div></div></div>";
  }
  function initials(n) { return n.split(/\s+/).map(function (w) { return w[0]; }).slice(0, 2).join("").toUpperCase(); }
  function teamCards() {
    return '<div class="grid g4">' + S.members.map(function (m) {
      var pic = m.photo ? '<img loading="lazy" src="' + esc(m.photo) + '" alt="' + esc(m.name) + '">' : "<span>" + esc(initials(m.name)) + "</span>";
      return '<div class="person glass spot lift ' + rv() + '"><div class="photo' + (m.photo ? "" : " blank") + '">' + pic + "</div><h3>" + esc(m.name) + '</h3><div class="usn">' + esc(m.usn) + '</div><div class="mail"><a href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a></div></div>";
    }).join("") + "</div>";
  }
  function facultyCards() {
    return '<div class="grid g4">' + S.faculty.map(function (f) {
      return '<div class="person glass spot lift ' + rv() + '"><h3>' + esc(f.name) + '</h3><div class="usn">' + esc(f.dept) + "</div></div>";
    }).join("") + "</div>";
  }

  views.team = function () {
    return sec("Members", "Each member writes their own reflection after every review.", teamCards()) +
      sec("Faculty guides", "", facultyCards());
  };

  views.problem = function () {
    var p = S.problem;
    var need = p.need ? '<div class="glass pad ' + rv() + '"><p style="font-size:20px;letter-spacing:-0.02em">' + esc(p.need) + "</p></div>"
      : empty("Need statement pending", "State what is required, in measurable terms, without naming a circuit.");
    var inputs = p.inputs.length ? table(["Parameter", "Value", "Unit", "Source", "Note"], p.inputs.map(function (i) {
      var c = i.source === "measured" ? "good" : i.source === "datasheet" ? "blue" : "warn";
      return R([esc(i.parameter), esc(i.value), esc(i.unit), '<span class="tag ' + c + '">' + esc(i.source) + "</span>", esc(i.note)]);
    })) : empty("No design inputs yet", "Every number needs a unit and a source: <b>measured</b>, <b>datasheet</b> or <b>assumed</b>.");
    var bg = p.background.length ? '<div class="grid g2">' + p.background.map(function (b) {
      return '<div class="glass pad spot ' + rv() + '"><span class="tag blue">' + esc(b.type) + "</span><h3 style='margin:10px 0 6px'>" + (b.link ? '<a href="' + esc(b.link) + '">' + esc(b.title) + "</a>" : esc(b.title)) + '</h3><p class="muted">' + esc(b.learned) + "</p></div>";
    }).join("") + "</div>" : empty("Background study pending", "List each datasheet, application note or reference design studied, and what the team learned from it.");
    var frs = p.candidateFRs.length ? '<div class="grid g3">' + p.candidateFRs.map(function (f) {
      return '<div class="glass pad ' + rv() + '"><span class="tag">' + esc(f.id) + "</span><p style='margin-top:10px'>" + esc(f.text) + "</p></div>";
    }).join("") + "</div>" : empty("Three candidate FRs needed for Review 1", "Draft requirements only — they are frozen at Review 3.");
    var unk = p.unknowns.length ? '<div class="glass pad ' + rv() + '"><ul style="padding-left:18px">' + p.unknowns.map(function (u) { return "<li>" + esc(u) + "</li>"; }).join("") + "</ul></div>" : "";
    return sec("Need statement", "", need) +
      sec("Design inputs", "Quantified, with units and where each number came from.", inputs) +
      sec("Background study", "What we read, and what each source taught us.", bg) +
      sec("Candidate functional requirements", "Three drafts to carry into the concept stage.", frs) +
      (unk ? sec("Still unknown", "", unk) : "") + decisionsFor("problem");
  };

  views.concepts = function () {
    var c = S.concepts;
    var matrix;
    if (c.alternatives.length && c.criteria.length) {
      var totals = c.alternatives.map(function (a) {
        return c.criteria.reduce(function (t, k) { return t + (k.weight * ((a.scores || {})[k.name] || 0)); }, 0);
      });
      var best = Math.max.apply(null, totals);
      var rows = c.alternatives.map(function (a, i) {
        return R([ "<b>" + esc(a.name) + "</b>" ].concat(c.criteria.map(function (k) { return esc((a.scores || {})[k.name] == null ? "—" : a.scores[k.name]); }), ["<b>" + totals[i] + "</b>"]), totals[i] === best ? "best" : "");
      });
      var heads = ["Concept"].concat(c.criteria.map(function (k) { return k.name + " (×" + k.weight + ")"; }), ["Weighted total"]);
      var nums = c.criteria.map(function (_, i) { return i + 1; }).concat([c.criteria.length + 1]);
      matrix = table(heads, rows, nums);
    } else matrix = empty("Comparison matrix pending", "Add <code>criteria</code> (with weights) and <code>alternatives</code> (with scores) in data.js — totals are calculated for you.");
    var alts = c.alternatives.length ? '<div class="grid g3">' + c.alternatives.map(function (a) {
      return '<div class="glass spot ' + rv() + '" style="overflow:hidden">' + (a.sketch ? '<img loading="lazy" src="' + esc(a.sketch) + '" alt="Sketch of ' + esc(a.name) + '">' : "") + '<div class="pad"><h3>' + esc(a.name) + '</h3><p class="muted" style="margin-top:6px">' + esc(a.summary) + "</p>" + ((a.pros || []).length ? '<h4 class="pc-h">Advantages</h4><div class="pc pro">' + ul(a.pros) + "</div>" : "") + ((a.cons || []).length ? '<h4 class="pc-h">Limitations</h4><div class="pc con">' + ul(a.cons) + "</div>" : "") + (a.rejectedBecause ? '<p style="margin-top:10px;font-size:13.5px"><span class="tag warn">Set aside</span> ' + esc(a.rejectedBecause) + "</p>" : "") + "</div></div>";
    }).join("") + "</div>" : empty("At least three alternatives needed for Review 2", "Add sketches and a one-line summary each. Rejected options stay on the site, with the reason.");
    var chosen = c.chosen ? '<div class="callout glass ' + rv() + '"><div class="big">Chosen</div><div><p><b>' + esc(c.chosen) + "</b></p><p class='muted' style='font-size:15px;margin-top:6px'>" + esc(c.reason) + "</p></div></div>" : "";
    var scope = (c.scopeIn.length || c.scopeOut.length) ? '<div class="grid g2" style="margin-top:16px"><div class="glass pad ' + rv() + '"><h3>In scope</h3><ul style="padding-left:18px;margin-top:8px">' + c.scopeIn.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></div><div class="glass pad ' + rv() + '"><h3>Out of scope</h3><ul style="padding-left:18px;margin-top:8px">' + c.scopeOut.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div></div>" : "";
    var cmp = c.comparison && c.comparison.rows && c.comparison.rows.length ? table(c.comparison.heads, c.comparison.rows.map(function (r) { return R(r.map(function (x, i) { return i ? esc(x) : "<b>" + esc(x) + "</b>"; })); })) : "";
    return sec("Alternatives", "At least three, sketched and compared fairly.", alts) +
      (cmp ? sec("The methods side by side", "Feature-by-feature comparison of the three gain-control methods.", cmp) : "") +
      sec("Comparison", "Weighted criteria. The highest total is highlighted.", matrix) +
      sec("Decision", "", (chosen || empty("Concept not chosen yet", "Record the chosen concept and the reason.")) + scope) + decisionsFor("concepts");
  };

  views.requirements = function () {
    var frozen = S.frFrozen ? '<div class="callout glass ' + rv() + '"><div class="big">Frozen</div><p>FR table frozen on <b>' + fmtDate(S.frFrozen) + "</b>. Changes after this date appear in the history below.</p></div>" : '<div class="callout glass ' + rv() + '"><div class="big">Draft</div><p>The FR table is not frozen yet. Freeze date is a hard gate at Review 3.</p></div>';
    var rows = S.fr.map(function (f) {
      var c = f.status === "frozen" ? "good" : f.status === "changed" ? "warn" : "";
      return R(["<b>" + esc(f.id) + "</b>", esc(f.requirement), esc(f.target), esc(f.method), esc(f.source), '<span class="tag ' + c + '">' + esc(f.status) + "</span>"]);
    });
    var hist = S.frHistory.length ? table(["Date", "FR", "Change", "Reason"], S.frHistory.map(function (h) { return R([fmtDate(h.date), esc(h.fr), esc(h.change), esc(h.reason)]); })) : empty("No changes after freeze", "Any change to an FR after the freeze date is logged here with the reason.");
    return sec("Status", "", frozen) +
      sec("Functional requirements table", "Each FR has a number, a target, a measurement method and a source.", rows.length ? table(["No.", "Requirement", "Target", "Method", "Source", "Status"], rows) : empty("FR table empty", "Add rows to <code>fr</code> in data.js.")) +
      sec("Change history", "", hist) + decisionsFor("requirements");
  };

  views.architecture = function () {
    var a = S.architecture;
    var diag = a.diagram ? fig({ type: "image", src: a.diagram, caption: "Block diagram — each block shows its input, output and governing FR." }) : empty("Block diagram pending", "Add the diagram at assets/img and set <code>architecture.diagram</code>.");
    var blocks = a.blocks.length ? table(["Block", "Input", "Output", "Governing FR"], a.blocks.map(function (b) { return R(["<b>" + esc(b.name) + "</b>", esc(b.input), esc(b.output), '<span class="tag blue">' + esc(b.fr) + "</span>"]); })) : "";
    var ch = a.subsystemChoices.length ? '<div class="grid g2">' + a.subsystemChoices.map(function (s) {
      return '<div class="glass pad spot ' + rv() + '"><h3>' + esc(s.subsystem) + '</h3><p class="muted" style="margin:8px 0">' + s.options.map(function (o) { return '<span class="tag' + (o === s.chosen ? " good" : "") + '">' + esc(o) + "</span>"; }).join(" ") + "</p><p style='font-size:14.5px'>" + esc(s.reason) + "</p></div>";
    }).join("") + "</div>" : empty("Subsystem alternatives pending", "For each block list the options considered, the selection, and why.");
    var paths = (a.paths || []).length ? '<div class="grid g2" style="margin-top:14px">' + a.paths.map(function (p) { return '<div class="glass pad ' + rv() + '"><h3>' + esc(p.title) + '</h3><ol class="steps-ol">' + p.steps.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div>"; }).join("") + "</div>" : "";
    var note = a.note ? '<div class="callout glass ' + rv() + '" style="margin-top:14px"><div class="big">Important</div><p>' + esc(a.note) + "</p></div>" : "";
    var hier = (a.hierarchy || []).length ? '<div class="grid g3">' + a.hierarchy.map(function (h, i) { return '<div class="glass pad hier ' + rv() + '"><span class="tag ' + (i ? "" : "good") + '">' + esc(h.label) + "</span><p>" + esc(h.text) + "</p></div>"; }).join("") + "</div>" : "";
    return sec("System flow", "The analog signal path and the gain-control path.", flowHTML(a) + paths + note) +
      sec("Block diagram", "", diag + (blocks ? '<div style="margin-top:16px">' + blocks + "</div>" : "")) +
      sec("Subsystem selection", "Alternatives considered for each block.", ch) + (hier ? sec("Design hierarchy", "", hier) : "") + decisionsFor("architecture");
  };

  views.design = function () {
    var D = S.design;
    var calcs = D.calcs.length ? '<div class="grid g2">' + D.calcs.map(function (c) {
      return '<div class="calc glass spot ' + rv() + '"><div class="dcard-top"><span class="tag blue">' + esc(c.fr) + '</span><span class="faint" style="font-size:13px">' + fmtDate(c.date) + "</span></div><h3>" + esc(c.title) + '</h3><div class="eq">' + esc(c.equation) + '</div><p class="muted" style="font-size:14px">' + esc(c.values) + '</p><div class="res"><div><small>Result</small><b>' + esc(c.result) + "</b></div><div><small>Margin</small><b>" + esc(c.margin) + "</b></div></div></div>";
    }).join("") + "</div>" : empty("No calculation cards yet", "One card per calculation: FR served, equation, values, result, margin — dated before purchase.");
    var comps = D.components.length ? table(["Part", "Role", "Why chosen", "Alternatives", "Date"], D.components.map(function (c) { return R(["<b>" + esc(c.part) + "</b>", esc(c.role), esc(c.reason), esc(c.alternatives), fmtDate(c.date)]); })) : empty("Component selection pending", "Each part with the reason it was chosen and what it was chosen over.");
    var bom = D.bom.length ? table(["Part", "Value", "Qty", "Source", "Cost"], D.bom.map(function (b) { return R([esc(b.part), esc(b.value), esc(b.qty), esc(b.source), esc(b.cost)]); }), [2, 4]) : empty("BOM pending", "List every part before purchase.");
    return sec("Calculations", "Each calculation traceable to the FR it serves.", calcs) +
      sec("Component selection", "", comps) +
      sec("Schematic and simulation", "", mediaGrid(D.media, "Schematic pending", "Add the schematic and the critical-block simulation with captions.")) +
      sec("Bill of materials", "", bom) + decisionsFor("design");
  };

  views.integration = function () {
    var counts = S.courses.map(function (c) {
      return { name: c, n: (S.decisions || []).filter(function (x) { return (x.courses || []).some(function (k) { return k.course === c; }); }).length };
    });
    var max = Math.max.apply(null, counts.map(function (c) { return c.n; }).concat([1]));
    var strip = counts.map(function (c) {
      return '<div class="cov"><span>' + esc(c.name) + '</span><div class="bar"><i data-w="' + Math.round(c.n / max * 100) + '"></i></div><b>' + c.n + "</b></div>";
    }).join("");
    var lv = { Named: 0, Applied: 0, Verified: 0 };
    (S.decisions || []).forEach(function (x) { lv[level(x)]++; });
    var map = S.map.length ? table(["Step", "Decision", "Course", "Concept", "Level"], S.map.map(function (m) { return R([esc(m.step), esc(m.decision), esc(m.course), esc(m.concept), '<span class="tag ' + (m.level === "Verified" ? "good" : m.level === "Applied" ? "blue" : "warn") + '">' + esc(m.level) + "</span>"]); })) : empty("Integration map pending", "Appendix D: one row per decision from step 03 to 13 — add rows to <code>map</code>.");
    var all = (S.decisions || []).length ? (S.decisions).map(decisionCard).join("") : empty("No decision cards yet", "The first cards should reach “Applied” level by Review 3.") + DECISION_TPL;
    return sec("Levels reached", "A course name alone is not integration. Named → Applied → Verified.",
      '<div class="grid g3"><div class="stat glass ' + rv() + '"><b>' + lv.Named + "</b><span>Named</span></div><div class=\"stat glass " + rv() + "\"><b>" + lv.Applied + "</b><span>Applied</span></div><div class=\"stat glass " + rv() + "\"><b>" + lv.Verified + "</b><span>Verified</span></div></div>") +
      sec("Foundation Integration Map", "", map) +
      sec("Course coverage strip", "Decision cards per foundation course. Compare with the usage levels for Theme 1 in Handbook Figure 3.", '<div class="glass pad ' + rv() + '">' + strip + "</div>" + (S.coverageNote ? '<p class="muted reveal" style="margin-top:14px">' + esc(S.coverageNote) + "</p>" : "")) +
      sec("All decision cards", "Each card also appears on the page of the step where the decision was made.", all);
  };

  views.build = function () {
    var B = S.build;
    var sims = B.sims.length ? '<div class="grid g2">' + B.sims.map(function (s) {
      return '<div class="glass spot ' + rv() + '" style="overflow:hidden">' + (s.src ? '<img loading="lazy" src="' + esc(s.src) + '" alt="' + esc(s.title) + '">' : "") + '<div class="pad"><span class="tag blue">' + esc(s.tool) + "</span><h3 style='margin:8px 0 4px'>" + esc(s.title) + '</h3><p class="muted" style="font-size:14px">' + esc(s.result) + "</p></div></div>";
    }).join("") + "</div>" : empty("No simulation results yet", "Testbench waveforms and simulation plots, each with a caption saying what it shows.");
    var tests = B.tests.length ? table(["Subsystem", "Date", "Test", "Result", ""], B.tests.map(function (t) { return R(["<b>" + esc(t.subsystem) + "</b>", fmtDate(t.date), esc(t.test), esc(t.result), '<span class="tag ' + (t.pass ? "good" : "warn") + '">' + (t.pass ? "Pass" : "Fail") + "</span>"]); })) : empty("No subsystem tests yet", "Each subsystem test record: what was tested, the result, pass or fail.");
    var dev = B.deviations.length ? table(["Date", "Deviation from schematic", "Reason"], B.deviations.map(function (x) { return R([fmtDate(x.date), esc(x.what), esc(x.reason)]); })) : empty("No deviations recorded", "Any change from the schematic goes here with the reason.");
    return sec("Simulation and testbench", "", sims) + sec("Subsystem tests", "", tests) +
      sec("Integration photos and videos", "", mediaGrid(B.media, "Build photos pending", "Photographs against the schematic, with captions.")) +
      sec("Deviations", "", dev) + decisionsFor("build");
  };

  views.validation = function () {
    var rows = S.fr.map(function (f) {
      return R(["<b>" + esc(f.id) + "</b>", esc(f.target), esc(f.predicted) || '<span class="faint">—</span>', esc(f.measured) || '<span class="faint">—</span>', esc(f.deviation) || '<span class="faint">—</span>', esc(f.explanation) || '<span class="faint">—</span>']);
    });
    var V = S.validation;
    var inst = V.instruments.length ? table(["Instrument", "Settings"], V.instruments.map(function (i) { return R([esc(i.instrument), esc(i.settings)]); })) : empty("Instrument settings pending", "Record each instrument and its settings.");
    var plan = (V.plan || []).length ? table(["Parameter", "What to measure"], V.plan.map(function (p) { return R(["<b>" + esc(p.parameter) + "</b>", esc(p.measure)]); })) : "";
    return (plan ? sec("Measurement plan", "Planned measurements only. No values are shown until they are measured on the bench.", plan) : "") + sec("Validation sheet", "Predicted, measured, deviation and explanation for every FR (Appendix G).", rows.length ? table(["FR", "Target", "Predicted", "Measured", "Deviation", "Explanation"], rows) : empty("Nothing to validate yet", "FRs from the requirements page appear here automatically.")) +
      sec("Instruments", "", inst) + sec("Setup", "", mediaGrid(V.media, "Setup photo pending", "Photograph of the measurement setup.")) +
      sec("One improvement, re-measured", "", V.improvement ? '<div class="glass pad ' + rv() + '"><p>' + esc(V.improvement) + "</p></div>" : empty("Not yet", "Describe the improvement and the re-measurement.")) + decisionsFor("validation");
  };

  views.failures = function () {
    var n = S.failures.length, need = S.failuresRequired;
    var pct = Math.min(100, Math.round(n / need * 100));
    var head = '<div class="stat glass ' + rv() + '"><b>' + n + " / " + need + '</b><span>failure cycles logged (at least ' + need + " by the Final Review)</span><div class=\"meter\"><i data-w=\"" + pct + '"></i></div></div>';
    var cards = n ? S.failures.map(function (f) {
      return '<article class="dcard glass spot ' + rv() + '"><div class="dcard-top"><span class="tag warn">Failure</span><span class="faint" style="font-size:13px">' + fmtDate(f.date) + '</span></div><h3>' + esc(f.symptom) + '</h3><dl class="dl"><dt>Test performed</dt><dd>' + esc(f.test) + "</dd><dt>Root cause</dt><dd>" + esc(f.rootCause) + "</dd><dt>Correction</dt><dd>" + esc(f.correction) + "</dd><dt>Re-measured</dt><dd>" + esc(f.remeasured) + "</dd><dt>Learning</dt><dd>" + esc(f.course ? f.course + " — " : "") + esc(f.learning) + "</dd></dl></article>";
    }).join("") : empty("No failures logged yet", "Failures are evidence of learning. Log: symptom → test → root cause → correction → re-measurement → learning.");
    return sec("Debugging log", "", head) + sec("Cycles", "", cards) + decisionsFor("failures");
  };

  views.notebook = function () {
    var nb = S.notebook;
    var weeks = {};
    nb.forEach(function (e) { var t = new Date(e.date + "T00:00:00"); if (!isNaN(t)) { var k = Math.floor((t - new Date(2026, 0, 1)) / 604800000); weeks[k] = 1; } });
    var stats = '<div class="grid g3"><div class="stat glass ' + rv() + '"><b>' + nb.length + "</b><span>dated entries</span></div><div class=\"stat glass " + rv() + "\"><b>" + Object.keys(weeks).length + "</b><span>weeks with at least one entry</span></div><div class=\"stat glass " + rv() + "\"><b>" + (nb[0] ? fmtDate(nb[0].date) : "—") + "</b><span>latest entry</span></div></div>";
    var items = nb.map(function (e) {
      return '<article class="entry glass spot ' + rv() + '"><div class="date">' + fmtDate(e.date) + (e.author ? " · " + esc(e.author) : "") + "</div><h3>" + esc(e.objective) + "</h3><dl><dt>Decision / calc</dt><dd>" + esc(e.decision) + "</dd><dt>Course used</dt><dd>" + esc(e.course) + "</dd><dt>Learning</dt><dd>" + esc(e.learning) + "</dd><dt>Next action</dt><dd>" + esc(e.next) + "</dd></dl></article>";
    }).join("");
    return sec("Rhythm", "Monday: plan the week. During the week: post calculations and predictions as they are made. Friday: close with what was learned.", stats) +
      sec("Entries", "Newest first.", '<div class="timeline">' + (items || empty("No entries yet", "Add the first entry to <code>notebook</code> in data.js.")) + "</div>");
  };

  views.reviews = function () {
    var cards = REVIEWS.map(function (r) {
      var date = S.reviewDates[r.id];
      var items = r.evidence.split(";").map(function (t, i) {
        var key = "chk-" + r.id + "-" + i, on = store.get(key) === "1";
        return '<label class="check"><input type="checkbox" data-key="' + key + '"' + (on ? " checked" : "") + "><span>" + esc(t.trim()) + "</span></label>";
      }).join("");
      return '<div class="review glass spot ' + rv() + '"><h3><span>' + esc(r.name) + '</span><span class="tag blue">' + esc(r.marks) + " marks</span></h3><div class=\"sub\">" + esc(r.weeks) + " · pages live: " + esc(r.pages) + (date ? " · <b>" + fmtDate(date) + "</b>" : " · date to be announced") + "</div>" + items + "</div>";
    }).join("");
    var rec = S.reviewRecord.length ? table(["Review", "Faculty observation", "Team response", "Where to see it"], S.reviewRecord.map(function (r) {
      return R([esc(r.review) + (r.date ? '<br><span class="faint">' + fmtDate(r.date) + "</span>" : ""), "“" + esc(r.observation) + "”", esc(r.response), r.href ? '<a href="' + esc(r.href) + '">' + esc(r.where) + "</a>" : esc(r.where)]);
    })) : empty("No reviews held yet", "After each review, record the faculty observation verbatim, the team response, and the page where the change was made.");
    var q = QUALITY.map(function (t, i) {
      var key = "q-" + i, on = store.get(key) === "1";
      return '<label class="check"><input type="checkbox" data-key="' + key + '"' + (on ? " checked" : "") + "><span>" + esc(t) + "</span></label>";
    }).join("");
    return sec("Review record", "Every faculty observation answered, with a link to the change.", rec) +
      sec("Review checklist", "Pages shown at a review must carry a date stamp earlier than the review date. Ticks are saved in this browser only.", '<div class="grid g2">' + cards + "</div>") +
      sec("Portfolio quality check", "The eight questions mentors use.", '<div class="glass pad ' + rv() + '">' + q + "</div>");
  };

  views.reflections = function () {
    var byM = S.members.map(function (m) {
      var list = S.reflections.filter(function (r) { return r.member === m.name; });
      return '<div class="glass pad ' + rv() + '"><div class="avatar">' + initials(m.name) + "</div><h3>" + esc(m.name) + "</h3>" +
        (list.length ? list.map(function (r) { return '<div style="margin-top:16px"><span class="tag blue">' + esc(r.review) + '</span> <span class="faint" style="font-size:13px">' + fmtDate(r.date) + '</span><p style="margin-top:8px">' + esc(r.text) + "</p></div>"; }).join("") : '<p class="muted" style="margin-top:10px">No reflection yet. Each member writes one after every review.</p>') + "</div>";
    }).join("");
    function ul(a, t) { return '<div class="glass pad ' + rv() + '"><h3>' + t + "</h3>" + (a.length ? '<ul style="padding-left:18px;margin-top:10px">' + a.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : '<p class="muted" style="margin-top:8px">Completed at the Final Review.</p>') + "</div>"; }
    return sec("Individual reflections", "In each member's own voice, after every review.", '<div class="grid g2">' + byM + "</div>") +
      sec("Forward links", "", '<div class="grid g3">' + ul(S.lessons.minor, "For the Minor Project") + ul(S.lessons.cohort, "For the next cohort") + ul(S.lessons.carry, "Concepts carrying into Sem VI–VII") + "</div>");
  };

  views.demo = function () {
    var v = S.demo.video, vid;
    if (!v) vid = empty("Demo video pending", "A 3–5 minute video walking through every FR. Set <code>demo.video</code> to an mp4 path or an embed URL.");
    else vid = fig({ type: /\.(mp4|webm|mov)$/i.test(v) ? "video" : "embed", src: v, caption: "Demonstration of every functional requirement." });
    var frs = S.fr.length ? '<div class="glass pad ' + rv() + '"><ol style="padding-left:20px">' + S.fr.map(function (f) { return "<li style='margin:6px 0'><b>" + esc(f.id) + "</b> — " + esc(f.requirement) + "</li>"; }).join("") + "</ol></div>" : "";
    var poster = S.demo.poster ? fig({ type: "image", src: S.demo.poster, caption: "Summary poster." }) : empty("Poster pending", "Summary poster for the Final Review.");
    return sec("Demo video", "", vid) + (frs ? sec("FRs covered", "", frs) : "") + sec("Summary poster", "", poster);
  };

  views.files = function () {
    var items = S.files.map(function (f) {
      var ok = !!f.href;
      return (ok ? '<a href="' + esc(f.href) + '" target="_blank" rel="noopener"' : "<div") + ' class="pcard glass spot lift ' + rv() + '" style="' + (ok ? "" : "opacity:.65") + '"><div class="n"><span>' + esc(f.note) + "</span><span>" + (ok ? "Open ↗" : "Pending") + "</span></div><h3>" + esc(f.label) + "</h3></" + (ok ? "a" : "div") + ">";
    }).join("");
    return sec("Repository links", "This is the only repository-style page. Every other page carries reasoning, evidence and learning. The formal report remains the summative document; this portfolio links to it and does not duplicate it.", '<div class="grid g2">' + items + "</div>");
  };

  /* ---------------- shell ---------------- */
  function navHTML(cur) {
    var main = ["problem", "requirements", "design", "failures", "notebook"];
    var links = main.map(function (id) { var p = byId[id]; return '<a href="' + p.file + '"' + (cur === id ? ' class="active"' : "") + ">" + p.short + "</a>"; }).join("");
    var groups = {};
    PAGES.forEach(function (p) { (groups[p.group] = groups[p.group] || []).push(p); });
    var i = 0;
    var menu = Object.keys(groups).map(function (g) {
      return "<div><h4>" + g + "</h4>" + groups[g].map(function (p) {
        return '<a class="mi" style="--i:' + (i++) + '" href="' + p.file + '"><em>' + (p.num ? String(p.num).padStart(2, "0") : "·") + "</em>" + esc(p.num === 0 ? "Home" : p.short) + "</a>";
      }).join("") + "</div>";
    }).join("");
    return '<header class="nav"><div class="nav-inner"><a class="brand" href="index.html"><span class="dot"></span>VDT Mini Project <small>Team ' + esc(S.teamNo) + '</small></a><nav class="nav-links">' + links + '</nav>' +
      '<button class="icon-btn" id="themeBtn" aria-label="Toggle theme"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>' +
      '<button class="icon-btn menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false"><span class="burger"><i></i><i></i></span></button></div></header>' +
      '<div class="menu" id="menu"><div class="menu-inner">' + menu + "</div></div>";
  }

  function pageHead(p) {
    if (p.id === "home") return "";
    var upd = (S.pageUpdated && S.pageUpdated[p.id]) || S.defaultUpdated;
    return '<header class="page-head"><div class="eyebrow reveal">Page ' + p.num + (p.steps !== "—" && p.steps !== "all" ? " · Design step " + p.steps : p.steps === "all" ? " · All steps" : "") + "</div>" +
      '<h1 class="reveal" style="--d:1">' + titleHTML(p.title, false) + "</h1>" +
      '<p class="lede reveal" style="--d:2">' + esc(p.holds) + "</p>" +
      '<div class="chips reveal" style="--d:3"><span class="chip">First due <b>' + esc(p.due) + '</b></span><span class="chip">Updated <b>' + fmtDate(upd) + "</b></span></div></header>";
  }

  function pager(p) {
    var i = PAGES.indexOf(p), prev = PAGES[i - 1], next = PAGES[i + 1];
    if (p.id === "home") return "";
    return '<nav class="pager">' + (prev ? '<a class="glass spot lift reveal" href="' + prev.file + '"><small>← Previous</small><b>' + esc(prev.title) + "</b></a>" : "<span></span>") +
      (next ? '<a class="glass spot lift next reveal" href="' + next.file + '"><small>Next →</small><b>' + esc(next.title) + "</b></a>" : "") + "</nav>";
  }

  function init() {
    var id = document.body.getAttribute("data-page") || "home";
    var p = byId[id] || byId.home;
    document.title = (p.id === "home" ? S.title : p.title + " — " + S.title) + " · Team " + S.teamNo;
    var saved = store.get("theme");
    if (saved) document.documentElement.setAttribute("data-theme", saved);

    document.body.insertAdjacentHTML("afterbegin",
      '<div class="ambient"></div>' + navHTML(id));
    var main = document.getElementById("content");
    main.innerHTML = pageHead(p) + (views[id] ? views[id]() : "") + pager(p);
    document.body.insertAdjacentHTML("beforeend",
      "<footer><span>EE-VDT · " + esc(S.dept) + "<br>" + esc(S.school) + "</span>" + (S.slug ? '<span class="foot-slug">' + esc(S.slug) + "</span>" : "") + "</footer>");

    /* menu */
    var btn = document.getElementById("menuBtn");
    function setMenu(o) { document.body.classList.toggle("menu-open", o); btn.setAttribute("aria-expanded", o); document.body.style.overflow = o ? "hidden" : ""; }
    btn.addEventListener("click", function () { setMenu(!document.body.classList.contains("menu-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

    /* theme */
    document.getElementById("themeBtn").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var isDark = cur ? cur === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      var next = isDark ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next); store.set("theme", next);
    });

    /* checkboxes persist */
    document.querySelectorAll("input[data-key]").forEach(function (c) {
      c.addEventListener("change", function () { store.set(c.getAttribute("data-key"), c.checked ? "1" : "0"); });
    });

    /* page transition */
    document.addEventListener("click", function (e) {
      var a = e.target.closest("a[href]");
      if (!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey) return;
      var h = a.getAttribute("href");
      if (!h || h.charAt(0) === "#" || /^(https?:|mailto:)/.test(h)) return;
      e.preventDefault(); document.body.classList.add("leaving");
      setTimeout(function () { location.href = h; }, 220);
    });
    window.addEventListener("pageshow", function (e) { if (e.persisted) document.body.classList.remove("leaving"); });

    /* nav shrink */
    var nav = document.querySelector(".nav");
    function onScroll() { nav.style.height = window.scrollY > 24 ? "46px" : "52px"; }
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

    /* reveal on scroll */
    var items = document.querySelectorAll(".reveal, .strip");
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("in");
          en.target.querySelectorAll("[data-w]").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
          io.unobserve(en.target);
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
      items.forEach(function (el) { io.observe(el); });
      /* strip's .in class is set on .strip's ancestor card too, so mark parent */
      document.querySelectorAll(".strip").forEach(function (s) {
        new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { s.parentElement.classList.add("in"); o.disconnect(); } }, { threshold: 0.3 }).observe(s);
      });
    } else {
      items.forEach(function (el) { el.classList.add("in"); });
      document.querySelectorAll("[data-w]").forEach(function (b) { b.style.width = b.getAttribute("data-w") + "%"; });
    }

    /* hidden admin entry: Ctrl+Shift+A, or triple-click the footer */
    document.addEventListener("keydown", function (e) { if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) { e.preventDefault(); location.href = "/admin"; } });
    /* works in every browser: just type the word "admin" anywhere on a page (not inside a field) */
    var typed = "";
    document.addEventListener("keydown", function (e) {
      var t = e.target && e.target.tagName; if (t === "INPUT" || t === "TEXTAREA" || t === "SELECT" || e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-5); if (typed === "admin") { typed = ""; location.href = "/admin"; }
    });
    var ft = document.querySelector("footer");
    if (ft) ft.addEventListener("click", function (e) { if (e.detail === 3) location.href = "/admin"; });

    /* a small "preview" ribbon when this browser is showing unpublished admin edits */
    try {
      if (localStorage.getItem("vdt_site_override") && !/[?&]nooverride/.test(location.search)) {
        var rb = document.createElement("a"); rb.className = "ribbon"; rb.href = "/admin"; rb.textContent = "Previewing unpublished edits · open admin";
        document.body.appendChild(rb);
      }
    } catch (e) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
