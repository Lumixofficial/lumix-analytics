## Scope

Two-page Operate surface for `analytics.lumixmarket.com`: `/` Overview and `/transactions`. Shared shell: header with Lumix wordmark, an Analytics label, and Overview/Transactions navigation; footer identical to the app `/spot` footer.

## Audience and task

Lumix team, partners, and curious traders checking spot traction (volume, swap count, traders, growth) and auditing individual swaps. Frequent quick reads on desktop; occasional phone checks.

## Content and states

Sample data until lumix-API exposes analytics endpoints; every view labels the data source (Sample data, Live, Stale, Unavailable). Loading uses skeletons sized to final content. Empty filter results name the active filters and offer a reset.

## Direction contract

THESIS: Analytics as an audit trail, not a KPI wall. Each headline figure sits on the chart it summarizes, and each swap opens into its ledger trace. This refuses the category default of four same-size KPI cards above a generic line chart.

OWN-WORLD: The Lumix dark Pure Gray ladder with 1px quiet borders and 16px panels. Poly Blue marks the aggregator series and Instrument Blue the Stellar AMM series. Navigation uses pills, labels use Inter, financial values use tabular mono, and charts use dashed 4–4 grids.

STORY: The visitor picks a period and reads volume, swaps, and traders. They see the daily trend and the aggregator/AMM split, then check which venues and pairs carry it. From there they drop into Transactions to audit a swap down to its pool hops and explorer links.

FIRST VIEWPORT: A title row with the period segmented control on the right. One full-width ledger panel holds a divided summary strip (Volume, Swaps, Traders, Avg swap, Routed volume) above a stacked daily bar chart about 240px tall, with a hover readout. Below it, venue share and top pairs sit side by side.

FORM: Established-world extension with a first-ranked "statement of account" structure; seed key established-world/direct-brief. Signature interaction: chart hover readout and a swap row that expands into a route trace (pay asset → legs and venue hops → receive asset) with ledger metadata.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

The lumix-API analytics contract (endpoint names, cursor versus page pagination) is to be decided with the user later.
