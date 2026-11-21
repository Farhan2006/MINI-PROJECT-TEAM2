/* Hidden admin editor for the portfolio.
   - Works on a copy of window.SITE (data.js) merged with this browser's saved working copy.
   - Autosaves to localStorage ("vdt_site_override"): the site shows those edits in THIS browser as a preview.
   - Publishing = writing assets/js/data.js to GitHub (token pasted by the admin), or downloading data.js. */
(function () {
  "use strict";
  var KEY = "vdt_site_override";
  var ORIGINAL = JSON.parse(JSON.stringify(window.SITE));
  var data;
  try { var saved = localStorage.getItem(KEY); data = saved ? Object.assign({}, ORIGINAL, JSON.parse(saved)) : JSON.parse(JSON.stringify(ORIGINAL)); }
  catch (e) { data = JSON.parse(JSON.stringify(ORIGINAL)); }
  delete data.contributions; /* removed from the site */
  (data.members || []).forEach(function (m) { delete m.subsystem; if (m.photo == null) m.photo = ""; }); /* subsystem removed from the site */
  if (data.showTeamPhoto == null) data.showTeamPhoto = true;
  (data.faculty || []).forEach(function (f) { if (/Sujata/i.test(f.name) && f.dept === "Department of VLSI") f.dept = "Head of Department of VLSI"; });

  /* ---------- helpers ---------- */
  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") el.className = attrs[k];
      else if (k === "text") el.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] !== false && attrs[k] != null) el.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return el;
  }
  function getPath(o, p) { if (!p) return o; return p.split(".").reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) { var ks = p.split("."), last = ks.pop(), t = o; ks.forEach(function (k) { if (t[k] == null || typeof t[k] !== "object") t[k] = {}; t = t[k]; }); t[last] = v; }
  function ensureArr(path) { var a = getPath(data, path); if (!Array.isArray(a)) { a = []; setPath(data, path, a); } return a; }
  var toastEl, toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 1800); }

  var stateEl, saveT;
  function dirty() { return JSON.stringify(strip(data)) !== JSON.stringify(strip(ORIGINAL)); }
  function strip(o) { var c = Object.assign({}, o); delete c.contributions; return c; }
  function refreshState() { var d = dirty(); stateEl.textContent = d ? "Unpublished changes" : "Matches published data.js"; stateEl.className = "cp-state" + (d ? " dirty" : ""); }
  function changed() {
    clearTimeout(saveT);
    saveT = setTimeout(function () { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { toast("Could not save locally (storage blocked)"); } refreshState(); }, 250);
    refreshState();
  }

  /* ---------- schema ---------- */
  function T(k, l, o) { return Object.assign({ k: k, l: l, t: "text" }, o || {}); }
  function A(k, l, o) { return T(k, l, Object.assign({ t: "area", full: true }, o || {})); }
  function N(k, l, o) { return T(k, l, Object.assign({ t: "num" }, o || {})); }
  function D(k, l, o) { return T(k, l, Object.assign({ t: "date" }, o || {})); }
  function L(k, l, o) { return T(k, l, Object.assign({ t: "lines", full: true }, o || {})); }
  function IMG(k, l, o) { return T(k, l, Object.assign({ t: "image", full: true, max: 1400 }, o || {})); }
  function S(k, l, opts, o) { return T(k, l, Object.assign({ t: "sel", o: opts }, o || {})); }
  var PAGE_IDS = ["problem", "concepts", "requirements", "architecture", "design", "build", "validation", "failures"];
  var MEDIA = [S("type", "Type", ["image", "video", "embed"]), IMG("src", "Image (upload) or video / embed URL"), T("caption", "Caption", { full: true })];

  var SECTIONS = [
    { g: "Overview", id: "general", n: "0", title: "Home and general", sub: "Title, subtitle, dates and the 16-step progress strip shown on the Home page.", blocks: [
      { f: [T("title", "Project title", { full: true }), T("fullTitle", "Full project title (shown in the About section)", { full: true }), T("subtitle", "Subtitle", { full: true }), T("dept", "Department", { full: true }), T("school", "School / university", { full: true }), T("slug", "Project slug"), T("theme", "Theme"), T("artefact", "Artefact"), T("teamNo", "Team number"),
        { k: "showTeamPhoto", l: "Team photo on the Home page", t: "bool", def: true, full: true, yes: "Show the team photo (untick to hide the whole block)" },
        { k: "teamPhoto", l: "Team photo", t: "image", full: true, max: 1800, wide: true }] },
      { path: "latest", label: "Latest update (Home)", f: [D("date", "Date"), A("text", "Text")] },
      { path: "about", label: "About the project (Home)", f: [A("objective", "Objective"), A("summary", "Summary"), T("domain", "Domain (comma-separated)", { t: "csv", full: true }), T("technologies", "Technologies (comma-separated)", { t: "csv", full: true })] },
      { path: "about.objectives", label: "Technical objectives", strings: true, hint: "One objective per line." },
      { f: [D("defaultUpdated", "Default 'last updated' date for pages")], label: "Page dates" },
      { path: "steps", label: "Design steps", hint: "Status drives the progress strip: done, progress or next.", rows: [N("n", "Step number"), T("label", "Label"), S("status", "Status", ["done", "progress", "next"])], title: "label", noReorder: false }
    ] },
    { g: "Overview", id: "team", n: "1", title: "Team and roles", sub: "Members with photos, and faculty guides. A member without a photo shows a blank frame.", blocks: [
      { path: "members", label: "Members", rows: [{ k: "photo", l: "Photo", t: "image", full: true, max: 800 }, T("name", "Name"), T("usn", "USN"), T("email", "Email", { full: true })], title: "name" },
      { path: "faculty", label: "Faculty guides", rows: [T("name", "Name"), T("dept", "Department")], title: "name" }
    ] },
    { g: "Design chain", id: "problem", n: "2", title: "Problem and need", sub: "Need statement, design inputs, background study and candidate requirements.", blocks: [
      { path: "problem", label: "Need statement", f: [A("need", "What is required, in measurable terms, without naming a circuit")] },
      { path: "problem.inputs", label: "Design inputs", rows: [T("parameter", "Parameter"), T("value", "Value"), T("note", "Note", { full: true })], title: "parameter" },
      { path: "problem.background", label: "Background study", rows: [T("title", "Source name"), S("type", "Type", ["datasheet", "app note", "reference design"]), A("learned", "What we learned"), T("link", "Link", { full: true })], title: "title" },
      { path: "problem.candidateFRs", label: "Candidate functional requirements", rows: [T("id", "ID (e.g. FR-01)"), T("text", "Requirement", { full: true }), A("acceptance", "Acceptance condition")], title: "id" },
      { path: "problem.unknowns", label: "Still unknown", strings: true, hint: "One item per line." }
    ] },
    { g: "Design chain", id: "concepts", n: "3", title: "Concept choices", sub: "Criteria, alternatives, scoring and the chosen concept.", blocks: [
      { path: "concepts.criteria", label: "Decision criteria", rows: [T("name", "Criterion"), N("weight", "Weight")], title: "name" },
      { path: "concepts.alternatives", label: "Alternatives", rows: [T("name", "Concept name"), IMG("sketch", "Sketch image"), A("summary", "Summary"), A("rejectedBecause", "Set aside because"), L("pros", "Advantages (one per line)"), L("cons", "Limitations (one per line)"), { k: "scores", l: "Scores per criterion", t: "scores" }], title: "name" },
      { path: "concepts", label: "Choice", f: [T("chosen", "Chosen concept", { full: true }), A("reason", "Reason")] },
      { path: "concepts.scopeIn", label: "In scope", strings: true, hint: "One item per line." },
      { path: "concepts.scopeOut", label: "Out of scope", strings: true, hint: "One item per line." },
      { path: "signalSelection", label: "Signal selection", f: [A("intro", "Introduction"), T("signals", "Signals scored (comma-separated, in column order)", { t: "csv", full: true }), T("scale", "Scoring note", { full: true }), T("selectedLabel", "Selection label"), T("selected", "Selected signal", { full: true }), L("justification", "Justification (one paragraph per line)")] },
      { path: "signalSelection.candidates", label: "Candidate signals", rows: [T("signal", "Signal"), T("characteristics", "Typical characteristics", { full: true }), T("application", "Application", { full: true })], title: "signal" },
      { path: "signalSelection.criteria", label: "Signal selection matrix", hint: "Weights are percentages. Scores: one number per signal, in the same order, comma-separated. Totals are calculated.", rows: [T("name", "Criterion"), N("weight", "Weight %"), { k: "scores", l: "Scores (comma-separated numbers)", t: "nums", full: true }], title: "name" },
      { path: "sensors", label: "Sensor selection", f: [A("intro", "Introduction"), A("statusNote", "Status note")] },
      { path: "sensors.candidates", label: "Candidate sensors", rows: [T("name", "Sensor"), IMG("image", "Photo"), A("text", "Description")], title: "name" },
      { path: "sensors.compare", label: "Sensor comparison table", f: [T("heads", "Column headings (comma-separated)", { t: "csv", full: true }), A("note", "Note under the table")] },
      { path: "sensors.compare.rows", label: "Comparison rows", hint: "The two value columns match the column headings above (SS49E, strain gauge).", rows: [T("parameter", "Parameter"), T("v1", "Column 2 value", { full: true }), T("v2", "Column 3 value", { full: true })], title: "parameter" },
      { path: "sensors", label: "SS49E design data", f: [T("specTitle", "Table title", { full: true }), T("specBadge", "Badge (optional)", { full: true })] },
      { path: "sensors.spec", label: "SS49E parameters", rows: [T("parameter", "Parameter"), T("value", "Value")], title: "parameter" },
      { path: "sensors.conditioning", label: "Sensor conditioning note", f: [T("title", "Title", { full: true }), A("intro", "Introduction"), T("equation", "Equation", { full: true })] },
      { path: "sensors.conditioning.terms", label: "Conditioning terms", rows: [T("term", "Term"), A("text", "Explanation")], title: "term" },
      { path: "sensors.strain", label: "Strain gauge data", f: [T("title", "Title", { full: true }), T("note", "Placeholder text while empty", { full: true })] },
      { path: "sensors.strain.rows", label: "Strain gauge parameters", hint: "Add rows here when the strain gauge data is ready.", rows: [T("parameter", "Parameter"), T("value", "Value")], title: "parameter" },
      { path: "controlVoltage", label: "Control voltage generation", f: [A("intro", "Introduction")] },
      { path: "controlVoltage.alternatives", label: "Control voltage alternatives", hint: "Leave the name empty to show a placeholder.", rows: [T("name", "Name"), A("summary", "Summary"), T("flow", "Signal path (comma-separated, e.g. FPGA, PWM, RC filter, Vctrl)", { t: "csv", full: true }), S("viz", "Mini diagram", ["", "pwm", "steps"]), L("pros", "Advantages (one per line)"), L("cons", "Limitations (one per line)")], title: "name" }
    ] },
    { g: "Design chain", id: "requirements", n: "4", title: "Functional requirements", sub: "The FR table with prediction vs measurement, and its change history.", blocks: [
      { f: [D("frFrozen", "Date the FR table was frozen")], label: "Freeze" },
      { path: "fr", label: "Requirements", rows: [T("id", "ID"), T("requirement", "Requirement", { full: true }), T("target", "Target"), T("method", "Method"), S("source", "Source", ["measured", "datasheet", "assumed"]), S("status", "Status", ["draft", "frozen", "changed"]), T("predicted", "Predicted"), T("measured", "Measured"), T("deviation", "Deviation"), A("explanation", "Explanation")], title: "id" },
      { path: "frHistory", top: true, label: "Change history", rows: [D("date", "Date"), T("fr", "FR"), T("change", "Change", { full: true }), A("reason", "Reason")], title: "fr" }
    ] },
    { g: "Design chain", id: "architecture", n: "5", title: "Architecture and subsystems", sub: "Block diagram, blocks and subsystem choices.", blocks: [
      { path: "architecture.flow", label: "System flow (left to right)", rows: [T("name", "Block"), T("sub", "Short description")], title: "name" },
      { path: "architecture.controlPath", label: "Gain-control path (shown under the flow)", f: [T("name", "Name"), T("sub", "Description", { full: true })] },
      { path: "architecture.paths", label: "Signal paths", rows: [T("title", "Title", { full: true }), L("steps", "Steps (one per line)")], title: "title" },
      { path: "architecture", label: "Important note", f: [A("note", "Highlighted note")] },
      { path: "architecture.circuit", label: "Gain stage circuit", f: [{ k: "show", l: "Show the circuit block", t: "bool", def: true, full: true, yes: "Show the Gain stage section" }, A("intro", "Introduction"), A("caption", "Caption under the circuit")] },
      { path: "architecture", label: "Diagram image", f: [IMG("diagram", "Block diagram image")] },
      { path: "architecture.blocks", label: "Blocks", rows: [T("name", "Block"), T("fr", "FR it serves"), T("input", "Input"), T("output", "Output")], title: "name" },
      { path: "architecture.hierarchy", label: "Design hierarchy", rows: [T("label", "Label (e.g. Primary design)"), A("text", "Description")], title: "label" },
      { path: "architecture.subsystemChoices", label: "Subsystem choices", rows: [T("subsystem", "Subsystem"), { k: "options", l: "Options considered (comma-separated)", t: "csv", full: true }, T("chosen", "Chosen"), A("reason", "Reason")], title: "subsystem" }
    ] },
    { g: "Design chain", id: "design", n: "6", title: "Design and calculations", sub: "Calculations, components, schematic media and bill of materials.", blocks: [
      { path: "design.calcs", top: true, label: "Calculations", rows: [T("title", "Title", { full: true }), T("fr", "FR"), D("date", "Date"), T("equation", "Equation", { full: true }), T("values", "Values", { full: true }), T("result", "Result"), T("margin", "Margin")], title: "title" },
      { path: "design.components", label: "Component selection", rows: [T("part", "Part"), T("role", "Role"), A("reason", "Why this part"), T("alternatives", "Alternatives"), D("date", "Date")], title: "part" },
      { path: "design.media", label: "Schematics and images", rows: MEDIA, title: "caption" },
      { path: "design.bom", label: "Bill of materials", rows: [T("part", "Part"), T("value", "Value"), N("qty", "Qty"), T("source", "Source"), T("cost", "Cost")], title: "part" }
    ] },
    { g: "Design chain", id: "integration", n: "7", title: "Foundation integration", sub: "Courses, decision cards and the integration map.", blocks: [
      { path: "courses", label: "The nine foundation courses", strings: true, hint: "One course per line." },
      { f: [A("coverageNote", "Coverage note (explain any under-represented course)")], label: "Coverage" },
      { path: "decisions", top: true, label: "Decision cards", rows: [T("id", "ID (D1…)"), S("page", "Made on page", PAGE_IDS), D("date", "Date"), T("decision", "Decision", { full: true }),
        { k: "options", l: "Options considered", t: "rows", cols: [T("name", "Option"), T("reason", "Reason", { full: true })] },
        T("fr", "Functional requirement addressed", { full: true }),
        { k: "courses", l: "Courses and concepts used", t: "rows", cols: [T("course", "Course"), T("concept", "Concept", { full: true })] },
        A("how", "How it was applied"), A("meets", "Where theory meets reality"), T("predicted", "Predicted"), D("predictedDate", "Predicted on"), T("measured", "Measured"), T("instrument", "Instrument"), A("learning", "Learning")], title: "id" },
      { path: "map", label: "Foundation Integration Map (Appendix D)", rows: [T("step", "Step"), T("decision", "Decision ID"), T("course", "Course"), T("concept", "Concept"), S("level", "Level", ["Named", "Applied", "Verified"])], title: "decision" }
    ] },
    { g: "Design chain", id: "build", n: "8", title: "Build and verification", sub: "Simulations, subsystem tests, build media and deviations.", blocks: [
      { path: "build.sims", label: "Simulations", rows: [T("title", "Title", { full: true }), T("tool", "Tool"), IMG("src", "Image"), A("result", "Result"), T("caption", "Caption", { full: true })], title: "title" },
      { path: "build.tests", top: true, label: "Subsystem tests", rows: [T("subsystem", "Subsystem"), D("date", "Date"), T("test", "Test", { full: true }), T("result", "Result", { full: true }), { k: "pass", l: "Passed", t: "bool" }], title: "subsystem" },
      { path: "build.media", label: "Build media", rows: MEDIA, title: "caption" },
      { path: "build.deviations", top: true, label: "Deviations", rows: [D("date", "Date"), T("what", "What changed", { full: true }), A("reason", "Why")], title: "what" }
    ] },
    { g: "Design chain", id: "validation", n: "9", title: "Predicted vs measured", sub: "Instruments, evidence and the improvement that was re-measured.", blocks: [
      { path: "validation.instruments", label: "Instruments", rows: [T("instrument", "Instrument"), T("settings", "Settings", { full: true })], title: "instrument" },
      { path: "validation.media", label: "Evidence media", rows: MEDIA, title: "caption" },
      { path: "validation.plan", label: "Measurement plan", hint: "What will be measured. Do not enter results here; results go in the Requirements table once measured.", rows: [T("parameter", "Parameter"), T("measure", "What to measure", { full: true })], title: "parameter" },
      { path: "validation", label: "Improvement", f: [A("improvement", "The one improvement that was re-measured")] }
    ] },
    { g: "Design chain", id: "failures", n: "10", title: "Failures and fixes", sub: "Failure cycles: symptom, root cause, correction and learning.", blocks: [
      { f: [N("failuresRequired", "Failure cycles required by the final review")], label: "Target" },
      { path: "failures", top: true, label: "Failure cycles", rows: [D("date", "Date"), T("course", "Course"), T("symptom", "Symptom", { full: true }), T("test", "How it was found", { full: true }), A("rootCause", "Root cause"), A("correction", "Correction"), T("remeasured", "Re-measured result", { full: true }), A("learning", "Learning")], title: "symptom" }
    ] },
    { g: "Evidence", id: "notebook", n: "11", title: "Engineering notebook", sub: "Dated entries, newest first.", blocks: [
      { path: "notebook", top: true, label: "Entries", rows: [D("date", "Date"), T("author", "Author"), T("objective", "Objective", { full: true }), A("decision", "Decision or calculation"), T("course", "Course used"), A("learning", "Learning"), A("next", "Next action")], title: "objective" }
    ] },
    { g: "Evidence", id: "reviews", n: "12", title: "Review record", sub: "Review dates and verbatim faculty observations with the team's response.", blocks: [
      { path: "reviewDates", label: "Review dates", f: [D("r1", "Review 1"), D("r2", "Review 2"), D("r3", "Review 3"), D("r4", "Review 4"), D("r5", "Review 5"), D("final", "Final review")] },
      { path: "reviewRecord", top: true, label: "Observations and responses", rows: [T("review", "Review"), D("date", "Date"), A("observation", "Faculty observation (verbatim)"), A("response", "What changed"), T("where", "Where it changed (e.g. Page 4, FR2)"), T("href", "Page link (e.g. requirements.html)")], title: "review" }
    ] },
    { g: "Evidence", id: "reflections", n: "13", title: "Reflections", sub: "Individual reflections and lessons.", blocks: [
      { path: "reflections", top: true, label: "Reflections", rows: [T("member", "Member"), T("review", "Review"), D("date", "Date"), A("text", "Reflection")], title: "member" },
      { path: "lessons.minor", label: "Lessons: minor", strings: true, hint: "One per line." },
      { path: "lessons.cohort", label: "Lessons: for the cohort", strings: true, hint: "One per line." },
      { path: "lessons.carry", label: "Lessons: to carry forward", strings: true, hint: "One per line." }
    ] },
    { g: "Closing", id: "demo", n: "14", title: "Final demonstration", sub: "Demo video and summary poster.", blocks: [
      { path: "demo", label: "Demo", f: [T("video", "Video (mp4 path, or YouTube/Drive embed URL)", { full: true }), IMG("poster", "Summary poster image")] }
    ] },
    { g: "Closing", id: "files", n: "15", title: "Project files", sub: "Links to the report, repositories, schematics and simulations.", blocks: [
      { path: "files", label: "Files", rows: [T("label", "Label", { full: true }), T("href", "Link", { full: true }), T("note", "Note")], title: "label" }
    ] },
    { g: "Tools", id: "publish", n: "↑", title: "Publish and backup", sub: "Send your edits live, or export and import them.", special: "publish" },
    { g: "Tools", id: "json", n: "{ }", title: "Advanced (raw JSON)", sub: "Edit everything directly. Invalid JSON is rejected.", special: "json" }
  ];

  /* ---------- field renderers ---------- */
  function defFor(cols) {
    var o = {};
    cols.forEach(function (c) { o[c.k] = c.t === "num" ? 0 : c.t === "bool" ? !!c.def : c.t === "sel" ? c.o[0] : c.t === "rows" || c.t === "csv" || c.t === "lines" || c.t === "nums" ? [] : c.t === "scores" ? {} : ""; });
    return o;
  }
  /* ---- images: resized in the browser, kept as data URLs until published ---- */
  function isDataUrl(s) { return typeof s === "string" && s.slice(0, 11) === "data:image/"; }
  function readImage(file, max, cb) {
    var fr = new FileReader();
    fr.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement("canvas");
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        var x = c.getContext("2d"); x.fillStyle = "#fff"; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL("image/jpeg", 0.86));
      };
      img.onerror = function () { alert("That file could not be read as an image."); };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  }
  function imageEl(c, obj) {
    var wrap = h("div", { class: "cp-f" + (c.full ? " full" : "") }, [h("label", { text: c.l })]);
    var thumb = h("div", { class: "cp-thumb" + (c.wide ? " wide" : "") }), pathIn = h("input", { type: "text", placeholder: "…or a path / URL, e.g. assets/img/photo.jpg" });
    var file = h("input", { type: "file", accept: "image/*", style: "display:none" });
    var upBtn = h("button", { class: "cp-btn sm", type: "button", onclick: function () { file.click(); } });
    var rmBtn = h("button", { class: "cp-btn sm danger", type: "button", text: "Remove", onclick: function () { obj[c.k] = ""; changed(); paint(); } });
    function paint() {
      var v = obj[c.k] || ""; thumb.innerHTML = "";
      if (v) thumb.appendChild(h("img", { src: v, alt: "" })); else thumb.appendChild(h("span", { text: "No photo" }));
      upBtn.textContent = v ? "Replace photo" : "Upload photo"; rmBtn.style.display = v ? "" : "none";
      pathIn.value = isDataUrl(v) ? "" : v; pathIn.placeholder = isDataUrl(v) ? "Uploaded photo (saved when you publish)" : "…or a path / URL, e.g. assets/img/photo.jpg";
    }
    file.addEventListener("change", function () { if (file.files[0]) readImage(file.files[0], c.max || 1200, function (u) { obj[c.k] = u; changed(); paint(); toast("Photo ready"); }); file.value = ""; });
    pathIn.addEventListener("input", function () { if (!isDataUrl(obj[c.k]) || pathIn.value) { obj[c.k] = pathIn.value.trim(); changed(); var v = obj[c.k]; thumb.innerHTML = ""; if (v) thumb.appendChild(h("img", { src: v, alt: "" })); else thumb.appendChild(h("span", { text: "No photo" })); upBtn.textContent = v ? "Replace photo" : "Upload photo"; rmBtn.style.display = v ? "" : "none"; } });
    paint();
    wrap.appendChild(h("div", { class: "cp-img" }, [thumb, h("div", { class: "cp-img-side" }, [h("div", { class: "cp-row-h" }, [upBtn, rmBtn, file]), pathIn])]));
    return wrap;
  }
  function fieldEl(c, obj, rerender) {
    if (c.t === "image") return imageEl(c, obj);
    if (c.t === "nums") {
      var nw = h("div", { class: "cp-f full" }, [h("label", { text: c.l })]);
      var nin = h("input", { type: "text", oninput: function () { obj[c.k] = nin.value.split(",").map(function (x) { return x.trim(); }).filter(function (x) { return x !== ""; }).map(Number); changed(); } });
      nin.value = (obj[c.k] || []).join(", "); nw.appendChild(nin); return nw;
    }
    if (c.t === "lines") {
      var lw = h("div", { class: "cp-f full" }, [h("label", { text: c.l })]);
      var lta = h("textarea", { style: "min-height:110px", oninput: function () { obj[c.k] = lta.value.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); changed(); } });
      lta.value = (obj[c.k] || []).join("\n"); lw.appendChild(lta); return lw;
    }
    var wrap = h("div", { class: "cp-f" + (c.full ? " full" : "") });
    var id = "f" + Math.random().toString(36).slice(2, 8);
    if (c.t === "rows") {
      wrap = h("div", { class: "cp-nested" }, [h("label", { text: c.l })]);
      if (!Array.isArray(obj[c.k])) obj[c.k] = [];
      wrap.appendChild(rowsEl(obj[c.k], c.cols, { title: c.cols[0].k, small: true }, rerender));
      return wrap;
    }
    if (c.t === "scores") {
      var crit = (getPath(data, "concepts.criteria") || []).map(function (x) { return x.name; }).filter(Boolean);
      wrap = h("div", { class: "cp-nested" }, [h("label", { text: c.l })]);
      if (!obj.scores || typeof obj.scores !== "object") obj.scores = {};
      if (!crit.length) { wrap.appendChild(h("div", { class: "cp-empty", text: "Add decision criteria above first." })); return wrap; }
      var grid = h("div", { class: "cp-scores" });
      crit.forEach(function (name) {
        var inp = h("input", { type: "number", min: 0, max: 5, step: 1, value: obj.scores[name] == null ? "" : obj.scores[name], oninput: function () { obj.scores[name] = inp.value === "" ? 0 : Number(inp.value); changed(); } });
        grid.appendChild(h("div", { class: "cp-f" }, [h("label", { text: name }), inp]));
      });
      wrap.appendChild(grid); return wrap;
    }
    if (c.t === "bool") {
      var cb = h("input", { type: "checkbox", onchange: function () { obj[c.k] = cb.checked; changed(); } }); cb.checked = obj[c.k] == null ? !!c.def : !!obj[c.k];
      wrap.appendChild(h("label", { text: c.l })); wrap.appendChild(h("label", { class: "chk" }, [cb, c.yes || "Yes"])); return wrap;
    }
    wrap.appendChild(h("label", { for: id, text: c.l }));
    var el, val = obj[c.k];
    if (c.t === "area") {
      el = h("textarea", { id: id, oninput: function () { obj[c.k] = el.value; changed(); } }); el.value = val == null ? "" : val;
    } else if (c.t === "sel") {
      el = h("select", { id: id, onchange: function () { obj[c.k] = el.value; changed(); } }, c.o.map(function (o) { return h("option", { value: o, text: o }); }));
      if (val && c.o.indexOf(val) < 0) el.appendChild(h("option", { value: val, text: val }));
      el.value = val == null || val === "" ? c.o[0] : val;
      if (val == null || val === "") { obj[c.k] = el.value; }
    } else if (c.t === "csv") {
      el = h("input", { id: id, type: "text", oninput: function () { obj[c.k] = el.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean); changed(); } }); el.value = (val || []).join(", ");
    } else if (c.t === "num") {
      el = h("input", { id: id, type: "number", step: "any", oninput: function () { obj[c.k] = el.value === "" ? 0 : Number(el.value); changed(); } }); el.value = val == null ? "" : val;
    } else if (c.t === "date") {
      el = h("input", { id: id, type: "date", oninput: function () { obj[c.k] = el.value; changed(); } }); el.value = val || "";
    } else {
      el = h("input", { id: id, type: "text", oninput: function () { obj[c.k] = el.value; changed(); } }); el.value = val == null ? "" : val;
    }
    wrap.appendChild(el); return wrap;
  }
  function fieldsEl(obj, cols, rerender) {
    var g = h("div", { class: "cp-fields" });
    cols.forEach(function (c) { g.appendChild(fieldEl(c, obj, rerender)); });
    return g;
  }
  function rowsEl(arr, cols, opt, rerender) {
    var box = h("div");
    function draw() {
      box.innerHTML = "";
      if (!arr.length) box.appendChild(h("div", { class: "cp-empty", text: "Nothing here yet." }));
      arr.forEach(function (item, i) {
        var tk = opt.title && item[opt.title] ? String(item[opt.title]).slice(0, 48) : "";
        var head = h("div", { class: "cp-row-h" }, [
          h("b", { text: "#" + (i + 1) + (tk ? " · " + tk : "") }),
          h("button", { class: "cp-btn sm", type: "button", title: "Move up", text: "↑", onclick: function () { if (i > 0) { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); changed(); draw(); } } }),
          h("button", { class: "cp-btn sm", type: "button", title: "Move down", text: "↓", onclick: function () { if (i < arr.length - 1) { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); changed(); draw(); } } }),
          h("button", { class: "cp-btn sm danger", type: "button", text: "Delete", onclick: function () { if (confirm("Delete this item?")) { arr.splice(i, 1); changed(); draw(); } } })
        ]);
        box.appendChild(h("div", { class: "cp-row" }, [head, fieldsEl(item, cols, draw)]));
      });
      box.appendChild(h("button", { class: "cp-btn", type: "button", text: "+ Add" + (opt.top ? " (newest first)" : ""), onclick: function () { var it = defFor(cols); if (opt.top) arr.unshift(it); else arr.push(it); changed(); draw(); } }));
    }
    draw(); return box;
  }
  function stringsEl(path) {
    var arr = ensureArr(path), ta = h("textarea", { style: "min-height:140px", oninput: function () { setPath(data, path, ta.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean)); changed(); } });
    ta.value = arr.join("\n");
    return h("div", { class: "cp-f full" }, [ta]);
  }

  /* ---------- views ---------- */
  var app, main, curId = "general";
  function block(b) {
    var card = h("section", { class: "cp-block glass" }, [h("h3", { text: b.label || "" })]);
    if (b.hint) card.appendChild(h("p", { class: "hint", text: b.hint }));
    if (b.f) { var obj = b.path ? (getPath(data, b.path) || (setPath(data, b.path, {}), getPath(data, b.path))) : data; card.appendChild(fieldsEl(obj, b.f)); }
    else if (b.rows) card.appendChild(rowsEl(ensureArr(b.path), b.rows, { title: b.title, top: b.top }));
    else if (b.strings) card.appendChild(stringsEl(b.path));
    return card;
  }
  function download(name, text, type) {
    var a = h("a", { href: URL.createObjectURL(new Blob([text], { type: type || "text/plain" })), download: name }); document.body.appendChild(a); a.click(); a.remove();
  }
  function dataJs() {
    var out = strip(data);
    return "/* Portfolio data. Edited via admin.html. Dates: YYYY-MM-DD. Newest entries first. */\nwindow.SITE = " + JSON.stringify(out, null, 2) + ";\n";
  }
  function parseImport(text) {
    var s = text.trim(), i = s.indexOf("{"), j = s.lastIndexOf("}");
    if (i < 0 || j < i) throw new Error("No JSON object found");
    return JSON.parse(s.slice(i, j + 1));
  }
  function utf8b64(s) { var b = new TextEncoder().encode(s), bin = ""; b.forEach(function (x) { bin += String.fromCharCode(x); }); return btoa(bin); }

  function publishView() {
    var wrap = h("div");
    wrap.appendChild(h("div", { class: "cp-note", text: "Edits you make here autosave in this browser only, and the site shows them to you as a preview. Visitors see changes only after you publish. Publishing writes assets/js/data.js to GitHub, which needs a GitHub token that only you have, so nobody else can publish from this page." }));
    var log = h("div", { class: "cp-log" });
    function say(msg, cls) { log.className = "cp-log show " + (cls || ""); log.textContent = msg; }

    var repo = h("input", { type: "text", value: localStorage.getItem("vdt_gh_repo") || "Swaroop087/MINI-PROJECT-TEAM2" });
    var br = h("input", { type: "text", value: localStorage.getItem("vdt_gh_branch") || "main" });
    var tok = h("input", { type: "password", placeholder: "github_pat_… (Contents: read & write)", autocomplete: "off", value: sessionStorage.getItem("vdt_gh_token") || "" });
    var msg = h("input", { type: "text", value: "Update portfolio content via admin" });
    var pub = h("section", { class: "cp-block glass" }, [h("h3", { text: "Publish to GitHub" }),
      h("p", { class: "hint", text: "Create a fine-grained token at github.com → Settings → Developer settings, limited to this repository with Contents: Read and write. The token is kept for this tab only (never saved to disk or to the site)." }),
      h("div", { class: "cp-gh" }, [h("div", null, [h("label", { text: "Repository (owner/name)" }), repo]), h("div", null, [h("label", { text: "Branch" }), br]), h("div", null, [h("label", { text: "Token" }), tok]), h("div", null, [h("label", { text: "Commit message" }), msg])]),
      h("button", { class: "cp-btn pri", type: "button", text: "Publish data.js", onclick: function () {
        var r = repo.value.trim(), b = br.value.trim() || "main", t = tok.value.trim();
        if (!/^[\w.-]+\/[\w.-]+$/.test(r)) return say("Repository must look like owner/name", "err");
        if (!t) return say("Paste a GitHub token first.", "err");
        localStorage.setItem("vdt_gh_repo", r); localStorage.setItem("vdt_gh_branch", b); sessionStorage.setItem("vdt_gh_token", t);
        var url = "https://api.github.com/repos/" + r + "/contents/assets/js/data.js", hd = { Authorization: "Bearer " + t, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
        var imgs = [];
        (function walk(o, trail) {
          if (!o || typeof o !== "object") return;
          Object.keys(o).forEach(function (k) {
            if (isDataUrl(o[k])) imgs.push({ kind: (trail.concat(k).join("-") || "image").replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40), obj: o, key: k });
            else walk(o[k], trail.concat(k));
          });
        })(data, []);
        say(imgs.length ? "Uploading " + imgs.length + " photo(s)…" : "Reading current data.js…");
        var chain = Promise.resolve();
        imgs.forEach(function (it, i) {
          chain = chain.then(function () {
            var path = "assets/img/" + it.kind + "-" + Date.now().toString(36) + i + ".jpg";
            return fetch("https://api.github.com/repos/" + r + "/contents/" + path, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, hd), body: JSON.stringify({ message: "Add " + path, content: it.obj[it.key].split(",")[1], branch: b }) })
              .then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error((j && j.message) || ("GitHub said " + res.status + " while uploading a photo")); it.obj[it.key] = path; changed(); }); });
          });
        });
        chain.then(function () {
          say("Reading current data.js…");
          return fetch(url + "?ref=" + encodeURIComponent(b), { headers: hd });
        }).then(function (res) {
          if (res.status === 404) return null;
          if (!res.ok) throw new Error("GitHub said " + res.status + " while reading (check token, repo and branch).");
          return res.json();
        }).then(function (cur) {
          say("Writing…");
          var body = { message: msg.value || "Update portfolio content", content: utf8b64(dataJs()), branch: b }; if (cur && cur.sha) body.sha = cur.sha;
          return fetch(url, { method: "PUT", headers: Object.assign({ "Content-Type": "application/json" }, hd), body: JSON.stringify(body) });
        }).then(function (res) { return res.json().then(function (j) { if (!res.ok) throw new Error((j && j.message) || ("GitHub said " + res.status)); return j; }); })
          .then(function (j) { say("Published. Commit " + (j.commit && j.commit.sha ? j.commit.sha.slice(0, 7) : "") + " is on " + b + ".\nIf Vercel is connected to this repository the live site updates in about a minute; otherwise redeploy from your terminal.", "ok"); })
          .catch(function (e) { say(String(e.message || e), "err"); });
      } }), log]);
    wrap.appendChild(pub);

    var file = h("input", { type: "file", accept: ".json,.js", style: "display:none", onchange: function () {
      var f = file.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { var o = parseImport(String(rd.result)); data = Object.assign({}, ORIGINAL, o); delete data.contributions; changed(); toast("Imported"); render("general"); } catch (e) { alert("Could not import: " + e.message); } };
      rd.readAsText(f);
    } });
    wrap.appendChild(h("section", { class: "cp-block glass" }, [h("h3", { text: "Backup and manual publish" }),
      h("p", { class: "hint", text: "Download data.js and put it in assets/js/ (then commit and push, or deploy), or load a saved file back in." }),
      h("div", { class: "cp-row-h" }, [
        h("button", { class: "cp-btn pri", type: "button", text: "Download data.js", onclick: function () { download("data.js", dataJs(), "text/javascript"); } }),
        h("button", { class: "cp-btn", type: "button", text: "Download JSON", onclick: function () { download("portfolio-data.json", JSON.stringify(strip(data), null, 2), "application/json"); } }),
        h("button", { class: "cp-btn", type: "button", text: "Import data.js / JSON", onclick: function () { file.click(); } }), file,
        h("button", { class: "cp-btn danger", type: "button", text: "Discard my edits", onclick: function () { if (confirm("Discard all unpublished edits in this browser and go back to the published data?")) { localStorage.removeItem(KEY); data = JSON.parse(JSON.stringify(ORIGINAL)); delete data.contributions; refreshState(); toast("Reset to published"); render("general"); } } })
      ])]));
    return wrap;
  }
  function jsonView() {
    var ta = h("textarea", { class: "cp-json", spellcheck: "false" }); ta.value = JSON.stringify(strip(data), null, 2);
    var err = h("div", { class: "cp-log err" });
    return h("div", null, [h("section", { class: "cp-block glass" }, [h("h3", { text: "Raw data" }), ta,
      h("div", { class: "cp-row-h", style: "margin-top:12px" }, [h("button", { class: "cp-btn pri", type: "button", text: "Apply JSON", onclick: function () {
        try { var o = JSON.parse(ta.value); if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("Top level must be an object"); data = o; changed(); toast("Applied"); err.className = "cp-log"; }
        catch (e) { err.className = "cp-log err show"; err.textContent = "Invalid JSON: " + e.message; } } })]), err])]);
  }

  function render(id) {
    curId = id || curId;
    var sec = SECTIONS.filter(function (s) { return s.id === curId; })[0] || SECTIONS[0];
    main.innerHTML = "";
    var t = sec.title.split(" "), last = t.pop();
    main.appendChild(h("h1", null, [t.join(" ") + " ", h("em", { text: last })]));
    main.appendChild(h("p", { class: "cp-sub", text: sec.sub }));
    if (sec.special === "publish") main.appendChild(publishView());
    else if (sec.special === "json") main.appendChild(jsonView());
    else sec.blocks.forEach(function (b) { main.appendChild(block(b)); });
    document.querySelectorAll(".cp-side a").forEach(function (a) { a.classList.toggle("on", a.dataset.id === curId); });
    try { history.replaceState(null, "", "#" + curId); } catch (e) {}
    window.scrollTo(0, 0);
  }

  function build() {
    app = document.getElementById("app");
    stateEl = h("span", { class: "cp-state" });
    toastEl = h("div", { class: "cp-toast" });
    var side = h("nav", { class: "cp-side" }), lastG = "";
    SECTIONS.forEach(function (s) {
      if (s.g !== lastG) { side.appendChild(h("h4", { text: s.g })); lastG = s.g; }
      var a = h("a", { "data-id": s.id, onclick: function () { render(s.id); } }, [h("em", { text: s.n }), s.title]); a.dataset.id = s.id; side.appendChild(a);
    });
    var top = h("header", { class: "cp-top" }, [
      h("div", { class: "cp-brand" }, ["Admin ", h("em", { text: "console" })]), stateEl,
      h("a", { class: "cp-btn", href: "index.html?preview", target: "_blank", rel: "noopener", text: "Preview site ↗" }),
      h("a", { class: "cp-btn", href: "/logout", text: "Log out" }),
      h("button", { class: "cp-btn pri", type: "button", text: "Publish…", onclick: function () { render("publish"); } })
    ]);
    main = h("main", { class: "cp-main" });
    app.appendChild(top);
    app.appendChild(h("div", { class: "cp-wrap" }, [side, main]));
    document.body.appendChild(toastEl);
    refreshState();
    var start = (location.hash || "").slice(1);
    render(SECTIONS.some(function (s) { return s.id === start; }) ? start : "general");
  }
  build();
})();
