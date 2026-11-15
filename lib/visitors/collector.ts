import type { VisitorConfig } from "./config";
import { isVisitorRoute } from "./routes";
import type { VisitorStore } from "./store";
import type { VisitorSite, VisitorRoute } from "./routes";
import { frontendSiteConfig } from "./sites";

export const MAX_EVENT_BYTES = 256;
const BODY_TIMEOUT_MS = 1000;
const fields = ["v", "type", "site", "route"];

export function isPageview(value: unknown): value is { v: 1; type: "pageview"; site: VisitorSite; route: VisitorRoute } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return Object.keys(event).length === fields.length && fields.every((key) => Object.hasOwn(event, key)) &&
    event.v === 1 && event.type === "pageview" && ((event.site === "lumix-analytics" && isVisitorRoute(event.route)) || (event.site === "lumix-front" && event.route === "/spot"));
}

class InvalidBody extends Error {
  constructor(readonly status: number) { super("Invalid visitor event"); }
}

async function readEvent(request: Request): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) throw new InvalidBody(400);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.byteLength;
          if (bytes > MAX_EVENT_BYTES) throw new InvalidBody(413);
          chunks.push(value);
        }
        const body = new Uint8Array(bytes);
        let offset = 0;
        for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
        try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)); }
        catch { throw new InvalidBody(400); }
      })(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new InvalidBody(408)), BODY_TIMEOUT_MS);
      }),
    ]);
  } finally {
    clearTimeout(timeout);
    // Do not await cancellation: an uncooperative producer must not hold the route open.
    void reader.cancel().catch(() => {});
  }
}

function reply(status: number) {
  return new Response(null, { status, headers: {
    "Cache-Control": "no-store", "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff", ...(status === 429 ? { "Retry-After": "60" } : {}),
  } });
}

export function createCollector(deps: {
  config: () => VisitorConfig | null;
  store: (config: VisitorConfig, site?: VisitorSite) => Promise<VisitorStore>;
  now?: () => Date;
}) {
  // Abuse counters are global only: no IP/UA keys or per-visitor rate maps.
  let window = -1, attempts = 0, pending = 0;
  return async (request: Request): Promise<Response> => {
    const config = deps.config();
    if (!config) return reply(204);
    const now = deps.now?.() ?? new Date();
    const minute = Math.floor(now.getTime() / 60_000);
    if (minute !== window) { window = minute; attempts = 0; }
    if (++attempts > config.maxPerMinute * 2 || pending >= 8) return reply(429);
    if (request.method !== "POST") return reply(405);
    const url = new URL(request.url);
    // No URL parameters, CORS, or reliance on forwarded/Host headers.
    const origin = request.headers.get("origin");
    const frontConfig = frontendSiteConfig(config);
    const frontOrigin = frontConfig?.origin;
    const front = !!frontConfig && origin === frontOrigin;
    if (url.search || (origin !== config.origin && !front) ||
        !(front ? [null, "same-site", "cross-site"].includes(request.headers.get("sec-fetch-site")) : [null, "same-origin"].includes(request.headers.get("sec-fetch-site")))) return reply(403);
    if (request.headers.get("dnt") === "1" || request.headers.get("sec-gpc") === "1") return reply(204);
    if (!/^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") ?? "") ||
        request.headers.has("content-encoding")) return reply(415);
    const length = request.headers.get("content-length");
    if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_EVENT_BYTES)) return reply(413);
    pending++;
    try {
      const event = await readEvent(request);
      if (!isPageview(event)) return reply(400);
      if ((front && event.site !== "lumix-front") || (!front && event.site !== "lumix-analytics")) return reply(403);
      const store = await deps.store(config, event.site);
      if (!await store.takeBudget(now, config.maxPerMinute)) return reply(429);
      await store.increment(event.route, now, config.retentionDays);
      if ((front ? frontConfig!.estimator.enabled : config.estimator.enabled) && store.estimate) {
        // This header is accepted only under a separately reviewed estimator and
        // an ingress that OVERWRITES it. Never fall back to X-Forwarded-For or UA.
        // Native dev is loopback-bound and has no ingress. All local test requests
        // deliberately share one estimate; never trust a caller-supplied IP there.
        const nativeLocal = process.env.NODE_ENV === "development" && config.localTest;
        await store.estimate(nativeLocal ? "127.0.0.1" : request.headers.get("x-lumix-client-ip"), now, origin!);
      }
      const response = reply(204);
      if (front) { response.headers.set("Access-Control-Allow-Origin", frontOrigin!); response.headers.set("Vary", "Origin"); }
      return response;
    } catch (error) {
      // Never log bodies, request URLs/headers, database URIs, or driver errors.
      return reply(error instanceof InvalidBody ? error.status : 503);
    } finally { pending--; }
  };
}
