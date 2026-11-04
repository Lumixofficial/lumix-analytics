import type { AnalyticsSummary, ChartData } from "@/lib/analytics/types";
import { formatCount, formatUsdWhole } from "@/lib/format";
import { VolumeChart } from "./volume-chart";

export function LedgerPanel({ summary, chart }: { summary: AnalyticsSummary; chart: ChartData }) {
  return (
    <section className="trade-panel volume-panel" aria-label="Overall volume and activity">
      <VolumeChart points={chart.points} />
      <dl className="volume-stats">
        <div className="volume-stat--lead">
          <dt>Total volume</dt>
          <dd className="trade-number">{formatUsdWhole(summary.totalVolumeUsd)}</dd>
        </div>
        <div>
          <dt>Total swaps</dt>
          <dd className="trade-number">{formatCount(summary.totalSwaps)}</dd>
        </div>
        <div>
          <dt>Total users</dt>
          <dd className="trade-number">{formatCount(summary.totalUsers)}</dd>
        </div>
      </dl>
    </section>
  );
}
