// Static checks on the source files: every page's <head>, local references, data integrity, config. No browser needed.
// Run: node --test tests/static.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const html = readdirSync(root).filter((f) => f.endsWith(".html")), read = (f) => readFileSync(path.join(root, f), "utf8");
const publicPages = html.filter((f) => !["admin.html", "login.html"].includes(f));
const SITE = (() => { const ctx = { window: {} }; vm.runInNewContext(read("assets/js/data.js"), ctx); return JSON.parse(JSON.stringify(ctx.window.SITE)); })();   // JSON round trip: plain objects from this realm

test("every page declares a favicon (browsers request /favicon.ico otherwise and log a 404 on every page)", () => {
  for (const f of html) assert.match(read(f), /<link rel="icon" href="[^"]+">/, f);
});

test("every page has charset, viewport, a title and lang", () => {
  for (const f of html) { const s = read(f); assert.match(s, /<meta charset="utf-8">/i, f); assert.match(s, /<meta name="viewport"[^>]*width=device-width/, f); assert.match(s, /<title>[^<]{3,}<\/title>/, f); assert.match(s, /<html lang="[a-z-]+"/, f); }
});

test("admin and login are marked noindex", () => { for (const f of ["admin.html", "login.html"]) assert.match(read(f), /<meta name="robots" content="[^"]*noindex/, f); });

test("every public page loads the same scripts in order, and the simulator scripts only where used", () => {
  for (const f of publicPages) {
    const src = [...read(f).matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]), sim = /design|index/.test(f);
    assert.deepEqual(src.filter((x) => !/sim/.test(x)), ["assets/js/data.js", "assets/js/site.js", "assets/js/motion.js"], f);
    assert.equal(src.includes("assets/js/simui.js"), sim, f + " simui.js");
    if (sim) assert.ok(src.indexOf("assets/js/sim.js") < src.indexOf("assets/js/simui.js"), f + ": engine before UI");
  }
});

test("every local file referenced from a page exists", () => {
  for (const f of html) for (const m of read(f).matchAll(/(?:href|src)="((?!https?:|data:|mailto:|#)[^"]+)"/g)) { const p = m[1].split(/[?#]/)[0]; if (p) assert.ok(existsSync(path.join(root, p)), `${f} -> ${p}`); }
});

test("data.js: page list points at real files, chain tabs are valid, local media exists", () => {
  for (const p of SITE.pages || []) assert.ok(existsSync(path.join(root, p.file)), "page " + p.file);
  const ids = SITE.chain.map((c) => c.id); assert.deepEqual([...ids], ["in", "cond", "amp", "out", "fpga", "dac", "inv", "jfet"]);
  for (const c of SITE.chain) { assert.ok(["gen", "cond", "amp", "jfet", "analysis", "scope"].includes(c.tab), c.id + " tab"); assert.ok(c.info.length > 20 && c.in && c.out && c.sub, c.id + " content"); }
  const strs = []; (function walk(o) { if (typeof o === "string") strs.push(o); else if (o && typeof o === "object") Object.values(o).forEach(walk); })(SITE);
  for (const s of strs) if (/^(assets|images|media)\/\S+\.(png|jpe?g|svg|webp|gif|mp4|pdf)$/i.test(s)) assert.ok(existsSync(path.join(root, s)), "media " + s);
});

test("vercel.json is valid, enables clean URLs and no-store on the admin routes", () => {
  const v = JSON.parse(read("vercel.json")); assert.equal(v.cleanUrls, true);
  const admin = v.headers.find((h) => /admin/.test(h.source)); assert.ok(admin.headers.some((h) => h.key === "Cache-Control" && /no-store/.test(h.value)));
  assert.ok(v.headers.some((h) => h.source === "/assets/(.*)"));
});

test("no debugging leftovers in shipped scripts", () => {
  for (const f of readdirSync(path.join(root, "assets/js")).concat(["../../middleware.js"])) { const s = read(path.join("assets/js", f)); assert.doesNotMatch(s, /\bdebugger\b|console\.(log|debug)\(/, f); }
});

test("no secrets or password literals in the repo's shipped files", () => {
  for (const f of ["middleware.js", "assets/js/admin.js", "assets/js/simui.js", "assets/js/sim.js", "login.html", "admin.html"]) assert.doesNotMatch(read(f), /(ghp_|github_pat_[A-Za-z0-9]{20}|password\s*[:=]\s*["'][^"']{4,}["'])/i, f);
});
