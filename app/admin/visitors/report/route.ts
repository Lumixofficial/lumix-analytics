import { visitorStorageConfig } from "@/lib/visitors/config";
import { buildVisitorReport } from "@/lib/visitors/report";
import { createReportHandler } from "@/lib/visitors/report-handler";
import { getVisitorStore } from "@/lib/visitors/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createReportHandler({ report: async (site) => {
  const storage = visitorStorageConfig();
  if (!storage) throw new Error("Visitor storage unavailable");
  return buildVisitorReport(storage, await getVisitorStore(storage, site), new Date(), site);
} });
