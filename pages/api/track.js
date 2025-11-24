// pages/api/track.js
import { redis } from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event = "view", path = "/", meta } = req.body || {};
  const country = req.headers["x-vercel-ip-country"] || "UNKNOWN";

  // If Redis is not configured (e.g. local dev / some preview env), just no-op.
  if (!redis) {
    console.warn("[track] Redis not configured, skipping track for", path);
    return res
      .status(200)
      .json({ ok: false, reason: "redis_not_configured" });
  }

  try {
    // Example keys:
    // stats:total:view
    // stats:path:/chapters/xxx
    // stats:country:IN
    const ops = [
      redis.incr(`stats:total:${event}`),
      redis.incr(`stats:path:${path}`),
      redis.incr(`stats:country:${country}`),
    ];

    if (meta && meta.chapterSlug) {
      ops.push(redis.incr(`stats:chapter:${meta.chapterSlug}:${event}`));
    }

    await Promise.all(ops);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("track error", e);
    return res.status(500).json({ error: "tracking failed" });
  }
}
