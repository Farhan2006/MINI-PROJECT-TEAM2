/* POST /api/admin/history {} -> last 30 saves; {id} -> that version's data. Gated by middleware.js (admin cookie). */
const { configured, sb, jsonBody } = require("../_sb");

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  const b = jsonBody(req, res); if (!b) return;
  if (!configured()) return res.status(503).json({ error: "Supabase is not configured." });
  try {
    if (b.id != null) {
      if (!/^\d{1,12}$/.test(String(b.id))) return res.status(400).json({ error: "Bad id" });
      const rows = await sb("/rest/v1/site_history?id=eq." + b.id + "&select=data");
      return rows && rows[0] ? res.status(200).json({ data: rows[0].data }) : res.status(404).json({ error: "Version not found" });
    }
    res.status(200).json({ versions: await sb("/rest/v1/site_history?select=id,created_at&order=id.desc&limit=30") });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
