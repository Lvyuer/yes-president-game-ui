/** Greenhood 脚本化行情与交易规则（playground） */

export type GreenhoodSymbolId = 'port' | 'defense' | 'tech';

export type GreenhoodSymbol = {
  id: GreenhoodSymbolId;
  name: string;
  ticker: string;
};

/** baseline=平淡 · tip=家族通气弱窗 · chip=政策放风强拉 */
export type GreenhoodMarketPhase = 'baseline' | 'tip' | 'chip';

export const GREENHOOD_SYMBOLS: GreenhoodSymbol[] = [
  { id: 'tech', name: '北美算力', ticker: 'TECH' },
  { id: 'defense', name: '军工复合体', ticker: 'DEF' },
  { id: 'port', name: '东方港口链', ticker: 'PORT' },
];

/** 本周已实现盈利超过此值 → 结束本周时判曝光（总统级内幕，千万起跳） */
export const LEAK_PROFIT_THRESHOLD_USD = 50_000_000;

/**
 * 单次默认手数：总统家族账户按「百万股」建仓。
 * TECH ~$120 → 约 $9.6 亿建仓；完整走通强拉窗口，账面可到上亿级已实现盈亏。
 */
export const DEFAULT_TRADE_LOT = 8_000_000;

/** 家族交易账户可用现金（美元） */
export const INITIAL_CASH_USD = 2_500_000_000;

/** F 芯片放风帖固定文案（脚本演示） */
export const CHIP_POLICY_POST_TEXT =
  '联邦算力采购将适度松绑。芯片与算力补贴窗口打开——分众国要赢这一仗。';

/** 平淡序列：小幅震荡 */
const BASELINE_PRICES: Record<GreenhoodSymbolId, number[]> = {
  tech: [118.4, 118.0, 117.6, 118.2, 118.8, 118.1, 117.9, 118.5, 118.3, 117.7],
  defense: [61.2, 61.0, 60.8, 61.1, 61.3, 61.0, 60.9, 61.2, 61.1, 60.7],
  port: [28.1, 28.0, 27.9, 28.2, 28.1, 27.8, 28.0, 27.9, 28.1, 28.0],
};

/** 家族通气后弱窗：可建仓，涨幅有限 */
const TIP_PRICES: Record<GreenhoodSymbolId, number[]> = {
  tech: [118.4, 119.1, 119.8, 120.4, 121.0, 121.3, 120.9, 120.6, 121.1, 120.8],
  defense: [61.2, 61.0, 60.9, 61.1, 60.8, 60.6, 60.9, 61.0, 60.7, 60.5],
  port: [28.1, 28.0, 27.9, 28.0, 27.8, 27.7, 27.9, 28.0, 27.8, 27.6],
};

/** 芯片政策帖放风后：强拉升 → 回吐（TECH 演示主线） */
const CHIP_PRICES: Record<GreenhoodSymbolId, number[]> = {
  tech: [121.0, 123.2, 126.0, 129.4, 132.8, 135.6, 138.2, 136.0, 133.1, 130.4, 128.6, 127.2, 126.4],
  defense: TIP_PRICES.defense,
  port: TIP_PRICES.port,
};

export function getSymbol(id: GreenhoodSymbolId): GreenhoodSymbol {
  return GREENHOOD_SYMBOLS.find((item) => item.id === id)!;
}

export function priceSeries(
  symbolId: GreenhoodSymbolId,
  phase: GreenhoodMarketPhase,
): number[] {
  if (phase === 'chip') return CHIP_PRICES[symbolId];
  if (phase === 'tip') return TIP_PRICES[symbolId];
  return BASELINE_PRICES[symbolId];
}

export function parseDynastyWealth(value: string): number {
  const normalized = value.trim().toUpperCase();
  const match = normalized.match(/^\$?([\d.]+)\s*([KMB])?$/);
  if (!match) return 0;
  const amount = parseFloat(match[1]!);
  const unit = match[2];
  if (unit === 'K') return amount * 1_000;
  if (unit === 'M') return amount * 1_000_000;
  if (unit === 'B') return amount * 1_000_000_000;
  return amount;
}

export function formatDynastyWealth(usd: number): string {
  const safe = Math.max(0, usd);
  if (safe >= 1_000_000_000) {
    return `$${(safe / 1_000_000_000).toFixed(2)}B`;
  }
  if (safe >= 1_000_000) {
    return `$${(safe / 1_000_000).toFixed(1)}M`;
  }
  if (safe >= 1_000) {
    return `$${(safe / 1_000).toFixed(0)}K`;
  }
  return `$${Math.round(safe)}`;
}

export function formatUsdCompact(usd: number): string {
  const sign = usd < 0 ? '-' : '';
  const abs = Math.abs(usd);
  if (abs >= 1_000_000_000) {
    return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  }
  if (abs >= 1_000) {
    return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  }
  return `${sign}$${Math.round(abs)}`;
}

/** 手数展示：8000000 → 800万股 */
export function formatShareLot(shares: number): string {
  if (shares <= 0) return '0股';
  if (shares >= 10_000) {
    const wan = shares / 10_000;
    return Number.isInteger(wan) ? `${wan}万股` : `${wan.toFixed(1)}万股`;
  }
  return `${shares}股`;
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function formatPnl(usd: number): string {
  const sign = usd > 0 ? '+' : usd < 0 ? '-' : '';
  return `${sign}${formatUsdCompact(Math.abs(usd))}`;
}

export type TradeResult =
  | {
      ok: true;
      message: string;
      side?: 'buy' | 'sell';
      symbolId?: GreenhoodSymbolId;
      realizedUsd?: number;
      proceedsUsd?: number;
      profitable?: boolean;
    }
  | { ok: false; message: string };

export function buyCost(price: number, shares: number): number {
  return price * shares;
}

export function sellProceeds(price: number, shares: number): number {
  return price * shares;
}
