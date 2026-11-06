export const TRANSACTIONS_PAGE_SIZE = 10;
export const MAX_TRANSACTION_PAGE = 100_000;

export function parsePage(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) return 1;
  const page = Number(raw);
  return Number.isSafeInteger(page) && page >= 1 && page <= MAX_TRANSACTION_PAGE ? page : 1;
}

export function transactionsHref(page: number) {
  return page > 1 ? `/transactions?page=${page}` : "/transactions";
}
