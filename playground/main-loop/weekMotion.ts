import gsap from 'gsap';

type MotionSlot = {
  timeline: gsap.core.Timeline | null;
  resolve: (() => void) | null;
};

const weekSlot: MotionSlot = { timeline: null, resolve: null };

const DUR = {
  dimIn: 0.45,
  calendarIn: 0.48,
  sheetTear: 0.4,
  fadeOut: 0.4,
} as const;

const EASE = {
  out: 'power2.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  back: 'back.out(1.35)',
} as const;

export type WeekTransitionTargets = {
  dim: HTMLElement | null;
  calendar: HTMLElement | null;
  sheets: HTMLElement[];
};

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function el(target: HTMLElement | null | undefined): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function killSlot(slot: MotionSlot): void {
  slot.timeline?.kill();
  slot.timeline = null;
  const resolve = slot.resolve;
  slot.resolve = null;
  resolve?.();
}

export function killWeekMotion(): void {
  killSlot(weekSlot);
}

export function skipWeekTransition(): void {
  const tl = weekSlot.timeline;
  if (!tl) return;
  tl.progress(1, false);
}

function runSlot(build: (tl: gsap.core.Timeline) => void): Promise<void> {
  killSlot(weekSlot);

  return new Promise((resolve) => {
    weekSlot.resolve = resolve;
    const tl = gsap.timeline({
      onComplete: () => {
        weekSlot.timeline = null;
        const done = weekSlot.resolve;
        weekSlot.resolve = null;
        done?.();
      },
    });
    weekSlot.timeline = tl;
    build(tl);
  });
}

function setHidden(nodes: (HTMLElement | null)[]) {
  nodes.forEach((node) => {
    if (!node) return;
    gsap.set(node, { opacity: 0, visibility: 'hidden' });
  });
}

export function playWeekTransition(targets: WeekTransitionTargets): Promise<void> {
  const dim = el(targets.dim);
  const calendar = el(targets.calendar);
  const sheets = targets.sheets.map(el).filter(Boolean) as HTMLElement[];

  if (!dim && !calendar) {
    return Promise.resolve();
  }

  if (prefersReducedMotion()) {
    [dim, calendar, ...sheets].forEach((node) => {
      if (node) {
        node.style.opacity = '0';
        node.style.visibility = 'hidden';
      }
    });
    return Promise.resolve();
  }

  return runSlot((tl) => {
    const all = [dim, calendar, ...sheets].filter(Boolean) as HTMLElement[];
    setHidden(all);

    if (dim) {
      gsap.set(dim, { opacity: 0, visibility: 'visible' });
      tl.to(dim, { opacity: 1, duration: DUR.dimIn, ease: EASE.out }, 0);
    }

    if (calendar) {
      gsap.set(calendar, {
        opacity: 0,
        visibility: 'visible',
        scale: 0.88,
        y: 28,
        transformOrigin: '50% 80%',
      });
      tl.to(
        calendar,
        { opacity: 1, scale: 1, y: 0, duration: DUR.calendarIn, ease: EASE.back },
        0.18,
      );
    }

    sheets.forEach((sheet, index) => {
      const isFinal = index === sheets.length - 1;
      gsap.set(sheet, {
        opacity: 1,
        visibility: 'visible',
        x: 0,
        y: 0,
        rotation: 0,
        transformOrigin: '50% 0%',
        zIndex: isFinal ? 1 : 2 + (sheets.length - 1 - index),
      });

      if (isFinal) return;

      const tearAt = 0.58 + index * 0.34;
      tl.call(
        () => {
          sheet.style.zIndex = '5';
          const img = sheet.querySelector(
            '.ml-week-transition__calendar-sheet-img',
          ) as HTMLImageElement | null;
          const torn = sheet.dataset.sheetTorn;
          if (img && torn) img.src = torn;
        },
        undefined,
        tearAt,
      );
      tl.to(
        sheet,
        {
          x: -130 - index * 40,
          y: -160 - index * 24,
          rotation: -24 - index * 10,
          opacity: 0,
          duration: DUR.sheetTear,
          ease: EASE.in,
        },
        tearAt,
      );
    });

    const fadeAt = 1.85;
    if (calendar) {
      tl.to(calendar, { opacity: 0, scale: 0.96, duration: DUR.fadeOut, ease: EASE.in }, fadeAt);
    }
    if (dim) {
      tl.to(dim, { opacity: 0, duration: DUR.fadeOut, ease: EASE.in }, fadeAt + 0.06);
    }
  });
}
