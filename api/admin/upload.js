/* POST /api/admin/upload {name, type} -> {uploadUrl, publicUrl}. The browser then PUTs the file straight to Supabase Storage
   (keeps big videos off the serverless function). Gated by middleware.js (admin cookie). */
const { configured, sb, jsonBody, publicUrl } = require("../_sb");
const OK = /^(image\/(jpeg|png|webp|gif|svg\+xml)|video\/(mp4|webm|quicktime)|application\/pdf)$/;

module.exports = async function (req, res) {
  res.setHeader("Cache-Control", "no-store");
  const b = jsonBody(req, res); if (!b) return;
  if (!configured()) return res.status(503).json({ error: "Supabase is not configured." });
  if (!OK.test(String(b.type || ""))) return res.status(400).json({ error: "Only images, mp4/webm/mov video and PDF files are allowed." });
  const clean = String(b.name || "file").toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[-.]+|[-.]+$/g, "").slice(-60) || "file";
  const path = new Date().toISOString().slice(0, 10) + "/" + Date.now().toString(36) + "-" + clean;
  try {
    const j = await sb("/storage/v1/object/upload/sign/media/" + path, { method: "POST", body: {} });
    res.status(200).json({ uploadUrl: process.env.SUPABASE_URL.trim().replace(/\/+$/, "") + "/storage/v1" + j.url, publicUrl: publicUrl(path) });
  } catch (e) { res.status(502).json({ error: String(e.message || e) }); }
};
