/* /api functions against a stubbed Supabase (global fetch). Run: node --test tests/api.test.mjs */
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
process.env.SUPABASE_URL = "https://x.supabase.co"; process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
const live = require("../api/live.js"), save = require("../api/admin/save.js"), upload = require("../api/admin/upload.js");

const mkRes = () => { const r = { h: {}, code: 0, body: null, setHeader(k, v) { r.h[k] = v; }, status(c) { r.code = c; return r; }, json(b) { r.body = b; return r; }, send(b) { r.body = b; return r; } }; return r; };
const post = (body, type = "application/json") => ({ method: "POST", headers: { "content-type": type }, body });
const stub = (fn) => { globalThis.fetch = async (u, o) => { const r = await fn(String(u), o || {}); return { ok: r.ok !== false, status: r.status || 200, text: async () => JSON.stringify(r.json ?? null) }; }; };

test("live: serves stored data as a window.SITE override, falls back to nothing on error", async () => {
  stub(() => ({ json: [{ data: { title: "T" } }] }));
  let res = mkRes(); await live({}, res);
  assert.match(res.body, /^window\.SITE = Object\.assign\(\{\}, window\.SITE, \{"title":"T"\}\);$/);
  stub(() => ({ ok: false, status: 500, json: { message: "boom" } }));
  res = mkRes(); await live({}, res);
  assert.match(res.body, /^\/\*/); assert.equal(res.code, 200);
});

test("save: stores data + history; rejects non-JSON, unuploaded files, non-objects", async () => {
  const calls = []; stub((u, o) => { calls.push(u.replace("https://x.supabase.co", "")); return { json: null }; });
  let res = mkRes(); await save(post({ data: { a: 1 } }), res);
  assert.equal(res.code, 200); assert.deepEqual(calls, ["/rest/v1/site_content?on_conflict=id", "/rest/v1/site_history"]);
  res = mkRes(); await save(post({ data: { a: 1 } }, "text/plain"), res); assert.equal(res.code, 415);
  res = mkRes(); await save(post({ data: { img: "data:image/jpeg;base64,AAA" } }), res); assert.equal(res.code, 400);
  res = mkRes(); await save(post({ data: [1] }), res); assert.equal(res.code, 400);
  res = mkRes(); await save({ method: "GET", headers: {} }, res); assert.equal(res.code, 405);
});

test("upload: signed URL for allowed types only, safe file names", async () => {
  stub((u) => ({ json: { url: "/object/upload/sign/media/p?token=t" } }));
  let res = mkRes(); await upload(post({ name: "../My Datasheet (1).PDF", type: "application/pdf" }), res);
  assert.equal(res.code, 200);
  assert.match(res.body.uploadUrl, /^https:\/\/x\.supabase\.co\/storage\/v1\/object\/upload\/sign\/media\/p\?token=t$/);
  assert.match(res.body.publicUrl, /\/storage\/v1\/object\/public\/media\/\d{4}-\d\d-\d\d\/[a-z0-9]+-my-datasheet-1-.*pdf$/);
  assert.ok(!res.body.publicUrl.includes(".."));
  res = mkRes(); await upload(post({ name: "x.exe", type: "application/x-msdownload" }), res); assert.equal(res.code, 400);
});
