"use client";

import { Fragment, useId, useState, type MouseEvent } from "react";
import type { TransactionItem } from "@/lib/analytics/types";
import { formatIsoDateUtc, formatUsd, shortHash } from "@/lib/format";
import { SwapAmounts } from "../asset";
import { Icon } from "../icon";
import { RouteSummary } from "../swap-bits";
import { SwapDetail } from "./swap-detail";

export function SwapTable({ items, showHash = false }: { items: TransactionItem[]; showHash?: boolean }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tableId = useId();

  return (
    <table className="compact-table swap-table" data-show-hash={showHash || undefined}>
      <caption className="trade-sr-only">Swaps. Select a swap to show transaction details.</caption>
      <thead>
        <tr>
          <th scope="col">Swap</th>
          <th scope="col">Route</th>
          <th scope="col" className="is-numeric">Value</th>
          {showHash ? <th scope="col">Transaction</th> : null}
          <th scope="col" className="is-numeric">Time</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr className="table-empty-row">
            <td colSpan={showHash ? 5 : 4}><p className="panel-empty">No transactions recorded yet.</p></td>
          </tr>
        ) : items.map((swap) => {
          const open = expandedId === swap.id;
          const detailId = `${tableId}-${swap.id}`;
          const toggle = () => setExpandedId(open ? null : swap.id);

          function rowClick(event: MouseEvent<HTMLTableRowElement>) {
            if (event.target instanceof Element && event.target.closest("button, a")) return;
            toggle();
          }

          return (
            <Fragment key={swap.id}>
              <tr className="swap-row" data-expanded={open || undefined} onClick={rowClick}>
                <td className="swap-cell">
                  <button
                    className="swap-toggle"
                    type="button"
                    onClick={toggle}
                    aria-expanded={open}
                    aria-controls={detailId}
                    aria-label={`${open ? "Hide" : "Show"} transaction details for ${swap.assetIn.symbol} to ${swap.assetOut.symbol}, ${shortHash(swap.txHash)}`}
                  >
                    <SwapAmounts swap={swap} />
                    <Icon name="chevron-down" size={14} className="swap-chevron" />
                  </button>
                </td>
                <td className="route-cell"><RouteSummary swap={swap} /></td>
                <td className="is-numeric value-cell">{formatUsd(swap.valueUsd)}</td>
                {showHash ? <td className="hash-cell"><span className="trade-number" title={swap.txHash}>{shortHash(swap.txHash)}</span></td> : null}
                <td className="is-numeric time-cell">
                  <time dateTime={swap.timestamp}>{formatIsoDateUtc(swap.timestamp)}</time>
                </td>
              </tr>
              <tr className="swap-detail-row" hidden={!open}>
                <td colSpan={showHash ? 5 : 4}>
                  <div id={detailId} role="region" aria-label={`Transaction details for ${shortHash(swap.txHash)}`}>
                    {open ? <SwapDetail swap={swap} /> : null}
                  </div>
                </td>
              </tr>
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}
