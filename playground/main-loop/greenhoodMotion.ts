import gsap from 'gsap';
import { prefersReducedMotion } from './phoneMotion';

export const CHART_WIDTH = 280;
export const CHART_HEIGHT = 72;
export const SESSION_SLOTS = 16;

const NAV_PUSH = '24%';
const NAV_DUR = 0.28;
const GROW_DUR = 0.32;
export const GROW_DUR_INITIAL = 0.5;

export type ChartScale = {
  min: number;
  max: number;
  open: number;
};

export type ChartPoint = { x: number; y: number };

export type ChartWindow = {
  slice: number[];
  windowStart: number;
};

export function domainFromPrices(prices: number[]): ChartScale {
  if (prices.length === 0) {
    return { min: 0, max: 1, open: 0 };
  }
  const lo = Math.min(...prices);
  const hi = Math.max(...prices);
  const pad = (hi - lo) * 0.18 || 0.5;
  return {
    min: lo - pad,
    max: hi + pad,
    open: prices[0]!,
  };
}

export function chartWindow(history: number[]): ChartWindow {
  if (history.length <= SESSION_SLOTS + 1) {
    return { slice: history, windowStart: 0 };
  }
  const windowStart = history.length - (SESSION_SLOTS + 1);
  return { slice: history.slice(windowStart), windowStart };
}

export function priceToChartY(
  price: number,
  scale: ChartScale,
  height = CHART_HEIGHT,
): number {
  const range = scale.max - scale.min || 1;
  return height - ((price - scale.min) / range) * (height - 8) - 4;
}

function indexToX(localIndex: number, width = CHART_WIDTH): number {
  return (localIndex / SESSION_SLOTS) * width;
}

/**
 * Y 用动态 domain；X 用固定 SESSION_SLOTS 时间格。
 * visibleCount 为窗口内可见点数（可为小数，用于末点生长动画）。
 */
export function buildChartGeometry(
  history: number[],
  scale: ChartScale,
  visibleCount: number,
): {
  points: ChartPoint[];
  polylineStr: string;
  areaPath: string;
  lastPoint: ChartPoint | null;
  windowStart: number;
} {
  if (history.length < 1 || visibleCount <= 0) {
    return {
      points: [],
      polylineStr: '',
      areaPath: '',
      lastPoint: null,
      windowStart: 0,
    };
  }

  const { slice, windowStart } = chartWindow(history);
  const fullCount = slice.length;
  const clamped = Math.min(visibleCount, fullCount);
  const whole = Math.floor(clamped);
  const frac = clamped - whole;

  const points: ChartPoint[] = [];

  for (let i = 0; i < whole; i += 1) {
    const price = slice[i]!;
    points.push({ x: indexToX(i), y: priceToChartY(price, scale) });
  }

  if (frac > 0.001 && whole < fullCount && whole >= 1) {
    const from = slice[whole - 1]!;
    const to = slice[whole]!;
    const price = from + (to - from) * frac;
    const xFrom = indexToX(whole - 1);
    const xTo = indexToX(whole);
    points.push({
      x: xFrom + (xTo - xFrom) * frac,
      y: priceToChartY(price, scale),
    });
  } else if (whole === 0 && slice.length > 0) {
    points.push({ x: indexToX(0), y: priceToChartY(slice[0]!, scale) });
  }

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(' ');
  const lastPoint = points.length > 0 ? points[points.length - 1]! : null;

  let areaPath = '';
  if (points.length >= 2) {
    const first = points[0]!;
    const last = points[points.length - 1]!;
    const linePath = points.map((p) => `${p.x},${p.y}`).join(' L ');
    areaPath = `M ${linePath} L ${last.x},${CHART_HEIGHT} L ${first.x},${CHART_HEIGHT} Z`;
  }

  return { points, polylineStr, areaPath, lastPoint, windowStart };
}

export function tapeIndexToChartPoint(
  tapeIndex: number,
  history: number[],
  scale: ChartScale,
): ChartPoint | null {
  const { slice, windowStart } = chartWindow(history);
  const localIndex = tapeIndex - windowStart;
  if (localIndex < 0 || localIndex >= slice.length) return null;
  const price = history[tapeIndex];
  if (price === undefined) return null;
  return {
    x: indexToX(localIndex),
    y: priceToChartY(price, scale),
  };
}

export function openBaselineY(scale: ChartScale, height = CHART_HEIGHT): number {
  return priceToChartY(scale.open, scale, height);
}

export function growVisibleCount(
  from: number,
  to: number,
  onUpdate: (count: number) => void,
  onComplete?: () => void,
  duration = GROW_DUR,
): gsap.core.Tween | null {
  if (prefersReducedMotion()) {
    onUpdate(to);
    onComplete?.();
    return null;
  }

  const state = { count: from };
  return gsap.to(state, {
    count: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => onUpdate(state.count),
    onComplete: () => {
      onUpdate(to);
      onComplete?.();
    },
  });
}

export function playNavForward(
  listEl: HTMLElement | null,
  detailEl: HTMLElement | null,
): gsap.core.Timeline | null {
  if (!listEl || !detailEl) return null;
  if (prefersReducedMotion()) {
    gsap.set(listEl, { opacity: 0, pointerEvents: 'none' });
    gsap.set(detailEl, { opacity: 1, x: 0, pointerEvents: 'auto' });
    return null;
  }

  gsap.set(listEl, { opacity: 1, x: 0, pointerEvents: 'auto' });
  gsap.set(detailEl, { opacity: 0, x: NAV_PUSH, pointerEvents: 'none' });

  return gsap
    .timeline()
    .to(listEl, { opacity: 0, x: `-${NAV_PUSH}`, duration: NAV_DUR, ease: 'power2.inOut' }, 0)
    .to(
      detailEl,
      {
        opacity: 1,
        x: 0,
        duration: NAV_DUR,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(listEl, { pointerEvents: 'none' });
          gsap.set(detailEl, { pointerEvents: 'auto' });
        },
      },
      0,
    );
}

export function playNavBack(
  listEl: HTMLElement | null,
  detailEl: HTMLElement | null,
): gsap.core.Timeline | null {
  if (!listEl || !detailEl) return null;
  if (prefersReducedMotion()) {
    gsap.set(listEl, { opacity: 1, x: 0, pointerEvents: 'auto' });
    gsap.set(detailEl, { opacity: 0, pointerEvents: 'none' });
    return null;
  }

  gsap.set(listEl, { opacity: 0, x: `-${NAV_PUSH}`, pointerEvents: 'none' });
  gsap.set(detailEl, { opacity: 1, x: 0, pointerEvents: 'auto' });

  return gsap
    .timeline()
    .to(detailEl, { opacity: 0, x: NAV_PUSH, duration: NAV_DUR, ease: 'power2.inOut' }, 0)
    .to(
      listEl,
      {
        opacity: 1,
        x: 0,
        duration: NAV_DUR,
        ease: 'power2.out',
        onComplete: () => {
          gsap.set(detailEl, { pointerEvents: 'none' });
          gsap.set(listEl, { pointerEvents: 'auto' });
        },
      },
      0,
    );
}

export function staggerListRows(rows: HTMLElement[]): void {
  if (!rows.length || prefersReducedMotion()) return;
  gsap.fromTo(
    rows,
    { opacity: 0, y: 10 },
    {
      opacity: 1,
      y: 0,
      duration: 0.26,
      stagger: 0.04,
      ease: 'power2.out',
      clearProps: 'transform',
    },
  );
}

export function flashRowPrice(
  row: HTMLElement | null,
  direction: 'up' | 'down',
): void {
  if (!row || prefersReducedMotion()) return;
  const cls = direction === 'up' ? 'is-row-flash-up' : 'is-row-flash-down';
  row.classList.add(cls);
  gsap.delayedCall(0.55, () => row.classList.remove(cls));
}

export function flashChartGroup(
  group: SVGGElement | null,
  direction: 'up' | 'down' | 'neutral',
): void {
  if (!group || prefersReducedMotion() || direction === 'neutral') return;
  const cls = direction === 'up' ? 'is-chart-up' : 'is-chart-down';
  group.classList.remove('is-chart-up', 'is-chart-down');
  void group.getBoundingClientRect();
  group.classList.add(cls);
  gsap.delayedCall(0.55, () => group.classList.remove(cls));
}

export function flashPrice(
  el: HTMLElement | null,
  direction: 'up' | 'down',
): void {
  if (!el || prefersReducedMotion()) return;
  const cls = direction === 'up' ? 'is-flash-up' : 'is-flash-down';
  el.classList.remove('is-flash-up', 'is-flash-down');
  void el.getBoundingClientRect();
  el.classList.add(cls);
  gsap.delayedCall(0.55, () => el.classList.remove(cls));
}

export function flashPositionRow(el: HTMLElement | null): void {
  if (!el || prefersReducedMotion()) return;
  el.classList.add('is-position-flash');
  gsap.delayedCall(0.55, () => el.classList.remove('is-position-flash'));
}

export function pulseElements(targets: (HTMLElement | null | undefined)[]): void {
  if (prefersReducedMotion()) return;
  const nodes = targets.filter(Boolean) as HTMLElement[];
  if (!nodes.length) return;
  gsap.fromTo(
    nodes,
    { scale: 1 },
    {
      scale: 1.03,
      duration: 0.16,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'transform',
    },
  );
}

export function pressButton(el: HTMLElement | null): void {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { scale: 1 },
    {
      scale: 0.94,
      duration: 0.08,
      yoyo: true,
      repeat: 1,
      ease: 'power2.out',
      clearProps: 'transform',
    },
  );
}

export function spinRefreshIcon(el: HTMLElement | null): gsap.core.Tween | null {
  if (!el || prefersReducedMotion()) return null;
  return gsap.fromTo(
    el,
    { rotation: 0 },
    { rotation: 360, duration: 0.4, ease: 'power2.out', clearProps: 'transform' },
  );
}

export function popTradeMark(el: SVGElement | null): void {
  if (!el || prefersReducedMotion()) return;
  gsap.fromTo(
    el,
    { scale: 0, opacity: 0, transformOrigin: 'center' },
    {
      scale: 1,
      opacity: 1,
      duration: 0.28,
      ease: 'back.out(2)',
    },
  );
}
