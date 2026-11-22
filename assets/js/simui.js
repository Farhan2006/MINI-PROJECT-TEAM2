/* Simulator UI: the live Signal Chain on Home and the interactive simulator on Design.
   Everything reads from one VGASim store, so previews, the details panel, the oscilloscope, the schematic and the JFET view always agree. */
(function () {
  "use strict";
  var Sim = window.VGASim, S = window.SITE, doc = document, root = doc.documentElement;
  if (!Sim || !S) return;
  var HOME = doc.body.getAttribute("data-page") !== "design";
  /* Home only illustrates the chain: it runs on a fixed demo signal, never on (or into) the visitor's saved simulator settings */
  var store = Sim.createStore(HOME ? null : "vdt_sim_v1"); window.VGASimStore = store;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var TAU = Sim.TAU, CH = { ch1: "#e8b339", ch2: "#4fb8e8", ch3: "#5cc98a", ch4: "#d27be0" };   /* amber, cyan-blue, green, magenta */

  /* ---------- small helpers ---------- */
  function h(tag, a, kids) {
    var e = doc.createElement(tag);
    Object.keys(a || {}).forEach(function (k) {
      var v = a[k];
      if (k === "text") e.textContent = v; else if (k === "html") e.innerHTML = v;
      else if (k === "on") Object.keys(v).forEach(function (ev) { e.addEventListener(ev, v[ev]); });
      else if (v !== false && v != null) e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? doc.createTextNode(c) : c); });
    return e;
  }
  function fV(v) { var a = Math.abs(v); if (!isFinite(v)) return "—"; if (a >= 1 || a === 0) return v.toFixed(2) + " V"; return (v * 1e3).toFixed(a < 0.01 ? 2 : a < 0.1 ? 1 : 0) + " mV"; }
  function fHz(f) { return f == null ? "—" : f >= 1e6 ? (f / 1e6).toFixed(2) + " MHz" : f >= 1000 ? (f / 1000).toFixed(f >= 10000 ? 1 : 2) + " kHz" : f.toFixed(f < 100 ? 1 : 0) + " Hz"; }
  function fOhm(r) { return !isFinite(r) ? "∞ (pinched off)" : r >= 1000 ? (r / 1000).toFixed(r >= 1e4 ? 1 : 2) + " kΩ" : r.toFixed(r < 100 ? 1 : 0) + " Ω"; }
  function fT(t) { return t >= 1 ? t + " s" : t >= 1e-3 ? +(t * 1e3).toPrecision(3) + " ms" : +(t * 1e6).toPrecision(3) + " µs"; }
  function fN(v, d) { return isFinite(v) ? v.toFixed(d == null ? 2 : d) : "—"; }
  function dl(rows) { return rows.map(function (r) { return "<div><dt>" + r[0] + "</dt><dd>" + r[1] + "</dd></div>"; }).join(""); }
  var cssCache = { t: -1e9 };
  function T(now) {
    if (now - cssCache.t > 500) {
      var cs = getComputedStyle(root), v = function (n, d) { return cs.getPropertyValue(n).trim() || d; };
      cssCache = { t: now, fg: v("--fg", "#131313"), bg: v("--bg", "#e7e5df"), accent: v("--accent", "#f1501b"), accent2: v("--accent-2", "#07bcb4"), stroke: v("--stroke-strong", "rgba(19,19,19,.35)"), muted: v("--muted", "#6f6c66"), warn: v("--warn", "#b8401c") };
    }
    return cssCache;
  }
  function fit(cv) {
    var dpr = Math.min(devicePixelRatio || 1, 2), r = cv._r;
    if (!r) { r = cv.getBoundingClientRect(); if (window.ResizeObserver) { cv._ro = new ResizeObserver(function (es) { cv._r = es[0].contentRect; }); cv._ro.observe(cv); cv._r = r; } }
    var w = Math.round(r.width * dpr), hh = Math.round(r.height * dpr);
    if (w && (cv.width !== w || cv.height !== hh)) { cv.width = w; cv.height = hh; }
    var g = cv.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, r.width, r.height);
    return { g: g, w: r.width, h: r.height };
  }
  function ext(m, k) {
    var g = m.state.gen, pk = g.vpp / 2;
    if (k === "in") return [g.dc - pk, g.dc + pk];
    if (k === "cond") return [m.condMin, m.condMax];
    if (k === "filt") return [m.condMin - m.shift, m.condMax - m.shift];
    if (k === "out") return [m.outMin, m.outMax];
    return [m.outDcIdeal - m.outPpIdeal / 2, m.outDcIdeal + m.outPpIdeal / 2];
  }

  /* ---------- animation loop: one rAF, only visible canvases are drawn ---------- */
  var views = [], last = 0, speed = reduce ? 0 : 1;
  function addView(cv, draw) {
    var v = { cv: cv, draw: draw, vis: false };
    if (window.IntersectionObserver) new IntersectionObserver(function (es) { v.vis = es[0].isIntersecting; }, { rootMargin: "120px" }).observe(cv); else v.vis = true;
    views.push(v); return v;
  }
  (function loop(now) {
    if (now - last > 30) { last = now; var m = store.model(); views.forEach(function (v) { if (v.vis) v.draw(v.cv, m, now); }); }
    requestAnimationFrame(loop);
  })(performance.now());

  /* ---------- waveform drawing shared by the chain previews, details panel, conditioning view ---------- */
  function drawAnalog(cv, m, now, o) {
    var f = fit(cv), g = f.g, th = T(now), big = o.big, ink = o.inv ? th.bg : th.fg;
    var L = big ? (HOME ? 10 : 52) : 3, R = big ? 10 : 3, Tp = big ? 22 : 3, B = big ? 22 : 3, w = f.w - L - R, hh = f.h - Tp - B, lo = 0, hi = 0;
    if (w < 10) return;
    o.traces.forEach(function (t) { var e = ext(m, t.k); lo = Math.min(lo, e[0]); hi = Math.max(hi, e[1]); });
    if (o.rails && m.clipped) { lo = Math.min(lo, -m.lim); hi = Math.max(hi, m.lim); }
    var pad = (hi - lo) * 0.12 || 0.1; lo -= pad; hi += pad;
    function Y(v) { return Tp + (1 - (v - lo) / (hi - lo)) * hh; }
    var span = m.useMic ? 0.04 : (o.cycles || 3) / m.f, ph = speed ? (now / 1000 * 0.3) : 0, t0 = m.useMic ? (ph * 0.5 % Math.max(0.05, m.len / m.fs - span)) : (ph % 1) / m.f, n = big ? 360 : 110, i;
    if (big) {
      g.font = "11px system-ui, sans-serif"; g.lineWidth = 1; g.strokeStyle = th.stroke; g.globalAlpha = 0.25;
      for (i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(L, Tp + hh * i / 4); g.lineTo(L + w, Tp + hh * i / 4); g.stroke(); }
      for (i = 0; i <= 6; i++) { g.beginPath(); g.moveTo(L + w * i / 6, Tp); g.lineTo(L + w * i / 6, Tp + hh); g.stroke(); }
      g.globalAlpha = 1; g.fillStyle = th.muted; g.textAlign = "right";
      if (!HOME) { g.fillText(fV(hi), L - 6, Tp + 9); g.fillText(fV(lo), L - 6, Tp + hh); if (Y(0) > Tp + 22 && Y(0) < Tp + hh - 14) g.fillText("0 V", L - 6, Y(0) + 4);   /* skip when it would collide with an end label */
        g.textAlign = "left"; g.fillText(fT(span / 6) + "/div", L, f.h - 6); }
    }
    g.setLineDash([4, 4]); g.strokeStyle = ink; g.globalAlpha = big ? 0.55 : 0.35; g.lineWidth = 1; g.beginPath(); g.moveTo(L, Y(0)); g.lineTo(L + w, Y(0)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    if (o.rails && m.clipped) { g.strokeStyle = th.warn; g.globalAlpha = 0.7; g.setLineDash([2, 4]); [m.lim, -m.lim].forEach(function (v) { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + w, Y(v)); g.stroke(); }); g.setLineDash([]); g.globalAlpha = 1; }
    o.traces.forEach(function (t, ti) {
      g.beginPath(); g.lineJoin = "round"; g.lineWidth = t.w || (big ? 2 : 1.5);
      for (i = 0; i <= n; i++) { var v = m.at(t.k, t0 + span * i / n), x = L + w * i / n; i ? g.lineTo(x, Y(v)) : g.moveTo(x, Y(v)); }
      g.strokeStyle = t.col === "ink" ? ink : t.col === "accent" ? th.accent : th.accent2; g.globalAlpha = t.alpha || 1; if (t.dash) g.setLineDash(t.dash); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (big && t.label) { g.fillStyle = g.strokeStyle; g.textAlign = "left"; g.fillText("— " + t.label, L + 6 + ti * 120, Tp - 8); }
    });
  }
  function drawBits(cv, m, now, big, inv) {
    var f = fit(cv), g = f.g, th = T(now), ink = inv ? th.bg : th.fg, w = f.w, hh = f.h, bits = [], i;
    for (i = 11; i >= 0; i--) bits.push((m.code >> i) & 1);
    if (!big) {
      var bw = (w - 6) / 12, y1 = hh * 0.22, y0 = hh * 0.72; g.beginPath(); g.lineWidth = 1.6; g.strokeStyle = th.accent;
      bits.forEach(function (b, k) { var x = 3 + k * bw, y = b ? y1 : y0; k ? g.lineTo(x, y) : g.moveTo(x, y); g.lineTo(x + bw, y); }); g.stroke();
      var cx = 3 + ((speed ? now / 700 : 0) % 1) * (w - 6); g.fillStyle = ink; g.globalAlpha = 0.5; g.fillRect(cx, 2, 1, hh - 4); g.globalAlpha = 1; return;
    }
    var bw2 = Math.min(40, (w - 20) / 12), x0 = (w - bw2 * 12) / 2, by = 34; g.font = "12px system-ui, sans-serif"; g.textAlign = "center";
    g.fillStyle = th.muted; g.fillText("12-bit DAC code, sent over I²C (MSB first)", w / 2, 18);
    bits.forEach(function (b, k) { var x = x0 + k * bw2; g.fillStyle = b ? th.accent : "transparent"; g.strokeStyle = th.stroke; g.lineWidth = 1; g.fillRect(x + 2, by, bw2 - 4, 30); g.strokeRect(x + 2, by, bw2 - 4, 30); g.fillStyle = b ? "#fff" : th.muted; g.fillText(b, x + bw2 / 2, by + 20); g.fillStyle = th.muted; g.font = "10px system-ui"; g.fillText("b" + (11 - k), x + bw2 / 2, by + 44); g.font = "12px system-ui, sans-serif"; });
    if (!HOME) { g.fillStyle = ink; g.fillText("code = " + m.code + "  (0x" + m.code.toString(16).toUpperCase() + ")", w / 2, by + 70); }
    var bx = 30, bwid = w - 60, byy = hh - 34; g.fillStyle = th.muted; g.textAlign = "left"; g.fillText(HOME ? "XADC input (conditioned signal)" : "XADC input (conditioned signal), 0 to " + fN(m.state.cond.xadcFS, 1) + " V", bx, byy - 10);
    g.strokeStyle = th.stroke; g.strokeRect(bx, byy, bwid, 12); var FS = m.state.cond.xadcFS, a = Sim.clamp(m.condMin / FS, 0, 1), b2 = Sim.clamp(m.condMax / FS, 0, 1);
    g.fillStyle = th.accent2; g.fillRect(bx + a * bwid, byy, Math.max(2, (b2 - a) * bwid), 12);
  }
  function drawStair(cv, m, now, big, inv) {
    var f = fit(cv), g = f.g, th = T(now), ink = inv ? th.bg : th.fg, p = m.state.ckt, L = big ? 52 : 4, B = big ? 22 : 4, w = f.w - L - 6, hh = f.h - B - 6, c = m.code, k = big ? 8 : 6, i;
    var vcOf = function (cd) { return cd / m.codeMax * p.vdacFS; }, v0 = vcOf(c - k), v1 = vcOf(c + k);
    function X(cd) { return L + (cd - (c - k)) / (2 * k + 1) * w; } function Y(v) { return 6 + (1 - (v - v0) / (v1 - v0 || 1)) * hh; }
    g.beginPath(); g.lineWidth = big ? 2 : 1.5; g.strokeStyle = ink; g.globalAlpha = 0.8;
    for (i = c - k; i <= c + k; i++) { var y = Y(vcOf(i)); i === c - k ? g.moveTo(X(i), y) : g.lineTo(X(i), y); g.lineTo(X(i + 1), y); } g.stroke(); g.globalAlpha = 1;
    var pulse = speed ? 3 + Math.sin(now / 250) : 3; g.fillStyle = th.accent; g.beginPath(); g.arc(X(c + 0.5), Y(vcOf(c)), big ? pulse + 2 : pulse, 0, TAU); g.fill();
    if (big && !HOME) { g.fillStyle = th.muted; g.font = "11px system-ui, sans-serif"; g.textAlign = "right"; g.fillText(fN(v1, 3) + " V", L - 6, 14); g.fillText(fN(v0, 3) + " V", L - 6, 6 + hh); g.textAlign = "left"; g.fillText("code " + (c - k) + " … " + (c + k) + "   (1 LSB = " + (m.dacLsb * 1000).toFixed(2) + " mV)", L, f.h - 6); }
  }
  function drawInv(cv, m, now, big, inv) {
    var f = fit(cv), g = f.g, th = T(now), ink = inv ? th.bg : th.fg, w = f.w, hh = f.h, mid = hh / 2, sc = (mid - (big ? 28 : 6)) / Math.max(m.state.ckt.vcMax, 0.01), x = w * 0.28, x2 = w * 0.72;
    g.setLineDash([4, 4]); g.strokeStyle = ink; g.globalAlpha = 0.4; g.beginPath(); g.moveTo(3, mid); g.lineTo(w - 3, mid); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.fillStyle = th.accent2; g.fillRect(x - 14, mid - m.vc * sc, 28, m.vc * sc);
    g.fillStyle = th.accent; g.fillRect(x2 - 14, mid, 28, m.vc * sc);
    g.strokeStyle = ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x + 26, mid); g.lineTo(x2 - 26, mid); g.stroke(); g.beginPath(); g.moveTo(x2 - 32, mid - 5); g.lineTo(x2 - 24, mid); g.lineTo(x2 - 32, mid + 5); g.stroke();
    if (big) { g.font = "12px system-ui, sans-serif"; g.textAlign = "center"; g.fillStyle = ink; g.fillText(HOME ? "+Vc" : "+Vc = " + fN(m.vc, 3) + " V", x, 16); g.fillText(HOME ? "−Vc" : "−Vc = " + fN(-m.vc, 3) + " V", x2, hh - 8); g.fillStyle = th.muted; g.fillText("unity-gain inversion", w / 2, mid - 10); }
  }
  /* N-channel JFET cross-section (textbook style). Channel opening and depletion depth come from VGS and VP of the shared JFET model;
     IDSS sets the resistance shown. Static drawing: it changes only when the model changes. */
  function drawJfet(cv, m, now, big, inv) {
    var f = fit(cv), g = f.g, th = T(now), ink = inv ? th.bg : th.fg, w = f.w, hh = f.h, jf = m.jfet, j = m.state.jfet, detail = big && !HOME, full = big;
    var mx = full ? 64 : 8, x0 = mx + (full ? 26 : 4), x1 = w - mx - (full ? 26 : 4), cy = hh / 2 - (detail ? 12 : 0);
    var H0 = full ? Math.min(124, hh * 0.3) : hh * 0.34, gh = full ? Math.min(58, hh * 0.15) : hh * 0.17, top = cy - H0 / 2, bot = cy + H0 / 2, L = x1 - x0;
    var gx0 = x0 + L * 0.26, gx1 = x1 - L * 0.26, cx = (gx0 + gx1) / 2, half = H0 / 2, d0 = half * (1 - jf.open), dL = Math.min(half, d0 * 0.8), dR = Math.min(half, d0 * 1.25), e = Math.max(d0 * 0.9, 0.0001);
    function fill(col, a) { g.globalAlpha = a; g.fillStyle = col; g.fill(); g.globalAlpha = 1; }
    function rect(x, y, ww, h2, col, a) { g.beginPath(); g.rect(x, y, ww, h2); fill(col, a); g.strokeStyle = ink; g.globalAlpha = 0.85; g.lineWidth = 1.2; g.stroke(); g.globalAlpha = 1; }
    rect(x0, top, L, H0, th.accent2, 0.15);                                  /* N-type channel */
    rect(gx0, top - gh, gx1 - gx0, gh, th.accent, 0.2); rect(gx0, bot, gx1 - gx0, gh, th.accent, 0.2);          /* P-type gates, top and bottom */
    [[top, 1], [bot, -1]].forEach(function (q) {                             /* depletion regions, symmetric about the channel centre line, deeper toward the drain */
      var yj = q[0], sg = q[1]; g.beginPath(); g.moveTo(gx0 - e, yj); g.lineTo(gx0, yj + sg * dL); g.lineTo(gx1, yj + sg * dR); g.lineTo(gx1 + e, yj); g.closePath();
      if (d0 > 0.5) {
        g.save(); g.clip(); g.strokeStyle = ink; g.globalAlpha = full ? 0.32 : 0.45; g.lineWidth = 1; g.beginPath();
        for (var k = -hh; k < w + hh; k += full ? 6 : 4) { g.moveTo(k, yj - sg * hh); g.lineTo(k + hh * 2 * sg, yj + sg * hh); } g.stroke(); g.restore();
        g.beginPath(); g.moveTo(gx0 - e, yj); g.lineTo(gx0, yj + sg * dL); g.lineTo(gx1, yj + sg * dR); g.lineTo(gx1 + e, yj); g.setLineDash([3, 3]); g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 1; g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      }
    });
    var cw = H0 * 0.7, cy0 = cy - cw / 2;                                    /* source and drain contacts */
    rect(x0 - 9, cy0, 9, cw, ink, 0.55); rect(x1, cy0, 9, cw, ink, 0.55);
    if (!full) return;
    g.strokeStyle = ink; g.fillStyle = ink; g.lineWidth = 1.2; g.globalAlpha = 0.85; g.font = AXT; g.textAlign = "center";
    function wire(x1_, y1_, x2_, y2_, label, lx, ly, al) { g.beginPath(); g.moveTo(x1_, y1_); g.lineTo(x2_, y2_); g.stroke(); g.beginPath(); g.arc(x2_, y2_, 3.2, 0, TAU); g.fillStyle = th.bg; g.fill(); g.stroke(); g.fillStyle = ink; g.textAlign = al || "center"; g.fillText(label, lx, ly); }
    wire(x0 - 9, cy, mx - 6, cy, "S", mx - 6, cy - 9, "center"); wire(x1 + 9, cy, w - mx + 6, cy, "D", w - mx + 6, cy - 9, "center");
    wire(cx, top - gh, cx, top - gh - 26, "G", cx + 12, top - gh - 20, "left"); wire(cx, bot + gh, cx, bot + gh + 26, "G", cx + 12, bot + gh + 34, "left");
    g.font = AXF; g.globalAlpha = 0.8; g.fillStyle = ink; g.textAlign = "center"; g.fillText("P-type gate", cx, top - gh / 2 + 4); g.fillText("P-type gate", cx, bot + gh / 2 + 4);
    g.textAlign = "left"; g.fillText("N-type channel", x0 + 8, bot - 8);
    g.textAlign = "right"; g.fillText("Depletion region", x1 - 4, top - gh * 0.55); g.beginPath(); g.moveTo(x1 - 40, top - gh * 0.55 + 4); g.lineTo(gx1 + e * 0.35, top + 2); g.lineWidth = 1; g.stroke();
    if (detail || big) {                                                      /* electron flow, and the channel-width dimension */
      var chOpen = jf.open > 0.02; g.strokeStyle = ink; g.fillStyle = ink; g.globalAlpha = chOpen ? 0.8 : 0.3; g.lineWidth = 1.4; g.setLineDash(chOpen ? [] : [4, 4]);
      g.beginPath(); g.moveTo(x0 + 10, cy); g.lineTo(x1 - 14, cy); g.stroke(); g.setLineDash([]); g.beginPath(); g.moveTo(x1 - 8, cy); g.lineTo(x1 - 17, cy - 4); g.lineTo(x1 - 17, cy + 4); g.closePath(); g.fill();
      g.globalAlpha = 0.8; g.font = AXF; g.textAlign = "left"; g.fillText("electron flow, S → D", x0 + 12, cy - 6);
      if (chOpen) { var dm = Math.min(half, d0 * 1.02), y1 = top + dm, y2 = bot - dm; g.strokeStyle = th.accent; g.fillStyle = th.accent; g.globalAlpha = 1; g.lineWidth = 1.2;
        g.beginPath(); g.moveTo(cx - 7, y1); g.lineTo(cx + 7, y1); g.moveTo(cx - 7, y2); g.lineTo(cx + 7, y2); g.moveTo(cx, y1); g.lineTo(cx, y2); g.stroke();
        [[y1, 1], [y2, -1]].forEach(function (a2) { g.beginPath(); g.moveTo(cx, a2[0]); g.lineTo(cx - 3.5, a2[0] + a2[1] * 7); g.lineTo(cx + 3.5, a2[0] + a2[1] * 7); g.closePath(); g.fill(); });
        g.textAlign = "left"; g.fillText("W", cx + 10, cy + 20); }
    }
    g.globalAlpha = 1;
    if (detail) {
      var by = hh - 34; g.font = AXF; g.fillStyle = ink; g.textAlign = "left";
      g.fillText("VGS = " + fN(jf.vgs, 2) + " V     VP = " + fN(j.vp, 2) + " V     IDSS = " + (j.idss * 1000).toFixed(j.idss < 0.01 ? 1 : 0) + " mA", mx, by);
      g.fillText(jf.pinched ? "PINCHED OFF (VGS ≤ VP): channel closed, no conduction" : "Channel open " + (jf.open * 100).toFixed(0) + " %     Rds ≈ " + fOhm(jf.rds) + "  (ohmic region)", mx, by + 19);
      var sx0 = w - mx - 190, sx1 = w - mx, sy = by + 6, pos = Sim.clamp((jf.vgs - j.vp) / (0 - j.vp), 0, 1);     /* gate bias scale from VP to 0 V */
      g.strokeStyle = ink; g.globalAlpha = 0.6; g.lineWidth = 1; g.beginPath(); g.moveTo(sx0, sy); g.lineTo(sx1, sy); g.moveTo(sx0, sy - 4); g.lineTo(sx0, sy + 4); g.moveTo(sx1, sy - 4); g.lineTo(sx1, sy + 4); g.stroke(); g.globalAlpha = 0.8;
      g.textAlign = "left"; g.fillText("VP", sx0, sy + 18); g.textAlign = "right"; g.fillText("0 V", sx1, sy + 18); g.fillStyle = th.accent; g.beginPath(); g.moveTo(sx0 + pos * 190, sy - 1); g.lineTo(sx0 + pos * 190 - 5, sy - 10); g.lineTo(sx0 + pos * 190 + 5, sy - 10); g.closePath(); g.fill();
      g.globalAlpha = 1;
    }
  }

  /* ---------- engineering plots: one frame (grid, axes, ticks, titles) shared by the waveform, Bode and JFET graphs ---------- */
  var AXF = '500 11.5px "Instrument Sans", system-ui, sans-serif', AXT = '600 12px "Instrument Sans", system-ui, sans-serif';
  function niceStep(v) { var e = Math.pow(10, Math.floor(Math.log10(v))), f = v / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; }
  function lin(lo, hi, n) { var st = niceStep((hi - lo) / n), a = Math.ceil(lo / st - 1e-9) * st, out = []; for (var v = a; v <= hi + st * 1e-6; v += st) out.push(Math.abs(v) < st * 1e-9 ? 0 : +v.toPrecision(10)); return { t: out, st: st }; }
  function dec(st) { return Math.max(0, -Math.floor(Math.log10(st) + 1e-9)); }
  function decades(lo, hi) { var o = [], d; for (d = Math.pow(10, Math.floor(Math.log10(lo))); d <= hi; d *= 10) for (var k = 2; k < 10; k++) if (d * k > lo && d * k < hi) o.push(d * k); return o; }
  function plotFrame(cv, now, o) {
    var f = fit(cv), g = f.g, th = T(now), L = o.L || 66, R = 18, Tp = o.Tp || 14, B = 48, w = f.w - L - R, hh = f.h - Tp - B, lg = Math.log10;
    var X = function (v) { return L + (o.xlog ? (lg(v) - lg(o.xmin)) / (lg(o.xmax) - lg(o.xmin)) : (v - o.xmin) / (o.xmax - o.xmin)) * w; };
    var Y = function (v) { return Tp + (1 - (o.ylog ? (lg(v) - lg(o.ymin)) / (lg(o.ymax) - lg(o.ymin)) : (v - o.ymin) / (o.ymax - o.ymin))) * hh; };
    g.lineWidth = 1; g.strokeStyle = th.fg;
    function vline(v, a) { g.globalAlpha = a; g.beginPath(); g.moveTo(Math.round(X(v)) + .5, Tp); g.lineTo(Math.round(X(v)) + .5, Tp + hh); g.stroke(); }
    function hline(v, a) { g.globalAlpha = a; g.beginPath(); g.moveTo(L, Math.round(Y(v)) + .5); g.lineTo(L + w, Math.round(Y(v)) + .5); g.stroke(); }
    (o.xminor || []).forEach(function (v) { vline(v, 0.06); }); (o.yminor || []).forEach(function (v) { hline(v, 0.06); });
    o.xt.forEach(function (v) { vline(v, 0.15); }); o.yt.forEach(function (v) { hline(v, 0.15); });
    g.globalAlpha = 0.7; g.strokeRect(L + .5, Tp + .5, w, hh);
    g.font = AXF; g.globalAlpha = 0.85; g.fillStyle = th.fg; g.textAlign = "center";
    o.xt.forEach(function (v) { g.fillText(o.xfmt(v), X(v), Tp + hh + 17); g.globalAlpha = 0.7; g.beginPath(); g.moveTo(Math.round(X(v)) + .5, Tp + hh); g.lineTo(Math.round(X(v)) + .5, Tp + hh + 4); g.stroke(); g.globalAlpha = 0.85; });
    g.textAlign = "right"; o.yt.forEach(function (v) { g.fillText(o.yfmt(v), L - 8, Y(v) + 4); });
    g.font = AXT; g.textAlign = "center"; g.fillText(o.xtitle, L + w / 2, f.h - 8); g.save(); g.translate(15, Tp + hh / 2); g.rotate(-Math.PI / 2); g.fillText(o.ytitle, 0, 0); g.restore(); g.globalAlpha = 1;
    g.save(); g.beginPath(); g.rect(L, Tp, w, hh); g.clip();     /* traces are drawn inside the plot area only; call pl.end() when done */
    return { g: g, th: th, X: X, Y: Y, L: L, Tp: Tp, w: w, hh: hh, f: f, end: function () { g.restore(); } };
  }
  function legend(pl, items) {
    var g = pl.g, y = 15; g.font = AXF; g.textAlign = "left"; var wid = 0; items.forEach(function (it) { it.wd = g.measureText(it.label).width + 40; wid += it.wd; });
    var cx = pl.L + pl.w - wid + 14; items.forEach(function (it) { g.strokeStyle = it.col; g.lineWidth = 2; g.setLineDash(it.dash || []); g.beginPath(); g.moveTo(cx, y); g.lineTo(cx + 20, y); g.stroke(); g.setLineDash([]); g.fillStyle = pl.th.fg; g.globalAlpha = 0.9; g.fillText(it.label, cx + 26, y + 4); g.globalAlpha = 1; cx += it.wd; });
  }
  /* Input -> filtered -> conditioned, sampled from the same model as the oscilloscope (fixed window from t = 0, so it is a stable plot, not an animation) */
  function drawWavePlot(cv, m, now) {
    var span = m.useMic ? 0.04 : 3 / m.f, lo = 0, hi = 0, i, n = 700;
    ["in", "filt", "cond"].forEach(function (k) { var e = ext(m, k); lo = Math.min(lo, e[0]); hi = Math.max(hi, e[1]); });
    var pad = (hi - lo) * 0.08, yt = lin(lo - pad, hi + pad, 6), un = span >= 1e-3 ? ["ms", 1e3] : ["µs", 1e6], xt = lin(0, span, 6), xd = dec(xt.st * un[1]), yd = dec(yt.st);
    var pl = plotFrame(cv, now, { xmin: 0, xmax: span, ymin: lo - pad, ymax: hi + pad, xt: xt.t, yt: yt.t, xfmt: function (v) { return (v * un[1]).toFixed(xd); }, yfmt: function (v) { return v.toFixed(yd); }, xtitle: "Time (" + un[0] + ")", ytitle: "Voltage (V)", Tp: 34 }), g = pl.g;
    g.strokeStyle = pl.th.fg; g.globalAlpha = 0.55; g.lineWidth = 1; g.beginPath(); g.moveTo(pl.L, Math.round(pl.Y(0)) + .5); g.lineTo(pl.L + pl.w, Math.round(pl.Y(0)) + .5); g.stroke(); g.globalAlpha = 1;
    [["in", pl.th.muted, [5, 4]], ["filt", pl.th.accent2, []], ["cond", pl.th.accent, []]].forEach(function (t) {
      g.beginPath(); g.lineWidth = 1.7; g.lineJoin = "round"; g.strokeStyle = t[1]; g.setLineDash(t[2]);
      for (i = 0; i <= n; i++) { var x = pl.X(span * i / n), y = pl.Y(m.at(t[0], span * i / n)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.setLineDash([]);
    });
    pl.end(); legend(pl, [{ label: "Input", col: pl.th.muted, dash: [5, 4] }, { label: "Filtered", col: pl.th.accent2 }, { label: "Conditioned (+DC shift)", col: pl.th.accent }]);
  }
  /* Bode magnitude of the selected low-pass model, log frequency axis */
  function drawBode(cv, m, now) {
    var s = m.state.cond, fmin = 10, fmax = 1e6, dbMin = -80, dbMax = 5, i, n = 500;
    var pl = plotFrame(cv, now, { xlog: true, xmin: fmin, xmax: fmax, ymin: dbMin, ymax: dbMax, xt: [10, 100, 1e3, 1e4, 1e5, 1e6], xminor: decades(fmin, fmax), yt: [0, -20, -40, -60, -80], yminor: [-10, -30, -50, -70], xfmt: function (v) { return v >= 1e6 ? "1 MHz" : v >= 1000 ? v / 1000 + " kHz" : v + " Hz"; }, yfmt: function (v) { return v + " dB"; }, xtitle: "Frequency (Hz)", ytitle: "Magnitude (dB)", L: 70, Tp: 34 }), g = pl.g, th = pl.th;
    g.setLineDash([6, 4]); g.lineWidth = 1; g.strokeStyle = th.fg; g.globalAlpha = 0.6; g.beginPath(); g.moveTo(pl.L, pl.Y(-3.01)); g.lineTo(pl.L + pl.w, pl.Y(-3.01)); g.stroke();
    g.strokeStyle = th.warn; g.globalAlpha = 0.9; g.beginPath(); g.moveTo(pl.X(s.fc), pl.Tp); g.lineTo(pl.X(s.fc), pl.Tp + pl.hh); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    g.beginPath(); g.lineWidth = 2; g.lineJoin = "round"; g.strokeStyle = th.accent2;
    for (i = 0; i <= n; i++) { var fq = Math.pow(10, Math.log10(fmin) + (Math.log10(fmax) - Math.log10(fmin)) * i / n), d = Math.max(20 * Math.log10(Sim.lpf(fq, s.fc, s.order).mag), dbMin - 5); i ? g.lineTo(pl.X(fq), pl.Y(d)) : g.moveTo(pl.X(fq), pl.Y(d)); } g.stroke();
    if (m.f) { var dd = 20 * Math.log10(m.H.mag); g.fillStyle = th.accent; g.beginPath(); g.arc(pl.X(m.f), pl.Y(dd), 4.5, 0, TAU); g.fill(); }
    pl.end(); g.font = AXF; g.fillStyle = th.fg; g.textAlign = "right"; g.fillText("−3 dB", pl.L + pl.w - 8, pl.Y(-3.01) + 15);
    var fcx = pl.X(s.fc), left = fcx > pl.L + 140; g.fillStyle = th.warn; g.textAlign = left ? "right" : "left"; g.fillText("fc = " + fHz(s.fc) + "  (−3 dB)", fcx + (left ? -8 : 8), pl.Y(-42));
    if (m.f) { var dd2 = 20 * Math.log10(m.H.mag), fx = pl.X(m.f), rt = fx > pl.L + pl.w - 190; g.fillStyle = th.fg; g.textAlign = rt ? "right" : "left"; g.fillText("f = " + fHz(m.f) + ", " + fN(dd2, 2) + " dB", fx + (rt ? -9 : 9), pl.Y(dd2) + 22); }
    legend(pl, [{ label: s.order === 2 ? "2nd-order Butterworth low-pass" : "1st-order RC low-pass", col: th.accent2 }]);
  }

  var PREV = {
    in: function (cv, m, now, big, inv) { drawAnalog(cv, m, now, { big: big, inv: inv, traces: [{ k: "in", col: "ink", label: "Input" }] }); },
    cond: function (cv, m, now, big, inv) { drawAnalog(cv, m, now, { big: big, inv: inv, traces: [{ k: "in", col: "ink", alpha: 0.5, dash: [3, 3], label: "Input" }, { k: "cond", col: "accent2", label: "Conditioned" }] }); },
    amp: function (cv, m, now, big, inv) { drawAnalog(cv, m, now, { big: big, inv: inv, rails: true, traces: [{ k: "cond", col: "ink", alpha: 0.55, label: "Input (conditioned)" }].concat(m.clipped ? [{ k: "outIdeal", col: "accent", alpha: 0.4, dash: [3, 3], label: "Ideal output" }] : []).concat([{ k: "out", col: "accent", label: "Simulated output" }]) }); },
    out: function (cv, m, now, big, inv) { drawAnalog(cv, m, now, { big: big, inv: inv, rails: true, traces: (m.clipped ? [{ k: "outIdeal", col: "accent", alpha: 0.4, dash: [3, 3], label: "Ideal" }] : []).concat([{ k: "out", col: "accent", label: "Output" }]) }); },
    fpga: drawBits, dac: drawStair, inv: drawInv, jfet: drawJfet
  };

  /* ---------- reusable numeric control (slider + number box, bound to the store) ---------- */
  var refreshers = [], uid = 0;
  store.on(function () { refreshers.forEach(function (f) { f(); }); });
  function num(label, o) {
    var id = "sim" + (++uid), st = function () { return store.state[o.g][o.k]; }, lg = o.log, mn = o.min, mx = o.max;
    var pos = function (v) { return Math.round(1000 * (lg ? Math.log(v / mn) / Math.log(mx / mn) : (v - mn) / (mx - mn))); };
    var val = function (p) { var q = p / 1000; return lg ? mn * Math.pow(mx / mn, q) : mn + q * (mx - mn); };
    var rng = h("input", { type: "range", id: id, min: 0, max: 1000, step: 1, "aria-label": label }), nb = h("input", { type: "number", step: o.step || "any", "aria-label": label + " value" });
    function commit(v) { var p = {}; p[o.g] = {}; p[o.g][o.k] = v; if (o.also) o.also(p, v); store.set(p); }
    rng.addEventListener("input", function () { commit(+val(+rng.value).toPrecision(4)); });
    nb.addEventListener("change", function () { var v = parseFloat(nb.value); if (isFinite(v)) commit(v); else refresh(); });
    function refresh() { var v = st(); rng.value = pos(Math.min(Math.max(v, mn), mx)); if (doc.activeElement !== nb) nb.value = +v.toPrecision(5); }
    refreshers.push(refresh); refresh();
    return h("div", { class: "sim-field" }, [h("label", { for: id, text: label }), rng, h("span", { class: "sim-num" }, [nb, h("em", { text: o.unit || "" })])]);
  }
  function seg(opts, get, set, aria) {
    var wrap = h("div", { class: "sim-seg", role: "group", "aria-label": aria || "" }), btns = opts.map(function (o) { return h("button", { type: "button", text: o[1], "data-v": o[0], on: { click: function () { set(o[0]); } } }); });
    btns.forEach(function (b) { wrap.appendChild(b); });
    function refresh() { btns.forEach(function (b) { var on = b.getAttribute("data-v") === String(get()); b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); }
    refreshers.push(refresh); refresh(); return wrap;
  }
  function gainCtl() {
    var id = "sim" + (++uid), rng = h("input", { type: "range", id: id, min: 0, max: 1000, "aria-label": "Gain" }), nb = h("input", { type: "number", step: "any", "aria-label": "Gain value" });
    function setGain(v) { store.set({ gain: { mode: "manual", manual: v } }); }
    rng.addEventListener("input", function () { var m = store.model(); setGain(+(m.avMin + (+rng.value / 1000) * (m.avMax - m.avMin)).toFixed(2)); });
    nb.addEventListener("change", function () { var v = parseFloat(nb.value); if (isFinite(v)) setGain(v); });
    function refresh() { var m = store.model(), v = store.state.gain.mode === "manual" ? store.state.gain.manual : m.av; rng.value = Math.round(1000 * Sim.clamp((v - m.avMin) / (m.avMax - m.avMin), 0, 1)); if (doc.activeElement !== nb) nb.value = +v.toFixed(2); }
    refreshers.push(refresh); refresh();
    return h("div", { class: "sim-field" }, [h("label", { for: id, text: "Gain Av" }), rng, h("span", { class: "sim-num" }, [nb, h("em", { text: "×" })])]);
  }

  /* =====================================================================  HOME: SIGNAL CHAIN (overview only)  ===================================================================== */
  function initChain() {
    var box = doc.querySelector(".chain"); if (!box) return;
    var items = S.chain || [], by = {}; items.forEach(function (c, i) { by[c.id] = c; c._i = i; });
    var blocks = [].slice.call(box.querySelectorAll(".cblock")), det = box.querySelector(".chain-detail"), $ = function (c) { return det.querySelector(c); };
    var sel = items[0].id;
    function esc(t) { return String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
    function select(id) {
      var c = by[id]; if (!c) return; sel = id; box.setAttribute("data-sel", id);
      blocks.forEach(function (b) { var on = b.dataset.id === id; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on ? "true" : "false"); });
      $(".cd-n").textContent = "Block " + String(c._i + 1).padStart(2, "0");
      $(".cd-grp").textContent = c.group === "control" ? "Gain-control path" : "Analog signal path";
      $(".cd-title").textContent = c.name; $(".cd-info").textContent = c.info || "";
      $(".cd-io").innerHTML = "<div><dt>Input</dt><dd>" + esc(c.in) + "</dd></div><div><dt>Output</dt><dd>" + esc(c.out) + "</dd></div>";
      var a = $(".cd-link"); a.href = "design.html?tab=" + (c.tab || "analysis") + "#simulator"; a.setAttribute("data-title", "Design");
      det.classList.remove("swap"); void det.offsetWidth; det.classList.add("swap");
    }
    blocks.forEach(function (b) { b.addEventListener("click", function () { select(b.dataset.id); }); });
    $(".cd-next").addEventListener("click", function () { select(items[(by[sel]._i + 1) % items.length].id); });
    $(".cd-prev").addEventListener("click", function () { select(items[(by[sel]._i + items.length - 1) % items.length].id); });
    blocks.forEach(function (b) { addView(b.querySelector(".cviz"), function (c, m, now) { var d = PREV[b.dataset.id]; if (d) d(c, m, now, false, b.classList.contains("on")); }); });
    addView($(".cd-viz"), function (c, m, now) { var d = PREV[sel]; if (d) d(c, m, now, true, false); });

    /* feedback bus: from the last control block up into the op-amp block */
    var bus = box.querySelector(".cbus"), dia = box.querySelector(".chain-diagram");
    function placeBus() {
      var amp = box.querySelector('.cblock[data-id="amp"]'), ctls = box.querySelectorAll(".ctl-row .cblock"), lastB = ctls[ctls.length - 1];
      if (!amp || !lastB || !bus || getComputedStyle(bus).display === "none") return;
      var d = dia.getBoundingClientRect(), a = amp.getBoundingClientRect(), k = lastB.getBoundingClientRect(), y1 = a.top - d.top + a.height / 2, y2 = k.top - d.top + k.height / 2;
      bus.style.top = y1 + "px"; bus.style.height = Math.max(0, y2 - y1) + "px";
    }
    placeBus(); addEventListener("resize", placeBus); setTimeout(placeBus, 700); setTimeout(placeBus, 2200);
    if (window.ResizeObserver) new ResizeObserver(placeBus).observe(dia);
    if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(placeBus);
    select(sel);
  }

  /* =====================================================================  DESIGN: SIMULATOR  ===================================================================== */
  var TDIVS = [1e-5, 2e-5, 5e-5, 1e-4, 2e-4, 5e-4, 1e-3, 2e-3, 5e-3, 1e-2, 2e-2, 5e-2], VDIVS = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5];
  function niceUp(v, list) { for (var i = 0; i < list.length; i++) if (list[i] >= v) return list[i]; return list[list.length - 1]; }

  function initSim() {
    var host = doc.getElementById("vga-sim"); if (!host) return;
    var circuitHTML = host.getAttribute("data-circuit") || ""; host.removeAttribute("data-circuit"); host.innerHTML = "";
    var scope = buildScope(), tabs = {}, panels = {};

    /* ---- generator ---- */
    var gen = h("div", { class: "glass sim-card" }, [h("h3", { text: "Signal generator" }),
      seg([["sine", "Sine wave"], ["mic", "Microphone"]], function () { return store.state.gen.mode; }, function (v) { store.set({ gen: { mode: v } }); }, "Input source")]);
    var sineBox = h("div", { class: "sim-sine" }, [num("Amplitude", { g: "gen", k: "vpp", min: 0.01, max: 1, log: true, unit: "Vpp", step: 0.005 }), num("Frequency", { g: "gen", k: "freq", min: 20, max: 20000, log: true, unit: "Hz", step: 10 }),
      num("DC offset", { g: "gen", k: "dc", min: -1, max: 1, unit: "V", step: 0.01 }), num("Phase", { g: "gen", k: "phase", min: -180, max: 180, unit: "°", step: 1 }), h("p", { class: "sim-eq", text: "Vin(t) = Voffset + (Vpp/2) × sin(2πft + φ)" })]);
    var micBox = buildMic(); gen.appendChild(sineBox); gen.appendChild(micBox);
    refreshers.push(function () { var mic = store.state.gen.mode === "mic"; sineBox.hidden = mic; micBox.hidden = !mic; });

    /* ---- gain controller ---- */
    var gc = h("div", { class: "glass sim-card" }, [h("h3", { text: "Gain controller" }),
      seg([["auto", "Automatic"], ["manual", "Manual"]], function () { return store.state.gain.mode; }, function (v) { store.set({ gain: { mode: v } }); }, "Gain mode"), h("p", { class: "sim-eq", html: "Av = 1 + (R2/R1) × (Vc/Vref)" })]);
    var autoBox = h("div", {}, [num("Target output", { g: "gain", k: "target", min: 0.5, max: 10, unit: "Vpp", step: 0.1 }), h("p", { class: "sim-hint", text: "The FPGA measures the conditioned input and picks the gain: Av = target / measured input amplitude." })]);
    var manBox = h("div", {}, [gainCtl(), h("p", { class: "sim-hint", text: "Pick any gain in the achievable range; the DAC code, Vc and gate voltage follow." })]);
    var ro = h("dl", { class: "sim-kv" }), warn = h("ul", { class: "sim-warn", "aria-live": "polite" });
    gc.appendChild(autoBox); gc.appendChild(manBox); gc.appendChild(ro); gc.appendChild(warn);
    refreshers.push(function () {
      var man = store.state.gain.mode === "manual", m = store.model(); autoBox.hidden = man; manBox.hidden = !man;
      ro.innerHTML = dl([["Required gain", isFinite(m.avRequired) ? fN(m.avRequired, 2) : "—"], ["Actual gain", fN(m.av, 2) + " (" + fN(20 * Math.log10(m.av), 1) + " dB)"], ["DAC code", m.code + " / " + m.codeMax], ["+Vc (DAC)", fN(m.vc, 3) + " V"], ["Gate voltage", fN(m.vgate, 3) + " V"], ["Output", fN(m.outPp, 3) + " Vpp" + (m.targetOk === true ? " ✓ target" : m.targetOk === false ? " ✗ target" : "")]]);
      warn.innerHTML = m.notes.map(function (n) { return "<li>" + n.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>"; }).join("");
    });
    host.appendChild(h("div", { class: "sim-row", id: "sim-gen" }, [gen, gc]));
    host.appendChild(scope.el);

    /* ---- tabs ---- */
    var tabDefs = [["analysis", "Engineering analysis"], ["cond", "Input conditioning"], ["amp", "Amplifier circuit"], ["jfet", "JFET channel"], ["params", "Parameters"]];
    var bar = h("div", { class: "sim-tabs", role: "tablist" }), wrap = h("div", { class: "sim-panels" });
    function show(id) { tabDefs.forEach(function (d) { var on = d[0] === id; tabs[d[0]].classList.toggle("on", on); tabs[d[0]].setAttribute("aria-selected", on); panels[d[0]].hidden = !on; }); refreshers.forEach(function (f) { f(); }); }
    tabDefs.forEach(function (d) { tabs[d[0]] = h("button", { type: "button", role: "tab", text: d[1], on: { click: function () { show(d[0]); } } }); panels[d[0]] = h("div", { class: "sim-panel", role: "tabpanel", hidden: true }); bar.appendChild(tabs[d[0]]); wrap.appendChild(panels[d[0]]); });
    host.appendChild(h("div", { class: "glass sim-card sim-tabcard" }, [bar, wrap]));
    buildAnalysis(panels.analysis); buildCond(panels.cond); buildAmp(panels.amp, circuitHTML); buildJfet(panels.jfet); buildParams(panels.params);
    host.querySelectorAll(".reveal").forEach(function (e) { e.classList.add("in"); });

    var q = new URLSearchParams(location.search).get("tab"), goTab = { cond: "cond", amp: "amp", jfet: "jfet", analysis: "analysis", gen: "analysis", scope: "analysis" }[q] || "analysis";
    show(goTab);
    if (location.hash === "#simulator" || q) setTimeout(function () { var el = q === "scope" ? scope.el : q === "gen" ? doc.getElementById("sim-gen") : doc.getElementById("simulator"); if (el) el.scrollIntoView({ behavior: "auto", block: "start" }); }, 150);
  }

  /* ---- microphone: record, play, use as the simulation input (a virtual source, not wired to the hardware) ---- */
  function buildMic() {
    var box = h("div", { class: "sim-mic" }), status = h("p", { class: "sim-hint sim-status", "aria-live": "polite", text: "Microphone is off. Press Enable microphone to start." });
    var note = h("p", { class: "sim-hint sim-note", text: "Microphone audio is a virtual simulation source. It is not connected to the amplifier hardware." });
    var stream = null, rec = null, chunks = [], url = null, audio = null, timer = null;
    var bEnable = h("button", { type: "button", class: "btn ghost", text: "Enable microphone" }), bRec = h("button", { type: "button", class: "btn ghost", text: "● Record", disabled: "" }), bStop = h("button", { type: "button", class: "btn ghost", text: "■ Stop", disabled: "" }), bPlay = h("button", { type: "button", class: "btn ghost", text: "▶ Play", disabled: "" });
    var useBox = h("label", { class: "sim-check" }, [h("input", { type: "checkbox", id: "sim-usemic" }), " Use the recording as the simulation input"]), use = useBox.firstChild; use.disabled = true;
    function set(s) { status.textContent = s; }
    bEnable.addEventListener("click", function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) return set("Recording needs a secure page (https or localhost) and a browser with MediaRecorder.");
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (s) { stream = s; bRec.disabled = false; bEnable.disabled = true; set("Microphone ready. Press Record (up to 8 s)."); }, function (e) { set("Microphone permission was not granted (" + (e && e.name || "error") + ")."); });
    });
    bRec.addEventListener("click", function () {
      chunks = []; rec = new MediaRecorder(stream); rec.ondataavailable = function (e) { if (e.data.size) chunks.push(e.data); };
      rec.onstop = function () {
        clearTimeout(timer); bRec.disabled = false; bStop.disabled = true; var blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
        if (url) URL.revokeObjectURL(url); url = URL.createObjectURL(blob); audio = new Audio(url);
        var AC = window.AudioContext || window.webkitAudioContext, ac = new AC();
        blob.arrayBuffer().then(function (ab) { return ac.decodeAudioData(ab); }).then(function (buf) {
          var d = buf.getChannelData(0), n = Math.min(d.length, Math.floor(buf.sampleRate * 8)); ac.close();
          store.setMic({ data: Float32Array.from(d.subarray(0, n)), fs: buf.sampleRate }); store.set({ gen: { mode: "mic" } }); use.disabled = false; use.checked = true; bPlay.disabled = false;
          set("Recorded " + (n / buf.sampleRate).toFixed(1) + " s at " + buf.sampleRate + " Hz. The oscilloscope now shows the real recorded waveform.");
        }, function () { set("Could not decode the recording."); });
      };
      rec.start(); bRec.disabled = true; bStop.disabled = false; set("Recording… speak or play a sound."); timer = setTimeout(function () { if (rec.state === "recording") rec.stop(); }, 8000);
    });
    bStop.addEventListener("click", function () { if (rec && rec.state === "recording") rec.stop(); });
    bPlay.addEventListener("click", function () { if (audio) { audio.currentTime = 0; audio.play(); } });
    use.addEventListener("change", function () { store.set({ gen: { mode: use.checked ? "mic" : "sine" } }); });
    refreshers.push(function () { use.checked = store.state.gen.mode === "mic" && store.hasMic(); });
    [bEnable, bRec, bStop, bPlay].forEach(function (b) { box.appendChild(b); }); box.appendChild(useBox);
    box.appendChild(num("Peak amplitude", { g: "gen", k: "vpp", min: 0.01, max: 1, log: true, unit: "Vpp", step: 0.005 })); box.appendChild(num("DC offset", { g: "gen", k: "dc", min: -1, max: 1, unit: "V", step: 0.01 }));
    box.appendChild(status); box.appendChild(note); return box;
  }

  /* ---- oscilloscope: CH1 conditioned input, CH2 positive DAC voltage Vc, CH3 amplified output, CH4 (optional) negative JFET gate voltage ---- */
  function buildScope() {
    var el = h("div", { class: "scope glass", id: "sim-scope" }), cv = h("canvas", { class: "scope-cv", "aria-label": "Virtual oscilloscope" }), chans = [
      { id: "ch1", name: "CH1", sub: "Conditioned input", kind: "cond", on: true, vdiv: 0, ac: false, pos: 0 }, { id: "ch2", name: "CH2", sub: "Vc (DAC)", kind: "vc", on: true, vdiv: 0, ac: false, pos: 0 },
      { id: "ch3", name: "CH3", sub: "Output", kind: "out", on: true, vdiv: 0, ac: false, pos: 0 }, { id: "ch4", name: "CH4", sub: "JFET gate (−Vc)", kind: "vg", on: false, vdiv: 0, ac: false, pos: 0 }];
    var st = { run: true, tdiv: 1e-3, tAuto: true, src: "ch3", level: null, cap: null, vcT: 0 }, meas = h("div", { class: "scope-meas" }), out = h("div", { class: "scope-status" });
    function autoT() { var m = store.model(); st.tdiv = niceUp((m.useMic ? 0.04 : 3 / m.f) / 10, TDIVS); }
    function autoV(c, arr) { var mn = Infinity, mx = -Infinity; arr.forEach(function (v) { mn = Math.min(mn, v); mx = Math.max(mx, v); }); var pk = c.ac ? (mx - mn) / 2 : Math.max(Math.abs(mn), Math.abs(mx)); return niceUp(Math.max(pk, 1e-4) / 3.2, VDIVS); }
    function capture(now) {
      var m = store.model(), N = 800, T = st.tdiv * 10, i, t0, trigd = false, srcCh = chans[st.src === "ch1" ? 0 : 2], lvl;
      if (st.src !== "free") { var e = m.useMic ? null : ext(m, srcCh.kind); lvl = st.level != null ? st.level : (e ? (e[0] + e[1]) / 2 : m.condDc); var from = m.useMic ? (now / 1000 * 0.3) % Math.max(0.05, m.len / m.fs - T - 0.06) : 0, tt = Sim.findTrigger(m, srcCh.kind, lvl, from, 0.05); if (tt != null) { t0 = tt - 0.1 * T; trigd = true; } }
      if (!trigd) t0 = m.useMic ? (now / 1000 * 0.3) % Math.max(0.05, m.len / m.fs - T) : (now / 1000 * 0.2 / m.f);
      var arrs = {}; chans.forEach(function (c) { var a = new Float32Array(N); for (i = 0; i < N; i++) a[i] = m.at(c.kind === "cond" || c.kind === "out" || c.kind === "vc" || c.kind === "vg" ? c.kind : "cond", t0 + T * i / (N - 1)); arrs[c.id] = a; });
      /* Vc as a stepped transition for 1.5 s after the code changes */
      if (st.lastVc !== m.vc) { if (st.lastVc != null) { st.vcOld = st.lastVc; st.vcT = now; } st.lastVc = m.vc; }
      if (st.vcOld != null && now - st.vcT < 1500) for (i = 0; i < N / 2; i++) arrs.ch2[i] = st.vcOld;
      st.cap = { arrs: arrs, T: T, dt: T / (N - 1), trigd: trigd, lvl: lvl, m: m, t0: t0 };
      if (!st.measT || now - st.measT > 250) { st.measT = now; measure(st.cap); }   /* a real scope's readouts update a few times a second */
    }
    function drawScope(c, m, now) {
      if (st.run || !st.cap) capture(now); var cap = st.cap, f = fit(c), g = f.g, w = f.w, hh = f.h, th = T(now), i, DX = 10, DY = 8, L = 0, Tp = 28, B = f.w < 560 ? 56 : 30, pw = w, ph = hh - Tp - B, dy = ph / DY;
      g.fillStyle = "#0a100d"; g.fillRect(0, 0, w, hh);
      g.lineWidth = 1; for (i = 0; i <= DX; i++) { g.strokeStyle = i === 5 ? "rgba(120,255,170,.32)" : "rgba(120,255,170,.12)"; g.beginPath(); g.moveTo(i * pw / DX, Tp); g.lineTo(i * pw / DX, Tp + ph); g.stroke(); }
      for (i = 0; i <= DY; i++) { g.strokeStyle = i === 4 ? "rgba(120,255,170,.32)" : "rgba(120,255,170,.12)"; g.beginPath(); g.moveTo(0, Tp + i * dy); g.lineTo(pw, Tp + i * dy); g.stroke(); }
      g.strokeStyle = "rgba(120,255,170,.22)"; for (i = 0; i < DX * 5; i++) { var x = i * pw / DX / 5; g.beginPath(); g.moveTo(x, Tp + ph / 2 - 3); g.lineTo(x, Tp + ph / 2 + 3); g.stroke(); }
      var n = cap.arrs.ch1.length;
      chans.forEach(function (ch) {
        if (!ch.on) return; var arr = cap.arrs[ch.id], vd = ch.vdiv || autoV(ch, arr), mean = 0, k; ch._vd = vd; if (ch.ac) { for (k = 0; k < n; k++) mean += arr[k]; mean /= n; }
        var Yv = function (v) { return Tp + ph / 2 - ((v - mean) / vd + ch.pos) * dy; };
        g.beginPath(); g.lineWidth = 1.8; g.strokeStyle = CH[ch.id]; g.shadowColor = CH[ch.id]; g.shadowBlur = 5; g.lineJoin = "round";
        var dense = cap.m.f && !cap.m.useMic && (ch.kind === "cond" || ch.kind === "out") && cap.m.f * cap.T > 120;
        if (dense) { var e = ext(cap.m, ch.kind === "cond" ? "cond" : "out"), amp = (e[1] - e[0]) / 2; g.globalAlpha = 0.85; g.fillStyle = CH[ch.id]; g.fillRect(0, Math.min(Yv(e[1]), Yv(e[0])), pw, Math.abs(Yv(e[0]) - Yv(e[1])) || 2); g.globalAlpha = 1; }
        else { for (k = 0; k < n; k++) { var xx = k / (n - 1) * pw, yy = Yv(arr[k]); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); }
        g.shadowBlur = 0; g.fillStyle = CH[ch.id]; var gy = Yv(mean); g.beginPath(); g.moveTo(0, gy); g.lineTo(9, gy - 5); g.lineTo(9, gy + 5); g.closePath(); g.fill();
        g.font = "10px system-ui"; g.fillStyle = "#06100a"; g.textAlign = "left"; g.fillText(ch.name.slice(2), 2, gy + 3.5);
      });
      if (cap.trigd) { g.fillStyle = "#ffb13b"; g.beginPath(); var tx = pw * 0.1; g.moveTo(tx - 5, Tp); g.lineTo(tx + 5, Tp); g.lineTo(tx, Tp + 8); g.closePath(); g.fill(); }
      var NEU = "#dfe8e3", DIM = "#9fb0a7"; g.font = '600 13px "Instrument Sans", system-ui, sans-serif'; g.textAlign = "left";
      var stat = [[st.run ? "RUN" : "STOP", st.run ? "#8fd9a8" : "#f0a070"], [fT(st.tdiv) + "/div", NEU], [cap.trigd ? "TRIG'D" : "AUTO", cap.trigd ? "#f0c26a" : DIM]].concat(st.src === "free" ? [] : [[st.src.toUpperCase() + " ↗ " + fV(cap.lvl), NEU]]), sx = 10;
      stat.forEach(function (t) { g.fillStyle = t[1]; g.fillText(t[0], sx, 18); sx += g.measureText(t[0]).width + 20; });
      var lx = 10, ly = hh - 10; chans.forEach(function (ch) { if (!ch.on) return; var t = ch.name + "   " + (ch._vd >= 1 ? ch._vd + " V" : ch._vd * 1000 + " mV") + "/div   " + (ch.ac ? "AC" : "DC"), need = 17 + g.measureText(t).width;
        if (lx + need > w - 8 && lx > 10) { lx = 10; ly -= 20; }                   /* wrap to a second row on narrow screens */
        g.fillStyle = CH[ch.id]; g.fillRect(lx, ly - 10, 11, 11); g.fillStyle = NEU; g.fillText(t, lx + 17, ly); lx += need + 26; });
      if (cap.m.clipped) { g.fillStyle = "#ffa585"; g.textAlign = "right"; g.fillText("OUTPUT CLIPPING", w - 10, 18); }
    }
    function measure(cap) {
      var rows = chans.filter(function (c) { return c.on; }).map(function (c) { var a = cap.arrs[c.id], ms = Sim.measure(a), fr = Sim.frequency(a, cap.dt); return '<tr><th scope="row"><i class="chdot" style="background:' + CH[c.id] + '"></i>' + c.name + "</th><td>" + fV(ms.pp) + "</td><td>" + fV(ms.max) + "</td><td>" + fV(ms.min) + "</td><td>" + fV(ms.mean) + "</td><td>" + (c.kind === "vc" || c.kind === "vg" ? "DC" : fHz(fr)) + "</td></tr>"; }).join("");
      var p1 = Sim.measure(cap.arrs.ch1).pp, p3 = Sim.measure(cap.arrs.ch3).pp, gn = chans[0].on && chans[2].on && p1 > 1e-6 ? p3 / p1 : null, m = cap.m;
      meas.innerHTML = '<div class="meas-grid"><div class="sim-scroll"><table class="sim-table meas-ch"><thead><tr><th>Channel</th><th>VPP</th><th>VMAX</th><th>VMIN</th><th>VAVG</th><th>Frequency</th></tr></thead><tbody>' + rows + "</tbody></table></div>" +
        '<div class="sim-scroll"><table class="sim-table meas-der"><tbody>' + [["Measured gain (CH3/CH1)", gn == null ? "—" : fN(gn, 2) + " (" + fN(20 * Math.log10(gn), 1) + " dB)"], ["Distortion (THD)", m.thd == null ? "—" : fN(m.thd * 100, 2) + " %"], ["Clipping", m.clipped ? '<b class="bad">YES</b>' : "No"], ["Slew limited", m.slewLimited ? '<b class="bad">YES</b>' : "No"]].map(function (r) { return "<tr><th>" + r[0] + "</th><td>" + r[1] + "</td></tr>"; }).join("") + "</tbody></table></div></div>";
    }
    /* controls */
    var run = h("button", { type: "button", class: "btn primary", text: "Stop", on: { click: function () { st.run = !st.run; run.textContent = st.run ? "Stop" : "Run"; root.setAttribute("data-sim-run", st.run ? "1" : "0"); } } });
    var tsel = h("select", { "aria-label": "Time per division", on: { change: function () { st.tdiv = +tsel.value; st.tAuto = false; } } }, TDIVS.map(function (t) { return h("option", { value: t, text: fT(t) + "/div" }); }));
    function stepT(d) { var i = Math.max(0, Math.min(TDIVS.length - 1, TDIVS.indexOf(st.tdiv) + d)); st.tdiv = TDIVS[i]; st.tAuto = false; tsel.value = st.tdiv; }
    var src = h("select", { "aria-label": "Trigger source", on: { change: function () { st.src = src.value; st.level = null; lvl.value = 500; } } }, [h("option", { value: "ch3", text: "Trigger: CH3" }), h("option", { value: "ch1", text: "Trigger: CH1" }), h("option", { value: "free", text: "Free run" })]);
    var lvl = h("input", { type: "range", min: 0, max: 1000, value: 500, "aria-label": "Trigger level", on: { input: function () { var m = store.model(), c = st.src === "ch1" ? 0 : 2, e = m.useMic ? [m.condMin, m.condMax] : ext(m, chans[c].kind), lo = e[0] - (e[1] - e[0]) * 0.2, hi = e[1] + (e[1] - e[0]) * 0.2; st.level = lo + (hi - lo) * lvl.value / 1000; } } });
    var auto = h("button", { type: "button", class: "btn ghost", text: "Autoscale", on: { click: function () { st.tAuto = true; autoT(); tsel.value = st.tdiv; chans.forEach(function (c) { c.vdiv = 0; c.pos = 0; }); chanRows.forEach(function (r) { r.sync(); }); st.level = null; lvl.value = 500; } } });
    var bar = h("div", { class: "scope-bar" }, [run, h("button", { type: "button", class: "btn ghost", "aria-label": "Zoom in time", text: "Zoom +", on: { click: function () { stepT(-1); } } }), h("button", { type: "button", class: "btn ghost", "aria-label": "Zoom out time", text: "Zoom −", on: { click: function () { stepT(1); } } }), tsel, src, h("label", { class: "scope-lvl" }, ["Level ", lvl]), auto]);
    var chanRows = chans.map(function (c) {
      var vs = h("select", { "aria-label": c.name + " volts per division", on: { change: function () { c.vdiv = +vs.value; } } }, [h("option", { value: 0, text: "Auto V/div" })].concat(VDIVS.map(function (v) { return h("option", { value: v, text: (v >= 1 ? v + " V" : v * 1000 + " mV") + "/div" }); })));
      var en = h("input", { type: "checkbox", "aria-label": "Show " + c.name, on: { change: function () { c.on = en.checked; } } }); en.checked = c.on;
      var ac = h("button", { type: "button", class: "btn ghost", text: "DC", "aria-label": c.name + " coupling", on: { click: function () { c.ac = !c.ac; ac.textContent = c.ac ? "AC" : "DC"; } } });
      var pos = h("input", { type: "range", min: -40, max: 40, value: 0, "aria-label": c.name + " position", on: { input: function () { c.pos = pos.value / 10; } } });
      var row = h("div", { class: "scope-ch", style: "--c:" + CH[c.id] }, [h("label", {}, [en, h("i", { class: "chdot" }), h("b", { text: c.name }), h("span", { text: c.sub })]), vs, ac, pos]);
      row.sync = function () { vs.value = 0; pos.value = 0; }; return row;
    });
    el.appendChild(h("h3", { text: "Virtual oscilloscope" })); el.appendChild(bar); el.appendChild(h("div", { class: "scope-screen" }, [cv]));
    el.appendChild(h("div", { class: "scope-chs" }, chanRows)); el.appendChild(meas);
    autoT(); tsel.value = st.tdiv; refreshers.push(function () { if (st.tAuto) { autoT(); tsel.value = st.tdiv; } else tsel.value = st.tdiv; });
    root.setAttribute("data-sim-run", "1"); addView(cv, drawScope);
    return { el: el, st: st, chans: chans };
  }

  /* ---- engineering analysis ---- */
  function buildAnalysis(p) {
    var sum = h("dl", { class: "sim-kv big" }), cmp = h("div", { class: "sim-scroll" }), steps = h("ol", { class: "sim-steps" }), warn = h("ul", { class: "sim-warn" });
    p.appendChild(h("h4", { text: "Summary" })); p.appendChild(sum); p.appendChild(warn); p.appendChild(h("h4", { text: "Theoretical vs simulated" })); p.appendChild(cmp); p.appendChild(h("h4", { text: "Calculation steps" })); p.appendChild(steps);
    refreshers.push(function () {
      if (p.hidden) return; var m = store.model(), c = m.state.ckt, g = m.state.gen, k = m.state.gain;
      sum.innerHTML = dl([["Original input", fN(g.vpp, 3) + " Vpp"], ["Conditioned input", fN(m.condPp, 4) + " Vpp"], ["Input frequency", m.useMic ? "recorded audio" : fHz(m.f)], ["Required gain", isFinite(m.avRequired) ? fN(m.avRequired, 2) : "—"], ["Actual gain", fN(m.av, 3)], ["DAC code", m.code + " (0x" + m.code.toString(16).toUpperCase() + ")"], ["Positive DAC voltage", fN(m.vc, 4) + " V"], ["Negative gate voltage", fN(m.vgate, 4) + " V"], ["Estimated JFET resistance", fOhm(m.jfet.rds) + " (model)"], ["Feedback leg from Av", fOhm(m.rgEq)], ["Amplified output", fN(m.outPp, 3) + " Vpp"], ["Clipping", m.clipped ? "YES" : "no"]]);
      warn.innerHTML = m.notes.map(function (n) { return "<li>" + n.replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</li>"; }).join("");
      var simGain = m.condPp > 0 ? m.outPp / m.condPp : 0, row = function (a, t, s, d) { return "<tr><th>" + a + "</th><td>" + t + "</td><td>" + s + "</td><td>" + d + "</td></tr>"; };
      cmp.innerHTML = '<table class="sim-table"><thead><tr><th></th><th>Theoretical (ideal)</th><th>Simulated</th><th>Difference</th></tr></thead><tbody>' +
        row("Output amplitude", fN(m.outPpIdeal, 3) + " Vpp", fN(m.outPp, 3) + " Vpp", fN(m.outPp - m.outPpIdeal, 3) + " V") + row("Gain (Vout / Vcond)", fN(m.av, 2), fN(simGain, 2), fN(simGain - m.av, 2)) +
        row("Output DC level", fV(m.outDcIdeal), fV((m.outMax + m.outMin) / 2), fV((m.outMax + m.outMin) / 2 - m.outDcIdeal)) + row("Output peak (max)", fV(m.outDcIdeal + m.outPpIdeal / 2), fV(m.outMax), fV(m.outMax - m.outDcIdeal - m.outPpIdeal / 2)) +
        row("Target (auto mode)", k.mode === "auto" ? fN(k.target, 2) + " Vpp" : "—", k.mode === "auto" ? fN(m.outPp, 3) + " Vpp" : "—", k.mode === "auto" ? fN(m.outPp - k.target, 3) + " V" : "—") + row("Distortion", "0 %", m.thd == null ? "—" : fN(m.thd * 100, 2) + " %", "") + "</tbody></table>";
      var S1 = function (t, f, v) { return "<li><b>" + t + "</b><code>" + f + "</code><span>" + v + "</span></li>"; };
      steps.innerHTML = S1("Input", "Vin,pp", fN(g.vpp, 3) + " V" + (m.useMic ? " peak, scaled recording" : " at " + fHz(m.f))) +
        S1("Low-pass filter", m.H ? "|H| = 1/√(1+(f/fc)^" + 2 * m.state.cond.order + ")" : "IIR low-pass, fc = " + fHz(m.state.cond.fc), m.H ? "|H| = " + fN(m.H.mag, 4) + " → Vcond,pp = " + fN(m.condPp, 4) + " V" : "Vcond,pp = " + fN(m.condPp, 4) + " V") +
        S1("Positive DC shift", "Vdc = Voffset + Vshift", fV(m.condDc) + " (min " + fV(m.condMin) + (m.aboveZero ? " &gt; 0 ✓" : " ≤ 0 ✗") + ")") +
        S1("XADC measurement", "LSB = FS / " + (Math.pow(2, m.state.cond.xadcBits) - 1), "codes " + m.xadc.min + " … " + m.xadc.max + " → " + fN(m.xadc.pp, 4) + " Vpp") +
        S1("Required gain", "Av,req = Vtarget / Vin,pp", fN(k.target, 2) + " / " + fN(m.xadc.pp, 4) + " = " + (isFinite(m.avRequired) ? fN(m.avRequired, 2) : "∞") + (k.mode === "manual" ? " (manual gain " + fN(k.manual, 2) + " used instead)" : "")) +
        S1("Control voltage", "Vc = (Av − 1)(R1/R2)·Vref", "(" + fN(m.avClamped, 2) + " − 1)·(" + fOhm(c.R1) + "/" + fOhm(c.R2) + ")·" + c.Vref + " = " + fN(m.vcNeeded, 4) + " V (range " + c.vcMin + " – " + c.vcMax + " V)") +
        S1("DAC quantisation", "code = round(Vc / " + c.vdacFS + " × " + m.codeMax + ")", m.code + " → Vc = " + fN(m.vc, 4) + " V") + S1("Gate voltage", "Vgate = −Vc", fN(m.vgate, 4) + " V") +
        S1("Actual gain", "Av = 1 + (R2/R1)(Vc/Vref)", fN(m.av, 3)) + S1("Output", "Vout,pp = Vcond,pp × Av", fN(m.condPp, 4) + " × " + fN(m.av, 3) + " = " + fN(m.outPpIdeal, 3) + " V ideal → " + fN(m.outPp, 3) + " V simulated");
    });
  }

  /* ---- input conditioning detail ---- */
  function buildCond(p) {
    var wf = h("canvas", { class: "sim-cv", "aria-label": "Input, filtered and conditioned waveforms" }), fr = h("canvas", { class: "sim-cv short", "aria-label": "Low-pass frequency response" }), info = h("dl", { class: "sim-kv" });
    var ctl = h("div", { class: "sim-ctl" }, [num("Input frequency", { g: "gen", k: "freq", min: 20, max: 20000, log: true, unit: "Hz", step: 10 }), num("Amplitude", { g: "gen", k: "vpp", min: 0.01, max: 1, log: true, unit: "Vpp", step: 0.005 }), num("Input DC offset", { g: "gen", k: "dc", min: -1, max: 1, unit: "V", step: 0.01 }),
      num("Cutoff frequency", { g: "cond", k: "fc", min: 1000, max: 100000, log: true, unit: "Hz", step: 100 }),
      h("div", { class: "sim-field" }, [h("label", { text: "Filter model" }), seg([[1, "1st order"], [2, "2nd order"]], function () { return store.state.cond.order; }, function (v) { store.set({ cond: { order: +v } }); }, "Filter order"), h("span")]),
      h("div", { class: "sim-field" }, [h("label", { text: "DC level shift" }), seg([["auto", "Auto (just above 0 V)"], ["fixed", "Fixed"]], function () { return store.state.cond.shiftMode; }, function (v) { store.set({ cond: { shiftMode: v } }); }, "Shift mode"), h("span")]),
      num("Fixed shift", { g: "cond", k: "shift", min: 0, max: 3, unit: "V", step: 0.01 })]);
    var concept = h("div", { html: '<svg viewBox="0 0 640 110" class="sim-concept" role="img" aria-label="Conceptual conditioning chain"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="10" y="30" width="110" height="50" rx="8"/><rect x="170" y="30" width="130" height="50" rx="8"/><rect x="350" y="30" width="110" height="50" rx="8"/><rect x="510" y="30" width="120" height="50" rx="8"/><path d="M120 55H170M300 55H350M460 55H510"/></g><g fill="currentColor" font-size="12" text-anchor="middle"><text x="65" y="60">Input</text><text x="235" y="52">20 kHz low-pass</text><text x="235" y="68" opacity=".6">attenuates &gt; fc</text><text x="405" y="52">Buffer op-amp</text><text x="405" y="68" opacity=".6">isolation</text><text x="570" y="52">+ DC level shift</text><text x="570" y="68" opacity=".6">stays &gt; 0 V</text></g><text x="320" y="104" text-anchor="middle" font-size="11" fill="currentColor" opacity=".65">Conceptual view: the exact circuit and component values are not specified.</text></svg>' });
    p.appendChild(h("p", { class: "sim-hint", text: "The conditioning stage is modelled as a low-pass filter, a unity-gain buffer and a positive DC shift. Filter order, shift voltage and XADC range are design parameters awaiting confirmation." }));
    p.appendChild(concept); p.appendChild(ctl); p.appendChild(h("div", { class: "sim-two" }, [h("div", {}, [h("h4", { text: "Input → filtered → conditioned" }), wf]), h("div", {}, [h("h4", { text: "Low-pass frequency response" }), fr])])); p.appendChild(info);
    addView(wf, drawWavePlot); addView(fr, drawBode);
    refreshers.push(function () {
      if (p.hidden) return; var m = store.model(), s = m.state; info.innerHTML = dl([["Input amplitude", fN(s.gen.vpp, 3) + " Vpp"], ["Filter gain at input frequency", m.H ? fN(m.H.mag, 4) + " (" + fN(20 * Math.log10(m.H.mag), 2) + " dB)" : "—"], ["Conditioned amplitude", fN(m.condPp, 4) + " Vpp"], ["DC offset of output", fV(m.condDc) + " (shift " + fV(m.shift) + ")"], ["Lowest voltage", fV(m.condMin) + (m.aboveZero ? " — above 0 V ✓" : " — BELOW 0 V ✗")], ["Roll-off above " + fHz(s.cond.fc), "−" + (s.cond.order === 2 ? "40" : "20") + " dB per decade"]]);
    });
  }

  /* ---- amplifier schematic: clickable components, editable values ---- */
  function buildAmp(p, svgHTML) {
    var fig = h("div", { class: "sim-schem", html: svgHTML }), side = h("div", { class: "sim-side glass" }), svg = fig.querySelector("svg");
    svg.setAttribute("viewBox", "28 -12 870 370");   /* the circuit spans x 36-889, y -7-350: the stock 970x365 box wasted ~12% of the width */
    var HOT = { R1: [32, 158, 76, 46], R2: [532, 6, 96, 44], Rp: [392, 236, 76, 40], RL: [680, 226, 40, 80], Q1: [124, 50, 40, 90], Q2: [396, 50, 40, 90], U1: [160, 158, 112, 134], U2: [528, 133, 116, 154], Vref: [82, 2, 48, 44], Vin: [330, 234, 60, 44], Vcontrol: [-50, 166, 60, 40] };
    var sel = "U2", T0 = {
      R1: { n: "R1", role: "Sets the gain ratio with R2: Av = 1 + (R2/R1)(Vc/Vref).", edit: ["ckt", "R1", "Ω"] }, R2: { n: "R2", role: "Feedback resistor of the CA3140 stage; with R1 it sets the gain scale.", edit: ["ckt", "R2", "Ω"] },
      Rp: { n: "Rp", role: "Series resistor in the signal input path (no gain effect in this model).", edit: ["ckt", "Rp", "Ω"] }, RL: { n: "RL (load)", role: "Output load. Minimum 2 kΩ. A lower RL lowers the available output swing.", edit: ["ckt", "RL", "Ω"] },
      Vref: { n: "Vref", role: "Reference voltage in the gain law; +0.2 V.", edit: ["ckt", "Vref", "V"] }, U1: { n: "U1 (inverting unity-gain op-amp)", role: "Turns the positive DAC voltage into the negative gate voltage.", edit: ["amp", "supply", "V supply (±)"] },
      U2: { n: "U2 (CA3140)", role: "The variable-gain op-amp. Supply ±12 V; closed-loop bandwidth falls as the gain rises.", edit: ["amp", "supply", "V supply (±)"] }, Q1: { n: "Q1 (JFET)", role: "N-channel JFET of the control pair. Voltage-controlled resistance.", edit: null },
      Q2: { n: "Q2 (JFET)", role: "N-channel JFET in the feedback network; its gate sits at −Vc.", edit: null }, Vin: { n: "Vin (conditioned)", role: "Conditioned input from the previous stage.", edit: null }, Vcontrol: { n: "−VControl", role: "Negative control voltage, i.e. the gate voltage.", edit: null }
    };
    function op(id, m) {
      var c = m.state.ckt, a = m.state.amp, vopk = m.outPp / 2;
      return { R1: [["Value", fOhm(c.R1)], ["Role in gain", "R2/R1 = " + fN(c.R2 / c.R1, 3)]], R2: [["Value", fOhm(c.R2)], ["Peak current (est.)", fN(Math.abs(vopk - m.condPp / 2) / c.R2 * 1000, 3) + " mA"]],
        Rp: [["Value", fOhm(c.Rp)], ["Input current", "≈ 0 (CMOS op-amp input)"]], RL: [["Value", fOhm(c.RL)], ["Peak voltage", fV(vopk)], ["Peak current", fN(vopk / c.RL * 1000, 3) + " mA"], ["Power (rms)", fN(vopk * vopk / 2 / c.RL * 1000, 3) + " mW"]],
        Vref: [["Voltage", "+" + fN(c.Vref, 2) + " V"]], U1: [["Output", fN(m.vgate, 3) + " V (= −Vc)"], ["Input", "+" + fN(m.vc, 3) + " V"], ["Supply", "±" + a.supply + " V"]],
        U2: [["Supply", "±" + a.supply + " V"], ["Output swing", "±" + fN(m.lim, 2) + " V"], ["Closed-loop BW", fHz(m.fcAmp)], ["GBW / slew (assumed)", fHz(a.gbw) + " / " + a.sr / 1e6 + " V/µs"], ["Gain", fN(m.av, 2)]],
        Q1: [["VGS", fN(m.vgate, 3) + " V"], ["Channel", (m.jfet.open * 100).toFixed(0) + " % open"], ["Model Rds", fOhm(m.jfet.rds)]], Q2: [["VGS", fN(m.vgate, 3) + " V"], ["Channel", (m.jfet.open * 100).toFixed(0) + " % open"], ["Model Rds", fOhm(m.jfet.rds)], ["Feedback leg (from Av)", fOhm(m.rgEq)]],
        Vin: [["AC", fN(m.condPp, 4) + " Vpp"], ["DC", fV(m.condDc)]], Vcontrol: [["Voltage", fN(m.vgate, 3) + " V"], ["DAC code", m.code]] }[id];
    }
    function renderSide() {
      var m = store.model(), d = T0[sel], rows = op(sel, m), ed = d.edit, val = ed ? store.state[ed[0]][ed[1]] : null; side.innerHTML = "";
      side.appendChild(h("h4", { text: d.n })); side.appendChild(h("p", { text: d.role }));
      if (ed) { var nb = h("input", { type: "number", step: "any", value: +val.toPrecision(6), "aria-label": d.n + " value", on: { change: function () { var v = parseFloat(nb.value); if (isFinite(v)) { var pa = {}; pa[ed[0]] = {}; pa[ed[0]][ed[1]] = v; store.set(pa); } } } }); side.appendChild(h("label", { class: "sim-edit" }, ["Edit value ", nb, " " + ed[2]])); }
      side.appendChild(h("dl", { class: "sim-kv", html: dl(rows) }));
      side.appendChild(h("p", { class: "sim-hint", text: "Values are derived from the simulation model. Edits update every view." }));
    }
    var g = svg.querySelector("g[transform]"), NS = "http://www.w3.org/2000/svg";
    Object.keys(HOT).forEach(function (id) {
      var r = HOT[id], rect = doc.createElementNS(NS, "rect"); rect.setAttribute("x", r[0]); rect.setAttribute("y", r[1]); rect.setAttribute("width", r[2]); rect.setAttribute("height", r[3]); rect.setAttribute("rx", 6); rect.setAttribute("class", "sim-hot"); rect.setAttribute("tabindex", 0); rect.setAttribute("role", "button"); rect.setAttribute("aria-label", T0[id].n); rect.setAttribute("data-comp", id);
      function pick() { sel = id; g.querySelectorAll(".sim-hot").forEach(function (e) { e.classList.toggle("on", e === rect); }); renderSide(); }
      rect.addEventListener("click", pick); rect.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } }); g.appendChild(rect);
    });
    p.appendChild(h("p", { class: "sim-hint", text: "Click any component to see its value, purpose and operating point. The circuit is the project's gain-stage schematic; the supply (±12 V) powers U1 and U2." }));
    p.appendChild(h("div", { class: "sim-schem-row" }, [fig, side])); refreshers.push(function () { if (!p.hidden) renderSide(); });
    g.querySelector('[data-comp="' + sel + '"]').classList.add("on");
  }

  /* ---- JFET channel formation ---- */
  function buildJfet(p) {
    var cv = h("canvas", { class: "sim-cv tall", "aria-label": "JFET cross-section" }), plot = h("canvas", { class: "sim-cv short", "aria-label": "JFET resistance against gate voltage" }), info = h("dl", { class: "sim-kv" });
    var model = h("select", { "aria-label": "JFET model", on: { change: function () { var j = Sim.JFETS[model.value]; store.set({ jfet: { model: model.value, idss: j.idss, vp: j.vp } }); } } }, Object.keys(Sim.JFETS).map(function (k) { return h("option", { value: k, text: k }); }));
    var ctl = h("div", { class: "sim-ctl" }, [h("div", { class: "sim-field" }, [h("label", { text: "Device model" }), model, h("span")]),
      num("IDSS", { g: "jfet", k: "idss", min: 0.001, max: 0.1, log: true, unit: "A", step: 0.001 }), num("Pinch-off VP", { g: "jfet", k: "vp", min: -10, max: -1, unit: "V", step: 0.1 }),
      h("div", { class: "sim-field" }, [h("label", { for: "sim-vgs", text: "Gate VGS" }), h("input", { id: "sim-vgs", type: "range", min: 0, max: 1000, "aria-label": "Gate voltage", on: { input: function (e) { var pp = store.state.ckt, vc = pp.vcMin + (pp.vcMax - pp.vcMin) * (1 - e.target.value / 1000); store.set({ gain: { mode: "manual", manual: Sim.gainFromVc(vc, pp) } }); } } }), h("span", { class: "sim-num", text: "sets manual gain" })])]);
    p.appendChild(h("p", { class: "sim-hint", text: "J111 and BF245 are selectable, but the device values here are illustrative until the real parts are measured. The JFET is modelled with the ohmic-region equation, not as a linear resistor." }));
    p.appendChild(ctl); p.appendChild(h("div", { class: "sim-two" }, [h("div", {}, [h("h4", { text: "Channel cross-section" }), cv]), h("div", {}, [h("h4", { text: "Resistance against gate voltage" }), plot, info])]));
    addView(cv, function (c, m, now) { drawJfet(c, m, now, true, false); });
    addView(plot, function (c, m, now) {
      var j = m.state.jfet, vmin = j.vp, rmin = Math.pow(10, Math.floor(Math.log10(Math.max(1, Sim.jfet(0, j).rds * 0.8)))), rmax = 1e6, i, n = 240;
      var pl = plotFrame(c, now, { xmin: vmin, xmax: 0, ymin: rmin, ymax: rmax, ylog: true, xt: lin(vmin, 0, 6).t, yt: [1, 10, 100, 1e3, 1e4, 1e5, 1e6].filter(function (v) { return v >= rmin; }), yminor: decades(rmin, rmax), xfmt: function (v) { return v.toFixed(dec(lin(vmin, 0, 6).st)); }, yfmt: function (v) { return v >= 1e6 ? v / 1e6 + " MΩ" : v >= 1000 ? v / 1000 + " kΩ" : v + " Ω"; }, xtitle: "Gate-source voltage VGS (V)", ytitle: "Channel resistance Rds (Ω)", L: 72 }), g = pl.g, th = pl.th;
      g.beginPath(); g.lineWidth = 2; g.strokeStyle = th.accent2; var first = true;
      for (i = 0; i <= n; i++) { var v = vmin + (0 - vmin) * i / n, r = Sim.jfet(v, j).rds; if (!isFinite(r)) r = rmax * 4; var y = pl.Y(Math.min(r, rmax * 4)); first ? g.moveTo(pl.X(v), y) : g.lineTo(pl.X(v), y); first = false; } g.stroke();
      var jf = m.jfet; g.setLineDash([5, 4]); g.strokeStyle = th.warn; g.lineWidth = 1; g.beginPath(); g.moveTo(pl.X(vmin), pl.Tp); g.lineTo(pl.X(vmin), pl.Tp + pl.hh); g.stroke(); g.setLineDash([]);
      if (!jf.pinched) { g.fillStyle = th.accent; g.beginPath(); g.arc(pl.X(jf.vgs), pl.Y(jf.rds), 4.5, 0, TAU); g.fill(); }
      pl.end(); g.font = AXF; g.fillStyle = th.warn; g.textAlign = "left"; g.fillText("VP = " + fN(j.vp, 2) + " V (pinch-off)", pl.L + 8, pl.Tp + 18);
      if (!jf.pinched) { g.fillStyle = th.fg; var rt = pl.X(jf.vgs) > pl.L + pl.w - 150; g.textAlign = rt ? "right" : "left"; g.fillText("VGS = " + fN(jf.vgs, 2) + " V, Rds = " + fOhm(jf.rds), pl.X(jf.vgs) + (rt ? -9 : 9), pl.Y(jf.rds) - 9); }
    });
    refreshers.push(function () {
      if (p.hidden) return; var m = store.model(), pp = m.state.ckt; model.value = m.state.jfet.model; var rng = doc.getElementById("sim-vgs"); if (rng && doc.activeElement !== rng) rng.value = Math.round(1000 * (1 - (m.vc - pp.vcMin) / (pp.vcMax - pp.vcMin)));
      info.innerHTML = dl([["Gate voltage VGS", fN(m.vgate, 3) + " V"], ["Channel open", (m.jfet.open * 100).toFixed(0) + " %"], ["Model Rds", fOhm(m.jfet.rds) + " (" + m.jfet.region + ")"], ["Feedback leg implied by Av", fOhm(m.rgEq)], ["Gain", fN(m.av, 2)]]);
    });
  }

  /* ---- parameters: every assumption is editable and labelled by status ---- */
  function buildParams(p) {
    var tb = h("tbody"), groups = { gen: "Input", cond: "Conditioning and XADC", ckt: "Gain circuit", amp: "CA3140 amplifier", jfet: "JFET (illustrative)" };
    Object.keys(Sim.META).forEach(function (key) {
      var parts = key.split("."), g = parts[0], k = parts[1], meta = Sim.META[key]; 
      var nb = h("input", { type: "number", step: "any", "aria-label": meta[0], on: { change: function () { var v = parseFloat(nb.value), pa = {}; if (!isFinite(v)) return refresh(); pa[g] = {}; pa[g][k] = v; store.set(pa); } } });
      function refresh() { if (doc.activeElement !== nb) nb.value = +store.state[g][k].toPrecision(6); } refreshers.push(refresh); refresh();
      tb.appendChild(h("tr", {}, [h("th", { text: groups[g] }), h("td", { text: meta[0] }), h("td", {}, [nb]), h("td", { text: meta[1] }), h("td", {}, [h("span", { class: "chip-status " + meta[2], text: meta[2] === "spec" ? "Project spec" : "Assumption" })])]));
    });
    p.appendChild(h("p", { class: "sim-hint", text: "“Project spec” values come from the project brief. “Assumption” values are illustrative or awaiting confirmation; change them and every view updates." }));
    p.appendChild(h("div", { class: "sim-scroll" }, [h("table", { class: "sim-table params" }, [h("thead", {}, [h("tr", {}, ["Group", "Parameter", "Value", "Unit", "Status"].map(function (t) { return h("th", { text: t }); }))]), tb])]));
    p.appendChild(h("button", { type: "button", class: "btn ghost", text: "Reset all to defaults", on: { click: function () { store.reset(); } } }));
  }

  function start() { initChain(); initSim(); }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();
})();
