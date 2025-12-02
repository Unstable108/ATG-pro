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
    return res.status(200).json({ ok: false, reason: "redis_not_configured" });
  }

  try {
    // simple UTC date string YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Build the keys we want to increment
    const totalKey = `stats:total:${event}`;
    const pathKey = `stats:path:${path}`;
    const countryKey = `stats:country:${country}`;
    const dailyKey = `stats:daily:${today}`; // new: total daily views (all events)

    const ops = [
      redis.incr(totalKey),
      redis.incr(pathKey),
      redis.incr(countryKey),
      redis.incr(dailyKey),
    ];

    // chapter-specific
    if (meta && meta.chapterSlug) {
      const chapKey = `stats:chapter:${meta.chapterSlug}:${event}`;
      ops.push(redis.incr(chapKey));
    }

    // also ensure we keep a canonical set of known stats keys (no stats: prefix)
    // e.g. "total:view", "path:/...", "country:IN", "daily:2025-01-18", "chapter:slug:view"
    const knownKeyMembers = [
      redis.sadd("stats:known_keys", `total:${event}`),
      redis.sadd("stats:known_keys", `path:${path}`),
      redis.sadd("stats:known_keys", `country:${country}`),
      redis.sadd("stats:known_keys", `daily:${today}`),
    ];

    if (meta && meta.chapterSlug) {
      knownKeyMembers.push(
        redis.sadd("stats:known_keys", `chapter:${meta.chapterSlug}:${event}`)
      );
    }

    await Promise.all([...ops, ...knownKeyMembers]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("[track] track error", e);
    return res.status(500).json({ error: "tracking failed" });
  }
}
