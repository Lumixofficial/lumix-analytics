import type { Metadata } from "next";
import { LedgerPanel } from "@/components/overview/ledger-panel";
import { PairsPanel } from "@/components/overview/pairs-panel";
import { RecentPanel } from "@/components/overview/recent-panel";
import { VenuePanel } from "@/components/overview/venue-panel";
import { PageHeading } from "@/components/page-heading";
import { getAnalyticsSummary, getChartData, getTopPairsData, getTransactions, getVenuesData } from "@/lib/api";

export const metadata: Metadata = { title: { absolute: "Overview | Lumix Analytics" } };

export default async function OverviewPage() {
  const [summary, chart, venues, topPairs, recent] = await Promise.all([
    getAnalyticsSummary(),
    getChartData(),
    getVenuesData(),
    getTopPairsData(),
    getTransactions(1, 5),
  ]);

  return (
    <div className="trade-container analytics-page">
      <PageHeading title="Overview" />
      <LedgerPanel summary={summary} chart={chart} />
      <div className="overview-grid">
        <VenuePanel venues={venues} />
        <PairsPanel pairs={topPairs.pairs} />
      </div>
      <RecentPanel swaps={recent.data} />
    </div>
  );
}
