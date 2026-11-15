import type { VisitorConfig } from "./config";

export function frontendSiteConfig(base: VisitorConfig | null): VisitorConfig | null {
  const origin = process.env.VISITOR_FRONT_ORIGIN ?? "";
  if (!base || process.env.VISITOR_FRONT_ENABLED !== "true" || origin === base.origin) return null;
  try {
    const url = new URL(origin);
    if (url.origin !== origin || url.username || url.password) return null;
    if (base.localTest ? !/^http:\/\/localhost:\d+$/.test(origin) :
      url.protocol !== "https:" || !process.env.VISITOR_FRONT_REVIEW_ID) return null;
  } catch { return null; }
  const enabled = base.estimator.enabled && process.env.VISITOR_FRONT_UNIQUES_ENABLED === "true" &&
    (base.localTest || !!process.env.VISITOR_FRONT_UNIQUES_REVIEW_ID);
  return { ...base, origin, estimator: { enabled, reason: enabled ? "Frontend daily estimation enabled." : "Frontend daily estimation is off or awaits its own review." } };
}
