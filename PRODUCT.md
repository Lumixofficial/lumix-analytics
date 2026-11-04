# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router, React, strict TypeScript, and Tailwind CSS. The inherited `design-system/` package remains the visual source of truth. No additional UI or chart library.

## Users

Lumix team members, partners, and traders checking spot-swap activity and inspecting individual transactions. Quick desktop reads and mobile checks.

## Product Purpose

A compact, read-only view of Lumix spot traction: overall volume, total swaps, total users, venues and pairs, with transaction details available on demand.

## Capabilities and Constraints

- Exactly two pages, Overview and Transactions, in the existing Lumix dark style.
- Overview has no timeframe selector or period query logic. It displays the general overall dataset.
- The top card is approximately 70% smooth blue area chart (24% opacity fading to transparent) on the left and 30% vertically stacked Total volume, Total swaps, Total users on the right, separated by a floating hairline. No visible axes, dates, dollar ticks, gridlines, switches, or legend.
- The chart line and gradient reveal together from left to right over 1400ms on page entry. Reduced-motion users see the complete chart immediately.
- Venues renders the protocols returned in Lumix aggregator and Stellar AMM groups. Each row has only its API-provided name and a horizontal bar whose width is its `sharePct`; Stellar AMM bars use the lighter Instrument Blue. No visible dollar amounts or percentages.
- Top pairs remains a short pair-and-volume list. Keep its table at natural height and the column headers close to the card title.
- Latest swaps has Swap (both icons, amounts and symbols), Route (execution venue and the API's `routeSummary`), USD Value, and UTC Time in strict `YYYY-MM-DD` format.
- Transactions loads 20 records per page with Previous/Next navigation and current page / total pages. Its table also includes a truncated transaction hash. The backend has no search parameter, so no local-only search is offered.
- Neither table has a Status column. Clicking a row or its keyboard-accessible toggle opens a copyable transaction hash linked to Mainnet Stellar Expert, execution venue, the API's protocol summary, and transfer amounts. Trader account, ledger, and UTC timestamp sections are intentionally absent. Drawers end after this summary: no individual routes, legs, splits, intermediate tokens, or per-hop amounts. Do not infer routes, hops, or status fields absent from the response.
- Table highlights apply only on hover, never persist because a row is open. Keep 32px desktop and 24px mobile content insets from card edges.
- Preserve the Lumix header, footer, brand typography, palette, and design-system package.
- The favicon uses the exact transparent 38×38 `lumix-front/app/icon.tsx` generator and identical white Lumix icon asset, without the previous dark tile.
- All displayed analytics come exclusively from the modular live backend. The centralized, typed `lib/api.ts` client reads `NEXT_PUBLIC_API_URL`, disables fetch caching, validates response shapes, and surfaces request failures without substitute records or counters.
- Zero totals remain zero; an empty chart displays a quiet baseline. Empty pairs and transaction feeds say "No transactions recorded yet." Pulse skeletons cover initial requests and transaction-page transitions, with reduced-motion support.
- `npm run lint`, `npm run typecheck`, and `npm run build` must succeed.

## API Configuration

`.env.local` points to `http://localhost:8080`; `.env.production` points to `https://api.lumixmarket.com`. Next.js gives `.env.local` precedence even during local production builds. Keep it local and set the production URL at deployment build time.

Server Components make uncached requests directly to:

- `/v1/analytics/summary`
- `/v1/analytics/chart?interval=1d` (API-provided cumulative volume)
- `/v1/analytics/venues`
- `/v1/analytics/top-pairs?limit=5`
- `/v1/analytics/transactions?page=1&limit=5&sort=-timestamp` on Overview
- `/v1/analytics/transactions?page={currentPage}&limit=20&sort=-timestamp` on Transactions

Widget responses are top-level objects. Transactions alone uses the `data` / `page` envelope. Decimal amount and USD strings are display quantities, not raw atomic token amounts. Unpriced transactions retain `valueUsd: null`, displayed as a dash rather than zero.

## Brand Commitments

Use existing Lumix assets. Preserve the footer verbatim, including Built on Stellar, social links, legal and documentation links, copyright, and risk disclaimer.

## Product Principles

- Keep the default view quiet and put detailed facts in row disclosures.
- Keep the selected fields accurate; render only records returned by the completed-swaps feed.
- Do not restore advanced filters, chart metric switches, analytics disclaimers, source badges, routing multipliers, or extra headline metrics without a new request.
- Treat the user's latest surface specifications as authoritative over earlier audit-trail or flat-table experiments.

## Accessibility & Inclusion

Use semantic headings, tables, lists, native disclosure buttons, visible focus, copy feedback, reduced-motion support, and 44px mobile controls. Preserve equivalent chart data for screen readers without visual axes. Long hashes must wrap without page overflow.
