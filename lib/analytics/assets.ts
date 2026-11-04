export type AssetInfo = { code: string; name: string; icon: string | null };

export const ASSETS: Record<string, AssetInfo> = {
  XLM: { code: "XLM", name: "Stellar Lumens", icon: "/tokens/xlm.jpg" },
  USDC: { code: "USDC", name: "USD Coin", icon: "/tokens/usdc.svg" },
  AQUA: { code: "AQUA", name: "Aquarius", icon: "/tokens/aqua.png" },
  EURC: { code: "EURC", name: "Euro Coin", icon: "/tokens/eurc.svg" },
  yXLM: { code: "yXLM", name: "yXLM", icon: "/tokens/yxlm.png" },
  PYUSD: { code: "PYUSD", name: "PayPal USD", icon: "/tokens/pyusd.png" },
  USTRY: { code: "USTRY", name: "Etherfuse USTRY", icon: "/tokens/ustry.png" },
  CETES: { code: "CETES", name: "Etherfuse CETES", icon: "/tokens/cetes.png" },
  SHX: { code: "SHX", name: "Stronghold SHX", icon: "/tokens/shx.png" },
};

export const assetInfo = (code: string): AssetInfo => (Object.hasOwn(ASSETS, code) ? ASSETS[code] : { code, name: code, icon: null });
