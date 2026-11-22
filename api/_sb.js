/* Shared Supabase REST helpers for the /api functions. Server-side only: uses the service_role key (never sent to browsers).
   Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. Not a route: files starting with "_" in /api are not served. */
const URL_ = () => String(process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
const KEY = () => String(process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
exports.configured = () => !!(URL_() && KEY());
exports.publicUrl = (path) => URL_() + "/storage/v1/object/public/media/" + path;

exports.sb = async function (path, opts) {
  opts = opts || {};
  const res = await fetch(URL_() + path, {
    method: opts.method || "GET",
    headers: Object.assign({ apikey: KEY(), Authorization: "Bearer " + KEY(), "Content-Type": "application/json" }, opts.headers || {}),
    body: opts.body == null ? undefined : JSON.stringify(opts.body)
  });
  const text = await res.text();
  let json = null; try { json = text ? JSON.parse(text) : null; } catch (e) { /* non-JSON error body */ }
  if (!res.ok) throw new Error((json && (json.message || json.error)) || ("Supabase " + res.status));
  return json;
};

/* admin routes: JSON body only (a cross-site form post cannot send this type without a CORS preflight, which we never allow) */
exports.jsonBody = function (req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "POST only" }); return null; }
  if (!/^application\/json/i.test(req.headers["content-type"] || "")) { res.status(415).json({ error: "JSON only" }); return null; }
  return req.body && typeof req.body === "object" ? req.body : (res.status(400).json({ error: "Bad JSON" }), null);
};
