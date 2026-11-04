import type { TransactionItem } from "@/lib/analytics/types";

export function RouteSummary({ swap, detailed = false }: { swap: TransactionItem; detailed?: boolean }) {
  return (
    <span className={`route-summary${detailed ? " route-summary--detail" : ""}`}>
      <span>{swap.venue === "STELLAR_NATIVE" ? "Stellar AMM" : detailed ? "Lumix Aggregator" : "Aggregator"}</span>
      {swap.routeSummary ? <span className="route-summary-sub">{swap.routeSummary}</span> : null}
    </span>
  );
}
