import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { authenticateAdmin } from "@/lib/visitors/auth";
import { visitorStorageConfig } from "@/lib/visitors/config";
import { getVisitorStore } from "@/lib/visitors/store";
import { buildVisitorReport } from "@/lib/visitors/report";
import { VisitorDashboard } from "@/components/visitor-dashboard";

export const metadata: Metadata = { title: "Visitor statistics", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function VisitorsPage() {
  // Authorization is repeated here before any storage access or serialization.
  if (await authenticateAdmin((await headers()).get("authorization")) !== "authorized") notFound();
  const storage = visitorStorageConfig();
  let report = null;
  if (storage) {
    try { report = await buildVisitorReport(storage, await getVisitorStore(storage)); } catch { /* Render an honest unavailable state. */ }
  }
  return <VisitorDashboard initial={report} />;
}
