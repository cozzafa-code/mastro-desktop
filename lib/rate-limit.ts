// lib/rate-limit.ts
interface RateLimitEntry { count: number; resetAt: number; }
const store = new Map<string, RateLimitEntry>();
if (typeof setInterval !== "undefined") {
  setInterval(() => { const now = Date.now(); for (const [k,e] of store.entries()) { if (e.resetAt < now) store.delete(k); } }, 60000);
}
export interface RateLimitConfig { limit: number; window: number; }
export interface RateLimitResult { success: boolean; limit: number; remaining: number; resetAt: number; }
export function rateLimit(identifier: string, config: RateLimitConfig = { limit: 20, window: 60000 }): RateLimitResult {
  const now = Date.now(); const entry = store.get(identifier);
  if (!entry || entry.resetAt < now) {
    store.set(identifier, { count: 1, resetAt: now + config.window });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt: now + config.window };
  }
  if (entry.count >= config.limit) return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
  entry.count++;
  return { success: true, limit: config.limit, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}
export const RATE_LIMITS = {
  auth:  { limit: 5,  window: 60000 },
  pin:   { limit: 5,  window: 60000 },
  api:   { limit: 60, window: 60000 },
  email: { limit: 3,  window: 60000 },
  pdf:   { limit: 10, window: 60000 },
} as const;
export function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(JSON.stringify({ error: "Troppe richieste. Riprova tra poco." }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)) },
  });
}
