---
name: Lumix Analytics
description: Minimal volume and swap dashboard for Lumix spot swaps, built inside the existing Lumix dark trading system.
colors:
  poly-blue: "#2e5cff"
  poly-blue-deep: "#1e48e6"
  instrument-blue: "#8fa6ff"
  blue-ink: "#0f1730"
  accent-selected: "rgba(46, 92, 255, 0.06)"
  info-tint: "rgba(46, 92, 255, 0.12)"
  focus-ring: "rgba(46, 92, 255, 0.15)"
  on-accent: "#ffffff"
  canvas: "#0a0a0b"
  surface: "#141416"
  raised: "#1c1c1f"
  raised-hover: "#222226"
  hairline: "#2a2a2d"
  rule-strong: "#6e6e73"
  text-primary: "#f4f4f5"
  text-secondary: "#a1a1a6"
  text-muted: "#85858b"
  hover-wash: "rgba(255, 255, 255, 0.04)"
  hover-wash-strong: "rgba(255, 255, 255, 0.06)"
  row-hover: "rgba(255, 255, 255, 0.03)"
  positive: "#35c46a"
  positive-tint: "#10241a"
  negative: "#f0524b"
  negative-tint: "#241214"
  warning: "#ffba00"
  warning-tint: "rgba(255, 186, 0, 0.12)"
  warning-border: "rgba(255, 186, 0, 0.30)"
typography:
  headline:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1.24
    letterSpacing: "-0.01em"
  headline-compact:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1.375rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.6
  body:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  body-small:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  nav:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0"
  label:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.45
  label-strong:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.45
  label-micro:
    fontFamily: "'Inter Variable', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    letterSpacing: "0.06em"
  data-hero:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.03em"
    fontFeature: "\"tnum\" 1, \"zero\" 1"
  data-lg:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"zero\" 1"
  data:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\" 1, \"zero\" 1"
  data-micro:
    fontFamily: "ui-monospace, 'SFMono-Regular', Menlo, Monaco, Consolas, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1
    fontFeature: "\"tnum\" 1"
rounded:
  swatch: "2px"
  xs: "4px"
  sm: "8px"
  md: "10px"
  control: "12px"
  panel: "16px"
  pill: "999px"
spacing:
  "0-5": "2px"
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
components:
  button-secondary:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-secondary-hover:
    backgroundColor: "{colors.raised-hover}"
  button-secondary-sm:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-ghost-sm:
    textColor: "{colors.text-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-ghost-sm-hover:
    backgroundColor: "{colors.hover-wash-strong}"
  nav-pill:
    textColor: "{colors.text-secondary}"
    typography: "{typography.nav}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "32px"
  nav-pill-hover:
    backgroundColor: "{colors.hover-wash}"
    textColor: "{colors.text-primary}"
  nav-pill-active:
    backgroundColor: "{colors.accent-selected}"
    textColor: "{colors.instrument-blue}"
  panel:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "20px"
  panel-compact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "16px"
  input-search:
    backgroundColor: "{colors.raised}"
    textColor: "{colors.text-primary}"
    typography: "{typography.body-small}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  table-head:
    textColor: "{colors.text-muted}"
    typography: "{typography.label-micro}"
  summary-value-lead:
    textColor: "{colors.text-primary}"
    typography: "{typography.data-hero}"
  summary-value:
    textColor: "{colors.text-primary}"
    typography: "{typography.data-lg}"
  page-button:
    textColor: "{colors.text-secondary}"
    typography: "{typography.data}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "32px"
  page-button-current:
    backgroundColor: "{colors.accent-selected}"
    textColor: "{colors.instrument-blue}"
---

# Design System: Lumix Analytics

## Direction

A quiet overall-volume dashboard with transaction details on demand. The user's current brief supersedes the earlier timeframe-controlled and non-expandable table variants. Preserve the existing Lumix dark world, header, footer, fonts, and `design-system/` package.

Analytics-specific CSS stays in `styles/shell.css`, `styles/overview.css`, and `styles/transactions.css`.

## Color, depth, and typography

Use the inherited neutral ladder: Canvas `#0a0a0b`, Surface `#141416`, Raised `#1c1c1f`, Hairline `#2a2a2d`. Primary text is `#f4f4f5`, secondary `#a1a1a6`, muted `#85858b`. Poly Blue `#2e5cff` draws the area-chart stroke and aggregator venue bars. Its area fill fades vertically from 24% opacity to transparent. Instrument Blue `#8fa6ff` distinguishes Stellar AMM venue bars and remains selected-navigation text and focus/caret color.

Inter Variable for words. Use the inherited tabular mono stack for money, quantities, counts, hashes, accounts, and pagination. The main volume is 2rem on desktop, 1.125rem on compact layouts; supporting totals are 1.375rem and 1.125rem respectively.

Panels retain 16px corners and one hairline, without shadows. Controls use inherited radii, focus rings, hover treatments, and 44px mobile targets. Do not replace Inter because of a generic overused-font warning.

## Overview

The page has a bare title without timeframe selection or period query logic. The general overall dataset supplies all metrics.

The top card is a 7:3 grid: a smooth blue area chart on the left, three vertically spaced metrics on the right (Total volume, Total swaps, Total users). No visible dollar/date ticks, axes, gridlines, metric switches, or legend. A 1px separator floats at 75% of the metric column height, centered vertically and clear of the card edges. Curve control points stay between actual endpoints. A visually hidden table provides equivalent overall-volume data. The line and gradient share a 1400ms left-to-right clip-path entrance on mount, disabled for reduced motion.

On mobile the card retains chart-left / vertical-metrics-right, with narrower proportions and smaller data type to avoid overflow.

Venues has two groups: Lumix aggregator (Soroswap, Aquarius, Phoenix, Sushi, Comet) and Stellar AMM (Liquidity pools, Order book). Render the API's protocol arrays, including any additional categories it returns. A row is a venue name on the left and a thin blue bar on the right. Each bar uses its protocol's `sharePct` directly, not normalization against the largest venue. There are no visible dollar amounts, percentages, group totals, or extra descriptions.

Top pairs shows five Pair/Volume entries. Its table does not flex-grow: keep the column headers directly beneath the title with a 12px gap, rather than distributing spare card height into the table header. Latest swaps shows five rich, expandable rows.

## Shared swap tables

Overview columns: Swap, Route, Value, Time. Transactions adds Transaction (truncated hash), 20 rows per page, and Previous/Next pagination with current page / total pages. The live API does not support search, so the old local-only search is removed. Neither table has a Status column.

Swap contains both asset icons, formatted decimal-string amounts, and API asset symbols joined by the authored arrow icon. Route shows Aggregator or Stellar AMM from `venue`, plus the API's `routeSummary` in smaller muted text. Do not infer protocol names or hop counts. Value is USD, with a dash for an unpriced transaction, and Time uses strict UTC calendar dates in `YYYY-MM-DD` format.

Each row has a native disclosure button with `aria-expanded` and `aria-controls`; clicking elsewhere on the summary row also toggles it. Only one row in a table opens at a time. The chevron rotates, without adding another column. Summary-row backgrounds are hover-only, never persisted by expansion state. Table content sits 32px from desktop card edges and 24px from mobile card edges.

The detail region contains a full copyable transaction hash linking to Mainnet Stellar Expert in a new tab. Its route section clearly shows Lumix Aggregator or Stellar AMM, the API-provided protocol summary, and total token transfer amounts. The drawer ends immediately after that summary. Individual legs, split routes, intermediate tokens, and per-hop amounts are intentionally omitted. Trader account, ledger, and UTC timestamp sections are removed. Long identifiers wrap. Only the backend's completed transaction feed is displayed; no status is inferred. No fees, slippage, or expanded analytics are added.

## Responsive behavior and states

Below 768px, breakdown panels stack. Swap rows become compact multi-line layouts while retaining all fields, including token icons and transaction hash. Detail facts become a single column. Pagination arrows, row toggles, and copy controls have 44px mobile targets.

Use semantic headings, tables, visible keyboard focus, copy announcements, and reduced-motion support. Subtle pulse skeletons match the chart/metrics split and five-column, 20-row transaction table. They also replace pending transaction-page results during pagination. Zero metrics stay zero. An empty chart has a quiet blue baseline without generated points. Empty pairs and transaction tables have a placeholder row saying "No transactions recorded yet."

Every displayed analytic comes from an uncached request through `lib/api.ts` to the live modular `/v1/analytics/*` endpoints. `NEXT_PUBLIC_API_URL` selects the backend. Widget responses are top-level objects; transactions retain their `data` / `page` envelope. Failed requests show an explicit retryable error instead of invented data or zero totals.

## Shell, favicon, and provenance

The Lumix header and footer remain unchanged, including the footer risk disclaimer.

`app/icon.tsx` is copied byte-for-byte from `lumix-front/app/icon.tsx`. It uses Next.js ImageResponse with a transparent background, 38×38 output, and the same 32×40 white Lumix logo placement. The logo source `design-system/assets/lumix-logo-icon-white.png` has the same SHA-256 in both apps. This replaces the previous dark rounded-square `app/icon.png`. A plain `img` is required by the image renderer, so its Next Image lint exemption is scoped to this one file.

Wordmark, logo, and token artwork retain existing provenance. No new artwork or palette changes are needed.
