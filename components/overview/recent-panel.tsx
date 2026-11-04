import Link from "next/link";
import type { TransactionItem } from "@/lib/analytics/types";
import { SwapTable } from "../transactions/swap-table";

export function RecentPanel({ swaps }: { swaps: TransactionItem[] }) {
  return (
    <section className="trade-panel overview-panel recent-panel" aria-labelledby="recent-title">
      <div className="trade-panel-header">
        <h2 className="trade-panel-title" id="recent-title">Latest swaps</h2>
        <Link className="trade-button trade-button--ghost trade-button--sm panel-action" href="/transactions">
          View all
        </Link>
      </div>
      <SwapTable items={swaps.slice(0, 5)} />
    </section>
  );
}
