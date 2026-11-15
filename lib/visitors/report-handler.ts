import { ADMIN_HEADERS, adminDenied, authenticateAdmin, type AdminAuth } from "./auth";
import type { VisitorReport } from "./report";
import type { VisitorSite } from "./routes";

export function createReportHandler(deps: {
  authenticate?: (header: string | null) => Promise<AdminAuth>;
  report: (site: VisitorSite) => Promise<VisitorReport>;
}) {
  return async (request: Request): Promise<Response> => {
    const auth = await (deps.authenticate ?? authenticateAdmin)(request.headers.get("authorization"));
    if (auth !== "authorized") return adminDenied(auth);
    const params = new URL(request.url).searchParams;
    const site = params.get("site") ?? "lumix-analytics";
    if (request.method !== "GET" || [...params.keys()].some(key => key !== "site") || params.getAll("site").length > 1 || (site !== "lumix-analytics" && site !== "lumix-front")) return new Response(null, { status: 400, headers: ADMIN_HEADERS });
    try { return Response.json(await deps.report(site), { headers: ADMIN_HEADERS }); }
    catch { return Response.json({ error: "Visitor statistics are unavailable. Check private storage and try again." }, { status: 503, headers: ADMIN_HEADERS }); }
  };
}
