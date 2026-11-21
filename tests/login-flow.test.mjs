// End-to-end: real browser against dev-server.mjs. /admin -> login form -> editor -> logout.
// Run: PLAYWRIGHT_DIR=<dir containing node_modules/playwright> node --test tests/login-flow.test.mjs
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_DIR || root, "x.js"))("playwright");
const PORT = 3917, BASE = `http://localhost:${PORT}`, PASS = "e2e-test-password";
let server, browser, page;

before(async () => {
  server = spawn(process.execPath, ["dev-server.mjs"], { cwd: root, env: { ...process.env, PORT: String(PORT), ADMIN_PASSWORD: PASS } });
  await new Promise((ok, fail) => { server.stdout.on("data", (d) => /Site:/.test(d) && ok()); server.on("error", fail); setTimeout(() => fail(new Error("server did not start")), 8000); });
  browser = await chromium.launch();
  page = await (await browser.newContext()).newPage();
});
after(async () => { await browser?.close(); server?.kill(); });

test("visiting /admin logged out lands on the login form", async () => {
  await page.goto(BASE + "/admin");
  assert.equal(new URL(page.url()).pathname, "/login");
  assert.ok(await page.locator('input[type="password"]').isVisible());
});

test("a wrong password shows an error and stays on /login", async () => {
  await page.fill("#pw", "wrong");
  await page.click('button[type="submit"]');
  await page.waitForSelector("#err:not([hidden])");
  assert.match(await page.textContent("#err"), /not correct/i);
  assert.equal(new URL(page.url()).pathname, "/login");
  assert.equal(new URL(page.url()).search, "", "?e=1 is cleaned from the address bar");
});

test("the right password opens the admin editor, and a reload stays signed in", async () => {
  await page.fill("#pw", PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
  await page.waitForFunction(() => document.querySelectorAll("#app *").length > 20); // editor rendered (first #app child is a hidden <noscript>)
  assert.match(await page.title(), /^Admin/);
  await page.reload();
  assert.equal(new URL(page.url()).pathname, "/admin");
});

test("the session cookie is HttpOnly, so page scripts cannot read it", async () => {
  assert.equal(await page.evaluate(() => document.cookie), "");
  const c = (await page.context().cookies()).find((x) => x.name === "vdt_admin");
  assert.ok(c && c.httpOnly && c.sameSite === "Strict");
});

test("/logout ends the session and /admin asks for the password again", async () => {
  await page.goto(BASE + "/logout");
  assert.equal(new URL(page.url()).pathname, "/login");
  await page.goto(BASE + "/admin");
  assert.equal(new URL(page.url()).pathname, "/login");
});
