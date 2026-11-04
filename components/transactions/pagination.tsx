"use client";

import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { MAX_TRANSACTION_PAGE, transactionsHref } from "@/lib/analytics/pagination";
import type { TransactionsResponse } from "@/lib/analytics/types";
import { formatCount } from "@/lib/format";
import { Icon } from "../icon";
import { usePendingTransition } from "../pending";

export function Pagination({ pagination }: { pagination: TransactionsResponse["page"] }) {
  const router = useRouter();
  const startTransition = usePendingTransition();
  const { page, limit, total, totalPages } = pagination;
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(total, page * limit);

  function go(event: MouseEvent<HTMLAnchorElement>, target: number) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    startTransition(() => router.push(transactionsHref(target), { scroll: false }));
    const results = document.getElementById("results");
    if (results && results.getBoundingClientRect().top < 0) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      results.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }

  return (
    <nav className="tx-pagination" aria-label="Pages">
      <p>
        <span className="trade-number">{formatCount(first)}–{formatCount(last)}</span>
        {" of "}<span className="trade-number">{formatCount(total)}</span>
      </p>
      <div className="page-controls">
          {page > 1 ? (
            <a className="page-button" href={transactionsHref(page - 1)} onClick={(event) => go(event, page - 1)} aria-label="Previous page">
              <Icon name="chevron-left" size={16} />
            </a>
          ) : (
            <span className="page-button is-disabled" aria-hidden="true"><Icon name="chevron-left" size={16} /></span>
          )}
          <span className="page-position trade-number">
            <span className="trade-sr-only">Page </span>{formatCount(page)}
            <span aria-hidden="true"> / </span><span className="trade-sr-only"> of </span>{formatCount(totalPages)}
          </span>
          {page < totalPages && page < MAX_TRANSACTION_PAGE ? (
            <a className="page-button" href={transactionsHref(page + 1)} onClick={(event) => go(event, page + 1)} aria-label="Next page">
              <Icon name="chevron-right" size={16} />
            </a>
          ) : (
            <span className="page-button is-disabled" aria-hidden="true"><Icon name="chevron-right" size={16} /></span>
          )}
      </div>
    </nav>
  );
}
