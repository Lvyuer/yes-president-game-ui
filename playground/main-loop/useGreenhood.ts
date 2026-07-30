import { computed, reactive, ref } from 'vue';
import {
  DEFAULT_TRADE_LOT,
  formatPrice,
  formatPnl,
  formatShareLot,
  formatUsdCompact,
  GREENHOOD_SYMBOLS,
  INITIAL_CASH_USD,
  priceSeries,
  type GreenhoodMarketPhase,
  type GreenhoodSymbolId,
  type TradeResult,
} from './greenhoodMarket';

export type GreenhoodPosition = {
  shares: number;
  avgCost: number;
};

export type GreenhoodTradeToast = {
  id: number;
  message: string;
  tone: 'buy' | 'sell' | 'sell-win' | 'info';
};

export type GreenhoodLastTradeResult = {
  id: number;
  side: 'sell';
  symbolId: GreenhoodSymbolId;
  symbolLabel: string;
  ticker: string;
  realizedUsd: number;
  proceedsUsd: number;
  profitable: boolean;
};

export type TradeMark = {
  tapeIndex: number;
  side: 'buy' | 'sell';
  price: number;
};

type SymbolTape = {
  prices: number[];
  phase: GreenhoodMarketPhase;
  cursor: number;
};

function emptyPositions(): Record<GreenhoodSymbolId, GreenhoodPosition> {
  return {
    tech: { shares: 0, avgCost: 0 },
    defense: { shares: 0, avgCost: 0 },
    port: { shares: 0, avgCost: 0 },
  };
}

function emptyTradeMarks(): Record<GreenhoodSymbolId, TradeMark[]> {
  return { tech: [], defense: [], port: [] };
}

function seedTape(symbolId: GreenhoodSymbolId, phase: GreenhoodMarketPhase): SymbolTape {
  const series = priceSeries(symbolId, phase);
  return {
    prices: [series[0]!],
    phase,
    cursor: 0,
  };
}

function emptyTapes(): Record<GreenhoodSymbolId, SymbolTape> {
  return {
    tech: seedTape('tech', 'baseline'),
    defense: seedTape('defense', 'baseline'),
    port: seedTape('port', 'baseline'),
  };
}

let toastCounter = 0;
let tradeResultCounter = 0;

export function useGreenhood() {
  const cashUsd = ref(INITIAL_CASH_USD);
  const positions = reactive(emptyPositions());
  const tapes = reactive(emptyTapes());
  const tradeMarks = reactive(emptyTradeMarks());
  const insiderPrimed = ref<Set<GreenhoodSymbolId>>(new Set());
  const chipBoosted = ref(false);
  const weekRealizedUsd = ref(0);
  const hasTradedThisWeek = ref(false);
  const hasBoughtTechThisWeek = ref(false);
  const hasSoldTechThisWeek = ref(false);
  const insiderTipReceived = ref(false);
  const lastToast = ref<GreenhoodTradeToast | null>(null);
  const lastTradeResult = ref<GreenhoodLastTradeResult | null>(null);

  const symbols = GREENHOOD_SYMBOLS;

  function isInsiderPrimed(symbolId: GreenhoodSymbolId): boolean {
    return insiderPrimed.value.has(symbolId);
  }

  function marketPhase(symbolId: GreenhoodSymbolId): GreenhoodMarketPhase {
    if (symbolId === 'tech' && chipBoosted.value) return 'chip';
    if (insiderPrimed.value.has(symbolId)) return 'tip';
    return 'baseline';
  }

  function currentPrice(symbolId: GreenhoodSymbolId): number {
    const prices = tapes[symbolId].prices;
    return prices[prices.length - 1] ?? 0;
  }

  function priceHistory(symbolId: GreenhoodSymbolId): number[] {
    return [...tapes[symbolId].prices];
  }

  function canRefresh(symbolId: GreenhoodSymbolId): boolean {
    const tape = tapes[symbolId];
    const series = priceSeries(symbolId, tape.phase);
    return tape.cursor + 1 < series.length;
  }

  function unrealizedPnl(symbolId: GreenhoodSymbolId): number {
    const pos = positions[symbolId];
    if (pos.shares <= 0) return 0;
    return (currentPrice(symbolId) - pos.avgCost) * pos.shares;
  }

  const totalUnrealizedUsd = computed(() =>
    symbols.reduce((sum, sym) => sum + unrealizedPnl(sym.id), 0),
  );

  const portfolioValueUsd = computed(
    () =>
      cashUsd.value +
      symbols.reduce((sum, sym) => sum + positions[sym.id].shares * currentPrice(sym.id), 0),
  );

  function pushToast(message: string, tone: GreenhoodTradeToast['tone']) {
    toastCounter += 1;
    lastToast.value = { id: toastCounter, message, tone };
  }

  function pushTradeMark(
    symbolId: GreenhoodSymbolId,
    side: TradeMark['side'],
    price: number,
  ) {
    const tapeIndex = tapes[symbolId].prices.length - 1;
    tradeMarks[symbolId].push({ tapeIndex, side, price });
  }

  function advanceTick(symbolId: GreenhoodSymbolId): boolean {
    const tape = tapes[symbolId];
    const series = priceSeries(symbolId, tape.phase);
    if (tape.cursor + 1 >= series.length) {
      return false;
    }
    tape.cursor += 1;
    tape.prices.push(series[tape.cursor]!);
    return true;
  }

  function switchPhase(symbolId: GreenhoodSymbolId, phase: GreenhoodMarketPhase) {
    const tape = tapes[symbolId];
    if (tape.phase === phase) return;
    tape.phase = phase;
    tape.cursor = 0;
    const series = priceSeries(symbolId, phase);
    tape.prices.push(series[0]!);
  }

  function refresh(symbolId: GreenhoodSymbolId): TradeResult {
    if (advanceTick(symbolId)) {
      pushToast(`${getSymbolLabel(symbolId)} 行情刷新`, 'info');
      return { ok: true, message: '行情已刷新' };
    }
    return { ok: false, message: '本段行情已走完' };
  }

  function getSymbolLabel(symbolId: GreenhoodSymbolId): string {
    return symbols.find((item) => item.id === symbolId)?.name ?? symbolId;
  }

  function getSymbolTicker(symbolId: GreenhoodSymbolId): string {
    return symbols.find((item) => item.id === symbolId)?.ticker ?? symbolId.toUpperCase();
  }

  function buy(symbolId: GreenhoodSymbolId, shares = DEFAULT_TRADE_LOT): TradeResult {
    const price = currentPrice(symbolId);
    const cost = price * shares;
    if (cost > cashUsd.value) {
      return { ok: false, message: '现金不足' };
    }

    const pos = positions[symbolId];
    const totalShares = pos.shares + shares;
    pos.avgCost =
      totalShares === 0
        ? 0
        : (pos.avgCost * pos.shares + price * shares) / totalShares;
    pos.shares = totalShares;
    cashUsd.value -= cost;
    hasTradedThisWeek.value = true;
    if (symbolId === 'tech') hasBoughtTechThisWeek.value = true;
    pushTradeMark(symbolId, 'buy', price);

    pushToast(
      `买入 ${formatShareLot(shares)} ${getSymbolLabel(symbolId)} @ ${formatPrice(price)}`,
      'buy',
    );
    return {
      ok: true,
      message: `已买入 ${formatShareLot(shares)}，花费 ${formatUsdCompact(cost)}`,
    };
  }

  function sell(symbolId: GreenhoodSymbolId, shares?: number): TradeResult {
    const pos = positions[symbolId];
    const qty = shares ?? pos.shares;
    if (qty <= 0 || pos.shares < qty) {
      return { ok: false, message: '没有可卖持仓' };
    }

    const price = currentPrice(symbolId);
    const proceeds = price * qty;
    const realized = (price - pos.avgCost) * qty;
    weekRealizedUsd.value += realized;
    cashUsd.value += proceeds;
    pos.shares -= qty;
    if (pos.shares === 0) {
      pos.avgCost = 0;
    }
    hasTradedThisWeek.value = true;
    if (symbolId === 'tech') hasSoldTechThisWeek.value = true;
    pushTradeMark(symbolId, 'sell', price);

    const profitable = realized > 0;
    tradeResultCounter += 1;
    lastTradeResult.value = {
      id: tradeResultCounter,
      side: 'sell',
      symbolId,
      symbolLabel: getSymbolLabel(symbolId),
      ticker: getSymbolTicker(symbolId),
      realizedUsd: realized,
      proceedsUsd: proceeds,
      profitable,
    };

    if (profitable) {
      pushToast(
        `落袋 ${formatPnl(realized)} · ${getSymbolTicker(symbolId)} 卖出成功`,
        'sell-win',
      );
    } else {
      pushToast(
        `卖出 ${formatShareLot(qty)} ${getSymbolLabel(symbolId)} @ ${formatPrice(price)}（${formatPnl(realized)}）`,
        'sell',
      );
    }
    return {
      ok: true,
      message: `已卖出 ${formatShareLot(qty)}，入账 ${formatUsdCompact(proceeds)}（盈亏 ${formatPnl(realized)}）`,
      side: 'sell',
      symbolId,
      realizedUsd: realized,
      proceedsUsd: proceeds,
      profitable,
    };
  }

  function primeInsider(symbolId: GreenhoodSymbolId) {
    if (insiderPrimed.value.has(symbolId)) return;
    const next = new Set(insiderPrimed.value);
    next.add(symbolId);
    insiderPrimed.value = next;
    insiderTipReceived.value = true;
    switchPhase(symbolId, 'tip');
    pushToast(`${getSymbolLabel(symbolId)} 收到内线，可先建仓`, 'info');
  }

  /** 芯片放风帖发出后：TECH 切入强拉升序列（append 跳空点）。 */
  function boostFromChipPost(): boolean {
    if (chipBoosted.value) return false;
    chipBoosted.value = true;
    switchPhase('tech', 'chip');
    pushToast('政策放风，TECH 强势异动', 'info');
    return true;
  }

  function reseedTapes() {
    for (const sym of symbols) {
      const phase = marketPhase(sym.id);
      tapes[sym.id] = seedTape(sym.id, phase);
    }
    Object.assign(tradeMarks, emptyTradeMarks());
  }

  function startNewWeek() {
    weekRealizedUsd.value = 0;
    hasTradedThisWeek.value = false;
    hasBoughtTechThisWeek.value = false;
    hasSoldTechThisWeek.value = false;
    chipBoosted.value = false;
    reseedTapes();
  }

  function resetAll() {
    cashUsd.value = INITIAL_CASH_USD;
    Object.assign(positions, emptyPositions());
    Object.assign(tapes, emptyTapes());
    Object.assign(tradeMarks, emptyTradeMarks());
    insiderPrimed.value = new Set();
    chipBoosted.value = false;
    weekRealizedUsd.value = 0;
    hasTradedThisWeek.value = false;
    hasBoughtTechThisWeek.value = false;
    hasSoldTechThisWeek.value = false;
    insiderTipReceived.value = false;
    lastToast.value = null;
    lastTradeResult.value = null;
  }

  return {
    cashUsd,
    positions,
    tapes,
    tradeMarks,
    insiderPrimed,
    chipBoosted,
    weekRealizedUsd,
    hasTradedThisWeek,
    hasBoughtTechThisWeek,
    hasSoldTechThisWeek,
    insiderTipReceived,
    lastToast,
    lastTradeResult,
    symbols,
    totalUnrealizedUsd,
    portfolioValueUsd,
    isInsiderPrimed,
    marketPhase,
    currentPrice,
    priceHistory,
    canRefresh,
    unrealizedPnl,
    buy,
    sell,
    refresh,
    primeInsider,
    boostFromChipPost,
    startNewWeek,
    resetAll,
  };
}

export type GreenhoodStore = ReturnType<typeof useGreenhood>;
