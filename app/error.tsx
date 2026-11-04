"use client";

import { Icon } from "@/components/icon";

export default function AnalyticsError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="trade-container analytics-page">
      <div className="trade-panel state-panel">
        <div className="trade-empty">
          <span className="trade-empty-mark">
            <Icon name="info" size={18} />
          </span>
          <h1 className="trade-empty-title">Analytics could not load</h1>
          <p className="trade-empty-copy">
            Live analytics could not be retrieved. Try again in a moment.
            {error.digest ? (
              <>
                {" "}
                If it keeps failing, share reference <code>{error.digest}</code> with the Lumix team.
              </>
            ) : null}
          </p>
          <button className="trade-button trade-button--secondary trade-button--sm" type="button" onClick={() => retry()}>
            <Icon name="refresh" size={14} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
