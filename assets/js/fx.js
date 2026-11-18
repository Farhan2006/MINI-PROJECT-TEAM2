/* Motion layer: scroll bar, circuit network, hero word reveal, amplifier waveform,
   3D tilt, magnetic buttons, count-up. Pure progressive enhancement. */
(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var doc = document;

  function cssVar(n) { return getComputedStyle(doc.documentElement).getPropertyValue(n).trim(); }
  function isDark() {
    var t = doc.documentElement.getAttribute("data-theme");
    return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  }

  /* ---- 3D scene (lazy: loads scene3d.js only when a stage exists) ---- */
  function loadScene(cb) {
    if (window.VDT3D) return cb();
    var s = doc.createElement("script"); s.src = "assets/js/scene3d.js"; s.onload = cb; s.onerror = function () {};
    doc.head.appendChild(s);
  }
  function webgl() {
    try { var c = doc.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; }
  }
  function stage3d() {
    if (!webgl()) return;
    var hero = doc.querySelector(".hero"), head = doc.querySelector(".page-head");
    var box = doc.createElement("div"), compact = !hero;
    if (hero) {
      box.className = "stage3d reveal"; box.style.setProperty("--d", 4); box.setAttribute("tabindex", "0");
      box.setAttribute("role", "img"); box.setAttribute("aria-label", "Interactive 3D FPGA variable gain amplifier. Click to change the gain.");
      box.innerHTML =
        '<div class="hud hud-tl"><b>FPGA</b> → gain stage → output</div>' +
        '<div class="hud hud-tr">GAIN <span class="hud-gain">×1</span></div>' +
        '<div class="hud hud-bl"><i style="background:#9cc2ff"></i>Input <i style="background:#a77bff"></i>Control <i style="background:#2997ff"></i>Output</div>' +
        '<div class="hud hud-br">Move your pointer · click the chip</div>';
      hero.insertBefore(box, hero.querySelector(".team-photo"));
      var rio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { box.classList.add("in"); rio.disconnect(); } }, { threshold: .05 });
      rio.observe(box);
    } else if (head && innerWidth > 860) {
      box.className = "stage3d-mini"; box.setAttribute("aria-hidden", "true");
      head.appendChild(box);
    } else return;
    var gainEl = box.querySelector(".hud-gain");
    loadScene(function () {
      var api = window.VDT3D.mount(box, {
        compact: compact, still: reduce,
        onGain: function (g) { if (gainEl) { gainEl.textContent = "×" + g; gainEl.classList.remove("pop"); void gainEl.offsetWidth; gainEl.classList.add("pop"); } }
      });
      if (!api) box.remove();
    });
  }

  /* ---- pointer: a "scope probe" — a glass lens with a live waveform inside.
          Wave amplitude + the ×gain tag follow how fast you move (pointer speed = gain). ---- */
  function cursor() {
    var NS = "http://www.w3.org/2000/svg";
    var lens = doc.createElement("div"), tag = doc.createElement("div"), dot = doc.createElement("div");
    lens.className = "probe"; tag.className = "probe-tag"; dot.className = "probe-dot";
    lens.innerHTML = '<svg viewBox="0 0 64 64" width="64" height="64"><path class="pw" d=""/><path class="pw2" d=""/></svg>';
    doc.body.append(lens, tag, dot);
    var path = lens.querySelector(".pw"), path2 = lens.querySelector(".pw2");
    var x = innerWidth / 2, y = innerHeight / 2, lx = x, ly = y, px = x, py = y, v = 0, seen = false, mode = "", t = 0;
    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; lx = px = x; ly = py = y; doc.body.classList.add("cur-on"); }
      var el = e.target.closest ? e.target.closest("a, button, .btn, summary, label, .stage3d, .tilt") : null;
      var m = !el ? "" : el.matches(".stage3d") ? "stage" : el.matches("a, .pcard, .pager a") ? "link" : el.matches(".btn, button") ? "btn" : "card";
      if (m !== mode) {
        mode = m; lens.className = "probe" + (m ? " " + m : ""); tag.className = "probe-tag" + (m ? " " + m : "");
      }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { doc.body.classList.remove("cur-on"); seen = false; });
    doc.addEventListener("pointerdown", function (e) {
      lens.classList.add("press");
      var r = doc.createElement("div"); r.className = "cur-burst"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      doc.body.appendChild(r); setTimeout(function () { r.remove(); }, 900);
    });
    doc.addEventListener("pointerup", function () { lens.classList.remove("press"); });
    var words = { stage: "CLICK · GAIN", link: "OPEN", btn: "GO", card: "" };
    (function f(now) {
      t = now / 1000;
      lx += (x - lx) * .2; ly += (y - ly) * .2;
      var sp = Math.hypot(x - px, y - py); px = x; py = y;
      v += (Math.min(1, sp / 40) - v) * .12;
      lens.style.transform = "translate3d(" + lx + "px," + ly + "px,0)";
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      tag.style.transform = "translate3d(" + (lx + 30) + "px," + (ly + 24) + "px,0)";
      var amp = mode ? 5 : 3 + v * 15, d = "", d2 = "";
      for (var i = 0; i <= 32; i++) {
        var X = 8 + i * 1.5, w = Math.sin(i * .42 - t * (mode ? 4 : 7));
        d += (i ? "L" : "M") + X.toFixed(1) + " " + (32 - w * amp * .45).toFixed(1);
        d2 += (i ? "L" : "M") + X.toFixed(1) + " " + (32 - w * amp).toFixed(1);
      }
      path.setAttribute("d", d); path2.setAttribute("d", d2);
      var txt = mode ? words[mode] : "×" + Math.max(1, Math.round(1 + v * 99));
      if (tag.textContent !== txt) tag.textContent = txt;
      requestAnimationFrame(f);
    })(performance.now());
  }

  function start() {
    scrollBar();
    navState();
    heroWords();
    countUp();
    stage3d();
    if (!reduce && fine) cursor();
    if (!reduce) {
      flowField();
      amplifierWave();
      if (fine) { tilt(); magnetic(); }
    } else {
      amplifierWave(true);
    }
  }

  /* ---- scroll progress ---- */
  function scrollBar() {
    var bar = doc.createElement("div");
    bar.className = "scrollbar"; bar.innerHTML = "<i></i>";
    doc.body.appendChild(bar);
    var i = bar.firstChild, tick = false;
    function upd() {
      var h = doc.documentElement.scrollHeight - innerHeight;
      i.style.transform = "scaleX(" + (h > 0 ? Math.min(1, scrollY / h) : 0) + ")";
      tick = false;
    }
    addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  function navState() {
    var nav = doc.querySelector(".nav"); if (!nav) return;
    function f() { nav.classList.toggle("scrolled", scrollY > 24); }
    addEventListener("scroll", f, { passive: true }); f();
  }

  /* ---- hero title: word-by-word entrance ---- */
  function heroWords() {
    /* inner pages: last word of the title becomes an editorial serif italic */
    var ph = doc.querySelector(".page-head h1");
    if (ph && !doc.querySelector(".hero")) {
      var ws = ph.textContent.trim().split(/\s+/);
      if (ws.length > 1) {
        var lastW = ws.pop().replace(/[&<>]/g, "");
        ph.innerHTML = ws.join(" ").replace(/[&<>]/g, "") + ' <span class="ser">' + lastW + "</span>";
      }
    }
    var g = doc.querySelector(".hero h1 .grad");
    if (!g) return;
    var words = g.textContent.trim().split(/\s+/);
    g.className = "";
    g.innerHTML = words.map(function (w, i) {
      return '<span class="w' + (/gain/i.test(w) ? " ser" : "") + '" style="--wi:' + i + '">' + w.replace(/[&<>]/g, "") + "</span>";
    }).join(" ");
  }

  /* ---- count-up numbers ---- */
  function countUp() {
    var els = doc.querySelectorAll(".stat b");
    els.forEach(function (el) {
      var m = el.textContent.match(/^(\d+)(.*)$/);
      if (!m) return;
      var target = +m[1], tail = m[2];
      if (reduce || !("IntersectionObserver" in window)) return;
      el.textContent = "0" + tail;
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var t0 = performance.now(), dur = 1100;
        (function step(t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
          el.textContent = Math.round(target * e) + tail;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  /* ---- 3D tilt on glass cards ---- */
  function tilt() {
    var sel = ".pcard, .person, .stat, .dcard, .calc, .review, .pager a";
    doc.querySelectorAll(sel).forEach(function (el) {
      el.classList.add("tilt", "rim");
      var raf = 0;
      el.addEventListener("pointermove", function (e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
          var max = r.width > 500 ? 2 : 7;
          el.classList.add("tilting");
          el.style.transform = "perspective(900px) rotateX(" + (-y * max).toFixed(2) + "deg) rotateY(" + (x * max).toFixed(2) + "deg) translateY(-4px) scale(1.012)";
        });
      });
      el.addEventListener("pointerleave", function () {
        el.classList.remove("tilting"); el.style.transform = "";
      });
    });
  }

  /* ---- magnetic buttons ---- */
  function magnetic() {
    doc.querySelectorAll(".btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .18).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .28).toFixed(1) + "px) scale(1.05)";
      });
      b.addEventListener("pointerleave", function () { b.style.transform = ""; });
    });
  }

  /* ---- background: "signal ridges" — stacked waveforms (oscilloscope / ridge-plot look).
          The pointer acts as a gain knob: ridges rise and ring where it passes. ---- */
  function flowField() {
    var c = doc.createElement("canvas"); c.id = "fxNet";
    var amb = doc.querySelector(".ambient");
    doc.body.insertBefore(c, amb ? amb.nextSibling : doc.body.firstChild);
    var ctx = c.getContext("2d"), W, H, dpr, N, running = true, t = 0, last = 0;
    var m = { x: -9999, y: -9999, tx: -9999, ty: -9999, v: 0 }, lx = 0, ly = 0, sy = scrollY;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 1.5);
      W = c.width = Math.round(innerWidth * dpr); H = c.height = Math.round(innerHeight * dpr);
      N = innerWidth < 700 ? 18 : 28;
    }
    size(); addEventListener("resize", size);
    addEventListener("pointermove", function (e) {
      m.tx = e.clientX * dpr; m.ty = e.clientY * dpr;
      if (m.x < -9000) { m.x = m.tx; m.y = m.ty; }
      m.v = Math.min(1, m.v + Math.hypot(e.clientX - lx, e.clientY - ly) / 90); lx = e.clientX; ly = e.clientY;
    }, { passive: true });
    doc.addEventListener("visibilitychange", function () { running = !doc.hidden; if (running) { last = 0; requestAnimationFrame(loop); } });

    function loop(now) {
      if (!running) return;
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
      m.x += (m.tx - m.x) * Math.min(1, dt * 7); m.y += (m.ty - m.y) * Math.min(1, dt * 7);
      m.v *= Math.pow(.18, dt);
      sy += (scrollY - sy) * Math.min(1, dt * 5);
      var dark = isDark();
      var bg = dark ? "0,0,0" : "245,245,247";
      var a1 = dark ? "80,150,255" : "0,113,227", a2 = dark ? "170,130,255" : "94,92,230", a3 = dark ? "255,120,190" : "255,80,160";
      ctx.clearRect(0, 0, W, H);
      var top = H * -.01, span = H * 1.0, step = Math.max(4, Math.round(8 * dpr));
      var g = ctx.createLinearGradient(0, 0, W, 0);
      var al = dark ? .5 : .38;
      g.addColorStop(0, "rgba(" + a1 + "," + al + ")"); g.addColorStop(.5, "rgba(" + a2 + "," + (al + .12) + ")"); g.addColorStop(1, "rgba(" + a3 + "," + al + ")");
      var ph = sy * .0018;
      for (var i = 0; i < N; i++) {
        var k = i / (N - 1), by = top + span * k;                 /* ridge baseline */
        var amp = (6 + 34 * k) * dpr * (.8 + .2 * Math.sin(i * 1.7));
        var f1 = .0042 / dpr * (1 + .25 * Math.sin(i)), f2 = .011 / dpr;
        ctx.beginPath();
        var first = true, lastY = 0, lastX = 0;
        for (var x = 0; x <= W + step; x += step) {
          var y = by
            + Math.sin(x * f1 + t * (.5 + .1 * Math.sin(i)) + i * .55 + ph) * amp
            + Math.sin(x * f2 - t * .9 + i * 1.3) * amp * .28;
          var dy = by - m.y, dx = x - m.x;
          var near = Math.exp(-(dy * dy) / (2 * 150 * 150 * dpr * dpr));
          if (near > .003) {
            var bump = Math.exp(-(dx * dx) / (2 * 170 * 170 * dpr * dpr));
            y -= near * bump * (46 + 90 * m.v) * dpr * (1 + .35 * Math.sin(x * .03 / dpr - t * 8));
          }
          if (first) { ctx.moveTo(x, y); first = false; } else ctx.lineTo(x, y);
          lastX = x; lastY = y;
        }
        /* stroke the ridge, then fill below it so nearer ridges occlude farther ones */
        ctx.strokeStyle = g; ctx.lineWidth = (.9 + k * .9) * dpr; ctx.globalAlpha = .25 + .75 * k;
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineTo(lastX, H + 10); ctx.lineTo(0, H + 10); ctx.closePath();
        ctx.fillStyle = "rgba(" + bg + "," + (dark ? .72 : .7) + ")"; ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---- hero: live "variable gain amplifier" — input sine and amplified output ---- */
  function amplifierWave(still) {
    var hero = doc.querySelector(".hero"); if (!hero) return;
    var host = doc.createElement("div");
    host.className = "wave glass reveal"; host.style.setProperty("--d", 5);
    host.innerHTML =
      '<div class="wave-bar"><span><b>Live demo</b> · variable gain stage</span>' +
      '<span class="wave-key"><i style="background:var(--faint)"></i>Vin<i style="background:var(--accent)"></i>Vout · gain <span class="wave-gain">×1</span></span></div>' +
      "<canvas></canvas>";
    var photo = hero.querySelector(".team-photo");
    hero.insertBefore(host, photo);
    if ("IntersectionObserver" in window) {
      var rio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { host.classList.add("in"); rio.disconnect(); } }, { threshold: 0.1 });
      rio.observe(host);
    } else host.classList.add("in");
    var cv = host.querySelector("canvas"), ctx = cv.getContext("2d"), gainEl = host.querySelector(".wave-gain");
    var W, H, dpr, gains = [1, 10, 50, 100], gi = 0, cur = 1, last = 0, t = 0, onScreen = true;
    function size() { dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = cv.clientWidth * dpr; H = cv.height = cv.clientHeight * dpr; }
    size(); addEventListener("resize", size);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; if (onScreen) frame(performance.now()); }).observe(host);

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var mid = H / 2, grid = isDark() ? "rgba(255,255,255,.07)" : "rgba(0,0,0,.06)";
      ctx.strokeStyle = grid; ctx.lineWidth = dpr;
      for (var gx = 0; gx <= 10; gx++) { ctx.beginPath(); ctx.moveTo(gx * W / 10, 0); ctx.lineTo(gx * W / 10, H); ctx.stroke(); }
      for (var gy = 0; gy <= 4; gy++) { ctx.beginPath(); ctx.moveTo(0, gy * H / 4); ctx.lineTo(W, gy * H / 4); ctx.stroke(); }
      var inAmp = H * .035, out = Math.min(H * .44, inAmp * cur);
      var cycles = W / (160 * dpr);
      var accent = cssVar("--accent") || "#0071e3", accent2 = cssVar("--accent-2") || "#5e5ce6";
      function trace(amp, color, width, glow, clip) {
        ctx.beginPath();
        for (var x = 0; x <= W; x += 3) {
          var v = Math.sin(x / W * cycles * 6.283 - t * 2) * amp;
          if (clip) v = Math.max(-clip, Math.min(clip, v));
          x === 0 ? ctx.moveTo(x, mid - v) : ctx.lineTo(x, mid - v);
        }
        ctx.strokeStyle = color; ctx.lineWidth = width * dpr; ctx.lineJoin = "round";
        ctx.shadowColor = glow || "transparent"; ctx.shadowBlur = glow ? 14 * dpr : 0;
        ctx.stroke(); ctx.shadowBlur = 0;
      }
      trace(inAmp, isDark() ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.28)", 1.5);
      var g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, accent); g.addColorStop(1, accent2);
      /* slightly soft-clips at the rails like a real amplifier */
      trace(out, g, 2.6, accent, H * .42);
      gainEl.textContent = "×" + Math.round(cur);
    }

    function frame(now) {
      if (!onScreen || doc.hidden) return;
      var dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
      if (!still && t - (frame.sw || 0) > 2.6) { frame.sw = t; gi = (gi + 1) % gains.length; }
      cur += (gains[gi] - cur) * Math.min(1, dt * 4);
      draw();
      requestAnimationFrame(frame);
    }
    doc.addEventListener("visibilitychange", function () { if (!doc.hidden) { last = 0; frame(performance.now()); } });
    if (still) { cur = 10; draw(); } else frame(performance.now());
  }

  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); });
  else setTimeout(start, 0);
})();
