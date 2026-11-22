// Simulation engine: gain law, DAC quantisation, conditioning, XADC, clipping, JFET, store. No browser needed.
// Run: node --test tests/sim.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import Sim from "../assets/js/sim.js";

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg || ""} expected ${b} +/- ${tol}, got ${a}`);
const state = (patch = {}) => Sim.merge(Sim.clone(Sim.DEFAULTS), patch);
const solve = (patch, mic) => Sim.solve(state(patch), mic);
const P = Sim.DEFAULTS.ckt;

test("gain law: Av = 1 + (R2/R1)(Vc/Vref), with the achievable range from the -0.41 V .. -5 V gate range", () => {
  near(Sim.gainFromVc(0.41, P), 1 + (10000 / 5100) * (0.41 / 0.2), 1e-9);
  near(Sim.gainFromVc(0.41, P), 5.02, 0.01, "min gain");
  near(Sim.gainFromVc(5, P), 50.02, 0.01, "max gain");
  near(Sim.vcFromGain(Sim.gainFromVc(2.3, P), P), 2.3, 1e-9, "inverse");
});

test("DAC: 12-bit code, 0-5 V range, actual Vc = code/4095*5", () => {
  const d = Sim.dacCode(2.5, P);
  assert.equal(d.code, Math.round(2.5 / 5 * 4095));
  assert.equal(d.max, 4095);
  near(d.vc, d.code / 4095 * 5, 1e-12);
  assert.equal(Sim.dacCode(9, P).code, 4095, "clamped at full scale");
  assert.equal(Sim.dacCode(-1, P).code, 0);
});

test("auto mode reaches the 5 Vpp target when the gain range allows it (200 mVpp @ 1 kHz)", () => {
  const m = solve({ gen: { vpp: 0.2 } });
  near(m.outPp, 5, 0.06, "output pp");
  assert.equal(m.targetOk, true);
  assert.equal(m.clipped, false);
  near(m.vgate, -m.vc, 1e-12);
  near(m.av, 1 + (10000 / 5100) * (m.vc / 0.2), 1e-9);
});

test("auto mode never claims 5 Vpp when the gain range cannot deliver it (10 mVpp)", () => {
  const m = solve({ gen: { vpp: 0.01 } });
  assert.ok(m.avRequired > m.avMax);
  near(m.av, m.avMax, 0.01, "gain saturates at the maximum");
  assert.ok(m.outPp < 1, `output ${m.outPp} must be far below 5 V`);
  assert.equal(m.targetOk, false);
  assert.ok(m.notes.some((n) => /exceeds the maximum/.test(n)));
});

test("auto mode with a large input falls to the minimum gain and says so (1 Vpp)", () => {
  const m = solve({ gen: { vpp: 1 } });
  assert.ok(m.av >= m.avMin - 1e-9);
  assert.ok(m.outPp > 4 && m.outPp < 6.5);
});

test("manual mode follows the selected gain through DAC quantisation", () => {
  const m = solve({ gain: { mode: "manual", manual: 20 } });
  near(m.av, 20, m.gainLsb, "within one DAC step");
  assert.equal(m.code, Sim.dacCode(Sim.vcFromGain(20, P), P).code);
  const lo = solve({ gain: { mode: "manual", manual: 1 } });
  near(lo.av, lo.avMin, 0.01, "clamped to the achievable minimum");
  assert.ok(lo.notes.some((n) => /outside the achievable range/.test(n)));
});

test("low-pass response: -3 dB at the cutoff, order 2 is steeper above it", () => {
  near(Sim.lpf(20000, 20000, 1).mag, Math.SQRT1_2, 1e-9);
  near(Sim.lpf(20000, 20000, 1).phase, -Math.PI / 4, 1e-9);
  near(Sim.lpf(20000, 20000, 2).mag, Math.SQRT1_2, 1e-9);
  assert.ok(Sim.lpf(60000, 20000, 2).mag < Sim.lpf(60000, 20000, 1).mag);
  near(Sim.lpf(200, 20000, 1).mag, 1, 1e-3);
});

test("conditioning attenuates by the filter magnitude and keeps the signal above 0 V", () => {
  const lo = solve({ gen: { freq: 1000 } }), hi = solve({ gen: { freq: 20000 } });
  near(hi.condPp / hi.state.gen.vpp, Math.SQRT1_2, 1e-6, "gain at fc");
  assert.ok(lo.condPp > hi.condPp);
  for (const m of [lo, hi, solve({ gen: { vpp: 1, dc: -0.3 } })]) { assert.ok(m.condMin > 0, "min " + m.condMin); assert.ok(m.shift >= 0); }
  const fixedLow = solve({ cond: { shiftMode: "fixed", shift: 0 } });
  assert.equal(fixedLow.aboveZero, false);
  assert.ok(fixedLow.notes.some((n) => /below 0 V/.test(n)));
});

test("XADC reads the conditioned signal quantised to 12 bits and flags saturation", () => {
  const m = solve({ gen: { vpp: 0.2 } });
  near(m.xadc.pp, m.condPp, m.xadc.lsb * 1.01, "measured pp within one LSB");
  assert.equal(m.xadc.saturated, false);
  const sat = solve({ gen: { vpp: 1 }, cond: { xadcFS: 0.3 } });
  assert.equal(sat.xadc.saturated, true);
  assert.ok(sat.notes.some((n) => /XADC/.test(n)));
});

test("output clips at the supply minus headroom, load-dependent, and the ideal value is kept separately", () => {
  const m = solve({ gen: { vpp: 1 }, gain: { mode: "manual", manual: 50 } });
  assert.equal(m.clipped, true);
  assert.ok(m.outMax <= m.lim + 1e-6 && m.outMin >= -m.lim - 1e-6);
  assert.ok(m.outPp < m.outPpIdeal, "actual below theoretical");
  assert.ok(m.lim < 12 - 1.5 + 1e-9);
  const heavy = solve({ ckt: { RL: 2000 }, gen: { vpp: 1 } });
  assert.ok(heavy.lim < solve({ gen: { vpp: 1 } }).lim, "a heavier load lowers the swing");
  assert.ok(solve({ gen: { vpp: 1 }, gain: { mode: "manual", manual: 50 } }).thd > 0.05, "clipping creates distortion");
});

test("clean output has near-zero THD", () => {
  assert.ok(solve({ gen: { vpp: 0.2 } }).thd < 1e-3);
});

test("closed-loop bandwidth GBW/Av reduces gain at high frequency and the slew limit bites when it is low", () => {
  const hi = solve({ gen: { freq: 20000, vpp: 0.1 }, gain: { mode: "manual", manual: 50 } });
  near(hi.fcAmp, 4.5e6 / hi.av, 1);
  assert.ok(hi.avBw < 1 && hi.avBw > 0.9);
  const slow = solve({ gen: { freq: 20000, vpp: 0.1 }, gain: { mode: "manual", manual: 50 }, amp: { sr: 5e4 } });
  assert.equal(slow.slewLimited, true);
  assert.ok(slow.outPp < hi.outPp);
});

test("sampled output matches the solved peak-to-peak and mean (one engine feeds every view)", () => {
  const m = solve({ gen: { vpp: 0.2, freq: 1000 } }), n = 2000, a = new Float32Array(n);
  for (let i = 0; i < n; i++) a[i] = m.at("out", i / n / 1000);
  near(Sim.measure(a).pp, m.outPp, m.outPp * 0.01, "pp");
  near(Sim.frequency(a.map((_, i) => m.at("out", i * 5e-6)), 5e-6), 1000, 15, "frequency");
  const c = new Float32Array(n); for (let i = 0; i < n; i++) c[i] = m.at("cond", i / n / 1000);
  near(Sim.measure(c).pp, m.condPp, m.condPp * 0.01, "conditioned pp");
  near(m.at("vc", 0), m.vc, 0); near(m.at("vg", 1), -m.vc, 0);
});

test("trigger finds the rising crossing, and none when the level is outside the signal", () => {
  const m = solve({ gen: { vpp: 0.2, freq: 1000 } });
  const lvl = (m.outMax + m.outMin) / 2, t = Sim.findTrigger(m, "out", lvl, 0, 0.01);
  assert.ok(t !== null);
  near(m.at("out", t), lvl, 1e-3, "value at trigger");
  assert.ok(m.at("out", t + 1e-5) > m.at("out", t - 1e-5), "rising");
  assert.equal(Sim.findTrigger(m, "out", m.outMax + 5, 0, 0.01), null);
});

test("JFET: resistance rises and the channel narrows as the gate goes more negative; pinch-off at VP; not a linear resistor", () => {
  const j = Sim.JFETS.J111, a = Sim.jfet(-0.41, j), b = Sim.jfet(-3, j), c = Sim.jfet(-6, j), d = Sim.jfet(-6.5, j);
  assert.ok(a.rds < b.rds && b.rds < c.rds);
  assert.ok(a.open > b.open && b.open > c.open && c.open > 0);
  assert.equal(d.pinched, true); assert.equal(d.rds, Infinity); assert.equal(d.open, 0);
  assert.ok(Math.abs(Sim.jfet(-2, j).rds / Sim.jfet(-1, j).rds - 2) > 0.1, "not proportional to |VGS|");
  assert.ok(Sim.JFETS.BF245 && Sim.JFETS.J111);
});

test("effective feedback leg implied by the gain law: Rg = R1*Vref/Vc and Av = 1 + R2/Rg", () => {
  const m = solve({ gain: { mode: "manual", manual: 12 } });
  near(1 + 10000 / m.rgEq, m.av, 1e-9);
});

test("microphone path: recorded samples are kept, conditioned above 0 V, and gain is applied to them", () => {
  const fs = 48000, data = new Float32Array(fs / 2); for (let i = 0; i < data.length; i++) data[i] = Math.sin(2 * Math.PI * 440 * i / fs) * 0.6 + 0.2 * Math.sin(2 * Math.PI * 1320 * i / fs);
  const m = solve({ gen: { mode: "mic", vpp: 0.2 } }, { data, fs });
  assert.equal(m.useMic, true);
  assert.ok(m.condMin > 0);
  near(m.outPp, 5, 0.3, "auto gain on the recording");
  const sampled = Array.from({ length: 500 }, (_, i) => m.at("in", i / fs));
  assert.ok(new Set(sampled.map((v) => v.toFixed(4))).size > 100, "waveform is the recording, not a sine");
  assert.equal(solve({ gen: { mode: "mic" } }).useMic, false, "no recording yet falls back to the sine generator");
});

test("store: values are clamped to their ranges, unknown keys ignored, subscribers notified, model recomputed", () => {
  const s = Sim.createStore(null); let calls = 0; s.on(() => calls++);
  const before = s.model();
  s.set({ gen: { vpp: 5, freq: 5, bogus: 1 }, nothing: { x: 1 } });
  assert.equal(s.state.gen.vpp, 1); assert.equal(s.state.gen.freq, 20); assert.equal(s.state.gen.bogus, undefined);
  assert.equal(calls, 1);
  assert.notEqual(s.model(), before);
  assert.equal(s.model(), s.model(), "cached until the next change");
  s.set({ ckt: { RL: 100 } }); assert.equal(s.state.ckt.RL, 2000, "minimum load is 2 kohm");
  s.reset(); assert.equal(s.state.gen.vpp, Sim.DEFAULTS.gen.vpp);
});

test("every limit and metadata key refers to a real parameter", () => {
  for (const key of [...Object.keys(Sim.LIMITS), ...Object.keys(Sim.META)]) { const [g, k] = key.split("."); assert.ok(k in Sim.DEFAULTS[g], key); }
});

test("conditioning plot signals are consistent: filtered = input x |H|, conditioned = filtered + the DC shift", () => {
  for (const patch of [{ gen: { freq: 1000 } }, { gen: { freq: 30000 }, cond: { order: 2, fc: 20000 } }, { gen: { freq: 8000, dc: 0.1 }, cond: { shiftMode: "fixed", shift: 0.4 } }]) {
    const m = solve(patch), n = 400, filt = new Float32Array(n), inp = new Float32Array(n);
    for (let i = 0; i < n; i++) { const t = i / n / m.f; filt[i] = m.at("filt", t); inp[i] = m.at("in", t); near(m.at("cond", t) - m.at("filt", t), m.shift, 1e-9, "shift is the only difference"); }
    near(Sim.measure(filt).pp, m.state.gen.vpp * m.H.mag, 1e-4, "filtered pp = Vpp x |H(f)|");
    near(Sim.measure(inp).pp, m.state.gen.vpp, 1e-4, "input pp");
  }
});
