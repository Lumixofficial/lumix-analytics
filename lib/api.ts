import { TRANSACTIONS_PAGE_SIZE } from "./analytics/pagination";
import type {
  AnalyticsSummary,
  ChartData,
  TransactionItem,
  TransactionsResponse,
  VenuesData,
} from "./analytics/types";

const TIMEOUT_MS = 10_000;
type Validator<T> = (value: unknown) => value is T;

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);
const isNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const isCount = (value: unknown): value is number => isNumber(value) && Number.isSafeInteger(value) && value >= 0;
const isDecimal = (value: unknown): value is string =>
  typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value));
const isTimestamp = (value: unknown): value is string =>
  typeof value === "string" && Number.isFinite(Date.parse(value));

const isSummary: Validator<AnalyticsSummary> = (value): value is AnalyticsSummary =>
  isObject(value) && isDecimal(value.totalVolumeUsd) && isCount(value.totalSwaps) && isCount(value.totalUsers);

const isChart: Validator<ChartData> = (value): value is ChartData =>
  isObject(value) && Array.isArray(value.points) &&
  value.points.every((point: unknown) => isObject(point) && isTimestamp(point.timestamp) && isNumber(point.volumeUsd));

function isVenueGroup(value: unknown): value is VenuesData["aggregator"] {
  return isObject(value) && isDecimal(value.volumeUsd) && isNumber(value.sharePct) &&
    Array.isArray(value.protocols) && value.protocols.every((protocol: unknown) =>
      isObject(protocol) && typeof protocol.name === "string" && isDecimal(protocol.volumeUsd) && isNumber(protocol.sharePct));
}

const isVenues: Validator<VenuesData> = (value): value is VenuesData =>
  isObject(value) && isVenueGroup(value.aggregator) && isVenueGroup(value.stellarAmm);

function isAsset(value: unknown): value is TransactionItem["assetIn"] {
  return isObject(value) && typeof value.id === "string" && typeof value.symbol === "string" &&
    isCount(value.decimals) && (value.contractId === undefined || typeof value.contractId === "string") &&
    (value.issuer == null || typeof value.issuer === "string");
}

function isTransaction(value: unknown): value is TransactionItem {
  return isObject(value) && typeof value.id === "string" && typeof value.txHash === "string" &&
    typeof value.pair === "string" && isAsset(value.assetIn) && isAsset(value.assetOut) &&
    isDecimal(value.amountIn) && isDecimal(value.amountOut) && (value.valueUsd === null || isDecimal(value.valueUsd)) &&
    (value.venue === "CONTRACT_AGGREGATOR" || value.venue === "STELLAR_NATIVE") &&
    typeof value.routeSummary === "string" && isTimestamp(value.timestamp);
}

const isTransactions: Validator<TransactionsResponse> = (value): value is TransactionsResponse =>
  isObject(value) && Array.isArray(value.data) && value.data.every(isTransaction) &&
  isObject(value.page) && isCount(value.page.page) && value.page.page > 0 &&
  isCount(value.page.limit) && value.page.limit > 0 && isCount(value.page.total) && isCount(value.page.totalPages);

async function read<T>(path: string, validate: Validator<T>): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
  if (!baseUrl) throw new Error("NEXT_PUBLIC_API_URL must be configured to load live analytics.");

  const response = await fetch(`${baseUrl}/v1/analytics${path}`, {
    cache: "no-store",
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Analytics API returned HTTP ${response.status} for ${path.split("?")[0]}.`);

  const body: unknown = await response.json();
  if (!validate(body)) throw new Error(`Analytics API returned an invalid response for ${path.split("?")[0]}.`);
  return body;
}

export const getAnalyticsSummary = () => read("/summary", isSummary);
export const getChartData = () => read("/chart?interval=1d", isChart);
export const getVenuesData = () => read("/venues", isVenues);

export function getTransactions(page = 1, limit = TRANSACTIONS_PAGE_SIZE) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sort: "-timestamp" });
  return read(`/transactions?${params}`, isTransactions);
}
