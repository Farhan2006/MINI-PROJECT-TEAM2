/* Local dev server: serves the site like Vercel does (clean URLs, middleware.js in front of /admin and /login).
   Run: node dev-server.mjs            (Node 18+, no dependencies)
        ADMIN_PASSWORD=secret PORT=3000 node dev-server.mjs
   Without ADMIN_PASSWORD the local password is "admin". Listens on 127.0.0.1 only. */
import http from "node:http";
import { readFileSync, statSync, createReadStream } from "node:fs";
import { webcrypto } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

if (!globalThis.crypto) globalThis.crypto = webcrypto; // Node 18 has no global crypto; Vercel's edge runtime does
const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
if (!String(process.env.ADMIN_PASSWORD || "").trim()) { process.env.ADMIN_PASSWORD = "admin"; console.log('ADMIN_PASSWORD is not set: the local admin password is "admin"'); }

// middleware.js is ESM but the project has no package.json "type", so load the real file through a data: URL.
const mw = await import("data:text/javascript;base64," + Buffer.from(readFileSync(path.join(root, "middleware.js"))).toString("base64"));

const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon", ".pdf": "application/pdf", ".mp4": "video/mp4", ".woff2": "font/woff2" };

function readBody(req, limit = 16 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let n = 0;
    req.on("data", (c) => { n += c.length; if (n > limit) { reject(new Error("body too large")); req.destroy(); } else chunks.push(c); });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function send(res, status, headers, body) { res.writeHead(status, { "Cache-Control": "no-store", ...headers }); res.end(body); }

function resolveFile(pathname) {
  let p; try { p = decodeURIComponent(pathname); } catch { return null; }
  if (p.endsWith("/")) p += "index.html";
  const file = path.join(root, p);
  if (!file.startsWith(root + path.sep) || p.split("/").some((s) => s.startsWith(".") || s === "node_modules")) return null;
  for (const f of [file, file + ".html"]) { try { if (statSync(f).isFile()) return f; } catch { /* try next */ } }
  return null;
}

http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, "http://" + req.headers.host);
    if ((mw.config.matcher.includes(url.pathname) || url.pathname.startsWith("/api/admin/"))) {
      const hasBody = req.method !== "GET" && req.method !== "HEAD";
      const r = await mw.default(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? await readBody(req) : undefined }));
      if (r.headers.get("x-middleware-next") !== "1") return send(res, r.status, Object.fromEntries(r.headers), Buffer.from(await r.arrayBuffer()));
    }
    if (url.pathname === "/api/live") return send(res, 200, { "Content-Type": "text/javascript; charset=utf-8" }, "/* local dev: no Supabase, using data.js */");
    if (url.pathname.startsWith("/api/admin/")) return send(res, 503, { "Content-Type": "application/json" }, '{"error":"Saving needs Supabase, which only runs on Vercel. Use the live site admin."}');
    if (req.method !== "GET" && req.method !== "HEAD") return send(res, 405, { Allow: "GET, HEAD" }, "Method not allowed");
    const file = resolveFile(url.pathname);
    if (!file) return send(res, 404, { "Content-Type": "text/plain; charset=utf-8" }, "Not found: " + url.pathname);
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  } catch (e) {
    send(res, 500, { "Content-Type": "text/plain; charset=utf-8" }, "Server error: " + e.message);
  }
}).listen(PORT, "127.0.0.1", () => console.log("Site: http://localhost:" + PORT + "/   Admin: http://localhost:" + PORT + "/admin"));
