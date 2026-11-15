import { createCollector } from "@/lib/visitors/collector";
import { visitorConfig } from "@/lib/visitors/config";
import { getVisitorStore } from "@/lib/visitors/store";
import { frontendSiteConfig } from "@/lib/visitors/sites";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createCollector({ config: visitorConfig, store: getVisitorStore });

export function OPTIONS(request: Request) {
  const config = frontendSiteConfig(visitorConfig());
  const origin = request.headers.get("origin");
  const allowed = config?.origin;
  if (!config || !allowed || origin !== allowed ||
      request.headers.get("access-control-request-method") !== "POST" ||
      request.headers.get("access-control-request-headers")?.toLowerCase() !== "content-type") return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": allowed, "Access-Control-Allow-Methods": "POST", "Access-Control-Allow-Headers": "content-type", "Vary": "Origin", "Cache-Control": "no-store" } });
}
