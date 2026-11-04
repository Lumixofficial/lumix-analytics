---
version: 1
slug: "app-page-tsx"
primary_target: "app/page.tsx"
related_targets: ["app/transactions/page.tsx"]
---

## Scope

Two-page Operate surface: Overview and Transactions. Preserve the existing Lumix dark shell, header, footer, fonts, and palette.

## Direction contract

THESIS: A quiet overview with transaction details on demand.

TOP CARD: Approximately 70% chart / 30% metrics. A smooth blue overall-volume area chart on the left, retaining the blue stroke with a 24%-to-transparent vertical fill; Total volume, Total swaps, Total users stacked vertically on the right. The chart line and fill reveal together left to right over 1400ms on mount, with no motion for reduced-motion users. A 75%-height decorative hairline floats between the columns without touching the card edges. No timeframe control, period query, visible axes, date ticks, dollar ticks, gridlines, switches, or legend.

VENUES: Two API-provided groups. Lumix aggregator: Soroswap, Aquarius, Phoenix, Sushi, Comet. Stellar AMM: Liquidity pools, Order book. Render the returned protocol arrays, including extra API categories. Every row has only a venue name and horizontal bar, sized directly from `sharePct`. Aggregator bars use Poly Blue; Stellar AMM bars use lighter Instrument Blue. No visible dollar amounts or percentages.

TABLES: Latest swaps has both token icons, formatted decimal-string amounts and API symbols, Route with the API's venue and `routeSummary`, USD Value (dash when null), and strict `YYYY-MM-DD` UTC Time. Transactions adds a truncated transaction hash and API-driven 20-row pagination with current page / total pages. The backend has no search parameter; do not add local-only filtering. Neither table shows a Status column.

DISCLOSURE: Clicking a row or its native button toggles transaction details below that row. Show a full copyable hash linked to Mainnet Stellar Expert in a new tab, execution venue (Lumix Aggregator or Stellar AMM), the API's protocol summary, and token transfer amounts. Do not show trader account, ledger, or UTC timestamp sections. End the drawer directly after the route summary. Do not render individual legs, splits, intermediate tokens, or per-hop amounts. Do not infer status or routes absent from the completed-transactions response. Do not add fees, slippage, or advanced filters. Row highlights are hover-only. Maintain 32px desktop / 24px mobile content insets.

TOP PAIRS: Keep the table at natural height with a 12px title-to-header gap; do not stretch the header area to fill the neighboring card's height.

ICON: Copy the exact transparent 38×38 generator from `lumix-front/app/icon.tsx`; its white Lumix logo source is byte-identical in both apps. Remove the old dark-tile icon.

STATES: Responsive mobile rows retain all fields. Hashes wrap. Loading matches the current structure with subtle pulse skeletons, disabled for reduced motion. Empty pairs and transaction feeds say "No transactions recorded yet." An empty chart has a quiet baseline. Zero totals remain zero. Failed requests show an explicit retryable error, never substitute data.

## Data contract

`lib/api.ts` reads `NEXT_PUBLIC_API_URL` and calls the live summary, chart (`interval=1d`), venues, top-pairs (`limit=5`), and transactions endpoints under `/v1/analytics`. The four widget responses are top-level objects. Transactions returns `data` and `page`, with `limit=5` for Overview and `limit=20` for Transactions, sorted by `-timestamp`. No generated analytic data is included.
