import type { Metadata } from "next";
import { LedgerPanel } from "@/components/overview/ledger-panel";
import { RecentPanel } from "@/components/overview/recent-panel";
import { SummaryPanel } from "@/components/overview/summary-panel";
import { VenuePanel } from "@/components/overview/venue-panel";
import { PageHeading } from "@/components/page-heading";
import { getAnalyticsSummary, getChartData, getTransactions, getVenuesData } from "@/lib/api";

export const metadata: Metadata = { title: { absolute: "Overview | Lumix Analytics" } };

export default async function OverviewPage() {
  const [summary, chart, venues, recent] = await Promise.all([
    getAnalyticsSummary(),
    getChartData(),
    getVenuesData(),
    getTransactions(1, 5),
  ]);

  return (
    <div className="trade-container analytics-page">
      <PageHeading title="Overview" />
      <LedgerPanel chart={chart} />
      <div className="overview-grid">
        <VenuePanel venues={venues} />
        <SummaryPanel summary={summary} />
      </div>
      <RecentPanel swaps={recent.data} />
    </div>
  );
}
