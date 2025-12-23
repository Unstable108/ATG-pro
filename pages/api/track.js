// pages/api/track.js
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event = "view", path = "/", meta } = req.body || {};
  const country = req.headers["x-vercel-ip-country"] || "UNKNOWN";

  // No-op tracking (Redis removed)
  // console.log("[track] Tracking disabled for", path);
  return res.status(200).json({ ok: true });
}