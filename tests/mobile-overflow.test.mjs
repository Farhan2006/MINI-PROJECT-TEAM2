// Every public page must fit a phone: no horizontal page scroll at 375px.
// Run: PLAYWRIGHT_DIR=<dir containing node_modules/playwright> node --test tests/
// shortcut: Playwright is not a project dependency, so it is located via PLAYWRIGHT_DIR; add it to package.json if tests move into CI.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { chromium } = createRequire(path.join(process.env.PLAYWRIGHT_DIR || root, "x.js"))("playwright");
const pages = readdirSync(root).filter((f) => f.endsWith(".html") && f !== "admin.html"); // admin is an editor, not a public page

for (const file of pages) {
  test(`${file} has no horizontal overflow at 375px`, async () => {
    const browser = await chromium.launch();
    try {
      const page = await (await browser.newContext({ viewport: { width: 375, height: 700 } })).newPage();
      await page.goto("file://" + path.join(root, file));
      // portfolio pages render into main#content; login.html is a plain static form without one
      await page.waitForFunction(() => { const m = document.querySelector("main#content"); return !m || m.children.length > 0; });
      await page.waitForTimeout(800);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      assert.ok(over <= 0, `page is ${over}px wider than the viewport`);
    } finally {
      await browser.close();
    }
  });
}
