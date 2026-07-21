import gsap from 'gsap';

const ENTER_DURATION = 0.28;
const LEAVE_DURATION = 0.22;
const CHROME_FADE = 0.12;
const CHROME_FADE_IN = 0.15;
const REDUCED_DURATION = 0.08;
const ENTER_Y = 16;
const SCENE_DIM = 0.72;

let activeTimeline: gsap.core.Timeline | null = null;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function killScreenTransition(): void {
  activeTimeline?.kill();
  activeTimeline = null;
}

function runTimeline(build: (tl: gsap.core.Timeline) => void): Promise<void> {
  killScreenTransition();

  return new Promise((resolve) => {
    const tl = gsap.timeline({
      onComplete: () => {
        activeTimeline = null;
        resolve();
      },
    });
    activeTimeline = tl;
    build(tl);
  });
}

function asTargets(
  elements: (HTMLElement | null | undefined)[],
): HTMLElement[] {
  return elements.filter((el): el is HTMLElement => el instanceof HTMLElement);
}

export function fadeChrome(
  elements: (HTMLElement | null | undefined)[],
  opacity: number,
  duration = opacity > 0 ? CHROME_FADE_IN : CHROME_FADE,
): Promise<void> {
  const targets = asTargets(elements);
  if (!targets.length) return Promise.resolve();

  if (prefersReducedMotion()) {
    targets.forEach((el) => {
      el.style.opacity = String(opacity);
    });
    return Promise.resolve();
  }

  return runTimeline((tl) => {
    tl.to(targets, {
      opacity,
      duration,
      ease: 'power1.out',
    });
  });
}

export function dimScene(
  element: HTMLElement | null | undefined,
  dim: boolean,
): Promise<void> {
  if (!element) return Promise.resolve();

  const opacity = dim ? SCENE_DIM : 1;

  if (prefersReducedMotion()) {
    element.style.opacity = String(opacity);
    return Promise.resolve();
  }

  return runTimeline((tl) => {
    tl.to(element, {
      opacity,
      duration: 0.18,
      ease: 'power1.out',
    });
  });
}

export function playEnter(element: HTMLElement | null | undefined): Promise<void> {
  if (!element) return Promise.resolve();

  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0, clearProps: 'transform' });
    return Promise.resolve();
  }

  gsap.set(element, { opacity: 0, y: ENTER_Y });

  return runTimeline((tl) => {
    tl.to(element, {
      opacity: 1,
      y: 0,
      duration: ENTER_DURATION,
      ease: 'power2.out',
      onComplete: () => {
        gsap.set(element, { clearProps: 'transform' });
      },
    });
  });
}

export function playLeave(element: HTMLElement | null | undefined): Promise<void> {
  if (!element) return Promise.resolve();

  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 0 });
    return Promise.resolve();
  }

  return runTimeline((tl) => {
    tl.to(element, {
      opacity: 0,
      y: ENTER_Y,
      duration: LEAVE_DURATION,
      ease: 'power2.in',
    });
  });
}

export function prepChromeForFadeIn(
  elements: (HTMLElement | null | undefined)[],
): void {
  asTargets(elements).forEach((el) => {
    gsap.set(el, { opacity: 0 });
  });
}
