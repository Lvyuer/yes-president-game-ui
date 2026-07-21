import gsap from 'gsap';

/**
 * Isolated from screenMotion.ts so phone timelines never kill desk transitions.
 * Shell (open/launch/push) and media (FTube expand) use separate timelines so
 * deep-link open and play-expand cannot abort each other and leave nav locks hung.
 */
type MotionSlot = {
  timeline: gsap.core.Timeline | null;
  resolve: (() => void) | null;
};

const shellSlot: MotionSlot = { timeline: null, resolve: null };
const mediaSlot: MotionSlot = { timeline: null, resolve: null };

export type NavDirection = 'forward' | 'back';

const DUR = {
  phoneOpen: 0.3,
  phoneClose: 0.26,
  appLaunch: 0.32,
  appBack: 0.28,
  push: 0.26,
  pop: 0.24,
  iconTap: 0.09,
  shake: 0.42,
  expand: 0.3,
  fade: 0.12,
} as const;

const EASE = {
  out: 'power2.out',
  in: 'power2.in',
  inOut: 'power2.inOut',
  back: 'back.out(1.4)',
} as const;

const PUSH_X = '28%';

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function killSlot(slot: MotionSlot): void {
  slot.timeline?.kill();
  slot.timeline = null;
  const resolve = slot.resolve;
  slot.resolve = null;
  // Always settle awaited callers — GSAP kill() does not fire onComplete.
  resolve?.();
}

/** Kill shell + media (unmount / hard reset). */
export function killPhoneMotion(): void {
  killSlot(shellSlot);
  killSlot(mediaSlot);
}

export function killMediaMotion(): void {
  killSlot(mediaSlot);
}

function el(target: HTMLElement | null | undefined): HTMLElement | null {
  return target instanceof HTMLElement ? target : null;
}

function runSlot(
  slot: MotionSlot,
  build: (tl: gsap.core.Timeline) => void,
): Promise<void> {
  killSlot(slot);

  return new Promise((resolve) => {
    slot.resolve = resolve;
    const tl = gsap.timeline({
      onComplete: () => {
        slot.timeline = null;
        const done = slot.resolve;
        slot.resolve = null;
        done?.();
      },
    });
    slot.timeline = tl;
    build(tl);
  });
}

function runTimeline(build: (tl: gsap.core.Timeline) => void): Promise<void> {
  return runSlot(shellSlot, build);
}

function runMediaTimeline(build: (tl: gsap.core.Timeline) => void): Promise<void> {
  return runSlot(mediaSlot, build);
}

export function clearMotionProps(target: HTMLElement | null | undefined): void {
  const node = el(target);
  if (!node) return;
  gsap.set(node, { clearProps: 'transform,opacity,filter,transformOrigin' });
}

function fadeOnly(
  targets: (HTMLElement | null | undefined)[],
  opacity: number,
  duration = DUR.fade,
): Promise<void> {
  const nodes = targets.map(el).filter(Boolean) as HTMLElement[];
  if (!nodes.length) return Promise.resolve();

  if (prefersReducedMotion()) {
    nodes.forEach((node) => {
      node.style.opacity = String(opacity);
    });
    return Promise.resolve();
  }

  return runTimeline((tl) => {
    tl.to(nodes, { opacity, duration, ease: EASE.out });
  });
}

/** Phone overlay enter: backdrop fade + device rise/scale. */
export function playPhoneOpen(
  backdrop: HTMLElement | null | undefined,
  device: HTMLElement | null | undefined,
): Promise<void> {
  const bd = el(backdrop);
  const dv = el(device);
  if (!bd && !dv) return Promise.resolve();

  if (prefersReducedMotion()) {
    if (bd) bd.style.opacity = '1';
    if (dv) clearMotionProps(dv);
    return Promise.resolve();
  }

  if (bd) gsap.set(bd, { opacity: 0 });
  if (dv) gsap.set(dv, { opacity: 0, y: 18, scale: 0.96 });

  return runTimeline((tl) => {
    if (bd) tl.to(bd, { opacity: 1, duration: DUR.phoneOpen, ease: EASE.out }, 0);
    if (dv) {
      tl.to(
        dv,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: DUR.phoneOpen,
          ease: EASE.back,
          onComplete: () => clearMotionProps(dv),
        },
        0,
      );
    }
  });
}

/** Phone overlay exit before parent unmount. */
export function playPhoneClose(
  backdrop: HTMLElement | null | undefined,
  device: HTMLElement | null | undefined,
): Promise<void> {
  const bd = el(backdrop);
  const dv = el(device);
  if (!bd && !dv) return Promise.resolve();

  if (prefersReducedMotion()) {
    if (bd) bd.style.opacity = '0';
    if (dv) dv.style.opacity = '0';
    return Promise.resolve();
  }

  return runTimeline((tl) => {
    if (bd) tl.to(bd, { opacity: 0, duration: DUR.phoneClose, ease: EASE.in }, 0);
    if (dv) {
      tl.to(
        dv,
        { opacity: 0, y: 14, scale: 0.97, duration: DUR.phoneClose, ease: EASE.in },
        0,
      );
    }
  });
}

/** Home screen → app: zoom from tapped icon. Home must already be hidden by caller. */
export function playLaunchApp(
  home: HTMLElement | null | undefined,
  app: HTMLElement | null | undefined,
  origin?: { xPercent: number; yPercent: number },
): Promise<void> {
  const homeEl = el(home);
  const appEl = el(app);
  if (!appEl) return Promise.resolve();

  // Keep any leftover home transform cleared; never scale the icon grid.
  if (homeEl) {
    gsap.set(homeEl, { opacity: 0, clearProps: 'transform' });
  }

  if (prefersReducedMotion()) {
    clearMotionProps(appEl);
    return Promise.resolve();
  }

  const ox = origin?.xPercent ?? 50;
  const oy = origin?.yPercent ?? 50;
  gsap.set(appEl, {
    opacity: 0,
    scale: 0.82,
    transformOrigin: `${ox}% ${oy}%`,
  });

  return runTimeline((tl) => {
    tl.to(appEl, {
      opacity: 1,
      scale: 1,
      duration: DUR.appLaunch,
      ease: EASE.out,
      onComplete: () => clearMotionProps(appEl),
    });
  });
}

/** App exit slide. Pass home only when it is already at home-chrome size. */
export function playBackToHome(
  home: HTMLElement | null | undefined,
  app: HTMLElement | null | undefined,
): Promise<void> {
  const homeEl = el(home);
  const appEl = el(app);
  if (!homeEl && !appEl) return Promise.resolve();

  if (prefersReducedMotion()) {
    if (homeEl) {
      homeEl.style.opacity = '1';
      clearMotionProps(homeEl);
    }
    if (appEl) appEl.style.opacity = '0';
    return Promise.resolve();
  }

  if (homeEl) gsap.set(homeEl, { opacity: 0, clearProps: 'transform' });
  if (appEl) gsap.set(appEl, { opacity: 1, x: 0, clearProps: 'scale,transformOrigin' });

  return runTimeline((tl) => {
    if (appEl) {
      tl.to(
        appEl,
        {
          opacity: 0,
          x: PUSH_X,
          duration: DUR.appBack,
          ease: EASE.in,
          onComplete: () => {
            if (!homeEl) clearMotionProps(appEl);
          },
        },
        0,
      );
    }
    if (homeEl) {
      tl.to(
        homeEl,
        {
          opacity: 1,
          duration: DUR.appBack,
          ease: EASE.out,
          onComplete: () => {
            clearMotionProps(homeEl);
            if (appEl) clearMotionProps(appEl);
          },
        },
        0.04,
      );
    }
  });
}

/** Internal forward push (compose → hotsearch, contacts → chat). */
export function playPush(
  leaving: HTMLElement | null | undefined,
  entering: HTMLElement | null | undefined,
): Promise<void> {
  const outEl = el(leaving);
  const inEl = el(entering);
  if (!inEl) return Promise.resolve();

  if (prefersReducedMotion()) {
    if (outEl) outEl.style.opacity = '0';
    clearMotionProps(inEl);
    return Promise.resolve();
  }

  gsap.set(inEl, { opacity: 0, x: PUSH_X });
  if (outEl) gsap.set(outEl, { opacity: 1, x: 0 });

  return runTimeline((tl) => {
    if (outEl) {
      tl.to(outEl, { opacity: 0, x: `-${PUSH_X}`, duration: DUR.push, ease: EASE.inOut }, 0);
    }
    tl.to(
      inEl,
      {
        opacity: 1,
        x: 0,
        duration: DUR.push,
        ease: EASE.out,
        onComplete: () => {
          clearMotionProps(inEl);
          if (outEl) clearMotionProps(outEl);
        },
      },
      0,
    );
  });
}

/** Internal back pop. */
export function playPop(
  leaving: HTMLElement | null | undefined,
  entering: HTMLElement | null | undefined,
): Promise<void> {
  const outEl = el(leaving);
  const inEl = el(entering);
  if (!inEl) return Promise.resolve();

  if (prefersReducedMotion()) {
    if (outEl) outEl.style.opacity = '0';
    clearMotionProps(inEl);
    return Promise.resolve();
  }

  gsap.set(inEl, { opacity: 0, x: `-${PUSH_X}` });
  if (outEl) gsap.set(outEl, { opacity: 1, x: 0 });

  return runTimeline((tl) => {
    if (outEl) {
      tl.to(outEl, { opacity: 0, x: PUSH_X, duration: DUR.pop, ease: EASE.inOut }, 0);
    }
    tl.to(
      inEl,
      {
        opacity: 1,
        x: 0,
        duration: DUR.pop,
        ease: EASE.out,
        onComplete: () => {
          clearMotionProps(inEl);
          if (outEl) clearMotionProps(outEl);
        },
      },
      0,
    );
  });
}

/** App icon tap micro-feedback. */
export function playIconTap(icon: HTMLElement | null | undefined): Promise<void> {
  const node = el(icon);
  if (!node) return Promise.resolve();

  if (prefersReducedMotion()) return Promise.resolve();

  return runTimeline((tl) => {
    tl.to(node, { scale: 0.9, duration: DUR.iconTap, ease: EASE.in })
      .to(node, {
        scale: 1,
        duration: DUR.iconTap,
        ease: EASE.out,
        onComplete: () => clearMotionProps(node),
      });
  });
}

/** Blocked close gate shake. */
export function playShake(device: HTMLElement | null | undefined): Promise<void> {
  const node = el(device);
  if (!node) return Promise.resolve();

  if (prefersReducedMotion()) return Promise.resolve();

  return runTimeline((tl) => {
    tl.to(node, { x: -8, duration: 0.06, ease: EASE.inOut })
      .to(node, { x: 8, duration: 0.06, ease: EASE.inOut })
      .to(node, { x: -6, duration: 0.06, ease: EASE.inOut })
      .to(node, { x: 6, duration: 0.06, ease: EASE.inOut })
      .to(node, {
        x: 0,
        duration: 0.08,
        ease: EASE.out,
        onComplete: () => clearMotionProps(node),
      });
  });
}

export type RectLike = Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>;

function rectToPercent(
  rect: RectLike,
  container: RectLike,
): { left: number; top: number; width: number; height: number } {
  return {
    left: ((rect.left - container.left) / container.width) * 100,
    top: ((rect.top - container.top) / container.height) * 100,
    width: (rect.width / container.width) * 100,
    height: (rect.height / container.height) * 100,
  };
}

/** Expand overlay from `fromRect` toward `toRect` (defaults to full container). */
export function playExpandFrom(
  overlay: HTMLElement | null | undefined,
  fromRect: RectLike,
  containerRect: RectLike,
  toRect?: RectLike,
): Promise<void> {
  const node = el(overlay);
  if (!node) return Promise.resolve();

  const from = rectToPercent(fromRect, containerRect);
  const to = toRect
    ? rectToPercent(toRect, containerRect)
    : { left: 0, top: 0, width: 100, height: 100 };

  if (prefersReducedMotion() || !Number.isFinite(from.left) || !Number.isFinite(to.left)) {
    gsap.set(node, {
      opacity: 1,
      left: `${to.left}%`,
      top: `${to.top}%`,
      width: `${to.width}%`,
      height: `${to.height}%`,
      pointerEvents: 'auto',
      clearProps: 'transform',
    });
    return Promise.resolve();
  }

  gsap.set(node, {
    opacity: 0,
    left: `${from.left}%`,
    top: `${from.top}%`,
    width: `${from.width}%`,
    height: `${from.height}%`,
    borderRadius: '8px',
    pointerEvents: 'none',
  });

  return runMediaTimeline((tl) => {
    tl.to(node, {
      opacity: 1,
      left: `${to.left}%`,
      top: `${to.top}%`,
      width: `${to.width}%`,
      height: `${to.height}%`,
      borderRadius: '6px',
      duration: DUR.expand,
      ease: EASE.inOut,
      onComplete: () => {
        gsap.set(node, { pointerEvents: 'auto' });
      },
    });
  });
}

/** Collapse overlay from current box back to `toRect`. */
export function playCollapseTo(
  overlay: HTMLElement | null | undefined,
  toRect: RectLike,
  containerRect: RectLike,
): Promise<void> {
  const node = el(overlay);
  if (!node) return Promise.resolve();

  const to = rectToPercent(toRect, containerRect);

  if (prefersReducedMotion()) {
    node.style.opacity = '0';
    return Promise.resolve();
  }

  return runMediaTimeline((tl) => {
    tl.to(node, {
      opacity: 0,
      left: `${to.left}%`,
      top: `${to.top}%`,
      width: `${to.width}%`,
      height: `${to.height}%`,
      borderRadius: '8px',
      duration: DUR.expand,
      ease: EASE.inOut,
    });
  });
}

export { fadeOnly as playFade };
