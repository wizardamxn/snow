import { Redis } from "@upstash/redis";

let client: Redis | null = null;
let attempted = false;

/** Returns null (no throw) when Upstash env vars aren't configured — stats simply stay unavailable. */
export function getRedis(): Redis | null {
  if (attempted) return client;
  attempted = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  client = new Redis({ url, token });
  return client;
}
