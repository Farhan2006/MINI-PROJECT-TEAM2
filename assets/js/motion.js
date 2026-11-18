/* Motion layer for the portfolio. Pure enhancement: the site works without it. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var doc = document, root = doc.documentElement;
  var S = window.SITE || {};
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
    headings(); heroWave(); ticker(); anatomy(); tilt(); countUp(); scrollBar(); footWord();
  }
  wipeLeave();
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { start(); wipeArrive(); });
  else { start(); wipeArrive(); }
})();
