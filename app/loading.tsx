export default function OverviewLoading() {
  return (
    <div className="trade-container analytics-page" aria-busy="true">
      <div className="page-head"><h1>Overview</h1></div>
      <div className="trade-panel volume-panel" role="status" aria-label="Loading overview">
        <span className="trade-skeleton volume-chart" aria-hidden="true" />
      </div>
      <div className="overview-grid" aria-hidden="true">
        <div className="trade-panel overview-panel venues-panel">
          <div className="trade-panel-header">
            <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
          </div>
          {[5, 1].map((rows, group) => (
            <div key={group} className="venue-group">
              <h3><span className="trade-skeleton skeleton-line" style={{ width: "7rem" }} /></h3>
              <ul className="venue-list">
                {Array.from({ length: rows }, (_, row) => (
                  <li key={row}>
                    <span className="trade-skeleton skeleton-line" />
                    <span className="trade-skeleton venue-bar" />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="trade-panel overview-panel summary-panel">
          <div className="trade-panel-header">
            <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
          </div>
          <div className="summary-stats">
            {[0, 1].map((stat) => (
              <div key={stat} className="summary-stat">
                <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
                <span className="trade-skeleton skeleton-value" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="trade-panel overview-panel">
        <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
        <span className="trade-skeleton skeleton-block" />
      </div>
    </div>
  );
}
