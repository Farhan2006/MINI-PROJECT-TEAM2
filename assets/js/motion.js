/* Motion layer for the portfolio. Pure enhancement: the site works without it. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var doc = document, root = doc.documentElement;
  var S = window.SITE || {};
  root.classList.add("js-motion");
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ---------- page wipe (arrival + departure) ---------- */
  function wipeArrive() {
    if (!root.classList.contains("wipe-hold")) return;
    try { sessionStorage.removeItem("vdtWipe"); } catch (e) {}
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      root.classList.remove("wipe-hold"); root.classList.add("wipe-out");
      setTimeout(function () { root.classList.add("wipe-nt"); root.classList.remove("wipe-out"); requestAnimationFrame(function () { root.classList.remove("wipe-nt"); }); }, 1000);
    }); });
  }
  function wipeLeave() {
    /* capture phase: handle internal links before the site's own fade handler */
    doc.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[href]");
      if (!a || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      var h = a.getAttribute("href");
      if (!h || h.charAt(0) === "#" || /^(https?:|mailto:|tel:)/.test(h)) return;
      e.preventDefault(); e.stopImmediatePropagation();
      try { sessionStorage.setItem("vdtWipe", "1"); } catch (er) {}
      root.classList.add("wipe-go");
      setTimeout(function () { location.href = h; }, 760);
    }, true);
    addEventListener("pageshow", function (e) { if (e.persisted) { root.classList.remove("wipe-go", "wipe-hold", "wipe-out"); } });
  }

  /* ---------- kinetic headings ---------- */
  function splitHeading(h) {
    if (h.getAttribute("data-split")) return;
    h.setAttribute("data-split", "1");
    var label = h.textContent.replace(/_$/, "").trim(), idx = 0, out = "";
    h.childNodes.forEach(function (n) {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(function (t) {
          if (!t) return;
          if (/^\s+$/.test(t)) out += " "; else out += '<span class="wm"><i style="--wi:' + (idx++) + '">' + esc(t) + "</i></span>";
        });
      } else if (n.nodeType === 1) {
        if (n.classList.contains("caret")) out += n.outerHTML;
        else if (n.tagName === "EM") out += '<span class="wm"><i style="--wi:' + (idx++) + '">' + n.outerHTML + "</i></span>";
        else out += n.outerHTML;
      }
    });
    h.setAttribute("aria-label", label); h.innerHTML = out;
  }
  function headings() {
    doc.querySelectorAll(".hero h1, .page-head h1, .sec-head h2").forEach(splitHeading);
  }

  /* ---------- hero oscilloscope wave ---------- */
  function heroWave() {
    var hero = doc.querySelector(".hero"); if (!hero || doc.querySelector(".hero-wave")) return;
    function path(amp, cycles) {
      var d = "", n = 160; for (var i = 0; i <= n; i++) { var x = i / n * 2400, y = 85 + Math.sin(i / n * cycles * 6.2832) * amp; d += (i ? "L" : "M") + x.toFixed(1) + " " + y.toFixed(1); } return d;
    }
    var w = doc.createElement("div"); w.className = "hero-wave"; w.setAttribute("aria-hidden", "true");
    w.innerHTML = '<svg viewBox="0 0 2400 170" preserveAspectRatio="none"><path class="in-w" d="' + path(14, 8) + '"/><path class="out-w" d="' + path(24, 8) + '"/></svg>';
    var ph = hero.querySelector(".team-photo"); if (ph) hero.insertBefore(w, ph); else hero.appendChild(w);
  }

  /* ---------- ticker (speed follows scroll velocity) ---------- */
  function ticker() {
    var hero = doc.querySelector(".hero"); if (!hero) return;
    var words = [S.title || "Variable Gain Amplifier", "Team " + (S.teamNo || ""), "EE-VDT", "KLE Technological University"];
    var one = words.map(function (t, i) { return '<span class="ticker-item' + (i % 2 ? " o" : "") + '">' + esc(t) + " <b>✺</b></span>"; }).join("");
    var t = doc.createElement("div"); t.className = "ticker"; t.setAttribute("aria-hidden", "true");
    t.innerHTML = '<div class="ticker-track">' + one + one + one + one + "</div>";
    hero.insertAdjacentElement("afterend", t);
    if (reduce) return;
    var track = t.firstChild, x = 0, dir = -1, vel = 0, lastY = scrollY, on = true, half;
    function measure() { half = track.scrollWidth / 2; } measure(); addEventListener("resize", measure);
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(t);
    (function loop() {
      var dy = scrollY - lastY; lastY = scrollY;
      vel += (clamp(Math.abs(dy) * .35, 0, 28) - vel) * .12; if (dy) dir = dy > 0 ? -1 : 1;
      if (on) { x += dir * (.9 + vel); if (x <= -half) x += half; if (x > 0) x -= half; track.style.transform = "translate3d(" + x + "px,0,0)"; }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- scroll-driven exploded chip ---------- */
  function anatomy() {
    var tr = doc.querySelector(".anat-track"); if (!tr) return;
    var sec = tr.closest(".anat") || tr, lis = tr.querySelectorAll(".anat-steps li"), target = 0, cur = 0, last = -1, vis = true;
    function calc() {
      var r = tr.getBoundingClientRect(), sh = tr.firstElementChild.getBoundingClientRect().height;
      target = clamp((80 - r.top) / Math.max(1, r.height - sh), 0, 1);
    }
    calc(); addEventListener("scroll", calc, { passive: true }); addEventListener("resize", calc);
    new IntersectionObserver(function (es) { vis = es[0].isIntersecting; }, { rootMargin: "200px" }).observe(tr);
    (function loop() {
      if (vis) {
        cur += (target - cur) * (reduce ? 1 : .12);
        tr.style.setProperty("--p", cur.toFixed(4));
        var a = Math.min(lis.length - 1, Math.floor(cur * lis.length * .999));
        if (a !== last) { last = a; sec.setAttribute("data-a", a); lis.forEach(function (li, i) { li.classList.toggle("on", i === a); }); }
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- cards: light 3D tilt on hover ---------- */
  function tilt() {
    if (reduce || !fine) return;
    doc.querySelectorAll(".pcard, .person").forEach(function (el) {
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0; var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          el.style.setProperty("--rx", (-y * 7).toFixed(2) + "deg"); el.style.setProperty("--ry", (x * 9).toFixed(2) + "deg"); el.classList.add("tilt");
        });
      });
      el.addEventListener("pointerleave", function () { el.classList.remove("tilt"); el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); });
    });
  }

  /* ---------- count-up numbers ---------- */
  function countUp() {
    if (reduce || !("IntersectionObserver" in window)) return;
    doc.querySelectorAll(".stat b").forEach(function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/); if (!m) return;
      var target = +m[1], tail = m[2]; el.textContent = "0" + tail;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return; io.disconnect();
        var t0 = performance.now();
        (function step(t) { var p = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - p, 4); el.textContent = Math.round(target * e) + tail; if (p < 1) requestAnimationFrame(step); })(t0);
      }, { threshold: .4 });
      io.observe(el);
    });
  }

  /* ---------- halftone: dot fields drawn on canvas (paper print look) ---------- */
  function isDark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; }
  function halftone(canvas, mode) {
    var ctx = canvas.getContext("2d"), W = 0, H = 0, dpr = 1, cell = mode === "edge" ? 10 : 15, on = true, last = 0;
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); var r = canvas.getBoundingClientRect(); W = canvas.width = Math.max(2, Math.round(r.width * dpr)); H = canvas.height = Math.max(2, Math.round(r.height * dpr)); }
    function field(x, y, t) {
      var nx = x / W, ny = y / H;
      if (mode === "edge") return Math.pow(clamp(ny + Math.sin(nx * 24 + t * 1.2) * .04, 0, 1), 1.7);
      var cx = mode === "head" ? .5 : .8, cy = mode === "head" ? .5 : .5, rx = mode === "head" ? .5 : .5, ry = mode === "head" ? .5 : .56;
      var d = Math.hypot((nx - cx) / rx, (ny - cy) / ry), base = clamp(1 - d, 0, 1), ripple = .5 + .5 * Math.sin(d * 10 - t * 1.7);
      return Math.pow(base, 1.5) * (.45 + .55 * ripple) * .66;
    }
    function draw(ms) {
      var t = ms / 1000, cs = cell * dpr, dark = isDark();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = mode === "edge" ? (dark ? "rgba(246,245,241,.55)" : "#131313") : (getComputedStyle(root).getPropertyValue("--accent").trim() || "#f1501b");
      var rows = Math.ceil(H / (cs * .866)) + 1, cols = Math.ceil(W / cs) + 1;
      ctx.beginPath();
      for (var gy = 0; gy < rows; gy++) {
        var y = gy * cs * .866, off = (gy % 2) * cs / 2;
        for (var gx = 0; gx < cols; gx++) {
          var x = gx * cs + off, v = field(x, y, t), r = v * cs * .74;
          if (r > .5) { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); }
        }
      }
      ctx.fill();
    }
    size(); addEventListener("resize", function () { size(); draw(performance.now()); });
    draw(performance.now());
    if (reduce) return;
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; }).observe(canvas);
    (function loop(now) { if (on && now - last > 33) { last = now; draw(now); } requestAnimationFrame(loop); })(performance.now());
  }
  function halftones() {
    var hero = doc.querySelector(".hero"), head = doc.querySelector(".page-head"), foot = doc.querySelector("footer");
    function add(parent, cls, mode, first) { var c = doc.createElement("canvas"); c.className = "ht " + cls; c.setAttribute("aria-hidden", "true"); if (first && parent.firstChild) parent.insertBefore(c, parent.firstChild); else parent.appendChild(c); halftone(c, mode); }
    if (hero) add(hero, "ht-hero", "sun", true);
    else if (head) add(head, "ht-head", "head", true);
    if (foot) add(foot, "ht-edge", "edge", true);
  }

  /* ---------- living halftone background: dots swell and turn orange near the pointer,
              ripple on click, and drift with scroll ---------- */
  function pointerField() {
    var c = doc.createElement("canvas"); c.id = "htField"; c.setAttribute("aria-hidden", "true");
    var amb = doc.querySelector(".ambient"); doc.body.insertBefore(c, amb ? amb.nextSibling : doc.body.firstChild);
    var ctx = c.getContext("2d"), W = 0, H = 0, dpr = 1, cs = 24, m = { x: -9999, y: -9999, tx: -9999, ty: -9999, v: 0 };
    var lx = 0, ly = 0, sy = scrollY, ripples = [], running = true, accent = "#f1501b", accentAt = 0;
    function size() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = c.width = Math.round(innerWidth * dpr); H = c.height = Math.round(innerHeight * dpr); cs = (innerWidth < 700 ? 20 : 24) * dpr; }
    size(); addEventListener("resize", size);
    addEventListener("pointermove", function (e) {
      m.tx = e.clientX * dpr; m.ty = e.clientY * dpr;
      if (m.x < -9000) { m.x = m.tx; m.y = m.ty; }
      m.v = Math.min(1, m.v + Math.hypot(e.clientX - lx, e.clientY - ly) / 70); lx = e.clientX; ly = e.clientY;
    }, { passive: true });
    doc.addEventListener("pointerdown", function (e) { ripples.push({ x: e.clientX * dpr, y: e.clientY * dpr, t0: performance.now() }); });
    doc.addEventListener("pointerleave", function () { m.tx = m.ty = -9999; });
    doc.addEventListener("visibilitychange", function () { running = !doc.hidden; if (running) requestAnimationFrame(frame); });
    function frame(now) {
      if (!running) return;
      var t = now / 1000, dark = isDark();
      if (now - accentAt > 600) { accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#f1501b"; accentAt = now; }
      m.x += (m.tx - m.x) * .16; m.y += (m.ty - m.y) * .16; m.v *= .94; sy += (scrollY - sy) * .08;
      ripples = ripples.filter(function (r) { return now - r.t0 < 1700; });
      var sig = 120 * dpr * (1 + m.v * .7), inv = 1 / (2 * sig * sig), ph = sy * .0021;
      ctx.clearRect(0, 0, W, H);
      var rows = Math.ceil(H / (cs * .866)) + 1, cols = Math.ceil(W / cs) + 1, hot = [];
      ctx.fillStyle = dark ? "rgba(246,245,241,.13)" : "rgba(19,19,19,.15)";
      ctx.beginPath();
      for (var gy = 0; gy < rows; gy++) {
        var y = gy * cs * .866, off = (gy % 2) * cs / 2;
        for (var gx = 0; gx < cols; gx++) {
          var x = gx * cs + off;
          var v = .2 + .16 * Math.sin(x * .0052 + y * .0038 + t * .55 + ph) + .08 * Math.sin(x * .011 - y * .007 - t * .8);
          var dx = x - m.x, dy = y - m.y, d2 = dx * dx + dy * dy, k = d2 < 9 * sig * sig ? Math.exp(-d2 * inv) : 0, w = 0;
          for (var i = 0; i < ripples.length; i++) {
            var a = (now - ripples[i].t0) / 1700, R = a * 900 * dpr, rx = x - ripples[i].x, ry = y - ripples[i].y, d = Math.sqrt(rx * rx + ry * ry);
            w += Math.exp(-((d - R) * (d - R)) / (2 * 55 * 55 * dpr * dpr)) * (1 - a);
          }
          v += k * .95 + w * .9;
          var r = Math.min(1, Math.max(0, v)) * cs * .5;
          if (r < .4) continue;
          if (k + w > .09) hot.push(x, y, r * .62); else { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832); }
        }
      }
      ctx.fill();
      if (hot.length) { ctx.fillStyle = accent; ctx.globalAlpha = dark ? .62 : .6; ctx.beginPath(); for (var j = 0; j < hot.length; j += 3) { ctx.moveTo(hot[j] + hot[j + 2], hot[j + 1]); ctx.arc(hot[j], hot[j + 1], hot[j + 2], 0, 6.2832); } ctx.fill(); ctx.globalAlpha = 1; }
      if (!reduce) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------- pointer: a spinning halftone lens that trails the cursor ---------- */
  function lens() {
    if (reduce || !fine) return;
    var el = doc.createElement("div"), dot = doc.createElement("div");
    el.className = "hcur"; el.innerHTML = "<i></i><b></b>"; dot.className = "hdot"; el.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    doc.body.append(el, dot);
    var x = -200, y = -200, lx = x, ly = y, px = x, py = y, v = 0, seen = false, hotNow = false;
    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; lx = x; ly = y; px = x; py = y; doc.body.classList.add("cur-on"); }
      var h = !!(e.target.closest && e.target.closest("a, button, .btn, summary, label, .pcard, .person, .fnode, .chip, .about-goals li"));
      if (h !== hotNow) { hotNow = h; el.classList.toggle("hot", h); }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { doc.body.classList.remove("cur-on"); seen = false; });
    doc.addEventListener("pointerdown", function () { el.classList.add("down"); });
    doc.addEventListener("pointerup", function () { el.classList.remove("down"); });
    (function loop() {
      lx += (x - lx) * .2; ly += (y - ly) * .2;
      var sp = Math.hypot(x - px, y - py); px = x; py = y; v += (Math.min(1, sp / 34) - v) * .12;
      el.style.transform = "translate3d(" + lx.toFixed(1) + "px," + ly.toFixed(1) + "px,0) scale(" + (1 + v * .5).toFixed(3) + ")";
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- section rules draw in when scrolled to ---------- */
  function sectionLines() {
    var secs = doc.querySelectorAll(".section");
    if (!("IntersectionObserver" in window)) { secs.forEach(function (x) { x.classList.add("in-view"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); } }); }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
    secs.forEach(function (x) { io.observe(x); });
  }

  /* ---------- scroll bar, footer word ---------- */
  function scrollBar() {
    var b = doc.createElement("div"); b.className = "scrollbar"; b.innerHTML = "<i></i>"; doc.body.appendChild(b);
    var i = b.firstChild, tick = false;
    function upd() { var h = root.scrollHeight - innerHeight; i.style.transform = "scaleX(" + (h > 0 ? clamp(scrollY / h, 0, 1) : 0) + ")"; tick = false; }
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true }); upd();
  }
  function footWord() {
    var f = doc.querySelector("footer"); if (!f) return;
    var w = doc.createElement("div"); w.className = "foot-word"; w.setAttribute("aria-hidden", "true");
    w.innerHTML = "<span>Team</span> <span><em>" + esc(S.teamNo || "02") + "</em></span>";
    f.insertBefore(w, f.firstChild);
    if ("IntersectionObserver" in window) { var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { w.classList.add("in"); io.disconnect(); } }, { threshold: .25 }); io.observe(w); } else w.classList.add("in");
  }

  function start() {
    headings(); heroWave(); ticker(); anatomy(); tilt(); countUp(); scrollBar(); footWord(); halftones(); sectionLines(); pointerField(); lens();
  }
  wipeLeave();
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { start(); wipeArrive(); });
  else { start(); wipeArrive(); }
})();
