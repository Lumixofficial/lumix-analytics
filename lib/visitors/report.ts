import { estimatorConfig, visitorState, type VisitorStorageConfig } from "./config";
import { utcDay } from "./estimator";
import { VISITOR_ROUTES } from "./routes";
import type { VisitorRepository, DailyCount } from "./store";
import type { VisitorSite, VisitorRoute } from "./routes";
import { frontendSiteConfig } from "./sites";

export function summarizePageviews(rows: DailyCount[], now: Date, retentionDays: number, site: VisitorSite = "lumix-analytics") {
  const routes: readonly VisitorRoute[] = site === "lumix-front" ? ["/spot"] : VISITOR_ROUTES;
  const today = utcDay(now), midnight = Date.parse(`${today}T00:00:00Z`);
  const dayBefore = (days: number) => utcDay(new Date(midnight - days * 86_400_000));
  const retainedFrom = dayBefore(retentionDays - 1);
  const valid = rows.filter(row => row.expiresAt > now && row.day >= dayBefore(29) && row.day <= today &&
    routes.includes(row.route) && Number.isSafeInteger(row.pageviews) && row.pageviews >= 0);
  const sum = (from: string, route?: string) => valid.filter(row => row.day >= from && (!route || row.route === route))
    .reduce((count, row) => count + row.pageviews, 0);
  return {
    pageviews: { today: sum(today), last7Days: sum(dayBefore(6)), last30Days: sum(dayBefore(29)) },
    daily: Array.from({ length: 30 }, (_, index) => {
      const day = dayBefore(29 - index);
      return { day, pageviews: day < retainedFrom ? null : valid.filter(row => row.day === day).reduce((n, row) => n + row.pageviews, 0) };
    }),
    routes: routes.map(route => ({ route, today: sum(today, route), last7Days: sum(dayBefore(6), route), last30Days: sum(dayBefore(29), route) })),
  };
}

export async function buildVisitorReport(storage: VisitorStorageConfig, repo: VisitorRepository, now = new Date(), site: VisitorSite = "lumix-analytics") {
  const state = visitorState();
  const siteConfig = site === "lumix-front" ? frontendSiteConfig(state.config) : state.config;
  const estimator = siteConfig?.estimator ?? estimatorConfig();
  const enabled = siteConfig !== null && estimator.enabled;
  const start = utcDay(new Date(Date.parse(`${utcDay(now)}T00:00:00Z`) - 29 * 86_400_000));
  const [rows, estimate] = await Promise.all([
    repo.readDaily(start, now), enabled ? repo.readEstimate(now) : Promise.resolve(null),
  ]);
  return {
    generatedAt: now.toISOString(), day: utcDay(now), dataset: storage.dataset,
    site, retentionDays: storage.retentionDays, ...summarizePageviews(rows, now, storage.retentionDays, site),
    collection: { enabled: siteConfig !== null, reason: site === "lumix-front" && !siteConfig ? "Frontend collection is disabled or lacks a valid origin/review." : state.reason },
    uniques: { enabled, reason: siteConfig ? estimator.reason : "Pageview collection is off.",
      today: estimate?.count ?? null, unestimatedPageviews: estimate?.unestimated ?? null,
      missingNetwork: estimate?.missingNetwork ?? 0, storageErrors: estimate?.storageErrors ?? 0 },
  };
}

export type VisitorReport = Awaited<ReturnType<typeof buildVisitorReport>>;
