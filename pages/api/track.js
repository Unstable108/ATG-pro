export default function handler(req, res) {
  const isEnabled = process.env.NEXT_PUBLIC_ENABLE_TRACKING === "true";

  if (!isEnabled) {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Tracking is currently a safe no-op backend. This route exists to avoid
  // unnecessary 404s or edge noise when clients send event requests.
  return res.status(200).json({ success: true });
}
