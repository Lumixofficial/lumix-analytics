import type { ChartData } from "@/lib/analytics/types";
import { formatIsoDateUtc, formatUsdWhole } from "@/lib/format";

const WIDTH = 1000;
const HEIGHT = 280;
const INSET = 12;

/** Cubic segments stay between measured endpoints, without inventing peaks. */
function smoothLine(points: { x: number; y: number }[]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M0,${points[0].y} H${WIDTH}`;
  return points.reduce((path, point, i) => {
    if (i === 0) return `M${point.x},${point.y}`;
    const previous = points[i - 1];
    const mid = (previous.x + point.x) / 2;
    return `${path} C${mid},${previous.y} ${mid},${point.y} ${point.x},${point.y}`;
  }, "");
}

export function VolumeChart({ points }: ChartData) {
  const maximum = points.reduce((max, point) => Math.max(max, point.volumeUsd), 1) * 1.08;
  const start = points.length ? Date.parse(points[0].timestamp) : 0;
  const duration = points.length > 1 ? Date.parse(points[points.length - 1].timestamp) - start : 0;
  const coordinates = points.map((point) => ({
    x: duration > 0 ? ((Date.parse(point.timestamp) - start) / duration) * WIDTH : WIDTH / 2,
    y: INSET + (1 - point.volumeUsd / maximum) * (HEIGHT - INSET * 2),
  }));
  const line = smoothLine(coordinates);
  const hasVolume = points.some((point) => point.volumeUsd > 0);

  return (
    <div className="volume-chart">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" role="img" aria-label={points.length ? "Cumulative swap volume over time" : "No volume recorded yet"}>
        <defs>
          <linearGradient id="volume-area-gradient" x1={0} y1={0} x2={0} y2={HEIGHT} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--trade-accent)" stopOpacity={0.24} />
            <stop offset="100%" stopColor="var(--trade-accent)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <g className="volume-plot">
          {hasVolume ? (
            <path className="volume-area" d={`${line} L${WIDTH},${HEIGHT} L0,${HEIGHT} Z`} fill="url(#volume-area-gradient)" />
          ) : null}
          {line ? (
            <path className="volume-line" d={line} vectorEffect="non-scaling-stroke" />
          ) : (
            <path className="volume-line volume-line--empty" d={`M0,${HEIGHT - INSET} H${WIDTH}`} vectorEffect="non-scaling-stroke" />
          )}
        </g>
      </svg>
      {points.length > 0 ? (
        <table className="trade-sr-only">
          <caption>Cumulative swap volume over time</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">Volume</th></tr></thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.timestamp}>
                <th scope="row">{formatIsoDateUtc(point.timestamp)}</th>
                <td>{formatUsdWhole(point.volumeUsd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
