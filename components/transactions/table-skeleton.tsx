import { TRANSACTIONS_PAGE_SIZE } from "@/lib/analytics/pagination";

export function TransactionTableSkeleton() {
  return (
    <div className="trade-panel transactions-panel" role="status" aria-label="Loading transactions">
      <div aria-hidden="true">
        {Array.from({ length: TRANSACTIONS_PAGE_SIZE }, (_, row) => (
          <div key={row} className="skeleton-row">
            {[0, 1, 2, 3, 4].map((cell) => (
              <span key={cell} className="trade-skeleton skeleton-line" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
