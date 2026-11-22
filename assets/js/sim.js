/* VGA simulation engine. One shared model behind the Signal Chain previews, the block details, the oscilloscope,
   the schematic and the JFET view: change a parameter once and every consumer sees the same numbers.
   Pure maths, no DOM. Loads in the browser (window.VGASim) and in Node (module.exports) for tests.

   Signal flow modelled (from the project block diagram):
     input -> [20 kHz LPF -> buffer -> positive DC level shift] -> CA3140 gain stage -> output
                              \-> XADC (FPGA) -> required gain -> DAC code -> +Vc -> inverting op-amp -> -Vc -> JFET -> feedback
   Gain law (project equation):  Av = 1 + (R2/R1) * (Vc / Vref)

   Parameter status is tracked in META: "spec" = given in the project brief, "assumed" = illustrative / awaiting confirmation. */
(function (root) {
  "use strict";
  var TAU = Math.PI * 2;

  /* ---------- parameters ---------- */
  var DEFAULTS = {
    gen:  { mode: "sine", vpp: 0.2, freq: 1000, dc: 0, phase: 0 },
    cond: { fc: 20000, order: 1, shiftMode: "auto", shift: 0.55, margin: 0.05, xadcFS: 1.0, xadcBits: 12 },
    gain: { mode: "auto", target: 5, manual: 10 },
    ckt:  { R1: 5100, R2: 10000, Rp: 1000, RL: 10000, Vref: 0.2, vcMin: 0.41, vcMax: 5, dacBits: 12, vdacFS: 5 },
    amp:  { supply: 12, headroom: 1.5, gbw: 4.5e6, sr: 9e6, ro: 60 },
    jfet: { model: "J111", idss: 0.03, vp: -6.5 }
  };
  /* illustrative device values (datasheet ranges are wide); labelled as such in the UI */
  var JFETS = { J111: { idss: 0.03, vp: -6.5 }, BF245: { idss: 0.01, vp: -3.5 } };
  var META = {
    "gen.vpp": ["Input amplitude", "Vpp", "spec"], "gen.freq": ["Input frequency", "Hz", "spec"], "gen.dc": ["Input DC offset", "V", "spec"], "gen.phase": ["Phase", "deg", "spec"],
    "cond.fc": ["Low-pass cutoff", "Hz", "spec"], "cond.order": ["Filter order (model)", "", "assumed"], "cond.shift": ["Fixed DC level shift", "V", "assumed"],
    "cond.margin": ["Auto-shift margin above 0 V", "V", "assumed"], "cond.xadcFS": ["XADC full-scale input", "V", "assumed"],
    "ckt.R1": ["R1", "ohm", "spec"], "ckt.R2": ["R2", "ohm", "spec"], "ckt.Rp": ["Rp", "ohm", "spec"], "ckt.RL": ["Load RL", "ohm", "spec"], "ckt.Vref": ["Vref", "V", "spec"],
    "ckt.vcMin": ["Min control voltage (gate -0.41 V)", "V", "spec"], "ckt.vcMax": ["Max control voltage (gate -5 V)", "V", "spec"],
    "amp.supply": ["Op-amp supply (+/-)", "V", "spec"], "amp.headroom": ["Output headroom to rail", "V", "assumed"], "amp.gbw": ["CA3140 gain-bandwidth", "Hz", "assumed"],
    "amp.sr": ["CA3140 slew rate", "V/s", "assumed"], "amp.ro": ["Output resistance", "ohm", "assumed"],
    "jfet.idss": ["JFET IDSS", "A", "assumed"], "jfet.vp": ["JFET pinch-off VP", "V", "assumed"]
  };
  /* allowed ranges, applied on every change */
  var LIMITS = {
    "gen.vpp": [0.01, 1], "gen.freq": [20, 20000], "gen.dc": [-2, 2], "gen.phase": [-360, 360],
    "cond.fc": [100, 200000], "cond.shift": [0, 5], "cond.margin": [0, 1], "cond.xadcFS": [0.1, 5],
    "gain.target": [0.1, 20], "gain.manual": [1, 200],
    "ckt.R1": [100, 1e6], "ckt.R2": [100, 1e6], "ckt.Rp": [10, 1e6], "ckt.RL": [2000, 1e6], "ckt.Vref": [0.01, 2],
    "ckt.vcMin": [0, 5], "ckt.vcMax": [0.1, 5], "amp.supply": [3, 18], "amp.headroom": [0, 6], "amp.gbw": [1e5, 1e8], "amp.sr": [1e5, 1e9], "amp.ro": [1, 1000],
    "jfet.idss": [1e-4, 0.2], "jfet.vp": [-12, -0.3]
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  /* overlay patch onto state (two levels deep), keeping only known keys and clamping numbers */
  function merge(base, patch) {
    Object.keys(patch || {}).forEach(function (g) {
      if (!base[g] || typeof patch[g] !== "object") return;
      Object.keys(patch[g]).forEach(function (k) {
        if (!(k in base[g])) return;
        var v = patch[g][k], lim = LIMITS[g + "." + k];
        if (typeof base[g][k] === "number") { v = Number(v); if (!isFinite(v)) return; if (lim) v = clamp(v, lim[0], lim[1]); }
        base[g][k] = v;
      });
    });
    return base;
  }

  /* ---------- device and circuit models ---------- */
  function lpf(f, fc, order) {
    var x = f / fc;
    if (order === 2) return { mag: 1 / Math.sqrt(1 + x * x * x * x), phase: -Math.atan2(Math.SQRT2 * x, 1 - x * x) };
    return { mag: 1 / Math.sqrt(1 + x * x), phase: -Math.atan(x) };
  }
  function gainFromVc(vc, p) { return 1 + (p.R2 / p.R1) * (vc / p.Vref); }
  function vcFromGain(av, p) { return (av - 1) * (p.R1 / p.R2) * p.Vref; }
  function dacCode(vc, p) {
    var max = Math.pow(2, p.dacBits) - 1, code = clamp(Math.round(vc / p.vdacFS * max), 0, max);
    return { code: code, max: max, vc: code / max * p.vdacFS };
  }
  /* N-channel JFET: ohmic-region resistance rds = VP^2 / (2*IDSS*(VGS-VP)); channel opening from the depletion width ~ sqrt(phi - VGS) */
  function jfet(vgs, j) {
    var phi = 0.6, vp = j.vp, den = 2 * j.idss * (vgs - vp), pinched = vgs <= vp;
    var open = pinched ? 0 : (1 - Math.sqrt((phi - vgs) / (phi - vp))) / (1 - Math.sqrt(phi / (phi - vp)));
    return { vgs: vgs, rds: pinched ? Infinity : vp * vp / den, open: clamp(open, 0, 1), pinched: pinched, region: pinched ? "pinched off" : "ohmic" };
  }
  function xadcCode(v, c) { var max = Math.pow(2, c.xadcBits) - 1; return Math.round(clamp(v / c.xadcFS, 0, 1) * max); }

  /* one-pole / biquad Butterworth low-pass via bilinear transform, for sampled (microphone) signals */
  function lowpassBuffer(x, fs, fc, order) {
    var n = x.length, y = new Float32Array(n), w = Math.tan(Math.PI * Math.min(fc, fs * 0.45) / fs), i;
    if (order === 2) {
      var k = w * w, q = Math.SQRT2, norm = 1 / (1 + q * w + k), b0 = k * norm, b1 = 2 * b0, a1 = 2 * (k - 1) * norm, a2 = (1 - q * w + k) * norm;
      var x1 = x[0], x2 = x[0], y1 = x[0], y2 = x[0];
      for (i = 0; i < n; i++) { var yy = b0 * x[i] + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = yy; y[i] = yy; }
    } else {
      var a = w / (1 + w), b = (1 - w) / (1 + w), px = x[0], py = x[0];
      for (i = 0; i < n; i++) { py = a * (x[i] + px) + b * py; px = x[i]; y[i] = py; }
    }
    return y;
  }

  /* ---------- the solver ---------- */
  function solve(s, mic) {
    var g = s.gen, c = s.cond, k = s.gain, p = s.ckt, a = s.amp, j = s.jfet;
    var useMic = g.mode === "mic" && mic && mic.data && mic.data.length > 16, pk = g.vpp / 2, f = g.freq;
    var m = { state: s, useMic: !!useMic, notes: [], f: f }, i;
    var inArr, filt, condArr, condMax, condMin, H = { mag: 1, phase: 0 };

    /* 1. input and conditioning (LPF -> buffer -> positive DC level shift) */
    if (useMic) {
      var peak = 1e-9; for (i = 0; i < mic.data.length; i++) peak = Math.max(peak, Math.abs(mic.data[i]));
      inArr = new Float32Array(mic.data.length); for (i = 0; i < inArr.length; i++) inArr[i] = g.dc + mic.data[i] / peak * pk;
      filt = lowpassBuffer(inArr, mic.fs, c.fc, c.order);
      var fmin = Infinity, fmax = -Infinity; for (i = 0; i < filt.length; i++) { fmin = Math.min(fmin, filt[i]); fmax = Math.max(fmax, filt[i]); }
      m.condPp = fmax - fmin; m.fRef = null;
      m.shift = c.shiftMode === "auto" ? Math.max(0, c.margin - fmin) : c.shift;
      condArr = new Float32Array(filt.length); for (i = 0; i < filt.length; i++) condArr[i] = filt[i] + m.shift;
      condMax = fmax + m.shift; condMin = fmin + m.shift; m.condDc = (condMax + condMin) / 2;
      m.f = null;
    } else {
      H = lpf(f, c.fc, c.order); m.H = H;
      m.condPp = g.vpp * H.mag; var cpk = m.condPp / 2;
      m.shift = c.shiftMode === "auto" ? Math.max(0, cpk + c.margin - g.dc) : c.shift;
      m.condDc = g.dc + m.shift; condMax = m.condDc + cpk; condMin = m.condDc - cpk;
    }
    m.condMax = condMax; m.condMin = condMin; m.aboveZero = condMin > 0;
    if (!m.aboveZero) m.notes.push("Conditioned signal dips below 0 V (" + condMin.toFixed(3) + " V): increase the DC level shift.");

    /* 2. XADC measurement (quantised, 0 - full scale) */
    var qmax = xadcCode(condMax, c), qmin = xadcCode(condMin, c), fs12 = Math.pow(2, c.xadcBits) - 1;
    m.xadc = { max: qmax, min: qmin, lsb: c.xadcFS / fs12, pp: (qmax - qmin) * c.xadcFS / fs12, saturated: condMax > c.xadcFS || condMin < 0 };
    if (condMax > c.xadcFS) m.notes.push("Conditioned peak " + condMax.toFixed(3) + " V exceeds the XADC full-scale " + c.xadcFS + " V: the FPGA under-measures the amplitude.");

    /* 3. gain: required (auto) or selected (manual), limited by the control-voltage range, quantised by the DAC */
    m.avMin = gainFromVc(p.vcMin, p); m.avMax = gainFromVc(p.vcMax, p);
    m.avRequired = m.xadc.pp > 0 ? k.target / m.xadc.pp : Infinity;
    var avWanted = k.mode === "auto" ? m.avRequired : k.manual;
    m.avWanted = avWanted; m.avClamped = clamp(isFinite(avWanted) ? avWanted : m.avMax, m.avMin, m.avMax);
    m.vcNeeded = vcFromGain(m.avClamped, p);
    var d = dacCode(clamp(m.vcNeeded, p.vcMin, p.vcMax), p);
    m.code = d.code; m.codeMax = d.max; m.vc = d.vc; m.vgate = -d.vc;
    m.av = gainFromVc(m.vc, p);
    m.rgEq = p.R1 * p.Vref / m.vc;                       /* effective grounded-leg impedance implied by Av = 1 + R2/Rg */
    m.jfet = jfet(m.vgate, j);
    m.dacLsb = p.vdacFS / d.max; m.gainLsb = (p.R2 / p.R1) * m.dacLsb / p.Vref;
    if (k.mode === "auto" && avWanted > m.avMax) m.notes.push("Required gain " + m.avRequired.toFixed(1) + " exceeds the maximum " + m.avMax.toFixed(1) + ": the output cannot reach the target.");
    if (k.mode === "auto" && avWanted < m.avMin) m.notes.push("Required gain " + m.avRequired.toFixed(2) + " is below the minimum " + m.avMin.toFixed(2) + ": the output is larger than the target.");
    if (k.mode === "manual" && (k.manual > m.avMax || k.manual < m.avMin)) m.notes.push("Selected gain is outside the achievable range " + m.avMin.toFixed(2) + " - " + m.avMax.toFixed(1) + ".");

    /* 4. CA3140 stage: closed-loop bandwidth GBW/Av, load-dependent swing, slew limiting, clipping */
    m.fcAmp = a.gbw / m.av; m.lim = (a.supply - a.headroom) * p.RL / (p.RL + a.ro);
    m.outDcIdeal = m.av * m.condDc; m.outPpIdeal = m.av * m.condPp;
    var ampH = useMic ? { mag: 1, phase: 0 } : lpf(f, m.fcAmp, 1); m.ampH = ampH;
    if (useMic) {
      var out = new Float32Array(condArr.length), pole = 1 - Math.exp(-TAU * m.fcAmp / mic.fs), dvMax = a.sr / mic.fs, y = condArr[0] * m.av, prev = clamp(y, -m.lim, m.lim), tgt;
      var lowMin = Infinity, lowMax = -Infinity;
      for (i = 0; i < condArr.length; i++) {
        tgt = condArr[i] * m.av; lowMin = Math.min(lowMin, tgt); lowMax = Math.max(lowMax, tgt);
        y += (tgt - y) * pole;                                   /* closed-loop bandwidth GBW/Av */
        prev = clamp(prev + clamp(y - prev, -dvMax, dvMax), -m.lim, m.lim);   /* slew limit, then rails */
        out[i] = prev;
      }
      m.outArr = out; m.inArr = inArr; m.condArr = condArr; m.fs = mic.fs; m.len = out.length;
      var omin = Infinity, omax = -Infinity; for (i = 0; i < out.length; i++) { omin = Math.min(omin, out[i]); omax = Math.max(omax, out[i]); }
      m.outPp = omax - omin; m.outMax = omax; m.outMin = omin; m.clipped = lowMax > m.lim || lowMin < -m.lim; m.slewLimited = false; m.thd = null;
    } else {
      var N = 256, tab = new Float32Array(N), ph0 = g.phase * Math.PI / 180 + H.phase + ampH.phase, amp = m.condPp / 2 * m.av * ampH.mag;
      var dv = a.sr / (f * N), yy = m.outDcIdeal + amp * Math.sin(ph0), lap, idx, ideal, rate = 0;
      for (lap = 0; lap < 4; lap++) for (idx = 0; idx < N; idx++) {
        ideal = m.outDcIdeal + amp * Math.sin(ph0 + TAU * idx / N);
        var want = ideal - yy; if (Math.abs(want) > dv) { want = want > 0 ? dv : -dv; if (lap === 3) rate++; }
        yy = clamp(yy + want, -m.lim, m.lim); if (lap === 3) tab[idx] = yy;
      }
      m.tab = tab; m.ph0 = ph0; m.slewLimited = rate > 2;
      var tmin = Infinity, tmax = -Infinity; for (i = 0; i < N; i++) { tmin = Math.min(tmin, tab[i]); tmax = Math.max(tmax, tab[i]); }
      m.outPp = tmax - tmin; m.outMax = tmax; m.outMin = tmin;
      m.clipped = m.outDcIdeal + amp > m.lim + 1e-9 || m.outDcIdeal - amp < -m.lim - 1e-9;
      /* total harmonic distortion of the simulated output (2nd - 10th harmonic) from the steady-state period */
      var re = [], im = [], h, n2;
      for (h = 1; h <= 10; h++) { var sr = 0, si = 0; for (n2 = 0; n2 < N; n2++) { sr += tab[n2] * Math.cos(TAU * h * n2 / N); si += tab[n2] * Math.sin(TAU * h * n2 / N); } re.push(sr); im.push(si); }
      var h1 = Math.hypot(re[0], im[0]), hs = 0; for (h = 1; h < 10; h++) hs += re[h] * re[h] + im[h] * im[h];
      m.thd = h1 > 1e-9 ? Math.sqrt(hs) / h1 : 0;
    }
    m.avBw = ampH.mag; m.outPpLinear = m.condPp * m.av * (useMic ? 1 : ampH.mag);
    if (m.clipped) m.notes.push("Output clips at +/-" + m.lim.toFixed(2) + " V (supply +/-" + a.supply + " V minus headroom).");
    if (m.slewLimited) m.notes.push("Output is slew-rate limited at this frequency and amplitude.");
    if (!useMic && m.avBw < 0.707) m.notes.push("Closed-loop bandwidth " + (m.fcAmp / 1000).toFixed(1) + " kHz is below the signal frequency: output is attenuated.");
    m.targetOk = k.mode === "auto" ? Math.abs(m.outPp - k.target) <= 0.02 * k.target : null;
    m.at = function (kind, t) { return evalAt(m, kind, t); };
    return m;
  }

  /* value of a signal at time t (seconds). kind: in | filt | cond | out | outIdeal | vc | vg */
  function evalAt(m, kind, t) {
    var g = m.state.gen;
    if (kind === "vc") return m.vc;
    if (kind === "vg") return m.vgate;
    if (kind === "filt") return evalAt(m, "cond", t) - m.shift;   /* low-pass output, before the DC level shift */
    if (m.useMic) {
      var arr = kind === "in" ? m.inArr : kind === "cond" ? m.condArr : m.outArr, ix = Math.floor(t * m.fs) % m.len; if (ix < 0) ix += m.len;
      return kind === "outIdeal" ? m.condArr[ix] * m.av : arr[ix];
    }
    var th = TAU * m.f * t + g.phase * Math.PI / 180;
    if (kind === "in") return g.vpp / 2 * Math.sin(th) + g.dc;
    if (kind === "cond") return m.condDc + m.condPp / 2 * Math.sin(th + m.H.phase);
    if (kind === "outIdeal") return m.outDcIdeal + m.outPpIdeal / 2 * Math.sin(th + m.H.phase);
    var x = ((th + m.H.phase + m.ampH.phase - m.ph0) / TAU) % 1; if (x < 0) x += 1;
    var pos = x * m.tab.length, i0 = Math.floor(pos), i1 = (i0 + 1) % m.tab.length, fr = pos - i0;
    return m.tab[i0] * (1 - fr) + m.tab[i1] * fr;
  }

  /* time of the first rising crossing of `level` at or after t0 on a channel; null if none (e.g. level outside the signal) */
  function findTrigger(m, kind, level, t0, span) {
    if (!m.useMic) {
      var lo = Infinity, hi = -Infinity, T = 1 / m.f, q = 64, i, v, prev = evalAt(m, kind, t0), tt;
      for (i = 1; i <= q; i++) { tt = t0 + T * i / q; v = evalAt(m, kind, tt); lo = Math.min(lo, v, prev); hi = Math.max(hi, v, prev); if (prev < level && v >= level) { var a = tt - T / q, b = tt; for (var r = 0; r < 18; r++) { var mid = (a + b) / 2; if (evalAt(m, kind, mid) < level) a = mid; else b = mid; } return b; } prev = v; }
      return null;
    }
    var n = Math.min(Math.floor(span * m.fs), m.len), s0 = Math.floor(t0 * m.fs), pv = evalAt(m, kind, t0);
    for (var k2 = 1; k2 < n; k2++) { var vv = evalAt(m, kind, t0 + k2 / m.fs); if (pv < level && vv >= level) return t0 + k2 / m.fs; pv = vv; }
    return null;
  }

  function measure(arr) {
    var n = arr.length, mn = Infinity, mx = -Infinity, sum = 0, i;
    for (i = 0; i < n; i++) { mn = Math.min(mn, arr[i]); mx = Math.max(mx, arr[i]); sum += arr[i]; }
    return { min: mn, max: mx, pp: mx - mn, mean: sum / n };
  }
  /* frequency from rising crossings of the mid level across a sampled window (dt = sample spacing); null if fewer than 2 crossings */
  function frequency(arr, dt) {
    var ms = measure(arr), mid = (ms.min + ms.max) / 2, first = -1, last = -1, cnt = 0, i;
    if (ms.pp < 1e-9) return null;
    for (i = 1; i < arr.length; i++) if (arr[i - 1] < mid && arr[i] >= mid) { var x = i - 1 + (mid - arr[i - 1]) / (arr[i] - arr[i - 1]); if (first < 0) first = x; last = x; cnt++; }
    return cnt >= 2 ? (cnt - 1) / ((last - first) * dt) : null;
  }

  /* ---------- store: shared state + subscribers + persistence ---------- */
  function createStore(key) {
    var state = clone(DEFAULTS), mic = null, model = null, subs = [], api;
    try { var raw = typeof localStorage !== "undefined" && key && localStorage.getItem(key); if (raw) merge(state, JSON.parse(raw)); } catch (e) { /* storage blocked: start from defaults */ }
    function save() { try { if (key) localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* ignore */ } }
    function notify() { subs.slice().forEach(function (fn) { fn(api); }); }
    api = {
      get state() { return state; },
      model: function () { return model || (model = solve(state, mic)); },
      set: function (patch) { merge(state, patch); model = null; save(); notify(); },
      setMic: function (buf) { mic = buf; model = null; notify(); },
      hasMic: function () { return !!mic; },
      reset: function () { state = clone(DEFAULTS); model = null; save(); notify(); },
      on: function (fn) { subs.push(fn); return function () { subs = subs.filter(function (x) { return x !== fn; }); }; }
    };
    return api;
  }

  var API = { DEFAULTS: DEFAULTS, JFETS: JFETS, META: META, LIMITS: LIMITS, TAU: TAU, clone: clone, clamp: clamp, merge: merge, lpf: lpf, gainFromVc: gainFromVc, vcFromGain: vcFromGain,
    dacCode: dacCode, jfet: jfet, xadcCode: xadcCode, lowpassBuffer: lowpassBuffer, solve: solve, evalAt: evalAt, findTrigger: findTrigger, measure: measure, frequency: frequency, createStore: createStore };
  if (typeof module !== "undefined" && module.exports) module.exports = API; else root.VGASim = API;
})(typeof window !== "undefined" ? window : globalThis);
