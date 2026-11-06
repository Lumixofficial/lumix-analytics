import type { ChartData } from "@/lib/analytics/types";
import { VolumeChart } from "./volume-chart";

export function LedgerPanel({ chart }: { chart: ChartData }) {
  return (
    <section className="trade-panel volume-panel" aria-label="Overall volume">
      <VolumeChart points={chart.points} />
    </section>
  );
}
