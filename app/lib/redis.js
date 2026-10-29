import { Redis } from "@upstash/redis";

// This reads the KV_REST_API_URL you just connected automatically
export const redis = Redis.fromEnv();

export const key = (...parts) => ["rp", ...parts].join(":");