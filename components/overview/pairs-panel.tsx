import type { TopPairsData } from "@/lib/analytics/types";
import { formatUsdWhole } from "@/lib/format";
import { PairMark } from "../asset";

export function PairsPanel({ pairs }: TopPairsData) {
  return (
    <section className="trade-panel overview-panel pairs-panel" aria-labelledby="pairs-title">
      <div className="trade-panel-header">
        <h2 className="trade-panel-title" id="pairs-title">Top pairs</h2>
      </div>
      <table className="compact-table pairs-table">
        <caption className="trade-sr-only">Top trading pairs by volume</caption>
        <thead>
          <tr><th scope="col">Pair</th><th scope="col" className="is-numeric">Volume</th></tr>
        </thead>
        <tbody>
          {pairs.length === 0 ? (
            <tr className="table-empty-row">
              <td colSpan={2}><p className="panel-empty">No transactions recorded yet.</p></td>
            </tr>
          ) : pairs.slice(0, 5).map((pair, index) => (
            <tr key={`${pair.pair}-${index}`}>
              <th scope="row">
                <span className="pair-label">
                  <PairMark base={pair.assetIn} quote={pair.assetOut} />
                  {pair.assetIn}<span className="pair-slash">/</span>{pair.assetOut}
                </span>
              </th>
              <td className="is-numeric">{formatUsdWhole(pair.volumeUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
