<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import gsap from 'gsap';
import type { GreenhoodLastTradeResult, GreenhoodStore } from './useGreenhood';
import { prefersReducedMotion } from './phoneMotion';
import {
  buildChartGeometry,
  chartWindow,
  domainFromPrices,
  flashChartGroup,
  flashPositionRow,
  flashPrice,
  flashRowPrice,
  growVisibleCount,
  GROW_DUR_INITIAL,
  openBaselineY,
  playNavBack,
  playNavForward,
  popTradeMark,
  pressButton,
  priceToChartY,
  pulseElements,
  spinRefreshIcon,
  staggerListRows,
  tapeIndexToChartPoint,
  type ChartScale,
} from './greenhoodMotion';
import {
  DEFAULT_TRADE_LOT,
  formatPnl,
  formatPrice,
  formatShareLot,
  formatUsdCompact,
  type GreenhoodSymbolId,
} from './greenhoodMarket';

const props = defineProps<{
  store: GreenhoodStore;
  locked?: boolean;
  guardMessage?: string;
}>();

const emit = defineEmits<{
  buy: [symbolId: GreenhoodSymbolId];
  sell: [symbolId: GreenhoodSymbolId];
  refresh: [symbolId: GreenhoodSymbolId];
}>();

type View = 'list' | 'detail';

const view = ref<View>('list');
const activeSymbolId = ref<GreenhoodSymbolId | null>(null);
const burstTrade = ref<GreenhoodLastTradeResult | null>(null);
const burstVisible = ref(false);
const summaryPulse = ref(false);
const sellBtnHit = ref(false);
const refreshing = ref(false);

const rootRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const detailRef = ref<HTMLElement | null>(null);
const burstRef = ref<HTMLElement | null>(null);
const burstPnlRef = ref<HTMLElement | null>(null);
const cashStatRef = ref<HTMLElement | null>(null);
const realizedStatRef = ref<HTMLElement | null>(null);
const portfolioStatRef = ref<HTMLElement | null>(null);
const sellBtnRef = ref<HTMLButtonElement | null>(null);
const buyBtnRef = ref<HTMLButtonElement | null>(null);
const refreshIconRef = ref<HTMLElement | null>(null);
const detailPriceRef = ref<HTMLElement | null>(null);
const positionRef = ref<HTMLElement | null>(null);
const chartGroupRef = ref<SVGGElement | null>(null);
const rowRefs = ref<Partial<Record<GreenhoodSymbolId, HTMLButtonElement>>>({});

const visibleCount = ref(0);
const chartPolylineStr = ref('');
const chartAreaPath = ref('');
const chartLastX = ref(0);
const chartLastY = ref(0);
const chartBaselineY = ref(0);
const showChartDot = ref(false);
const showCostLine = ref(false);
const costLineState = reactive({ y: 0 });
const chartDomain = reactive<ChartScale>({ min: 0, max: 1, open: 0 });
const tradeMarkRefs = ref<Record<string, SVGGElement | null>>({});

const lastSeenPrices = ref<Partial<Record<GreenhoodSymbolId, number>>>({});

let gsapCtx: gsap.Context | null = null;
let burstHideTimer: ReturnType<typeof setTimeout> | null = null;
let pulseClearTimer: ReturnType<typeof setTimeout> | null = null;
let sellHitTimer: ReturnType<typeof setTimeout> | null = null;
let navTween: gsap.core.Timeline | null = null;
let chartGrowTween: gsap.core.Tween | null = null;
let domainTween: gsap.core.Tween | null = null;
let costLineTween: gsap.core.Tween | null = null;
let refreshSpinTween: gsap.core.Tween | null = null;
let burstTween: gsap.core.Tween | null = null;
let burstPnlTween: gsap.core.Tween | null = null;
let lastToastId = 0;
let lastPriceFlash = 0;
let toastClearTimer: ReturnType<typeof setTimeout> | null = null;
let pendingListFlash: { id: GreenhoodSymbolId; openPrice: number } | null = null;
let detailPriceOnOpen = 0;

const visibleToast = ref<{
  id: number;
  message: string;
  tone: 'buy' | 'sell' | 'sell-win' | 'info';
} | null>(null);

const activeSymbol = computed(() =>
  activeSymbolId.value
    ? props.store.symbols.find((item) => item.id === activeSymbolId.value) ?? null
    : null,
);

const activePrice = computed(() =>
  activeSymbolId.value ? props.store.currentPrice(activeSymbolId.value) : 0,
);

const activeHistory = computed(() =>
  activeSymbolId.value ? props.store.priceHistory(activeSymbolId.value) : [],
);

const activePosition = computed(() =>
  activeSymbolId.value ? props.store.positions[activeSymbolId.value] : null,
);

const activeUnrealized = computed(() =>
  activeSymbolId.value ? props.store.unrealizedPnl(activeSymbolId.value) : 0,
);

const cashUsd = computed(() => props.store.cashUsd.value);
const portfolioValueUsd = computed(() => props.store.portfolioValueUsd.value);
const weekRealizedUsd = computed(() => props.store.weekRealizedUsd.value);
const symbols = computed(() => props.store.symbols);

const canRefreshActive = computed(() =>
  activeSymbolId.value ? props.store.canRefresh(activeSymbolId.value) : false,
);

const chartTradeMarks = computed(() => {
  if (!activeSymbolId.value) return [];
  const history = activeHistory.value;
  const marks = props.store.tradeMarks[activeSymbolId.value];
  const { windowStart } = chartWindow(history);
  return marks
    .filter((mark) => mark.tapeIndex >= windowStart)
    .map((mark) => {
      const point = tapeIndexToChartPoint(mark.tapeIndex, history, chartDomain);
      if (!point) return null;
      return { ...mark, x: point.x, y: point.y };
    })
    .filter((mark): mark is NonNullable<typeof mark> => mark !== null);
});

const priceDelta = computed(() => {
  const history = activeHistory.value;
  if (history.length < 2) return 0;
  return history[history.length - 1]! - history[history.length - 2]!;
});

function setRowRef(id: GreenhoodSymbolId, el: HTMLButtonElement | null) {
  if (el) rowRefs.value[id] = el;
}

function setTradeMarkRef(key: string, el: SVGGElement | null) {
  if (el) tradeMarkRefs.value[key] = el;
}

function getVisiblePricesForDomain(): number[] {
  const history = activeHistory.value;
  const { slice } = chartWindow(history);
  const count = Math.min(Math.ceil(visibleCount.value), slice.length);
  return slice.slice(0, Math.max(1, count));
}

function syncChartFromVisibleCount() {
  const history = activeHistory.value;
  if (history.length < 1) {
    chartPolylineStr.value = '';
    chartAreaPath.value = '';
    showChartDot.value = false;
    showCostLine.value = false;
    return;
  }

  const geom = buildChartGeometry(history, chartDomain, visibleCount.value);
  chartPolylineStr.value = geom.polylineStr;
  chartAreaPath.value = geom.areaPath;
  chartBaselineY.value = openBaselineY(chartDomain);
  if (geom.lastPoint) {
    chartLastX.value = geom.lastPoint.x;
    chartLastY.value = geom.lastPoint.y;
    showChartDot.value = visibleCount.value >= 1;
  } else {
    showChartDot.value = false;
  }

  const pos = activePosition.value;
  if (pos && pos.shares > 0) {
    showCostLine.value = true;
    costLineState.y = priceToChartY(pos.avgCost, chartDomain);
  } else {
    showCostLine.value = false;
  }
}

function retargetDomain(immediate = false) {
  const prices = getVisiblePricesForDomain();
  if (prices.length === 0) return;
  const next = domainFromPrices(prices);
  next.open = prices[0]!;

  domainTween?.kill();
  if (immediate || prefersReducedMotion()) {
    chartDomain.min = next.min;
    chartDomain.max = next.max;
    chartDomain.open = next.open;
    syncChartFromVisibleCount();
    return;
  }

  domainTween = gsap.to(chartDomain, {
    min: next.min,
    max: next.max,
    open: next.open,
    duration: 0.5,
    ease: 'power2.out',
    onUpdate: () => syncChartFromVisibleCount(),
    onComplete: () => {
      domainTween = null;
    },
  });
}

function tweenCostLine(targetY: number) {
  costLineTween?.kill();
  if (prefersReducedMotion()) {
    costLineState.y = targetY;
    return;
  }
  costLineTween = gsap.to(costLineState, {
    y: targetY,
    duration: 0.4,
    ease: 'power2.out',
    onComplete: () => {
      costLineTween = null;
    },
  });
}

function killChartGrowTween() {
  chartGrowTween?.kill();
  chartGrowTween = null;
}

function killAllChartMotion() {
  killChartGrowTween();
  domainTween?.kill();
  domainTween = null;
  costLineTween?.kill();
  costLineTween = null;
}

function killNavTween() {
  navTween?.kill();
  navTween = null;
}

function growChartTo(
  targetCount: number,
  options?: {
    flashDirection?: 'up' | 'down' | 'neutral';
    duration?: number;
  },
) {
  const from = visibleCount.value;
  killChartGrowTween();

  if (prefersReducedMotion() || targetCount <= from) {
    visibleCount.value = targetCount;
    retargetDomain(true);
    return;
  }

  retargetDomain();

  chartGrowTween = growVisibleCount(
    from,
    targetCount,
    (count) => {
      visibleCount.value = count;
      syncChartFromVisibleCount();
    },
    () => {
      chartGrowTween = null;
      retargetDomain();
      const dir = options?.flashDirection ?? 'neutral';
      flashChartGroup(chartGroupRef.value, dir);
    },
    options?.duration,
  );
}

function clearBurstTimers() {
  if (burstHideTimer) {
    clearTimeout(burstHideTimer);
    burstHideTimer = null;
  }
  if (pulseClearTimer) {
    clearTimeout(pulseClearTimer);
    pulseClearTimer = null;
  }
  if (sellHitTimer) {
    clearTimeout(sellHitTimer);
    sellHitTimer = null;
  }
  burstTween?.kill();
  burstTween = null;
  burstPnlTween?.kill();
  burstPnlTween = null;
}

function pulseSummaryStats(includePortfolio = false) {
  summaryPulse.value = true;
  pulseClearTimer = setTimeout(() => {
    summaryPulse.value = false;
    pulseClearTimer = null;
  }, 620);

  pulseElements([
    cashStatRef.value,
    realizedStatRef.value,
    includePortfolio ? portfolioStatRef.value : null,
  ]);
}

function flashSellButton() {
  sellBtnHit.value = true;
  sellHitTimer = setTimeout(() => {
    sellBtnHit.value = false;
    sellHitTimer = null;
  }, 520);
  pressButton(sellBtnRef.value);
}

function flashBuyButton() {
  pressButton(buyBtnRef.value);
}

async function showProfitBurst(trade: GreenhoodLastTradeResult) {
  clearBurstTimers();
  burstTrade.value = trade;
  burstVisible.value = true;
  pulseSummaryStats(true);
  flashSellButton();

  await nextTick();

  if (!prefersReducedMotion() && burstRef.value && burstPnlRef.value) {
    gsap.set(burstRef.value, { opacity: 0 });
    gsap.set(burstPnlRef.value, { scale: 0.72, opacity: 0 });
    burstTween = gsap.to(burstRef.value, {
      opacity: 1,
      duration: 0.16,
      ease: 'power2.out',
    });
    burstPnlTween = gsap.to(burstPnlRef.value, {
      scale: 1,
      opacity: 1,
      duration: 0.42,
      ease: 'back.out(1.8)',
    });
  }

  burstHideTimer = setTimeout(() => {
    if (!prefersReducedMotion() && burstRef.value) {
      burstTween = gsap.to(burstRef.value, {
        opacity: 0,
        duration: 0.22,
        ease: 'power2.in',
        onComplete: () => {
          burstVisible.value = false;
          burstTrade.value = null;
        },
      });
      return;
    }
    burstVisible.value = false;
    burstTrade.value = null;
  }, prefersReducedMotion() ? 1200 : 1500);
}

watch(
  () => props.store.lastTradeResult.value,
  (trade) => {
    if (!trade?.profitable) return;
    void showProfitBurst(trade);
  },
);

watch(
  () => props.store.lastToast.value,
  (toast) => {
    if (!toast || toast.id === lastToastId) return;
    lastToastId = toast.id;

    visibleToast.value = toast;
    if (toastClearTimer) clearTimeout(toastClearTimer);
    toastClearTimer = setTimeout(() => {
      if (visibleToast.value?.id === toast.id) {
        visibleToast.value = null;
      }
      toastClearTimer = null;
    }, 2800);

    if (toast.tone === 'buy') {
      pulseSummaryStats(true);
      flashBuyButton();
      flashPositionRow(positionRef.value);
    } else if (toast.tone === 'sell' || toast.tone === 'sell-win') {
      pulseSummaryStats(true);
    }
  },
);

watch(activeHistory, (history, prev) => {
  if (view.value !== 'detail' || history.length < 1) return;
  if (!prev || prev.length < 1) return;

  const prevWin = chartWindow(prev);
  const nextWin = chartWindow(history);

  const prevLast = prev[prev.length - 1]!;
  const nextLast = history[history.length - 1]!;
  const direction =
    nextLast > prevLast ? 'up' : nextLast < prevLast ? 'down' : 'neutral';

  if (nextWin.windowStart > prevWin.windowStart) {
    visibleCount.value = nextWin.slice.length;
    retargetDomain();
    syncChartFromVisibleCount();
    flashChartGroup(chartGroupRef.value, direction);
    return;
  }

  const fromCount = prevWin.slice.length;
  const toCount = nextWin.slice.length;
  if (toCount > fromCount) {
    visibleCount.value = fromCount;
    growChartTo(toCount, { flashDirection: direction });
  }
});

watch(
  () => activePosition.value?.avgCost,
  (avgCost) => {
    if (view.value !== 'detail' || !avgCost || (activePosition.value?.shares ?? 0) <= 0) {
      return;
    }
    showCostLine.value = true;
    tweenCostLine(priceToChartY(avgCost, chartDomain));
  },
);

watch(
  () =>
    activeSymbolId.value
      ? props.store.tradeMarks[activeSymbolId.value].length
      : 0,
  async () => {
    if (view.value !== 'detail') return;
    await nextTick();
    const marks = chartTradeMarks.value;
    const last = marks[marks.length - 1];
    if (!last) return;
    const key = `${last.tapeIndex}-${last.side}`;
    popTradeMark(tradeMarkRefs.value[key] ?? null);
  },
);

watch(activePrice, (price, prev) => {
  if (view.value !== 'detail' || price === prev) return;
  const now = Date.now();
  if (now - lastPriceFlash < 120) return;
  lastPriceFlash = now;
  if (price > prev) flashPrice(detailPriceRef.value, 'up');
  else if (price < prev) flashPrice(detailPriceRef.value, 'down');
});

function flashListRowOnReturn() {
  if (!pendingListFlash) return;
  const { id, openPrice } = pendingListFlash;
  pendingListFlash = null;
  const row = rowRefs.value[id];
  const closePrice = props.store.currentPrice(id);
  lastSeenPrices.value[id] = closePrice;
  if (closePrice === openPrice) return;
  flashRowPrice(row ?? null, closePrice > openPrice ? 'up' : 'down');
}

async function openSymbol(id: GreenhoodSymbolId, event?: MouseEvent) {
  if (props.locked || view.value === 'detail') return;

  const row = (event?.currentTarget ?? null) as HTMLElement | null;
  pressButton(row);

  activeSymbolId.value = id;
  const history = props.store.priceHistory(id);
  const win = chartWindow(history);
  detailPriceOnOpen = props.store.currentPrice(id);
  visibleCount.value = prefersReducedMotion() ? win.slice.length : 1;
  retargetDomain(true);
  syncChartFromVisibleCount();

  view.value = 'detail';

  await nextTick();
  killNavTween();
  navTween = playNavForward(listRef.value, detailRef.value);

  if (!prefersReducedMotion() && win.slice.length > 1) {
    growChartTo(win.slice.length, { duration: GROW_DUR_INITIAL });
  } else {
    visibleCount.value = win.slice.length;
    retargetDomain(true);
  }
}

async function backToList() {
  if (view.value === 'list') return;

  if (activeSymbolId.value) {
    const id = activeSymbolId.value;
    const closePrice = props.store.currentPrice(id);
    if (closePrice !== detailPriceOnOpen) {
      pendingListFlash = { id, openPrice: detailPriceOnOpen };
    }
    lastSeenPrices.value[id] = closePrice;
  }

  view.value = 'list';
  killNavTween();
  navTween = playNavBack(listRef.value, detailRef.value);

  if (navTween) {
    await navTween.then();
  }

  activeSymbolId.value = null;
  killAllChartMotion();
  visibleCount.value = 0;
  chartPolylineStr.value = '';
  chartAreaPath.value = '';
  showChartDot.value = false;
  showCostLine.value = false;
  tradeMarkRefs.value = {};

  await nextTick();
  if (listRef.value) {
    const rows = Array.from(
      listRef.value.querySelectorAll<HTMLElement>('.ml-greenhood__row'),
    );
    staggerListRows(rows);
    flashListRowOnReturn();
  }
}

function onBuy() {
  if (!activeSymbolId.value || props.locked) return;
  flashBuyButton();
  emit('buy', activeSymbolId.value);
}

function onSell() {
  if (!activeSymbolId.value || props.locked) return;
  pressButton(sellBtnRef.value);
  emit('sell', activeSymbolId.value);
}

function onRefresh() {
  if (!activeSymbolId.value || props.locked || refreshing.value || !canRefreshActive.value) return;
  refreshing.value = true;
  refreshSpinTween?.kill();
  refreshSpinTween = spinRefreshIcon(refreshIconRef.value);
  emit('refresh', activeSymbolId.value);
  setTimeout(() => {
    refreshing.value = false;
  }, 420);
}

function listChange(symbolId: GreenhoodSymbolId): number {
  const history = props.store.priceHistory(symbolId);
  if (history.length < 2) return 0;
  return history[history.length - 1]! - history[0]!;
}

onMounted(() => {
  if (rootRef.value) {
    gsapCtx = gsap.context(() => {}, rootRef.value);
  }
  if (listRef.value && detailRef.value) {
    gsap.set(listRef.value, { opacity: 1, x: 0, pointerEvents: 'auto' });
    gsap.set(detailRef.value, { opacity: 0, x: '24%', pointerEvents: 'none' });
  }
  for (const sym of props.store.symbols) {
    lastSeenPrices.value[sym.id] = props.store.currentPrice(sym.id);
  }
  void nextTick(() => {
    if (listRef.value) {
      const rows = Array.from(
        listRef.value.querySelectorAll<HTMLElement>('.ml-greenhood__row'),
      );
      staggerListRows(rows);
    }
  });
});

onBeforeUnmount(() => {
  clearBurstTimers();
  if (toastClearTimer) {
    clearTimeout(toastClearTimer);
    toastClearTimer = null;
  }
  killNavTween();
  killAllChartMotion();
  refreshSpinTween?.kill();
  gsapCtx?.revert();
  gsapCtx = null;
});
</script>

<template>
  <div ref="rootRef" class="ml-greenhood" :class="{ 'is-locked': locked }">
    <div v-if="locked && guardMessage" class="ml-greenhood__guard">
      <p>{{ guardMessage }}</p>
    </div>

    <header class="ml-greenhood__header">
      <button
        v-if="view === 'detail'"
        type="button"
        class="ml-greenhood__back"
        @click="backToList"
      >
        ← 行情
      </button>
      <div class="ml-greenhood__brand">
        <span class="ml-greenhood__logo">GH</span>
        <div>
          <h2 class="ml-greenhood__title">Greenhood</h2>
          <p class="ml-greenhood__subtitle">家族交易账户</p>
        </div>
      </div>
    </header>

    <div class="ml-greenhood__summary-wrap">
      <div
        class="ml-greenhood__summary"
        :class="{ 'is-pulse': summaryPulse }"
      >
        <div ref="cashStatRef" class="ml-greenhood__stat ml-greenhood__stat--cash">
          <span class="ml-greenhood__stat-label">现金</span>
          <strong>{{ formatUsdCompact(cashUsd) }}</strong>
        </div>
        <div ref="portfolioStatRef" class="ml-greenhood__stat ml-greenhood__stat--portfolio">
          <span class="ml-greenhood__stat-label">持仓市值</span>
          <strong>{{ formatUsdCompact(portfolioValueUsd - cashUsd) }}</strong>
        </div>
        <div ref="realizedStatRef" class="ml-greenhood__stat ml-greenhood__stat--realized">
          <span class="ml-greenhood__stat-label">本周已实现</span>
          <strong :class="{ up: weekRealizedUsd > 0, down: weekRealizedUsd < 0 }">
            {{ formatPnl(weekRealizedUsd) }}
          </strong>
        </div>
      </div>
    </div>

    <Transition name="ml-greenhood-toast">
      <div
        v-if="visibleToast"
        :key="visibleToast.id"
        class="ml-greenhood__toast"
        :data-tone="visibleToast.tone"
        role="status"
      >
        {{ visibleToast.message }}
      </div>
    </Transition>

    <Transition name="ml-greenhood-burst">
      <div
        v-if="burstVisible && burstTrade"
        ref="burstRef"
        class="ml-greenhood__burst"
        role="status"
        aria-live="polite"
      >
        <div class="ml-greenhood__burst-flash" aria-hidden="true" />
        <div class="ml-greenhood__burst-card">
          <p class="ml-greenhood__burst-kicker">已落袋</p>
          <p ref="burstPnlRef" class="ml-greenhood__burst-pnl">
            {{ formatPnl(burstTrade.realizedUsd) }}
          </p>
          <p class="ml-greenhood__burst-meta">
            {{ burstTrade.ticker }} · 入账 {{ formatUsdCompact(burstTrade.proceedsUsd) }}
          </p>
        </div>
      </div>
    </Transition>

    <div class="ml-greenhood__views">
      <div ref="listRef" class="ml-greenhood__list">
        <button
          v-for="symbol in symbols"
          :key="symbol.id"
          :ref="(el) => setRowRef(symbol.id, el as HTMLButtonElement | null)"
          type="button"
          class="ml-greenhood__row"
          :disabled="locked"
          @click="openSymbol(symbol.id, $event)"
        >
          <div class="ml-greenhood__row-main">
            <strong>{{ symbol.ticker }}</strong>
            <span>{{ symbol.name }}</span>
          </div>
          <div class="ml-greenhood__row-side">
            <strong>{{ formatPrice(store.currentPrice(symbol.id)) }}</strong>
            <span
              :class="{
                up: listChange(symbol.id) > 0,
                down: listChange(symbol.id) < 0,
              }"
            >
              {{ formatPnl(listChange(symbol.id)) }}
            </span>
            <span
              v-if="store.marketPhase(symbol.id) === 'chip'"
              class="ml-greenhood__tag"
            >
              放风
            </span>
            <span
              v-else-if="store.isInsiderPrimed(symbol.id)"
              class="ml-greenhood__tag"
            >
              弱窗
            </span>
          </div>
        </button>
      </div>

      <div
        v-show="view === 'detail' || activeSymbolId"
        ref="detailRef"
        class="ml-greenhood__detail"
      >
        <template v-if="activeSymbol">
          <div class="ml-greenhood__detail-head">
            <div>
              <h3>{{ activeSymbol.name }}</h3>
              <p>{{ activeSymbol.ticker }}</p>
            </div>
            <div ref="detailPriceRef" class="ml-greenhood__detail-price">
              <strong>{{ formatPrice(activePrice) }}</strong>
              <span :class="{ up: priceDelta > 0, down: priceDelta < 0 }">
                {{ formatPnl(priceDelta) }}
              </span>
            </div>
          </div>

          <div class="ml-greenhood__chart-wrap">
            <svg
              class="ml-greenhood__chart"
              viewBox="0 0 280 72"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="gh-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#5fd38a" stop-opacity="0.28" />
                  <stop offset="100%" stop-color="#5fd38a" stop-opacity="0" />
                </linearGradient>
              </defs>
              <g ref="chartGroupRef" class="ml-greenhood__chart-group">
                <line
                  class="ml-greenhood__chart-baseline"
                  x1="0"
                  :y1="chartBaselineY"
                  x2="280"
                  :y2="chartBaselineY"
                />
                <line
                  v-if="showCostLine"
                  class="ml-greenhood__chart-cost"
                  x1="0"
                  :y1="costLineState.y"
                  x2="280"
                  :y2="costLineState.y"
                />
                <text
                  v-if="showCostLine"
                  class="ml-greenhood__chart-cost-label"
                  x="276"
                  :y="Math.max(10, costLineState.y - 4)"
                  text-anchor="end"
                >
                  成本 {{ formatPrice(activePosition?.avgCost ?? 0) }}
                </text>
                <path
                  v-if="chartAreaPath"
                  class="ml-greenhood__chart-area"
                  :d="chartAreaPath"
                />
                <polyline
                  v-if="chartPolylineStr"
                  class="ml-greenhood__chart-line"
                  :points="chartPolylineStr"
                  fill="none"
                  stroke-width="2"
                  vector-effect="non-scaling-stroke"
                />
                <g
                  v-for="mark in chartTradeMarks"
                  :key="`${mark.tapeIndex}-${mark.side}`"
                  :ref="(el) => setTradeMarkRef(`${mark.tapeIndex}-${mark.side}`, el as SVGGElement)"
                  class="ml-greenhood__chart-mark"
                  :class="mark.side === 'buy' ? 'is-buy' : 'is-sell'"
                  :transform="`translate(${mark.x}, ${mark.y})`"
                >
                  <polygon
                    v-if="mark.side === 'buy'"
                    points="0,-5 4,3 -4,3"
                  />
                  <polygon
                    v-else
                    points="0,5 4,-3 -4,-3"
                  />
                </g>
                <g v-if="showChartDot" class="ml-greenhood__chart-dot">
                  <circle
                    class="ml-greenhood__chart-dot-halo"
                    :cx="chartLastX"
                    :cy="chartLastY"
                    r="6"
                  />
                  <circle
                    class="ml-greenhood__chart-dot-core"
                    :cx="chartLastX"
                    :cy="chartLastY"
                    r="3"
                  />
                </g>
              </g>
            </svg>
          </div>

          <div ref="positionRef" class="ml-greenhood__position">
            <span>持仓 {{ formatShareLot(activePosition?.shares ?? 0) }}</span>
            <span v-if="(activePosition?.shares ?? 0) > 0">
              成本 {{ formatPrice(activePosition?.avgCost ?? 0) }}
            </span>
            <span
              v-if="(activePosition?.shares ?? 0) > 0"
              :class="{ up: activeUnrealized > 0, down: activeUnrealized < 0 }"
            >
              浮盈 {{ formatPnl(activeUnrealized) }}
            </span>
          </div>

          <div class="ml-greenhood__actions">
            <div class="ml-greenhood__action-row">
              <button
                ref="buyBtnRef"
                type="button"
                class="ml-greenhood__action-btn ml-greenhood__action-btn--buy"
                :disabled="locked"
                @click="onBuy"
              >
                买入 {{ formatShareLot(DEFAULT_TRADE_LOT) }}
              </button>
              <button
                ref="sellBtnRef"
                type="button"
                class="ml-greenhood__action-btn ml-greenhood__action-btn--sell"
                :class="{ 'is-hit': sellBtnHit }"
                :disabled="locked || (activePosition?.shares ?? 0) <= 0"
                @click="onSell"
              >
                全部卖出
              </button>
            </div>
            <button
              type="button"
              class="ml-greenhood__action-btn ml-greenhood__action-btn--ghost"
              :disabled="locked || refreshing || !canRefreshActive"
              @click="onRefresh"
            >
              <span ref="refreshIconRef" class="ml-greenhood__refresh-icon" aria-hidden="true">↻</span>
              {{ canRefreshActive ? '刷新行情' : '本段行情已走完' }}
            </button>
          </div>

          <p v-if="store.marketPhase(activeSymbol.id) === 'chip'" class="ml-greenhood__hint">
            政策放风已发出：TECH 强势窗口，涨完可能回吐。
          </p>
          <p v-else-if="store.isInsiderPrimed(activeSymbol.id)" class="ml-greenhood__hint">
            家族群已通气：可先建仓。发算力松绑帖后才会猛拉。
          </p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-greenhood {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  padding: 14px 12px 18px;
  box-sizing: border-box;
  background: linear-gradient(180deg, #0d1412 0%, #101816 100%);
  color: #e8f2ee;
  overflow: hidden;
}

.ml-greenhood.is-locked {
  pointer-events: none;
  opacity: 0.72;
}

.ml-greenhood__guard {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}

.ml-greenhood__guard p {
  margin: 0;
  text-align: center;
  line-height: 1.5;
  color: #f0f0f0;
}

.ml-greenhood__header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ml-greenhood__back {
  border: 0;
  background: transparent;
  color: #7fd9a8;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 4px 0;
}

.ml-greenhood__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ml-greenhood__logo {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: #1f6b4a;
  color: #d7ffe8;
  font-weight: 700;
  font-size: 0.8rem;
}

.ml-greenhood__title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.2;
}

.ml-greenhood__subtitle {
  margin: 2px 0 0;
  font-size: 0.72rem;
  color: #8aa89a;
}

.ml-greenhood__summary-wrap {
  position: relative;
  flex-shrink: 0;
}

.ml-greenhood__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.ml-greenhood__summary.is-pulse .ml-greenhood__stat--cash,
.ml-greenhood__summary.is-pulse .ml-greenhood__stat--realized,
.ml-greenhood__summary.is-pulse .ml-greenhood__stat--portfolio {
  border-color: rgba(95, 211, 138, 0.55);
  box-shadow: 0 0 0 1px rgba(95, 211, 138, 0.18), 0 0 18px rgba(95, 211, 138, 0.12);
}

.ml-greenhood__summary.is-pulse .ml-greenhood__stat--cash strong,
.ml-greenhood__summary.is-pulse .ml-greenhood__stat--realized strong,
.ml-greenhood__summary.is-pulse .ml-greenhood__stat--portfolio strong {
  color: #7dffb0;
}

.ml-greenhood__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(127, 217, 168, 0.12);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ml-greenhood__stat-label {
  font-size: 0.68rem;
  color: #8aa89a;
}

.ml-greenhood__stat strong {
  font-size: 0.82rem;
}

.ml-greenhood__toast {
  flex-shrink: 0;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.78rem;
  line-height: 1.35;
  background: rgba(16, 24, 22, 0.96);
  border: 1px solid rgba(127, 217, 168, 0.22);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.28);
}

.ml-greenhood__toast[data-tone='buy'] {
  border-left: 3px solid #5fd38a;
}

.ml-greenhood__toast[data-tone='info'] {
  border-left: 3px solid #7fd9a8;
  color: #d7ffe8;
}

.ml-greenhood__toast[data-tone='sell'] {
  border-left: 3px solid #f0b35c;
}

.ml-greenhood__toast[data-tone='sell-win'] {
  border-left: 3px solid #5fd38a;
  background: rgba(95, 211, 138, 0.12);
  color: #d7ffe8;
  font-weight: 600;
}

.ml-greenhood-toast-enter-active {
  transition: opacity 0.22s ease, transform 0.28s ease;
}

.ml-greenhood-toast-leave-active {
  transition: opacity 0.18s ease, transform 0.2s ease;
}

.ml-greenhood-toast-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.ml-greenhood-toast-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.ml-greenhood__burst {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(4, 10, 8, 0.72);
  pointer-events: none;
}

.ml-greenhood__burst-flash {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(95, 211, 138, 0.28) 0%, rgba(95, 211, 138, 0) 62%);
  animation: ml-greenhood-flash 0.55s ease-out 1;
}

.ml-greenhood__burst-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.ml-greenhood__burst-kicker {
  margin: 0;
  font-size: 0.82rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #9fd9b8;
}

.ml-greenhood__burst-pnl {
  margin: 0;
  font-family: var(--yp-font-latin, system-ui, sans-serif);
  font-size: clamp(2.4rem, 12vw, 3.4rem);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: #7dffb0;
  text-shadow: 0 0 28px rgba(95, 211, 138, 0.35);
}

.ml-greenhood__burst-meta {
  margin: 0;
  font-size: 0.86rem;
  color: #c8e8d8;
}

.ml-greenhood-burst-enter-active,
.ml-greenhood-burst-leave-active {
  transition: opacity 0.2s ease;
}

.ml-greenhood-burst-enter-from,
.ml-greenhood-burst-leave-to {
  opacity: 0;
}

@keyframes ml-greenhood-flash {
  0% {
    opacity: 0.95;
    transform: scale(0.92);
  }
  100% {
    opacity: 0;
    transform: scale(1.08);
  }
}

.ml-greenhood__views {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ml-greenhood__list,
.ml-greenhood__detail {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
  will-change: transform, opacity;
}

.ml-greenhood__row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(127, 217, 168, 0.14);
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.22);
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ml-greenhood__row:hover:not(:disabled) {
  background: rgba(95, 211, 138, 0.08);
}

.ml-greenhood__row.is-row-flash-up {
  background: rgba(95, 211, 138, 0.14);
  border-color: rgba(95, 211, 138, 0.35);
}

.ml-greenhood__row.is-row-flash-down {
  background: rgba(240, 113, 113, 0.12);
  border-color: rgba(240, 113, 113, 0.3);
}

.ml-greenhood__row:disabled {
  cursor: not-allowed;
}

.ml-greenhood__row-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ml-greenhood__row-main strong {
  font-size: 0.95rem;
}

.ml-greenhood__row-main span {
  font-size: 0.75rem;
  color: #8aa89a;
}

.ml-greenhood__row-side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 0.78rem;
}

.ml-greenhood__tag {
  margin-top: 2px;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(95, 211, 138, 0.18);
  color: #7fd9a8;
  font-size: 0.65rem;
}

.ml-greenhood__detail {
  gap: 12px;
}

.ml-greenhood__detail-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.ml-greenhood__detail-head h3 {
  margin: 0;
  font-size: 1.05rem;
}

.ml-greenhood__detail-head p {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: #8aa89a;
}

.ml-greenhood__detail-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.ml-greenhood__detail-price.is-flash-up {
  background: rgba(95, 211, 138, 0.18);
}

.ml-greenhood__detail-price.is-flash-down {
  background: rgba(240, 113, 113, 0.16);
}

.ml-greenhood__detail-price strong {
  font-size: 1.1rem;
}

.ml-greenhood__chart-wrap {
  padding: 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(127, 217, 168, 0.1);
}

.ml-greenhood__chart {
  width: 100%;
  height: 72px;
  display: block;
}

.ml-greenhood__chart-group .ml-greenhood__chart-baseline {
  stroke: rgba(138, 168, 154, 0.35);
  stroke-width: 1;
  stroke-dasharray: 3 4;
  vector-effect: non-scaling-stroke;
}

.ml-greenhood__chart-group .ml-greenhood__chart-cost {
  stroke: rgba(255, 176, 72, 0.75);
  stroke-width: 1;
  stroke-dasharray: 4 3;
  vector-effect: non-scaling-stroke;
}

.ml-greenhood__chart-cost-label {
  fill: rgba(255, 196, 120, 0.9);
  font-size: 7px;
  font-family: var(--yp-font-sans, system-ui, sans-serif);
  pointer-events: none;
}

.ml-greenhood__chart-mark polygon {
  stroke-width: 0;
}

.ml-greenhood__chart-mark.is-buy polygon {
  fill: #5fd38a;
}

.ml-greenhood__chart-mark.is-sell polygon {
  fill: #f07171;
}

.ml-greenhood__chart-group .ml-greenhood__chart-area {
  fill: url(#gh-area-grad);
  transition: fill 0.35s ease;
}

.ml-greenhood__chart-group .ml-greenhood__chart-line {
  stroke: #5fd38a;
  fill: none;
  transition: stroke 0.35s ease;
}

.ml-greenhood__chart-group.is-chart-up .ml-greenhood__chart-line {
  stroke: #7dffb0;
}

.ml-greenhood__chart-group.is-chart-up .ml-greenhood__chart-area {
  fill: rgba(95, 211, 138, 0.22);
}

.ml-greenhood__chart-group.is-chart-down .ml-greenhood__chart-line {
  stroke: #f07171;
}

.ml-greenhood__chart-group.is-chart-down .ml-greenhood__chart-area {
  fill: rgba(240, 113, 113, 0.14);
}

.ml-greenhood__chart-dot-core {
  fill: #7dffb0;
}

.ml-greenhood__chart-dot-halo {
  fill: rgba(95, 211, 138, 0.35);
  transform-origin: center;
  animation: ml-greenhood-dot-pulse 1.6s ease-out infinite;
}

@keyframes ml-greenhood-dot-pulse {
  0% {
    opacity: 0.7;
    transform: scale(0.85);
  }
  70% {
    opacity: 0;
    transform: scale(1.6);
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
  }
}

.ml-greenhood__position {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 0.78rem;
  color: #b8cfc4;
  padding: 6px 8px;
  margin: -2px -4px;
  border-radius: 8px;
  transition: background 0.2s ease;
}

.ml-greenhood__position.is-position-flash {
  background: rgba(95, 211, 138, 0.12);
}

.ml-greenhood__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: auto;
  padding-top: 4px;
}

.ml-greenhood__action-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ml-greenhood__action-btn {
  border: 0;
  border-radius: 999px;
  font-family: var(--yp-font-sans, system-ui, sans-serif);
  font-size: 0.84rem;
  font-weight: 700;
  line-height: 1.2;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.ml-greenhood__action-btn:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.ml-greenhood__action-btn--buy,
.ml-greenhood__action-btn--sell {
  padding: 12px 10px;
}

.ml-greenhood__action-btn--buy {
  background: linear-gradient(180deg, #3ecf7a 0%, #1f9d57 100%);
  color: #062a16;
  box-shadow: 0 2px 10px rgba(31, 157, 87, 0.28);
}

.ml-greenhood__action-btn--sell {
  background: rgba(240, 113, 113, 0.14);
  color: #f5a8a8;
  border: 1px solid rgba(240, 113, 113, 0.35);
}

.ml-greenhood__action-btn--sell.is-hit {
  background: rgba(95, 211, 138, 0.22);
  color: #d7ffe8;
  border-color: rgba(95, 211, 138, 0.65);
  box-shadow: 0 0 0 1px rgba(95, 211, 138, 0.2), 0 0 16px rgba(95, 211, 138, 0.18);
}

.ml-greenhood__action-btn--ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 10px;
  background: transparent;
  color: #7fd9a8;
  font-weight: 600;
  font-size: 0.78rem;
}

.ml-greenhood__action-btn--ghost:hover:not(:disabled) {
  color: #a8e8c4;
}

.ml-greenhood__refresh-icon {
  display: inline-block;
  font-size: 1rem;
  line-height: 1;
}

.ml-greenhood__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #8aa89a;
}

.up {
  color: #5fd38a;
}

.down {
  color: #f07171;
}

@media (prefers-reduced-motion: reduce) {
  .ml-greenhood__burst-flash {
    animation: none;
    opacity: 0.35;
  }

  .ml-greenhood-burst-enter-active,
  .ml-greenhood-burst-leave-active,
  .ml-greenhood-toast-enter-active,
  .ml-greenhood-toast-leave-active {
    transition: none;
  }

  .ml-greenhood__chart-dot-halo {
    animation: none;
    opacity: 0.4;
  }

  .ml-greenhood__list,
  .ml-greenhood__detail {
    will-change: auto;
  }
}
</style>
