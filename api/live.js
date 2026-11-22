/* GET /api/live -> JavaScript that replaces window.SITE with the content stored in Supabase.
   Loaded right after assets/js/data.js, which stays as the fallback: if Supabase is unset, empty or down, this sends an
   empty script and the site shows data.js. Cached 5 s at the edge so a burst of visitors makes one database call. */
const { configured, sb } = require("./_sb");

module.exports = async function (req, res) {
  res.setHeader("Content-Type", "text/javascript; charset=utf-8");
  let js = "/* no live data: using data.js */";
  if (configured()) {
    try {
      const rows = await sb("/rest/v1/site_content?id=eq.1&select=data");
      if (rows && rows[0] && rows[0].data && typeof rows[0].data === "object")
        js = "window.SITE = Object.assign({}, window.SITE, " + JSON.stringify(rows[0].data).replace(/[\u2028\u2029]/g, " ") + ");";
    } catch (e) { /* fall back to data.js */ }
  }
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=5, stale-while-revalidate=60");
  res.status(200).send(js);
};
