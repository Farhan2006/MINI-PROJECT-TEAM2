/* Vercel Routing Middleware: HTTP Basic auth in front of the admin editor.
   The password lives in the ADMIN_PASSWORD environment variable (never in the repo).
   Fails closed: if the variable is missing, the admin is unavailable. Any username works. */
export const config = {
  matcher: ["/admin", "/admin.html", "/assets/js/admin.js", "/assets/css/admin.css"]
};

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var r = 0;
  for (var i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export default function middleware(request) {
  var pass = String((typeof process !== "undefined" && process.env && process.env.ADMIN_PASSWORD) || "").trim();
  if (!pass) return new Response("Admin is not configured.", { status: 503, headers: { "Cache-Control": "no-store" } });

  var auth = request.headers.get("authorization") || "";
  if (auth.slice(0, 6) === "Basic ") {
    try {
      var decoded = atob(auth.slice(6)), given = decoded.slice(decoded.indexOf(":") + 1);
      if (safeEqual(given, pass)) return new Response(null, { headers: { "x-middleware-next": "1" } });
    } catch (e) { /* fall through to 401 */ }
  }
  return new Response("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Portfolio admin", charset="UTF-8"', "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" }
  });
}
