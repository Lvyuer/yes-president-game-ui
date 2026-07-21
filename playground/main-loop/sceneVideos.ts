export type SceneVideoClip =
  | 'idle'
  | 'phone-start'
  | 'phone-end'
  | 'advisor-signing'
  | 'intro-intruder';

export type SceneBackdropMode =
  | 'idle'
  | 'phone-start'
  | 'phone-hold'
  | 'phone-end'
  | 'advisor-arrive'
  | 'advisor-hold'
  | 'advisor-leave'
  | 'intro-intruder';

/** When false, idle mode stays on the static poster (no random ambient clips). */
export const AMBIENT_IDLE_ENABLED = false;

/** Vite resolves known extensions at build/dev time; missing files simply aren't listed. */
const videoModules = import.meta.glob('./assets/video/*.{webm,mp4}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const clipCache = new Map<string, string | null>();

const IDLE_FILE_STEMS = [
  'idle-drinking-cola',
  'idle-doodling-on-documents',
  'idle-casual-phone',
] as const;

const ADVISOR_SIGNING_STEM = 'idle-signing-documents';
export const INTRO_INTRUDER_STEM = 'idle-homeless-intruder';

function resolveNamedSrc(stem: string): string | null {
  const webm = `./assets/video/${stem}.webm`;
  const mp4 = `./assets/video/${stem}.mp4`;
  return videoModules[webm] ?? videoModules[mp4] ?? null;
}

/** All available idle loop URLs (showcase loops + optional idle.webm/mp4). */
export function listIdleVideoSrcs(): string[] {
  const fromNamed = IDLE_FILE_STEMS.map(resolveNamedSrc).filter((src): src is string => !!src);
  const legacy = resolveNamedSrc('idle');
  const all = legacy ? [...fromNamed, legacy] : [...fromNamed];
  return [...new Set(all)];
}

let lastIdleSrc: string | null = null;

/** Pick a random idle loop URL; prefers not repeating the previous one. */
export function pickRandomIdleSrc(): string | null {
  const pool = listIdleVideoSrcs();
  if (pool.length === 0) return null;
  if (pool.length === 1) {
    lastIdleSrc = pool[0];
    return pool[0];
  }

  const candidates = lastIdleSrc ? pool.filter((src) => src !== lastIdleSrc) : pool;
  const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? pool[0];
  lastIdleSrc = pick;
  return pick;
}

function resolveClipSrc(clip: SceneVideoClip): string | null {
  if (clip === 'idle') {
    return pickRandomIdleSrc();
  }
  if (clip === 'advisor-signing') {
    return resolveNamedSrc(ADVISOR_SIGNING_STEM);
  }
  if (clip === 'intro-intruder') {
    return resolveNamedSrc(INTRO_INTRUDER_STEM);
  }
  return resolveNamedSrc(clip);
}

/** Resolve clip URL (webm first, then mp4). Idle always re-rolls randomly. */
export async function getSceneVideoSrc(clip: SceneVideoClip): Promise<string | null> {
  if (clip === 'idle') {
    const src = pickRandomIdleSrc();
    if (!src) {
      console.warn(
        '[SceneBackdrop] Missing idle videos (expected idle-*.mp4 or idle.webm/mp4). Using static fallback.',
      );
    }
    return src;
  }

  if (clipCache.has(clip)) {
    return clipCache.get(clip) ?? null;
  }

  const src = resolveClipSrc(clip);
  if (!src) {
    console.warn(
      `[SceneBackdrop] Missing video for "${clip}" (expected assets/video/${clip}.webm or .mp4). Using static fallback.`,
    );
  }
  clipCache.set(clip, src);
  return src;
}

export function clipForMode(mode: SceneBackdropMode): SceneVideoClip | null {
  if (mode === 'idle') return 'idle';
  if (mode === 'phone-start' || mode === 'phone-hold') return 'phone-start';
  if (mode === 'phone-end') return 'phone-end';
  if (mode === 'advisor-arrive' || mode === 'advisor-hold' || mode === 'advisor-leave') {
    return 'advisor-signing';
  }
  if (mode === 'intro-intruder') return 'intro-intruder';
  return null;
}

export function isHoldMode(mode: SceneBackdropMode): boolean {
  return mode === 'phone-hold' || mode === 'advisor-hold';
}

export function isAdvisorMode(mode: SceneBackdropMode): boolean {
  return mode === 'advisor-arrive' || mode === 'advisor-hold' || mode === 'advisor-leave';
}
