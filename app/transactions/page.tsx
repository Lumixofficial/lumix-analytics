import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeading } from "@/components/page-heading";
import { PendingContent, PendingRegion } from "@/components/pending";
import { Pagination } from "@/components/transactions/pagination";
import { SwapTable } from "@/components/transactions/swap-table";
import { TransactionTableSkeleton } from "@/components/transactions/table-skeleton";
import { parsePage, transactionsHref, TRANSACTIONS_PAGE_SIZE } from "@/lib/analytics/pagination";
import { getTransactions } from "@/lib/api";

export const metadata: Metadata = { title: "Transactions" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function TransactionsPage({ searchParams }: Props) {
  const { page } = await searchParams;
  const currentPage = parsePage(page);
  const transactions = await getTransactions(currentPage, TRANSACTIONS_PAGE_SIZE);
  const lastPage = Math.max(1, transactions.page.totalPages);
  if (currentPage > lastPage) redirect(transactionsHref(lastPage));

  return (
    <PendingRegion className="trade-container analytics-page">
      <PageHeading title="Transactions" />
      <section id="results" aria-label="Swaps">
        <PendingContent fallback={<TransactionTableSkeleton />}>
          <div className="trade-panel transactions-panel">
            <SwapTable key={transactions.page.page} items={transactions.data} showHash />
          </div>
          {transactions.page.totalPages > 0 ? <Pagination pagination={transactions.page} /> : null}
        </PendingContent>
      </section>
    </PendingRegion>
  );
}
