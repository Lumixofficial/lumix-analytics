import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NotFound() {
  return (
    <div className="trade-container analytics-page">
      <div className="trade-panel state-panel">
        <div className="trade-empty">
          <span className="trade-empty-mark">
            <Icon name="search" size={18} />
          </span>
          <h1 className="trade-empty-title">This page does not exist</h1>
          <p className="trade-empty-copy">Lumix Analytics has two pages: the overview and the transaction list.</p>
          <div className="state-actions">
            <Link className="trade-button trade-button--secondary trade-button--sm" href="/">
              Go to overview
            </Link>
            <Link className="trade-button trade-button--ghost trade-button--sm" href="/transactions">
              Browse transactions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
