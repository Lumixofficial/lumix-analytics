"use client";

import { useState } from "react";
import type { TransactionItem } from "@/lib/analytics/types";
import { SwapAmounts } from "../asset";
import { Icon } from "../icon";
import { RouteSummary } from "../swap-bits";

export function SwapDetail({ swap }: { swap: TransactionItem }) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");

  async function copyHash() {
    try {
      await navigator.clipboard.writeText(swap.txHash);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  }

  return (
    <div className="swap-detail-body">
      <h2 className="trade-sr-only">Transaction details</h2>
      <dl className="transaction-facts">
        <div className="transaction-hash">
          <dt>Transaction hash</dt>
          <dd>
            <a
              className="transaction-id transaction-link trade-number"
              href={`https://stellar.expert/explorer/public/tx/${encodeURIComponent(swap.txHash)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View transaction ${swap.txHash} on Stellar Expert (opens in a new tab)`}
            >
              <span>{swap.txHash}</span>
              <Icon name="external" size={12} />
            </a>
            <button className="copy-button" type="button" onClick={copyHash} aria-label="Copy transaction hash">
              <Icon name={copyState === "copied" ? "check" : "copy"} size={14} />
              <span>{copyState === "copied" ? "Copied" : "Copy"}</span>
            </button>
            <span className="copy-feedback" role="status">
              {copyState === "error" ? "Unable to copy. Select the hash to copy it." : copyState === "copied" ? "Transaction hash copied." : ""}
            </span>
          </dd>
        </div>
      </dl>
      <div className="route-breakdown">
        <h3>Route breakdown</h3>
        <div className="route-overview">
          <RouteSummary swap={swap} detailed />
          <SwapAmounts swap={swap} />
        </div>
      </div>
    </div>
  );
}
