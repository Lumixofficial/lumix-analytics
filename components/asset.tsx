import Image from "next/image";
import { assetInfo } from "@/lib/analytics/assets";
import type { TransactionItem } from "@/lib/analytics/types";
import { formatAmount } from "@/lib/format";
import { Icon } from "./icon";

export function AssetMark({ code, size = 20 }: { code: string; size?: number }) {
  const info = assetInfo(code);
  if (!info.icon) {
    return (
      <span className="asset-mark asset-mark--initials" style={{ width: size, height: size }} aria-hidden="true">
        {code.slice(0, 1)}
      </span>
    );
  }
  return <Image className="asset-mark" src={info.icon} alt="" aria-hidden="true" width={size} height={size} unoptimized />;
}

export function PairMark({ base, quote }: { base: string; quote: string }) {
  return (
    <span className="pair-mark" aria-hidden="true">
      <AssetMark code={base} size={18} />
      <AssetMark code={quote} size={18} />
    </span>
  );
}

export function AssetAmount({ code, amount }: { code: string; amount: string }) {
  return (
    <span className="asset-amount">
      <AssetMark code={code} size={18} />
      <span className="trade-number">{formatAmount(amount)}</span>
      <span className="asset-code">{code}</span>
    </span>
  );
}

export function SwapAmounts({ swap }: { swap: TransactionItem }) {
  return (
    <span className="swap-amounts">
      <AssetAmount code={swap.assetIn.symbol} amount={swap.amountIn} />
      <span className="swap-out">
        <Icon name="arrow-right" size={12} className="swap-arrow" />
        <span className="trade-sr-only">to</span>
        <AssetAmount code={swap.assetOut.symbol} amount={swap.amountOut} />
      </span>
    </span>
  );
}
