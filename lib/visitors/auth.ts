import { createHash, scrypt, timingSafeEqual } from "node:crypto";
import { isLoopbackOrigin } from "./config";
import { serverSecret, type Environment } from "./secrets";

export const ADMIN_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0", Vary: "Authorization",
  "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer",
};
export type AdminAuth = "authorized" | "unauthorized" | "unconfigured" | "limited";

export function adminConfig(env: Environment = process.env) {
  const username = env.VISITOR_ADMIN_USERNAME ?? "";
  const hash = serverSecret("VISITOR_ADMIN_PASSWORD_HASH", env);
  const origin = env.VISITOR_ANALYTICS_ORIGIN ?? "";
  try {
    const url = new URL(origin);
    const local = env.VISITOR_ANALYTICS_DATASET === "test" && env.VISITOR_ANALYTICS_MODE === "local-test" && isLoopbackOrigin(origin);
    if (url.origin !== origin || (url.protocol !== "https:" && !(local && url.protocol === "http:"))) return null;
  } catch { return null; }
  if (!/^[a-zA-Z0-9_.@-]{1,64}$/.test(username) || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{64}$/.test(hash)) return null;
  return { username, hash };
}

let minute = -1, attempts = 0, active = 0;
export async function authenticateAdmin(authorization: string | null, env: Environment = process.env): Promise<AdminAuth> {
  const config = adminConfig(env);
  if (!config) return "unconfigured";
  if (!authorization || authorization.length > 512 || !/^Basic [A-Za-z0-9+/]+={0,2}$/.test(authorization)) return "unauthorized";
  const now = Math.floor(Date.now() / 60_000);
  if (now !== minute) { minute = now; attempts = 0; }
  if (++attempts > 120 || active >= 2) return "limited";
  const credentials = Buffer.from(authorization.slice(6), "base64").toString("utf8");
  const separator = credentials.indexOf(":");
  if (separator < 1) return "unauthorized";
  const username = credentials.slice(0, separator), password = credentials.slice(separator + 1);
  if (Buffer.byteLength(password) > 128) return "unauthorized";
  const [, salt, expected] = config.hash.split(":");
  active++;
  try {
    const digest = await new Promise<Buffer>((resolve, reject) => {
      scrypt(password, Buffer.from(salt, "hex"), 32, { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 }, (error, result) => {
        if (error) reject(error); else resolve(result);
      });
    });
    const sameUsername = timingSafeEqual(createHash("sha256").update(username).digest(), createHash("sha256").update(config.username).digest());
    return timingSafeEqual(digest, Buffer.from(expected, "hex")) && sameUsername ? "authorized" : "unauthorized";
  } catch { return "unauthorized"; }
  finally { active--; }
}

export function adminDenied(result: Exclude<AdminAuth, "authorized">): Response {
  return new Response(result === "unconfigured" ? "Visitor admin access has not been configured." :
    result === "limited" ? "Too many login attempts. Try again in a minute." : "Sign in to view visitor statistics.", {
    status: result === "unconfigured" ? 503 : result === "limited" ? 429 : 401,
    headers: { ...ADMIN_HEADERS, "Content-Type": "text/plain; charset=utf-8",
      ...(result === "unauthorized" ? { "WWW-Authenticate": 'Basic realm="Lumix visitor statistics", charset="UTF-8"' } : {}),
      ...(result === "limited" ? { "Retry-After": "60" } : {}),
    },
  });
}
