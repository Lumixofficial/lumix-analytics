import type { AnalyticsSummary } from "@/lib/analytics/types";
import { formatCount, formatUsdWhole } from "@/lib/format";

export function SummaryPanel({ summary }: { summary: AnalyticsSummary }) {
  return (
    <section className="trade-panel overview-panel summary-panel" aria-labelledby="metrics-title">
      <div className="trade-panel-header">
        <h2 className="trade-panel-title" id="metrics-title">Metrics</h2>
      </div>
      <dl className="summary-stats">
        <div className="summary-stat">
          <dt>Total volume</dt>
          <dd className="trade-number">{formatUsdWhole(summary.totalVolumeUsd)}</dd>
        </div>
        <div className="summary-stat">
          <dt>Total swaps</dt>
          <dd className="trade-number">{formatCount(summary.totalSwaps)}</dd>
        </div>
      </dl>
    </section>
  );
}
