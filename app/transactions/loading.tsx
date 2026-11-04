import { TransactionTableSkeleton } from "@/components/transactions/table-skeleton";

export default function TransactionsLoading() {
  return (
    <div className="trade-container analytics-page" aria-busy="true">
      <div className="page-head"><h1>Transactions</h1></div>
      <TransactionTableSkeleton />
    </div>
  );
}
