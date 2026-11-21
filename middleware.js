/* Vercel Routing Middleware: password login in front of the admin editor.
   The password lives in the ADMIN_PASSWORD environment variable (never in the repo).
   POST /login checks it and sets a signed, HttpOnly session cookie (8h); /admin and its assets need that cookie.
   The cookie is an HMAC keyed by the password, so changing ADMIN_PASSWORD logs everyone out.
   Fails closed: if the variable is missing, the admin is unavailable. The same file runs locally via dev-server.mjs.
   shortcut: no per-IP attempt limit (the edge keeps no state); each wrong guess costs 300ms. Add a Vercel Firewall rate-limit rule on POST /login if the site is public. */
export const config = {
  matcher: ["/admin", "/admin.html", "/assets/js/admin.js", "/assets/css/admin.css", "/login", "/logout"]
};

var COOKIE = "vdt_admin", TTL_SECONDS = 8 * 3600, enc = new TextEncoder();

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(key, msg) {
  var k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  var bytes = new Uint8Array(await crypto.subtle.sign("HMAC", k, enc.encode(msg))), hex = "";
  for (var i = 0; i < bytes.length; i++) hex += (bytes[i] < 16 ? "0" : "") + bytes[i].toString(16);
  return hex;
}

/* comparing HMACs of both strings keeps the check constant-time and length-blind */
async function passwordOk(given, pass) {
  return safeEqual(await hmac(pass, "pw:" + given), await hmac(pass, "pw:" + pass));
}

async function sessionValid(request, pass) {
  var m = (request.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]*)"));
  if (!m) return false;
  var parts = m[1].split("."), exp = Number(parts[0]);
  if (!parts[1] || !(exp > Date.now())) return false;
  return safeEqual(parts[1], await hmac(pass, "session:" + parts[0]));
}

function cookie(value, maxAge, secure) {
  return COOKIE + "=" + value + "; Path=/; Max-Age=" + maxAge + "; HttpOnly; SameSite=Strict" + (secure ? "; Secure" : "");
}

function redirect(to, status, setCookie) {
  var h = { Location: to, "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
  if (setCookie) h["Set-Cookie"] = setCookie;
  return new Response(null, { status: status, headers: h });
}

export default async function middleware(request) {
  var pass = String((typeof process !== "undefined" && process.env && process.env.ADMIN_PASSWORD) || "").trim();
  if (!pass) return new Response("Admin is not configured.", { status: 503, headers: { "Cache-Control": "no-store" } });

  var url = new URL(request.url), path = url.pathname, secure = url.protocol === "https:";
  var next = function () { return new Response(null, { headers: { "x-middleware-next": "1" } }); };

  if (path === "/logout") return redirect("/login", 302, cookie("", 0, secure));

  if (path === "/login") {
    if (request.method !== "POST") return next();
    var given = "";
    try { given = String((await request.formData()).get("password") || "").slice(0, 256); } catch (e) { /* not a form post: treated as empty */ }
    if (given && await passwordOk(given, pass)) {
      var exp = String(Date.now() + TTL_SECONDS * 1000);
      return redirect("/admin", 303, cookie(exp + "." + await hmac(pass, "session:" + exp), TTL_SECONDS, secure));
    }
    await new Promise(function (r) { setTimeout(r, 300); });
    return redirect("/login?e=1", 303);
  }

  if (await sessionValid(request, pass)) return next();
  if (path.indexOf("/admin") === 0) return redirect("/login", 302);
  return new Response("Authentication required.", { status: 401, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}
