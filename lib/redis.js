// lib/redis.js
import { Redis } from "@upstash/redis";

let redis = null;

try {
  // Reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env.
  redis = Redis.fromEnv();
} catch (e) {
  console.warn(
    "Redis not configured, tracking disabled",
    e && (e.message || e)
  );
}

export { redis };
