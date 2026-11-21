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
  var darkMQ = matchMedia("(prefers-color-scheme: dark)");
  function isDark() { var t = root.getAttribute("data-theme"); return t ? t === "dark" : darkMQ.matches; }
  /* warm the destination on hover/touch/focus so the next page is cached before the click */
  var warmed = {};
  function warm(e) {
    var a = e.target.closest && e.target.closest("a[href]"), h = a && a.getAttribute("href");
    if (!h || a.target || warmed[h] || h.charAt(0) === "#" || /^(https?:|mailto:|tel:)/.test(h)) return;
    warmed[h] = 1; var l = doc.createElement("link"); l.rel = "prefetch"; l.href = h; doc.head.appendChild(l);
  }
  doc.addEventListener("pointerover", warm, { passive: true }); doc.addEventListener("touchstart", warm, { passive: true }); doc.addEventListener("focusin", warm);

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
  function headings() { doc.querySelectorAll(".hero h1, .page-head h1, .sec-head h2").forEach(splitHeading); }

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
      if (vis && (Math.abs(target - cur) > .0002 || last < 0)) {
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

  /* ---------- pointer: a clean ring that trails the cursor and reacts to what is under it ---------- */
  function ring() {
    if (reduce || !fine) return;
    var el = doc.createElement("div"), dot = doc.createElement("div");
    el.className = "pring"; el.innerHTML = "<i></i>"; dot.className = "pdot"; el.setAttribute("aria-hidden", "true"); dot.setAttribute("aria-hidden", "true");
    doc.body.append(el, dot);
    var x = -200, y = -200, lx = x, ly = y, px = x, py = y, v = 0, seen = false, hotNow = false;
    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; lx = x; ly = y; px = x; py = y; doc.body.classList.add("cur-on"); }
      var h = !!(e.target.closest && e.target.closest("a, button, .btn, summary, label, .pcard, .person, .fnode, .chip, .about-goals li, .cblock"));
      if (h !== hotNow) { hotNow = h; el.classList.toggle("hot", h); }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { doc.body.classList.remove("cur-on"); seen = false; });
    doc.addEventListener("pointerdown", function () { el.classList.add("down"); });
    doc.addEventListener("pointerup", function () { el.classList.remove("down"); });
    (function loop() {
      if (Math.abs(x - lx) < .05 && Math.abs(y - ly) < .05 && v < .001 && x === px && y === py) { requestAnimationFrame(loop); return; }
      lx += (x - lx) * .2; ly += (y - ly) * .2;
      var sp = Math.hypot(x - px, y - py); px = x; py = y; v += (Math.min(1, sp / 34) - v) * .12;
      el.style.transform = "translate3d(" + lx.toFixed(1) + "px," + ly.toFixed(1) + "px,0) scale(" + (1 + v * .35).toFixed(3) + ")";
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- signal chain: live mini scopes in every block, click-to-inspect panel, auto tour ---------- */
  function chain() {
    var box = doc.querySelector(".chain"); if (!box) return;
    var items = S.chain || [], by = {}; items.forEach(function (c, i) { by[c.id] = c; c._i = i; });
    var blocks = [].slice.call(box.querySelectorAll(".cblock")), det = box.querySelector(".chain-detail");
    var dN = det.querySelector(".cd-n"), dG = det.querySelector(".cd-grp"), dT = det.querySelector(".cd-title"), dS = det.querySelector(".cd-sub"), dI = det.querySelector(".cd-info"), dF = det.querySelector(".cd-facts"), dL = det.querySelector(".cd-link"), dNext = det.querySelector(".cd-next"), dV = det.querySelector(".cd-viz");
    var sel = items[0] && items[0].id, auto = true, hovering = false, onScreen = false;

    function select(id, user) {
      var c = by[id]; if (!c) return; sel = id; if (user) auto = false;
      box.setAttribute("data-sel", id);
      var cur = null;
      blocks.forEach(function (b) { var on = b.dataset.id === id; if (on) cur = b; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      dN.textContent = "Block " + String(c._i + 1).padStart(2, "0");
      dG.textContent = c.group === "control" ? "Gain-control path" : "Analog signal path";
      dT.textContent = c.name; dS.textContent = c.sub; dI.textContent = c.info || "";
      dF.innerHTML = (c.facts || []).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("");
      if (cur && cur.dataset.href) { dL.style.display = ""; dL.href = cur.dataset.href; dL.setAttribute("data-title", cur.dataset.page); dL.textContent = "Open the " + cur.dataset.page + " page →"; } else dL.style.display = "none";
      dV.setAttribute("data-viz", c.viz || "wave-in");
      det.classList.remove("swap"); void det.offsetWidth; det.classList.add("swap");
    }
    blocks.forEach(function (b) { b.addEventListener("click", function () { select(b.dataset.id, true); }); });
    dNext.addEventListener("click", function () { select(items[(by[sel]._i + 1) % items.length].id, true); });
    box.addEventListener("pointerenter", function () { hovering = true; });
    box.addEventListener("pointerleave", function () { hovering = false; });
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }, { rootMargin: "80px" }).observe(box);
    if (!reduce) setInterval(function () { if (auto && onScreen && !hovering && !doc.hidden) select(items[(by[sel]._i + 1) % items.length].id, false); }, 6000);
    select(sel, false);

    /* feedback bus: from the last control block up into the op-amp block */
    var bus = box.querySelector(".cbus"), dia = box.querySelector(".chain-diagram");
    function placeBus() {
      var amp = box.querySelector('.cblock[data-id="amp"]'), ctls = box.querySelectorAll(".ctl-row .cblock"), last = ctls[ctls.length - 1];
      if (!amp || !last || !bus || getComputedStyle(bus).display === "none") return;
      var d = dia.getBoundingClientRect(), a = amp.getBoundingClientRect(), k = last.getBoundingClientRect();
      var y1 = a.top - d.top + a.height / 2, y2 = k.top - d.top + k.height / 2;
      bus.style.top = y1 + "px"; bus.style.height = Math.max(0, y2 - y1) + "px";
    }
    placeBus(); addEventListener("resize", placeBus); setTimeout(placeBus, 700); setTimeout(placeBus, 2200);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeBus);

    /* live scopes */
    var cvs = [].slice.call(box.querySelectorAll(".cviz")).concat([dV]), accent = "#f1501b", accAt = 0;
    /* size comes from a ResizeObserver, not getBoundingClientRect on every canvas every frame (forced layout) */
    var ro = "ResizeObserver" in window ? new ResizeObserver(function (es) { es.forEach(function (e) { e.target._r = e.contentRect; }); }) : null;
    function fit(cv) { var dpr = Math.min(devicePixelRatio || 1, 2), r = (ro && cv._r) || cv.getBoundingClientRect(); if (ro && !cv._r) { cv._r = r; ro.observe(cv); } var w = Math.round(r.width * dpr), h = Math.round(r.height * dpr); if (w && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; } return dpr; }
    function hash(i) { var x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); }
    function drawViz(cv, t, inv, dark) {
      var kind = cv.getAttribute("data-viz") || "wave-in", dpr = fit(cv), w = cv.width, h = cv.height; if (!w || !h) return;
      var g = cv.getContext("2d"), mid = h / 2, lw = Math.max(1.3, 1.6 * dpr), ink = inv ? "246,245,241" : (dark ? "246,245,241" : "19,19,19");
      g.clearRect(0, 0, w, h);
      g.strokeStyle = "rgba(" + ink + "," + (inv ? .16 : .12) + ")"; g.lineWidth = dpr; g.beginPath();
      for (var i = 1; i < 8; i++) { g.moveTo(w * i / 8, 0); g.lineTo(w * i / 8, h); } g.moveTo(0, mid); g.lineTo(w, mid); g.stroke();
      var gain = .2 + .8 * (.5 + .5 * Math.sin(t * .55)), base = h * .12, big = Math.min(h * .45, base + h * .32 * gain);
      function sine(amp, col, wid, ph) { g.beginPath(); for (var x = 0; x <= w; x += 2) { var y = mid - Math.sin(x / w * 18.85 - t * 3 + (ph || 0)) * amp; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.strokeStyle = col; g.lineWidth = wid; g.lineJoin = "round"; g.stroke(); }
      var acc = accent, line = "rgba(" + ink + ",.85)", soft = "rgba(" + ink + ",.3)";
      if (kind === "wave-in") sine(base, line, lw);
      else if (kind === "wave-amp") { sine(base, soft, lw); sine(big, acc, lw * 1.5); }
      else if (kind === "wave-out") sine(big, acc, lw * 1.6);
      else if (kind === "bits") {
        var nb = 14, sh = Math.floor(t * 3), bw = w / nb; g.beginPath();
        for (var b2 = 0; b2 < nb; b2++) { var bit = hash(b2 + sh) > .5, y2 = bit ? mid - h * .24 : mid + h * .24, x0 = b2 * bw; if (!b2) g.moveTo(x0, y2); else g.lineTo(x0, y2); g.lineTo(x0 + bw, y2); }
        g.strokeStyle = acc; g.lineWidth = lw * 1.3; g.lineJoin = "miter"; g.stroke();
      } else if (kind === "steps") {
        g.beginPath(); for (var x3 = 0; x3 <= w; x3 += 2) { var tt = t - (1 - x3 / w) * 4.2, v = Math.floor((.5 + .5 * Math.sin(tt * .95)) * 8) / 8, y3 = h * .84 - v * h * .68; x3 ? g.lineTo(x3, y3) : g.moveTo(x3, y3); }
        g.strokeStyle = acc; g.lineWidth = lw * 1.3; g.lineJoin = "miter"; g.stroke();
      } else if (kind === "curve") {
        g.setLineDash([5 * dpr, 5 * dpr]); g.beginPath(); g.moveTo(0, h * .86); g.lineTo(w, h * .14); g.strokeStyle = soft; g.lineWidth = dpr; g.stroke(); g.setLineDash([]);
        g.beginPath(); for (var x4 = 0; x4 <= w; x4 += 2) { var y4 = h * .86 - h * .72 * Math.pow(x4 / w, 2.3); x4 ? g.lineTo(x4, y4) : g.moveTo(x4, y4); } g.strokeStyle = line; g.lineWidth = lw; g.stroke();
        var xp = w * (.5 + .4 * Math.sin(t * .7)), yp = h * .86 - h * .72 * Math.pow(xp / w, 2.3);
        g.beginPath(); g.arc(xp, yp, 4.2 * dpr, 0, 6.2832); g.fillStyle = acc; g.fill();
      }
    }
    function paint(now) {
      var t = now / 1000, dark = isDark();
      if (now - accAt > 700) { accent = getComputedStyle(root).getPropertyValue("--accent").trim() || "#f1501b"; accAt = now; }
      cvs.forEach(function (cv) { drawViz(cv, t, !!(cv.closest && cv.closest(".cblock.on")), dark); });
    }
    if (reduce) { setTimeout(function () { paint(2400); }, 300); return; }
    (function loop(now) { if (onScreen) paint(now); requestAnimationFrame(loop); })(performance.now());
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
    headings(); heroWave(); anatomy(); countUp(); scrollBar(); footWord(); sectionLines(); ring(); chain();
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})();
