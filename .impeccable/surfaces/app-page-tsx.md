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

TOP CARD: A full-width smooth blue overall-volume area chart, retaining the blue stroke with a 24%-to-transparent vertical fill. The chart line and fill reveal together left to right over 1400ms on mount, with no motion for reduced-motion users. No timeframe control, period query, visible axes, date ticks, dollar ticks, gridlines, switches, or legend.

LOWER GRID: Venues on the left takes 70% and Metrics on the right takes 30%, with equal-height cards, at 1024px and above. Stack on mobile and tablet. Metrics shows only Total volume and Total swaps in two evenly spaced rows with large tabular numbers and a subtle separator. Do not display Total users.

VENUES: Lumix aggregator shows API-provided Soroswap and Aquarius bars plus Phoenix, Sushi, and Comet with muted "Coming soon" tags and no bars. Stellar AMM shows only the API's Order book row. Exclude Unattributed, Liquidity pools, and other categories. Active bars retain their original `sharePct`, without renormalization. Aggregator bars use Poly Blue; Stellar AMM uses lighter Instrument Blue. No visible dollar amounts or percentages.

TABLES: Latest swaps has both token icons, formatted decimal-string amounts and API symbols, Route with the API's venue and `routeSummary`, USD Value (dash when null), and strict `YYYY-MM-DD` UTC Time. Transactions adds a truncated transaction hash and API-driven 10-row pagination with current page / total pages. The backend has no search parameter; do not add local-only filtering. Neither table shows a Status column.

DISCLOSURE: Clicking a row or its native button toggles transaction details below that row. Show a full copyable hash linked to Mainnet Stellar Expert in a new tab, execution venue (Lumix Aggregator or Stellar AMM), the API's protocol summary, and token transfer amounts. Do not show trader account, ledger, or UTC timestamp sections. End the drawer directly after the route summary. Do not render individual legs, splits, intermediate tokens, or per-hop amounts. Do not infer status or routes absent from the completed-transactions response. Do not add fees, slippage, or advanced filters. Row highlights are hover-only. Maintain 32px desktop / 24px mobile content insets.

TOP PAIRS: Removed from the UI and API client; never request its endpoint.

MOTION: Active venue bars reveal left to right over 1400ms with the chart's easing, using a left-origin scale transform over the API-derived width. Stable keys prevent replay on data updates. Disable the entrance for reduced motion.

ICON: Copy the exact transparent 38×38 generator from `lumix-front/app/icon.tsx`; its white Lumix logo source is byte-identical in both apps. Remove the old dark-tile icon.

STATES: Responsive mobile rows retain all fields. Hashes wrap. Loading matches the full-width chart and lower Venues/Metrics structure with subtle pulse skeletons, disabled for reduced motion. Empty transaction feeds say "No transactions recorded yet." An empty chart has a quiet baseline. Zero totals remain zero. Failed requests show an explicit retryable error, never substitute data.

## Data contract

`lib/api.ts` reads `NEXT_PUBLIC_API_URL` and calls only the live summary, chart (`interval=1d`), venues, and transactions endpoints under `/v1/analytics`. The three widget responses are top-level objects. Transactions returns `data` and `page`, with `limit=5` for Overview and `limit=10` for Transactions, sorted by `-timestamp`. No generated analytic data is included.
