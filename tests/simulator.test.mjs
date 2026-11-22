// Browser tests for the live Signal Chain (Home) and the simulator (Design), run against dev-server.mjs.
// Run: PLAYWRIGHT_DIR=<dir containing node_modules/playwright> node --test tests/simulator.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_DIR || root, "x.js"))("playwright");
const PORT = 3918, BASE = `http://localhost:${PORT}`;
let server, browser, errors = [];
const IDS = ["in", "cond", "amp", "out", "fpga", "dac", "inv", "jfet"];

before(async () => {
  server = spawn(process.execPath, ["dev-server.mjs"], { cwd: root, env: { ...process.env, PORT: String(PORT) } });
  await new Promise((ok, fail) => { server.stdout.on("data", (d) => /Site:/.test(d) && ok()); server.on("error", fail); setTimeout(() => fail(new Error("server did not start")), 8000); });
  browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
});
after(async () => { await browser?.close(); server?.kill(); });

async function open(url, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.w || 1360, height: opts.h || 900 }, permissions: ["microphone"] });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => errors.push(url + " pageerror " + e.message));
  page.on("console", (m) => ["error", "warning"].includes(m.type()) && !/willReadFrequently/.test(m.text()) && errors.push(url + " " + m.type() + " " + m.text())); // that warning comes from this test reading pixels, not from the app
  await page.goto(BASE + url);
  await page.waitForFunction(() => window.VGASimStore && document.querySelector(".chain, #vga-sim .sim-row"));
  await page.waitForTimeout(600);
  return page;
}
const show = async (page, sel) => { await page.locator(sel).first().scrollIntoViewIfNeeded(); await page.waitForTimeout(450); };
const canvasSum = (page, sel) => page.evaluate((s) => { const c = document.querySelector(s), d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data; let h = 0, ink = 0; for (let i = 0; i < d.length; i += 4) { h = (h * 31 + d[i] + d[i + 1] * 7 + d[i + 2] * 13 + d[i + 3]) | 0; if (d[i + 3] > 0) ink++; } return { h, ink }; }, sel);
const setNum = async (page, label, v) => { const el = page.getByLabel(label + " value").first(); await el.fill(String(v)); await el.press("Tab"); await page.waitForTimeout(150); };

test("Home chain has the eight blocks in the specified order, with the two paths separated", async () => {
  const page = await open("/index.html");
  assert.deepEqual(await page.$$eval(".cblock", (b) => b.map((x) => x.dataset.id)), IDS);
  assert.deepEqual(await page.$$eval(".chain-sig .cblock", (b) => b.map((x) => x.dataset.id)), ["in", "cond", "amp", "out"]);
  assert.deepEqual(await page.$$eval(".ctl-row .cblock", (b) => b.map((x) => x.dataset.id)), ["fpga", "dac", "inv", "jfet"]);
  assert.match(await page.textContent(".chain-ctl small"), /gain-control path/i);
  assert.ok(await page.locator(".cbus").count(), "dashed feedback line to the gain stage");
  await page.context().close();
});

test("clicking every block updates a concise panel in place: title, short description, visual, input/output, Explore Design", async () => {
  const page = await open("/index.html"); await show(page, ".chain"); const titles = new Set();
  for (const id of IDS) {
    await page.click(`.cblock[data-id="${id}"]`); await page.waitForTimeout(250);
    titles.add(await page.textContent(".cd-title"));
    assert.equal(await page.getAttribute(`.cblock[data-id="${id}"]`, "aria-pressed"), "true");
    const info = await page.textContent(".cd-info"); assert.ok(info.length > 20 && info.length < 260 && info.split(/[.!?]\s/).length <= 3, id + " description is short: " + info);
    assert.deepEqual(await page.$$eval(".cd-io dt", (d) => d.map((x) => x.textContent)), ["Input", "Output"]);
    assert.ok((await canvasSum(page, ".cd-viz")).ink > 200, id + " visual is drawn");
    assert.match(await page.textContent(".cd-link"), /Explore Design/); assert.match(await page.getAttribute(".cd-link", "href"), /^design\.html\?tab=\w+#simulator$/);
    assert.ok(await page.$eval(".chain-detail", (e) => e.scrollHeight <= e.clientHeight + 1), id + " panel needs no inner scrolling");
    assert.equal(new URL(page.url()).pathname, "/index.html", "stays on the page");
  }
  assert.equal(titles.size, 8, "eight different panels");
  assert.match(await page.textContent(".cd-n"), /Block 08/);
  await page.click(`.cblock[data-id="in"]`); await page.click(".cd-prev"); assert.match(await page.textContent(".cd-title"), /jfet/i);
  await page.click(".cd-next"); assert.match(await page.textContent(".cd-title"), /analog input/i);
  await page.click(".cd-next"); assert.match(await page.textContent(".cd-title"), /conditioning/i);
  await page.context().close();
});

test("previews are live canvases that animate", async () => {
  const page = await open("/index.html"); await show(page, ".chain");
  for (const id of IDS) { const sel = `.cblock[data-id="${id}"] .cviz`; assert.ok((await canvasSum(page, sel)).ink > 30, id + " preview drawn"); }
  const a = await canvasSum(page, '.cblock[data-id="in"] .cviz'); await page.waitForTimeout(500);
  assert.notEqual((await canvasSum(page, '.cblock[data-id="in"] .cviz')).h, a.h, "waveform moves over time");
  await page.context().close();
});

test("Home is an overview only: no simulation controls, readouts, equations or calculations", async () => {
  const page = await open("/index.html");
  assert.equal(await page.locator("main input, main select, main textarea").count(), 0, "no inputs or sliders on Home");
  for (const sel of [".chain-ctrl", ".scope", "#vga-sim", ".cd-eq", ".cd-vals", ".cd-facts", "[data-live]", ".cb-v"]) assert.equal(await page.locator(sel).count(), 0, sel + " must not exist on Home");
  assert.equal(await page.locator('main button:text-matches("Auto|Manual|Run|Stop|Record", "i")').count(), 0, "no gain-mode or scope buttons");
  for (const id of IDS) assert.equal(await page.locator(`.cblock[data-id="${id}"] .cb-t > *`).count(), 2, id + " block shows only a name and a subtitle");
  const txt = await page.textContent(".chain-diagram"); assert.doesNotMatch(txt, /\b\d+(\.\d+)?\s?(mV|V|Vpp|kΩ|Hz|kHz)\b|code \d/, "no measurements or codes in the diagram");
  assert.doesNotMatch(await page.textContent(".chain-detail"), /\bcode\b|=|\b\d+(\.\d+)?\s?(mV|Vpp|kΩ)\b/, "no equations or values in the panel");
  await page.context().close();
});

test("Home never reads or writes the simulator settings", async () => {
  const page = await open("/design.html"); await page.evaluate(() => window.VGASimStore.set({ gen: { vpp: 0.7, freq: 5000 } })); await page.waitForTimeout(200);
  const saved = await page.evaluate(() => localStorage.getItem("vdt_sim_v1")); assert.ok(saved);
  await page.goto(BASE + "/index.html"); await page.waitForFunction(() => window.VGASimStore); await show(page, ".chain");
  for (const id of IDS) await page.click(`.cblock[data-id="${id}"]`);
  assert.equal(await page.evaluate(() => window.VGASimStore.state.gen.vpp), 0.2, "Home previews use the fixed demo signal, not the saved setting");
  assert.equal(await page.evaluate(() => localStorage.getItem("vdt_sim_v1")), saved, "saved simulator state untouched");
  await page.context().close();
});

test("wide layout: content uses the viewport at 1440 / 1600 / 1920, panels are 60/40 and top-aligned, nothing overflows", async () => {
  const want = { 1440: [1180, 1300], 1600: [1250, 1450], 1920: [1300, 1460] };
  for (const w of [1440, 1600, 1920]) {
    const page = await open("/index.html", { w, h: 1000 }); await show(page, ".chain");
    const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); return { main: r("main").width - 44, dia: r(".chain-diagram"), det: r(".chain-detail"), over: document.documentElement.scrollWidth - innerWidth, viz: r(".cd-viz").width }; });
    assert.ok(g.main >= want[w][0] && g.main <= want[w][1], `${w}px: content width ${g.main}`);
    const share = g.dia.width / (g.dia.width + g.det.width); assert.ok(share > 0.56 && share < 0.64, `${w}px: diagram share ${share.toFixed(2)}`);
    assert.ok(Math.abs(g.dia.top - g.det.top) < 4, `${w}px: panels top-aligned`); assert.ok(g.over <= 0, `${w}px overflows`); assert.ok(g.viz > 300, `${w}px: visual is large (${g.viz})`);
    assert.ok(await page.$eval(".chain-detail", (e) => e.scrollHeight <= e.clientHeight + 1), `${w}px: panel does not scroll`);
    assert.ok((await page.$eval(".chain-detail", (e) => e.getBoundingClientRect().height)) <= g.dia.height + 40, `${w}px: panel fits the diagram height`);
    await page.context().close();
  }
});

test("tablet and mobile: chain stacks, nothing overflows, blocks stay selectable", async () => {
  for (const w of [1024, 768, 375]) {
    const page = await open("/index.html", { w, h: 900 }); await show(page, ".chain");
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, w + "px overflows");
    assert.deepEqual(await page.$$eval(".ctl-row .cblock", (b) => b.map((x) => x.dataset.id)), ["fpga", "dac", "inv", "jfet"]);
    const lefts = await page.$$eval(".ctl-row .cblock", (b) => b.map((x) => Math.round(x.getBoundingClientRect().left))), row = lefts.every((l, i) => i === 0 || l > lefts[i - 1] + 20);
    assert.equal(row, w >= 768, w + "px: gain-control path is " + (row ? "horizontal" : "stacked"));   // horizontal on tablet, stacked only on phones
    if (w >= 768) assert.notEqual(await page.$eval(".cbus", (e) => getComputedStyle(e).display), "none", w + "px: dashed feedback line kept");
    await page.click('.cblock[data-id="jfet"]'); assert.match(await page.textContent(".cd-title"), /jfet/i);
    await page.context().close();
  }
});

test("Design page: generator limits, auto mode reaches 5 Vpp, manual mode follows the slider", async () => {
  const page = await open("/design.html#simulator");
  const st = () => page.evaluate(() => JSON.parse(JSON.stringify({ s: window.VGASimStore.state, m: (({ av, outPp, code, vc, vgate, clipped }) => ({ av, outPp, code, vc, vgate, clipped }))(window.VGASimStore.model()) })));
  const g = page.locator("#sim-gen .sim-sine");
  await g.getByLabel("Amplitude value").fill("5"); await g.getByLabel("Amplitude value").press("Tab"); assert.equal((await st()).s.gen.vpp, 1, "amplitude clamps to 1 Vpp");
  await g.getByLabel("Amplitude value").fill("0.001"); await g.getByLabel("Amplitude value").press("Tab"); assert.equal((await st()).s.gen.vpp, 0.01, "and to 10 mVpp");
  await g.getByLabel("Frequency value").fill("5"); await g.getByLabel("Frequency value").press("Tab"); assert.equal((await st()).s.gen.freq, 20);
  await g.getByLabel("Frequency value").fill("99999"); await g.getByLabel("Frequency value").press("Tab"); assert.equal((await st()).s.gen.freq, 20000);
  await g.getByLabel("Amplitude value").fill("0.2"); await g.getByLabel("Amplitude value").press("Tab"); await g.getByLabel("Frequency value").fill("1000"); await g.getByLabel("Frequency value").press("Tab");
  const auto = await st(); assert.ok(Math.abs(auto.m.outPp - 5) < 0.06, "auto output " + auto.m.outPp);
  assert.match(await page.locator("#sim-gen").textContent(), /✓ target/);
  const gc = page.locator("#sim-gen .sim-card").nth(1); await gc.getByRole("button", { name: "Manual" }).click(); await gc.getByLabel("Gain value").fill("12"); await gc.getByLabel("Gain value").press("Tab");
  const man = await st(); assert.equal(man.s.gain.mode, "manual"); assert.ok(Math.abs(man.m.av - 12) < 0.05);
  assert.ok(Math.abs(man.m.vgate + man.m.vc) < 1e-9); assert.equal(man.m.code, Math.round(man.m.vc / 5 * 4095));
  await page.context().close();
});

test("oscilloscope draws all channels, stops, measures, and flags clipping", async () => {
  const page = await open("/design.html#simulator");
  const sc = page.locator("#sim-scope"); await show(page, "#sim-scope");
  assert.ok((await canvasSum(page, ".scope-cv")).ink > 5000, "scope drawn");
  const m = await sc.locator(".scope-meas .meas-ch tbody tr").allTextContents(); assert.equal(m.length, 3, "CH1-CH3 shown, CH4 optional");
  assert.match(await sc.locator(".scope-meas").textContent(), /Measured gain.*25\.0/);
  await sc.getByRole("button", { name: "Stop" }).click(); await page.waitForTimeout(200); /* one frame: the RUN label becomes STOP */ const f1 = await canvasSum(page, ".scope-cv"); await page.waitForTimeout(500); assert.equal((await canvasSum(page, ".scope-cv")).h, f1.h, "frozen while stopped");
  assert.equal(await page.getAttribute("html", "data-sim-run"), "0");
  await sc.getByRole("button", { name: "Run" }).click();
  await sc.getByLabel("Show CH4").check(); await page.waitForTimeout(400); assert.equal((await sc.locator(".scope-meas .meas-ch tbody tr").count()), 4);
  const t0 = await sc.locator(".scope-bar select").first().inputValue(); await sc.getByRole("button", { name: "Zoom in time" }).click(); assert.notEqual(await sc.locator(".scope-bar select").first().inputValue(), t0);
  await sc.getByLabel("CH3 volts per division").selectOption("0.5"); await page.waitForTimeout(300); assert.ok((await canvasSum(page, ".scope-cv")).ink > 1000);
  await sc.getByLabel("CH1 coupling").click(); assert.equal(await sc.getByLabel("CH1 coupling").textContent(), "AC");
  await page.evaluate(() => window.VGASimStore.set({ gen: { vpp: 1 }, gain: { mode: "manual", manual: 50 } })); await page.waitForTimeout(500);
  assert.match(await sc.locator(".scope-meas").textContent(), /Clipping\s*YES/);
  await page.context().close();
});

test("microphone: record from a (fake) device, then the real waveform drives the chain", async () => {
  const page = await open("/design.html#simulator"); await show(page, "#sim-scope");
  await page.getByRole("button", { name: "Microphone" }).first().click();
  await page.getByRole("button", { name: "Enable microphone" }).click(); await page.waitForFunction(() => /Microphone ready/.test(document.querySelector(".sim-mic .sim-status").textContent));
  await page.getByRole("button", { name: "● Record" }).click(); await page.waitForTimeout(1500); await page.getByRole("button", { name: "■ Stop" }).click();
  await page.waitForFunction(() => /Recorded/.test(document.querySelector(".sim-mic .sim-status").textContent), null, { timeout: 8000 });
  const r = await page.evaluate(() => { const m = window.VGASimStore.model(); return { mic: m.useMic, len: m.len, cond: m.condMin > 0, pp: m.outPp }; });
  assert.equal(r.mic, true); assert.ok(r.len > 10000); assert.ok(r.cond, "recording is conditioned above 0 V");
  assert.match(await page.locator(".sim-mic").textContent(), /virtual simulation source/);
  assert.ok((await canvasSum(page, ".scope-cv")).ink > 3000);
  await page.getByRole("button", { name: "▶ Play" }).click();
  await page.context().close();
});

test("tabs: analysis, conditioning, schematic components, JFET and parameters all work and stay in sync", async () => {
  const page = await open("/design.html?tab=amp#simulator");
  assert.equal(await page.getAttribute('.sim-tabs button.on', "role"), "tab"); assert.match(await page.textContent(".sim-tabs button.on"), /Amplifier circuit/, "deep link opens the right tab");
  for (const comp of ["R1", "R2", "Rp", "RL", "Q1", "Q2", "U1", "U2", "Vref", "Vin", "Vcontrol"]) { await page.locator(`.sim-hot[data-comp="${comp}"]`).click({ force: true }); assert.ok((await page.textContent(".sim-side h4")).length > 1, comp); assert.ok((await page.$$eval(".sim-side dl > div", (r) => r.length)) >= 1, comp + " has values"); }
  await page.locator('.sim-hot[data-comp="R2"]').click({ force: true }); await page.getByLabel("R2 value").fill("20000"); await page.getByLabel("R2 value").press("Tab"); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.VGASimStore.state.ckt.R2), 20000, "editing a component updates the shared model");
  await page.click('.sim-tabs button:text("Engineering analysis")'); assert.match(await page.textContent(".sim-steps"), /Required gain/); assert.match(await page.textContent(".sim-panel:not([hidden])"), /Theoretical/);
  await page.click('.sim-tabs button:text("Input conditioning")'); await show(page, ".sim-panel:not([hidden]) canvas"); assert.ok((await canvasSum(page, ".sim-panel:not([hidden]) canvas")).ink > 500);
  await page.click('.sim-tabs button:text("JFET channel")'); await show(page, ".sim-panel:not([hidden]) canvas"); await page.getByLabel("JFET model").selectOption("BF245"); assert.equal(await page.evaluate(() => window.VGASimStore.state.jfet.model), "BF245"); assert.equal(await page.evaluate(() => window.VGASimStore.state.jfet.vp), -3.5);
  const open1 = await page.evaluate(() => window.VGASimStore.model().jfet.open); await page.locator("#sim-vgs").fill("900"); await page.waitForTimeout(250);
  assert.notEqual(await page.evaluate(() => window.VGASimStore.model().jfet.open), open1, "gate slider moves the channel"); assert.equal(await page.evaluate(() => window.VGASimStore.state.gain.mode), "manual");
  await page.click('.sim-tabs button:text("Parameters")'); assert.ok((await page.$$eval(".sim-table.params tbody tr", (r) => r.length)) > 15); assert.ok((await page.$$eval(".chip-status.assumed", (r) => r.length)) > 3);
  await page.getByRole("button", { name: "Reset all to defaults" }).click(); assert.equal(await page.evaluate(() => window.VGASimStore.state.ckt.R2), 10000);
  await page.context().close();
});

test("mobile: both pages fit a 375 px phone and the blocks stay selectable", async () => {
  for (const url of ["/index.html", "/design.html#simulator"]) {
    const page = await open(url, { w: 375, h: 700 });
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, url + " overflows horizontally");
    if (url.startsWith("/index")) { await page.click('.cblock[data-id="jfet"]'); assert.match(await page.textContent(".cd-title"), /jfet/i); assert.ok((await page.locator('.cblock[data-id="jfet"] .cviz').boundingBox()).width > 100); }
    await page.context().close();
  }
});

test("Design page uses ~92% of the viewport, aligned with the nav, with consistent width for every section", async () => {
  const want = { 1440: [1280, 1340], 1600: [1440, 1520], 1920: [1560, 1610] };
  for (const w of [1440, 1600, 1920]) {
    const page = await open("/design.html#simulator", { w, h: 1000 });
    const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(); const secs = [...document.querySelectorAll("main .section")].map((e) => Math.round(e.getBoundingClientRect().width)); return { main: r("main").width, mainL: r("main").left, navL: r(".nav-inner").left, navW: r(".nav-inner").width, secs, over: document.documentElement.scrollWidth - innerWidth }; });
    assert.ok(g.main >= want[w][0] && g.main <= want[w][1], `${w}px: main ${g.main}`);
    assert.ok(Math.abs(g.mainL - g.navL) < 3 && Math.abs(g.main - g.navW) < 3, `${w}px: content aligned with the nav (${g.mainL} vs ${g.navL})`);
    assert.ok(new Set(g.secs).size === 1, `${w}px: every section has the same width ${g.secs}`);
    assert.ok(g.over <= 0, `${w}px overflows`);
    await page.context().close();
  }
});

test("simulator layout: generator and gain controller side by side (equal), oscilloscope full width below, large screen", async () => {
  const page = await open("/design.html#simulator", { w: 1600, h: 1000 }); await show(page, "#sim-scope");
  const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), c = [...document.querySelectorAll("#sim-gen .sim-card")].map((e) => e.getBoundingClientRect()); return { c0: c[0], c1: c[1], sim: r("#vga-sim"), scope: r("#sim-scope"), cv: r(".scope-cv"), tab: r(".sim-tabcard") }; });
  assert.ok(Math.abs(g.c0.width - g.c1.width) / g.c0.width < 0.03, "equal widths"); assert.ok(Math.abs(g.c0.height - g.c1.height) < 2, "equal heights"); assert.ok(Math.abs(g.c0.top - g.c1.top) < 2 && g.c1.left > g.c0.right - 1, "side by side");
  assert.ok(g.scope.top >= g.c0.bottom - 1 && Math.abs(g.scope.width - g.sim.width) < 2, "scope below, full width");
  assert.ok(g.cv.height >= 500 && g.cv.width > 1300, `scope screen is large (${g.cv.width}x${g.cv.height})`);
  assert.ok(g.tab.top - g.scope.bottom < 40 && g.scope.top - g.c0.bottom < 40, "tight vertical gaps");
  assert.equal(await page.locator("#sim-gen .sim-card h3").evaluateAll((h) => h.map((x) => Math.round(x.getBoundingClientRect().top)).filter((v, i, a) => v === a[0]).length), 2, "headings aligned");
  await page.context().close();
});

test("oscilloscope readability: channel colours only as indicators, neutral high-contrast text, one font, aligned numbers", async () => {
  const page = await open("/design.html#simulator"); await show(page, "#sim-scope"); await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const cs = (e) => getComputedStyle(e), td = document.querySelector(".meas-ch tbody td"), th = document.querySelector(".meas-ch tbody th"), d = document.querySelector(".meas-der td"), dt = document.querySelector(".meas-der th");
    const dots = [...document.querySelectorAll(".meas-ch .chdot")].map((e) => cs(e).backgroundColor), lab = document.querySelector(".scope-ch label b");
    const right = [...document.querySelectorAll(".meas-ch tbody tr")].map((tr) => Math.round(tr.children[1].getBoundingClientRect().right));
    return { td: cs(td).color, th: cs(th).color, d: cs(d).color, dt: cs(dt).color, fg: cs(document.body).color, fam: [cs(td).fontFamily, cs(d).fontFamily, cs(th).fontFamily], size: parseFloat(cs(td).fontSize), dots, labColor: cs(lab).color, right, heads: [...document.querySelectorAll(".meas-ch thead th")].map((e) => e.textContent), der: [...document.querySelectorAll(".meas-der th")].map((e) => e.textContent) };
  });
  for (const k of ["td", "th", "d"]) assert.equal(r[k], r.fg, k + " text is the neutral foreground colour, not a channel colour");
  assert.equal(new Set(r.fam).size, 1, "one font family"); assert.ok(r.size >= 14, "readable size " + r.size);
  assert.deepEqual(r.dots, ["rgb(232, 179, 57)", "rgb(79, 184, 232)", "rgb(92, 201, 138)"], "amber, cyan, green indicators"); assert.equal(r.labColor, r.fg);
  assert.equal(new Set(r.right).size, 1, "numeric columns are right-aligned on one edge");
  assert.deepEqual(r.heads.map((x) => x.toUpperCase()), ["CHANNEL", "VPP", "VMAX", "VMIN", "VAVG", "FREQUENCY"]);
  assert.deepEqual(r.der.map((x) => x.toLowerCase()), ["measured gain (ch3/ch1)", "distortion (thd)", "clipping", "slew limited"]);
  await page.context().close();
});

test("engineering plots redraw from the live model: waveform, Bode and JFET respond to every relevant control", async () => {
  const page = await open("/design.html?tab=cond#simulator", { w: 1600, h: 1000 });
  const cvs = ".sim-panel:not([hidden]) .sim-cv"; await show(page, cvs);
  const sums = async () => [await canvasSum(page, `${cvs}:nth-of-type(1)`), await canvasSum(page, `.sim-panel:not([hidden]) > .sim-two > div:nth-child(2) canvas`)];
  const wave = () => canvasSum(page, ".sim-panel:not([hidden]) .sim-two > div:first-child canvas"), bode = () => canvasSum(page, ".sim-panel:not([hidden]) .sim-two > div:last-child canvas");
  const w0 = await wave(), b0 = await bode(); assert.ok(w0.ink > 3000 && b0.ink > 3000);
  await page.evaluate(() => window.VGASimStore.set({ gen: { freq: 12000 } })); await page.waitForTimeout(250); assert.notEqual((await wave()).h, w0.h, "waveform follows frequency"); assert.notEqual((await bode()).h, b0.h, "Bode marker follows frequency");
  const b1 = await bode(); await page.evaluate(() => window.VGASimStore.set({ cond: { order: 2 } })); await page.waitForTimeout(250); assert.notEqual((await bode()).h, b1.h, "Bode follows the filter model");
  const b2 = await bode(); await page.evaluate(() => window.VGASimStore.set({ cond: { fc: 5000 } })); await page.waitForTimeout(250); assert.notEqual((await bode()).h, b2.h, "Bode follows the cutoff");
  const m = await page.evaluate(() => { const m = window.VGASimStore.model(); return { f: m.f, mag: m.H.mag }; }); assert.ok(m.mag < 0.707, "12 kHz is above a 5 kHz 2nd-order cutoff: attenuated");
  await page.click('.sim-tabs button:text("JFET channel")'); await page.evaluate(() => window.VGASimStore.reset()); await show(page, ".sim-cv.tall");
  const jf = () => canvasSum(page, ".sim-cv.tall"), j0 = await jf(); assert.ok(j0.ink > 4000);
  const openAt = async () => page.evaluate(() => window.VGASimStore.model().jfet.open);
  const o0 = await openAt(); await page.locator("#sim-vgs").fill("60"); await page.waitForTimeout(250); const o1 = await openAt(); assert.ok(o1 < o0, "channel narrows as VGS goes more negative"); assert.notEqual((await jf()).h, j0.h);
  const j1 = await jf(); await page.getByLabel("JFET model").selectOption("BF245"); await page.waitForTimeout(250); assert.notEqual((await jf()).h, j1.h, "model change redraws"); const o2 = await openAt(); assert.notEqual(o2, o1, "BF245 (VP -3.5 V) has a different channel width at the same gate voltage");
  const j2 = await jf(); await page.evaluate(() => window.VGASimStore.set({ jfet: { vp: -9 } })); await page.waitForTimeout(250); assert.notEqual((await jf()).h, j2.h, "pinch-off redraws"); assert.ok((await openAt()) > o2, "a larger |VP| keeps the channel more open");
  const j3 = await jf(); await page.evaluate(() => window.VGASimStore.set({ jfet: { idss: 0.005 } })); await page.waitForTimeout(250); assert.notEqual((await jf()).h, j3.h, "IDSS redraws (resistance shown)");
  await page.evaluate(() => window.VGASimStore.set({ gain: { mode: "manual", manual: 5.03 }, jfet: { model: "J111", idss: 0.03, vp: -6.5 } })); await page.waitForTimeout(250);
  const wide = await openAt(); await page.evaluate(() => window.VGASimStore.set({ gain: { mode: "manual", manual: 50 } })); await page.waitForTimeout(250); assert.ok((await openAt()) < wide, "high gain = more negative gate = narrower channel");
  await page.context().close();
});

test("amplifier schematic fills ~2/3 of its section, scales without distortion, and keeps all components clickable", async () => {
  for (const w of [1440, 1600, 1920]) {
    const page = await open("/design.html?tab=amp#simulator", { w, h: 1000 }); await show(page, ".sim-schem");
    const g = await page.evaluate(() => { const r = (s) => document.querySelector(s).getBoundingClientRect(), svg = document.querySelector(".sim-schem svg"), v = svg.viewBox.baseVal; return { row: r(".sim-schem-row"), sch: r(".sim-schem"), side: r(".sim-side"), svg: r(".sim-schem svg"), vb: [v.width, v.height], nHot: document.querySelectorAll(".sim-hot").length }; });
    const share = g.sch.width / g.row.width; assert.ok(share > 0.62 && share < 0.72, `${w}px: schematic share ${share.toFixed(2)}`); assert.ok(g.side.width / g.row.width > 0.28 && g.side.width / g.row.width < 0.36, `${w}px: info panel share`);
    assert.ok(g.svg.width > (w === 1440 ? 780 : 850), `${w}px: schematic is large (${Math.round(g.svg.width)}px)`);
    assert.ok(Math.abs(g.svg.width / g.svg.height - g.vb[0] / g.vb[1]) < 0.02, `${w}px: aspect ratio preserved`); assert.equal(g.nHot, 11);
    await page.locator('.sim-hot[data-comp="Q2"]').click({ force: true }); assert.match(await page.textContent(".sim-side h4"), /Q2/); assert.equal(await page.locator(".sim-hot.on").count(), 1);
    await page.context().close();
  }
});

test("Design page at 1024 / 768 / 375: stacks cleanly, no overflow, scope and plots stay usable", async () => {
  for (const w of [1024, 768, 375]) {
    const page = await open("/design.html#simulator", { w, h: 900 });
    assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, w + "px overflows horizontally");
    const c = await page.evaluate(() => [...document.querySelectorAll("#sim-gen .sim-card")].map((e) => e.getBoundingClientRect()));
    if (w <= 768) assert.ok(c[1].top >= c[0].bottom - 1, w + "px: cards stack"); else assert.ok(Math.abs(c[0].top - c[1].top) < 2, w + "px: cards side by side");
    await show(page, "#sim-scope"); assert.ok((await canvasSum(page, ".scope-cv")).ink > 3000); assert.ok((await page.locator(".scope-cv").boundingBox()).height >= 300);
    for (const tab of ["Input conditioning", "Amplifier circuit", "JFET channel"]) { await page.click(`.sim-tabs button:text("${tab}")`); await page.waitForTimeout(250); assert.ok((await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)) <= 0, `${w}px ${tab} overflows`); }
    await page.context().close();
  }
});

test("no console errors or warnings on any page that was exercised", () => { assert.deepEqual(errors, [], errors.join("\n")); });
