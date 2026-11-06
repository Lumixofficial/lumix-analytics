export interface AnalyticsSummary {
  totalVolumeUsd: string;
  totalSwaps: number;
  totalUsers: number;
}

export interface ChartData {
  points: {
    timestamp: string;
    volumeUsd: number;
  }[];
}

export interface VenuesData {
  aggregator: {
    volumeUsd: string;
    sharePct: number;
    protocols: { name: string; volumeUsd: string; sharePct: number }[];
  };
  stellarAmm: {
    volumeUsd: string;
    sharePct: number;
    protocols: { name: string; volumeUsd: string; sharePct: number }[];
  };
}

export interface TransactionItem {
  id: string;
  txHash: string;
  pair: string;
  assetIn: {
    id: string;
    contractId?: string;
    symbol: string;
    issuer?: string | null;
    decimals: number;
  };
  assetOut: {
    id: string;
    contractId?: string;
    symbol: string;
    issuer?: string | null;
    decimals: number;
  };
  amountIn: string;
  amountOut: string;
  valueUsd: string | null;
  venue: "CONTRACT_AGGREGATOR" | "STELLAR_NATIVE";
  routeSummary: string;
  timestamp: string;
}

export interface TransactionsResponse {
  data: TransactionItem[];
  page: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
