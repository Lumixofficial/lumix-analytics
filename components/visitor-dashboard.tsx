"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import type { VisitorReport } from "@/lib/visitors/report";
import { PageHeading } from "@/components/page-heading";

const number = (value: number) => new Intl.NumberFormat("en-US").format(value);
const subscribeReady = () => () => {};

export function VisitorDashboard({ initial }: { initial: VisitorReport | null }) {
  const ready = useSyncExternalStore(subscribeReady, () => true, () => false);
  const [report, setReport] = useState(initial);
  const [days, setDays] = useState<7 | 30>(7);
  const [site, setSite] = useState<"lumix-analytics" | "lumix-front">("lumix-analytics");
  const [error, setError] = useState(initial ? "" : "Stored statistics could not be loaded. Check private storage, then refresh.");
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    setPending(true);
    try {
      const response = await fetch(`/admin/visitors/report?site=${site}`, { cache: "no-store", credentials: "same-origin", referrerPolicy: "no-referrer", signal });
      if (!response.ok) throw new Error(response.status === 401 ? "Your sign-in has expired. Reload this page to sign in." : "Statistics could not refresh. The last successful values remain below.");
      const data: VisitorReport = await response.json();
      setReport(data); setError("");
    } catch (failure) {
      if (!signal?.aborted) setError(failure instanceof Error ? failure.message : "Statistics could not refresh.");
    } finally { if (!signal?.aborted) setPending(false); }
  }, [site]);
  useEffect(() => {
    const controller = new AbortController();
    const initialRead = setTimeout(() => void refresh(controller.signal), 0);
    const timer = setInterval(() => { if (document.visibilityState === "visible") void refresh(controller.signal); }, 10_000);
    return () => { clearTimeout(initialRead); clearInterval(timer); controller.abort(); };
  }, [refresh]);

  const series = report?.daily.slice(-days) ?? [];
  const max = Math.max(1, ...series.map(day => day.pageviews ?? 0));
  return (
    <div className="trade-container analytics-page visitor-admin">
      <PageHeading title="Visitor statistics" />
      <div className="visitor-admin-toolbar">
        <p>Private audience measurement <span aria-hidden="true">·</span> All days use UTC</p>
        <label htmlFor="visitor-site">Site</label><select disabled={!ready} id="visitor-site" value={site} onChange={event => { setReport(null); setSite(event.target.value as typeof site); }}><option value="lumix-analytics">Lumix Analytics</option><option value="lumix-front">Lumix Front</option></select>
        <button type="button" className="trade-button trade-button--secondary trade-button--sm" disabled={pending}
          onClick={() => void refresh()}>{pending ? "Refreshing…" : "Refresh counts"}</button>
      </div>
      {error && <p role="alert" className="visitor-report-error">{error}</p>}
      {!report ? <div className="trade-panel visitor-report-empty"><h2>Statistics are unavailable</h2>
        <p>No values are shown until authenticated storage responds. Refresh to try again.</p></div> : <>
        <div className="visitor-status" aria-label="Measurement status">
          <strong className="visitor-dataset">{report.dataset === "test" ? "Test data" : "Production data"}</strong>
          <span>{report.collection.enabled ? "Pageview collection enabled" : "Pageview collection off"}</span>
          <span>{report.uniques.enabled ? "Daily estimation enabled" : "Daily estimation off"}</span>
        </div>
        {!report.collection.enabled && <p className="visitor-status-detail">{report.collection.reason}</p>}
        {!report.uniques.enabled && <p className="visitor-status-detail">{report.uniques.reason}</p>}
        <div className="visitor-metrics">
          <section className="trade-panel visitor-metric"><h2>Pageviews today</h2><p className="trade-number" data-testid="today-pageviews">{number(report.pageviews.today)}</p><span>{report.day} UTC</span></section>
          <section className="trade-panel visitor-metric"><h2>Estimated visitors today</h2><p className="trade-number" data-testid="today-uniques">{report.uniques.today === null ? "Off" : number(report.uniques.today)}</p><span>Daily network estimate, not unique people</span></section>
          <section className="trade-panel visitor-metric"><h2>Pageviews in {days} days</h2><p className="trade-number">{number(days === 7 ? report.pageviews.last7Days : report.pageviews.last30Days)}</p><span>Includes today; retained events only</span></section>
        </div>
        {report.uniques.missingNetwork > 0 && <p role="status" className="visitor-status-detail">
          {number(report.uniques.missingNetwork)} pageviews today skipped estimation because the trusted ingress supplied no valid network information.
        </p>}
        {report.uniques.storageErrors > 0 && <p role="status" className="visitor-status-detail">
          {number(report.uniques.storageErrors)} pageviews today skipped estimation because temporary estimation storage failed.
        </p>}
        <div className="visitor-report-grid">
          <section className="trade-panel visitor-trend" aria-labelledby="visitor-trend-title">
            <div className="visitor-section-head"><h2 id="visitor-trend-title">Daily pageviews</h2>
              <div className="trade-segmented" aria-label="Trend period">
                {([7, 30] as const).map(period => <button type="button" key={period} aria-pressed={days === period} onClick={() => setDays(period)}>{period} days</button>)}
              </div>
            </div>
            <p className="visitor-chart-scale">{number(max === 1 && series.every(day => !day.pageviews) ? 0 : max)} maximum</p>
            <div className="visitor-bars" role="img" aria-label={`Daily pageviews for the last ${days} UTC days. Exact values are available in the daily counts table.`}>
              {series.map(day => <div key={day.day} className={day.pageviews === null ? "visitor-bar-slot is-unavailable" : "visitor-bar-slot"}
                title={`${day.day}: ${day.pageviews === null ? "outside retention" : number(day.pageviews) + " pageviews"}`}>
                <span style={{ height: `${day.pageviews === null ? 0 : day.pageviews / max * 100}%` }} />
              </div>)}
            </div>
            <div className="visitor-chart-dates"><span>{series[0]?.day}</span><span>{series.at(-1)?.day}</span></div>
            <details className="visitor-daily-table"><summary>Show daily counts</summary><table className="compact-table"><thead><tr><th scope="col">UTC day</th><th scope="col" className="is-numeric">Pageviews</th></tr></thead>
              <tbody>{series.map(day => <tr key={day.day}><th scope="row">{day.day}</th><td className="is-numeric">{day.pageviews === null ? "Outside retention" : number(day.pageviews)}</td></tr>)}</tbody></table></details>
          </section>
          <section className="trade-panel visitor-routes" aria-labelledby="visitor-routes-title">
            <div className="visitor-section-head"><h2 id="visitor-routes-title">Pageviews by route</h2><span>{days} days</span></div>
            <table className="compact-table"><thead><tr><th scope="col">Route</th><th scope="col" className="is-numeric">Views</th></tr></thead>
              <tbody>{report.routes.map(route => <tr key={route.route}><th scope="row"><code>{route.route}</code></th><td className="is-numeric">{number(days === 7 ? route.last7Days : route.last30Days)}</td></tr>)}</tbody></table>
            <p>Only explicitly allowed routes are measured for the selected site.</p>
          </section>
        </div>
        <div className="visitor-report-notes">
          <p>Network estimates combine people on shared networks and can count someone again after a network change. Daily estimates are never added into a weekly or monthly people count.</p>
          <p>Counts expire after {report.retentionDays} days. Days outside retention are marked unavailable; a zero means no retained events for that day.</p>
          <p role="status" aria-live="polite">Last read: <time dateTime={report.generatedAt}>{report.generatedAt.replace("T", " ").replace(/\.\d+Z$/, " UTC")}</time>. Updates every 10 seconds while this tab is visible.</p>
          <p>To sign out, close this private browser window or clear this site’s saved HTTP authentication credentials.</p>
        </div>
      </>}
    </div>
  );
}
