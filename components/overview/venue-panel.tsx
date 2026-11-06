import type { VenuesData } from "@/lib/analytics/types";

const UPCOMING_VENUES = ["Phoenix", "Sushi", "Comet"];

export function VenuePanel({ venues }: { venues: VenuesData }) {
  const groups = [
    {
      label: "Lumix aggregator",
      path: "aggregator",
      protocols: venues.aggregator.protocols.filter(({ name }) =>
        ["soroswap", "aquarius"].includes(name.trim().toLowerCase())),
      upcoming: UPCOMING_VENUES,
    },
    {
      label: "Stellar AMM",
      path: "stellar-amm",
      protocols: venues.stellarAmm.protocols.filter(({ name }) => name.trim().toLowerCase() === "order book"),
      upcoming: [],
    },
  ];

  return (
    <section className="trade-panel overview-panel venues-panel" aria-labelledby="venues-title">
      <div className="trade-panel-header">
        <h2 className="trade-panel-title" id="venues-title">Venues</h2>
      </div>
      {groups.map((group) => (
        <div className="venue-group" key={group.label} data-path={group.path}>
          <h3>{group.label}</h3>
          <ul className="venue-list">
            {group.protocols.map((protocol) => (
              <li key={protocol.name}>
                <span>{protocol.name}</span>
                <span className="venue-bar" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.max(0, protocol.sharePct))}%` }} />
                </span>
              </li>
            ))}
            {group.upcoming.map((name) => (
              <li key={name} className="venue-upcoming">
                <span>{name}</span>
                <span className="venue-coming-soon">Coming soon</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
