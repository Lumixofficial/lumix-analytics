export default function OverviewLoading() {
  return (
    <div className="trade-container analytics-page" aria-busy="true">
      <div className="page-head"><h1>Overview</h1></div>
      <div className="trade-panel volume-panel" role="status" aria-label="Loading overview">
        <span className="trade-skeleton skeleton-chart" />
        <div className="volume-stats" aria-hidden="true">
          {[0, 1, 2].map((cell) => (
            <div key={cell}>
              <span className="trade-skeleton skeleton-line" style={{ width: "4.5rem" }} />
              <span className="trade-skeleton skeleton-value" style={{ width: "5rem" }} />
            </div>
          ))}
        </div>
      </div>
      <div className="overview-grid">
        {[0, 1].map((panel) => (
          <div key={panel} className="trade-panel overview-panel">
            <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
            <span className="trade-skeleton skeleton-block" />
          </div>
        ))}
      </div>
      <div className="trade-panel overview-panel">
        <span className="trade-skeleton skeleton-line" style={{ width: "6rem" }} />
        <span className="trade-skeleton skeleton-block" />
      </div>
    </div>
  );
}
