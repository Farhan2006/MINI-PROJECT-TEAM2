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

  /* ---- pointer: soft follower + click ripple ---- */
  function cursor() {
    var dot = doc.createElement("div"), ring = doc.createElement("div");
    dot.className = "cur-dot"; ring.className = "cur-ring";
    doc.body.append(ring, dot);
    var x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y, seen = false, big = false;
    addEventListener("pointermove", function (e) {
      x = e.clientX; y = e.clientY;
      if (!seen) { seen = true; rx = x; ry = y; doc.body.classList.add("cur-on"); }
      var hot = e.target.closest && e.target.closest("a, button, .btn, .tilt, summary, label, .stage3d");
      if (!!hot !== big) { big = !!hot; ring.classList.toggle("big", big); }
    }, { passive: true });
    doc.addEventListener("pointerleave", function () { doc.body.classList.remove("cur-on"); seen = false; });
    doc.addEventListener("pointerdown", function (e) {
      ring.classList.add("press");
      var r = doc.createElement("div"); r.className = "cur-burst"; r.style.left = e.clientX + "px"; r.style.top = e.clientY + "px";
      doc.body.appendChild(r); setTimeout(function () { r.remove(); }, 800);
    });
    doc.addEventListener("pointerup", function () { ring.classList.remove("press"); });
    (function f() {
      rx += (x - rx) * .16; ry += (y - ry) * .16;
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0)";
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0)";
      requestAnimationFrame(f);
    })();
  }

  function start() {
    scrollBar();
    navState();
    heroWords();
    countUp();
    stage3d();
    if (!reduce && fine) cursor();
    if (!reduce) {
      network();
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
    var g = doc.querySelector(".hero h1 .grad");
    if (!g) return;
    var words = g.textContent.trim().split(/\s+/);
    g.className = "";
    g.innerHTML = words.map(function (w, i) {
      return '<span class="w" style="--wi:' + i + '">' + w.replace(/[&<>]/g, "") + "</span>";
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

  /* ---- drifting circuit-node network (reacts to the pointer) ---- */
  function network() {
    var c = doc.createElement("canvas"); c.id = "fxNet";
    var amb = doc.querySelector(".ambient");
    doc.body.insertBefore(c, amb ? amb.nextSibling : doc.body.firstChild);
    var ctx = c.getContext("2d"), W, H, dpr, pts = [], mouse = { x: -999, y: -999 }, running = true;
    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      var n = Math.round(Math.min(70, innerWidth * innerHeight / 22000));
      pts = [];
      for (var i = 0; i < n; i++) pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25 * dpr, vy: (Math.random() - .5) * .25 * dpr });
    }
    size(); addEventListener("resize", size);
    addEventListener("pointermove", function (e) { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; }, { passive: true });
    doc.addEventListener("visibilitychange", function () { running = !doc.hidden; if (running) loop(); });
    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var col = isDark() ? "150,170,255" : "0,113,227", link = 150 * dpr;
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        var dx = p.x - mouse.x, dy = p.y - mouse.y, md = Math.sqrt(dx * dx + dy * dy);
        if (md < 160 * dpr) { p.x += dx / md * .6; p.y += dy / md * .6; }
        ctx.fillStyle = "rgba(" + col + ",.55)";
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.6 * dpr, 0, 6.283); ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], ax = p.x - q.x, ay = p.y - q.y, d = Math.sqrt(ax * ax + ay * ay);
          if (d < link) {
            ctx.strokeStyle = "rgba(" + col + "," + (.22 * (1 - d / link)).toFixed(3) + ")";
            ctx.lineWidth = dpr * .8;
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(loop);
    }
    loop();
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
