// Only these public, static pages may become dimensions. Unknown/dynamic paths
// are dropped, never copied into a request or an "other" bucket.
export const VISITOR_ROUTES = ["/", "/transactions"] as const;
export type VisitorRoute = (typeof VISITOR_ROUTES)[number] | "/spot";
export type VisitorSite = "lumix-analytics" | "lumix-front";

export function isVisitorRoute(value: unknown): value is VisitorRoute {
  return typeof value === "string" && (VISITOR_ROUTES as readonly string[]).includes(value);
}

export function normalizeVisitorRoute(pathname: string): VisitorRoute | null {
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/+$/, "") || "/";
  return isVisitorRoute(path) ? path : null;
}
