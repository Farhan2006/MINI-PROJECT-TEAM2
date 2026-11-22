/* POST /api/admin/save {data} -> stores the whole site JSON (and a history copy). Gated by middleware.js (admin cookie). */
const { configured, sb, jsonBody } = require("../_sb");

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  const body = jsonBody(req, res); if (!body) return;
  if (!configured()) return res.status(503).json({ error: "Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." });
  const data = body.data, text = JSON.stringify(data || null);
  if (!data || typeof data !== "object" || Array.isArray(data)) return res.status(400).json({ error: "data must be an object" });
  if (text.length > 2e6) return res.status(413).json({ error: "Content is over 2 MB: upload photos instead of embedding them." });
  if (/"data:(image|video|application)\//.test(text)) return res.status(400).json({ error: "Unuploaded file found in the content." });
  try {
    await sb("/rest/v1/site_content?on_conflict=id", { method: "POST", headers: { Prefer: "resolution=merge-duplicates,return=minimal" }, body: { id: 1, data, updated_at: new Date().toISOString() } });
    await sb("/rest/v1/site_history", { method: "POST", headers: { Prefer: "return=minimal" }, body: { data } });
    res.status(200).json({ ok: true, at: new Date().toISOString() });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
