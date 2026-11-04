const financial = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const integer = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const precise = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 7 });

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const clean = (value: number) => (Math.abs(value) < 0.005 ? 0 : value);

export const DASH = "\u2014";

type NumericValue = number | string | null | undefined;

function finiteNumber(value: NumericValue) {
  if (value == null || (typeof value === "string" && value.trim() === "")) return null;
  const number = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(number) ? number : null;
}

export function formatUsd(value: NumericValue) {
  const number = finiteNumber(value);
  if (number === null) return DASH;
  const v = clean(number);
  return `${v < 0 ? "\u2212" : ""}$${financial.format(Math.abs(v))}`;
}

export function formatUsdWhole(value: NumericValue) {
  const number = finiteNumber(value);
  if (number === null) return DASH;
  return `${number < 0 ? "\u2212" : ""}$${integer.format(Math.abs(Math.round(number)))}`;
}

export function formatCompactUsd(value: number) {
  if (!Number.isFinite(value)) return DASH;
  if (value === 0) return "$0";
  return `$${compact.format(value)}`;
}

export function formatAmount(value: NumericValue) {
  const number = finiteNumber(value);
  if (number === null) return DASH;
  if (number !== 0 && Math.abs(number) < 0.01) return number < 0 ? "\u2212<0.01" : "<0.01";
  return financial.format(number);
}

/** Network fees are fractions of a lumen; two decimals would round them to a fabricated zero. */
export function formatXlmFee(value: number) {
  if (!Number.isFinite(value)) return DASH;
  return `${precise.format(value)} XLM`;
}

export function formatCount(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value)) return DASH;
  return integer.format(value);
}

export function formatCompactCount(value: number) {
  if (!Number.isFinite(value)) return DASH;
  return compact.format(value);
}

export function formatPct(value: number | null | undefined, digits = 1) {
  if (value == null || !Number.isFinite(value)) return DASH;
  return `${value.toFixed(digits)}%`;
}

export function formatChange(current: number, previous: number | null | undefined) {
  if (previous == null || !Number.isFinite(previous) || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(pct * 10) / 10;
  const sign = rounded > 0 ? "+" : rounded < 0 ? "\u2212" : "";
  return { pct: rounded, label: `${sign}${Math.abs(rounded).toFixed(1)}%` };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Calendar date in UTC, independent of the viewer's timezone. */
export function formatIsoDateUtc(iso: string) {
  const date = new Date(iso);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : DASH;
}

export function formatDateUtc(iso: string, withYear = false) {
  const d = new Date(iso);
  const base = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
  return withYear ? `${base}, ${d.getUTCFullYear()}` : base;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatWeekdayDateUtc(iso: string) {
  return `${WEEKDAYS[new Date(iso).getUTCDay()]}, ${formatDateUtc(iso, true)}`;
}

export function formatRangeUtc(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  return `${formatDateUtc(startIso, !sameYear)} \u2013 ${formatDateUtc(endIso, true)}`;
}

export function formatTimeUtc(iso: string, seconds = false) {
  const d = new Date(iso);
  const time = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
  return seconds ? `${time}:${pad(d.getUTCSeconds())}` : time;
}

export function formatDateTimeUtc(iso: string) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${formatTimeUtc(iso, true)} UTC`;
}

/** Relative to the dataset's as-of time, not the viewer's clock, so server and client agree. */
export function formatRelative(iso: string, referenceIso: string) {
  const seconds = Math.max(0, Math.round((Date.parse(referenceIso) - Date.parse(iso)) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (days < 365) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function shortHash(hash: string) {
  return hash.length > 14 ? `${hash.slice(0, 6)}\u2026${hash.slice(-6)}` : hash;
}

export function shortAddress(address: string) {
  return address.length > 10 ? `${address.slice(0, 4)}\u2026${address.slice(-4)}` : address;
}
