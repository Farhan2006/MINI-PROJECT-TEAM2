// Admin login: form login + signed session cookie, enforced by middleware.js.
// Run: node --test tests/auth.test.mjs   (no browser needed)
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { webcrypto } from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = webcrypto; // Node 18 has no global crypto; Vercel's edge runtime does

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// middleware.js is ESM but the project has no package.json "type", so load it through a data: URL.
const src = readFileSync(path.join(root, "middleware.js"), "utf8");
const mw = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

const PASS = "correct horse battery staple";
beforeEach(() => { process.env.ADMIN_PASSWORD = PASS; });

const get = (url, headers = {}) => new Request(url, { headers });
const post = (url, fields, headers = {}) => new Request(url, { method: "POST", headers, body: new URLSearchParams(fields) });
const passes = (res) => res && res.headers.get("x-middleware-next") === "1";
const cookieOf = (res) => (res.headers.get("set-cookie") || "").split(";")[0];

async function login(url = "http://localhost/login") {
  const res = await mw.default(post(url, { password: PASS }));
  return { res, cookie: cookieOf(res) };
}

test("matcher covers the editor, its assets, and the login endpoints", () => {
  for (const p of ["/admin", "/admin.html", "/assets/js/admin.js", "/assets/css/admin.css", "/login", "/logout"]) assert.ok(mw.config.matcher.includes(p), p);
});

test("fails closed with 503 when ADMIN_PASSWORD is unset", async () => {
  delete process.env.ADMIN_PASSWORD;
  assert.equal((await mw.default(get("http://localhost/admin"))).status, 503);
  assert.equal((await mw.default(post("http://localhost/login", { password: "x" }))).status, 503);
});

test("an unauthenticated visit to /admin is redirected to /login", async () => {
  for (const p of ["/admin", "/admin.html"]) {
    const res = await mw.default(get("http://localhost" + p));
    assert.equal(res.status, 302, p);
    assert.equal(new URL(res.headers.get("location"), "http://localhost").pathname, "/login");
  }
});

test("unauthenticated requests for admin.js / admin.css get 401, not a redirect", async () => {
  for (const p of ["/assets/js/admin.js", "/assets/css/admin.css"]) assert.equal((await mw.default(get("http://localhost" + p))).status, 401, p);
});

test("HTTP Basic auth no longer unlocks the admin", async () => {
  const basic = "Basic " + btoa("anyone:" + PASS);
  assert.equal(passes(await mw.default(get("http://localhost/admin", { authorization: basic }))), false);
});

test("wrong password goes back to /login?e=1 and sets no cookie", async () => {
  const res = await mw.default(post("http://localhost/login", { password: "nope" }));
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/login?e=1");
  assert.equal(res.headers.get("set-cookie"), null);
});

test("empty or missing password is rejected", async () => {
  assert.equal((await mw.default(post("http://localhost/login", { password: "" }))).headers.get("location"), "/login?e=1");
  assert.equal((await mw.default(post("http://localhost/login", {}))).headers.get("location"), "/login?e=1");
});

test("right password redirects to /admin with an HttpOnly SameSite=Strict cookie that never contains the password", async () => {
  const { res } = await login();
  assert.equal(res.status, 303);
  assert.equal(res.headers.get("location"), "/admin");
  const sc = res.headers.get("set-cookie");
  assert.match(sc, /HttpOnly/i); assert.match(sc, /SameSite=Strict/i); assert.match(sc, /Path=\//); assert.match(sc, /Max-Age=\d+/);
  assert.ok(!sc.includes(PASS) && !sc.includes(encodeURIComponent(PASS)));
  assert.doesNotMatch(sc, /Secure/i, "plain http (localhost) cannot carry a Secure cookie");
});

test("the cookie is Secure over https", async () => {
  const { res } = await login("https://example.vercel.app/login");
  assert.match(res.headers.get("set-cookie"), /Secure/i);
});

test("a valid session cookie lets /admin and its assets through", async () => {
  const { cookie } = await login();
  for (const p of ["/admin", "/admin.html", "/assets/js/admin.js", "/assets/css/admin.css"]) assert.ok(passes(await mw.default(get("http://localhost" + p, { cookie })), p));
});

test("a tampered cookie is rejected", async () => {
  const { cookie } = await login();
  const [name, val] = cookie.split("=");
  const [exp, sig] = val.split(".");
  const forged = [`${name}=${Number(exp) + 999999999}.${sig}`, `${name}=${exp}.${sig.slice(0, -2)}aa`, `${name}=${exp}`, `${name}=garbage`];
  for (const c of forged) assert.equal(passes(await mw.default(get("http://localhost/admin", { cookie: c }))), false, c);
});

test("an expired cookie is rejected", async () => {
  const { cookie } = await login();
  const real = Date.now;
  Date.now = () => real() + 9 * 3600 * 1000; // session lasts 8h
  try { assert.equal(passes(await mw.default(get("http://localhost/admin", { cookie }))), false); } finally { Date.now = real; }
});

test("changing ADMIN_PASSWORD invalidates existing sessions", async () => {
  const { cookie } = await login();
  process.env.ADMIN_PASSWORD = "a different password";
  assert.equal(passes(await mw.default(get("http://localhost/admin", { cookie }))), false);
});

test("a ?next= parameter is ignored, so login can never redirect off-site", async () => {
  const res = await mw.default(post("http://localhost/login?next=https://evil.example", { password: PASS, next: "https://evil.example" }));
  assert.equal(res.headers.get("location"), "/admin");
});

test("the login page itself stays reachable when logged out", async () => {
  assert.ok(passes(await mw.default(get("http://localhost/login"))));
});

test("/logout clears the cookie and returns to /login", async () => {
  const res = await mw.default(get("http://localhost/logout"));
  assert.equal(res.headers.get("location"), "/login");
  assert.match(res.headers.get("set-cookie"), /Max-Age=0/);
});

test("responses carrying auth state are never cached", async () => {
  assert.match((await mw.default(get("http://localhost/admin"))).headers.get("cache-control"), /no-store/);
  assert.match((await login()).res.headers.get("cache-control"), /no-store/);
});
