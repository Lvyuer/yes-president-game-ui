/** Dev-only scene/video alignment helper. Enable via `/?scene-debug=1#/main-loop`. */
export function isSceneAlignDebugEnabled(): boolean {
  return readDevFlag('scene-debug');
}

/** Dev-only settlement roll + card preview. Enable via `/?settlement-preview=1#/main-loop`. */
export function isSettlementPreviewEnabled(): boolean {
  return readDevFlag('settlement-preview');
}

/** Dev-only advisor signing loop. Enable via `/?advisor-preview=1#/main-loop`. */
export function isAdvisorPreviewEnabled(): boolean {
  return readDevFlag('advisor-preview');
}

export function readDevFlag(name: string): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  if (params.get(name) === '1' || params.get(name) === 'true') return true;

  const hash = window.location.hash;
  const hashQuery = hash.includes('?') ? hash.slice(hash.indexOf('?') + 1) : '';
  const hashParams = new URLSearchParams(hashQuery);
  return hashParams.get(name) === '1' || hashParams.get(name) === 'true';
}

export type SceneAlignView = 'video' | 'poster' | 'blend';
