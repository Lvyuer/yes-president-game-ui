<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import sceneBg from './assets/oval-office.png';
import {
  AMBIENT_IDLE_ENABLED,
  clipForMode,
  getSceneVideoSrc,
  isHoldMode,
  listIdleVideoSrcs,
  type SceneBackdropMode,
  type SceneVideoClip,
} from './sceneVideos';
import type { SceneAlignView } from './sceneAlignDebug';

const props = withDefaults(
  defineProps<{
    mode: SceneBackdropMode;
    /** When false, idle ambient clips are not scheduled (e.g. secondary screens). */
    ambientEnabled?: boolean;
    /** Advisor signing clip pause point (seconds). Leave resumes from here. */
    advisorPauseAtSec?: number;
  }>(),
  {
    ambientEnabled: false,
    advisorPauseAtSec: 5,
  },
);

const emit = defineEmits<{
  clipEnded: [];
  clipPaused: [];
}>();

type Slot = 'a' | 'b';

/** Soft crossfade when swapping clips / returning to poster. */
const CROSSFADE_MS = 450;
/** How long to sit on static IDLE before occasionally playing one ambient clip. */
const IDLE_REST_MIN_MS = 3_000;
const IDLE_REST_MAX_MS = 8_000;

const slotA = ref<HTMLVideoElement | null>(null);
const slotB = ref<HTMLVideoElement | null>(null);
/** Currently playing / front-most slot. */
const visibleSlot = ref<Slot | null>(null);
/** Slot still fading out underneath during crossfade. */
const outgoingSlot = ref<Slot | null>(null);
const debugState = ref<{ view: SceneAlignView; blend: number } | null>(null);
const debugClipActive = ref(false);

const posterStyle = computed(() => {
  const debug = debugState.value;
  if (!debug) return undefined;

  if (debug.view === 'poster') {
    return { opacity: '1', zIndex: '2' };
  }
  if (debug.view === 'blend') {
    return { opacity: String(debug.blend), zIndex: '2' };
  }
  return { opacity: '0', zIndex: '0' };
});

const softFadeEnabled = computed(() => !debugState.value && !debugClipActive.value);

const videoClass = (slot: Slot) => {
  if (debugState.value?.view === 'poster') {
    return { 'is-visible': false, 'is-front': false };
  }
  const isActive = visibleSlot.value === slot;
  const isOutgoing = outgoingSlot.value === slot;
  return {
    'is-visible': isActive || isOutgoing,
    'is-front': isActive,
  };
};

let applyGeneration = 0;
let fadeToken = 0;
let idleRestTimer: number | null = null;
let advisorPauseEmitted = false;

function slotVideo(slot: Slot) {
  return slot === 'a' ? slotA.value : slotB.value;
}

function otherSlot(slot: Slot): Slot {
  return slot === 'a' ? 'b' : 'a';
}

function clearIdleRestTimer() {
  if (idleRestTimer != null) {
    window.clearTimeout(idleRestTimer);
    idleRestTimer = null;
  }
}

function randomIdleRestMs() {
  return IDLE_REST_MIN_MS + Math.random() * (IDLE_REST_MAX_MS - IDLE_REST_MIN_MS);
}

function clearOutgoing(slot: Slot | null) {
  if (!slot) return;
  if (outgoingSlot.value === slot) {
    outgoingSlot.value = null;
  }
  if (visibleSlot.value !== slot) {
    slotVideo(slot)?.pause();
  }
}

/** Reveal target on top; optionally keep previous visible underneath while new fades in. */
function swapToSlot(target: Slot, crossfade: boolean) {
  const current = visibleSlot.value;
  fadeToken += 1;
  const token = fadeToken;

  if (!crossfade || !current || current === target) {
    outgoingSlot.value = null;
    if (current && current !== target) {
      slotVideo(current)?.pause();
    }
    visibleSlot.value = target;
    return;
  }

  outgoingSlot.value = current;
  visibleSlot.value = target;

  window.setTimeout(() => {
    if (token !== fadeToken) return;
    clearOutgoing(current);
  }, CROSSFADE_MS);
}

/** Fade videos out to reveal the static oval-office poster (default IDLE). */
function hideToPoster(crossfade: boolean) {
  fadeToken += 1;
  const token = fadeToken;
  const current = visibleSlot.value;
  const outgoing = outgoingSlot.value;
  outgoingSlot.value = null;
  visibleSlot.value = null;

  const toPause = [current, outgoing].filter((s): s is Slot => !!s);
  if (!crossfade) {
    for (const slot of toPause) {
      slotVideo(slot)?.pause();
    }
    return;
  }

  window.setTimeout(() => {
    if (token !== fadeToken) return;
    for (const slot of toPause) {
      slotVideo(slot)?.pause();
    }
  }, CROSSFADE_MS);
}

function scheduleIdleAmbient() {
  clearIdleRestTimer();
  if (!AMBIENT_IDLE_ENABLED || !props.ambientEnabled || props.mode !== 'idle' || debugClipActive.value) {
    return;
  }
  if (listIdleVideoSrcs().length === 0) return;

  idleRestTimer = window.setTimeout(() => {
    idleRestTimer = null;
    void playIdleAmbient();
  }, randomIdleRestMs());
}

async function playIdleAmbient() {
  if (!AMBIENT_IDLE_ENABLED || !props.ambientEnabled || debugClipActive.value || props.mode !== 'idle') {
    return;
  }

  const generation = applyGeneration;
  const src = await getSceneVideoSrc('idle');
  if (
    generation !== applyGeneration ||
    !props.ambientEnabled ||
    props.mode !== 'idle'
  ) {
    return;
  }

  if (!src) {
    scheduleIdleAmbient();
    return;
  }

  const current = visibleSlot.value;
  const targetSlot: Slot = current ? otherSlot(current) : 'a';
  const played = await prepareSlot(targetSlot, src, false, true);
  if (
    generation !== applyGeneration ||
    !props.ambientEnabled ||
    props.mode !== 'idle'
  ) {
    slotVideo(targetSlot)?.pause();
    return;
  }

  if (!played) {
    scheduleIdleAmbient();
    return;
  }

  swapToSlot(targetSlot, true);
}

/** Stop ambient playback / timers while leaving main (keeps poster under secondary UI). */
function freezeAmbient() {
  clearIdleRestTimer();
  applyGeneration += 1;
  if (props.mode === 'idle') {
    hideToPoster(true);
  }
}

async function waitForDecodable(video: HTMLVideoElement, timeoutMs = 2500): Promise<boolean> {
  if (video.videoWidth > 0 && video.readyState >= 2) return true;

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      cleanup();
      resolve(video.videoWidth > 0);
    }, timeoutMs);

    const onReady = () => {
      if (video.videoWidth > 0) {
        cleanup();
        resolve(true);
      }
    };

    const cleanup = () => {
      window.clearTimeout(timer);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('loadedmetadata', onReady);
    };

    video.addEventListener('loadeddata', onReady);
    video.addEventListener('loadedmetadata', onReady);
  });
}

function waitForFirstFrame(video: HTMLVideoElement): Promise<void> {
  return new Promise((resolve) => {
    if ('requestVideoFrameCallback' in video) {
      video.requestVideoFrameCallback(() => resolve());
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

async function playDecodable(video: HTMLVideoElement, loop: boolean): Promise<boolean> {
  video.loop = loop;

  const attempt = async (muted: boolean) => {
    video.muted = muted;
    await video.play();
    const ok = await waitForDecodable(video);
    if (!ok) {
      video.pause();
      throw new Error('undecodable');
    }
    await waitForFirstFrame(video);
    return true;
  };

  try {
    return await attempt(false);
  } catch {
    try {
      return await attempt(true);
    } catch {
      console.warn(
        '[SceneBackdrop] Video failed to decode (often HEVC/hvc1). Keep H.264/avc1 for web. Falling back to poster.',
      );
      return false;
    }
  }
}

async function prepareSlot(
  slot: Slot,
  src: string,
  loop: boolean,
  restart: boolean,
): Promise<boolean> {
  const video = slotVideo(slot);
  if (!video) return false;

  if (video.src !== src) {
    video.src = src;
    video.load();
  }

  if (restart) {
    video.currentTime = 0;
  }

  return playDecodable(video, loop);
}

async function applyMode(mode: SceneBackdropMode) {
  if (debugClipActive.value) return;

  const generation = ++applyGeneration;
  clearIdleRestTimer();

  if (isHoldMode(mode)) {
    const video = visibleSlot.value ? slotVideo(visibleSlot.value) : null;
    video?.pause();
    return;
  }

  if (mode === 'advisor-leave') {
    const video = visibleSlot.value ? slotVideo(visibleSlot.value) : null;
    if (video) {
      // 从定格处继续播后半段（走近/退场），不要跳到更晚的时间点
      const pausedNear =
        Number.isFinite(video.currentTime) &&
        Math.abs(video.currentTime - props.advisorPauseAtSec) < 0.35;
      if (!pausedNear) {
        video.currentTime = props.advisorPauseAtSec;
      }
      const played = await playDecodable(video, false);
      if (generation !== applyGeneration) return;
      if (!played) {
        emit('clipEnded');
      }
      return;
    }

    const clip = clipForMode(mode);
    if (!clip) return;

    const src = await getSceneVideoSrc(clip);
    if (generation !== applyGeneration) return;

    if (!src) {
      emit('clipEnded');
      return;
    }

    const targetSlot: Slot = visibleSlot.value ? otherSlot(visibleSlot.value) : 'a';
    const played = await prepareSlot(targetSlot, src, false, true);
    if (generation !== applyGeneration) {
      slotVideo(targetSlot)?.pause();
      return;
    }

    if (!played) {
      emit('clipEnded');
      return;
    }

    swapToSlot(targetSlot, true);
    const leaveVideo = slotVideo(targetSlot);
    if (leaveVideo) {
      leaveVideo.currentTime = props.advisorPauseAtSec;
      const resumed = await playDecodable(leaveVideo, false);
      if (!resumed) {
        emit('clipEnded');
      }
    }
    return;
  }

  // Default IDLE = static poster; ambient clips only fire occasionally.
  if (mode === 'idle') {
    hideToPoster(true);
    scheduleIdleAmbient();
    return;
  }

  const clip = clipForMode(mode);
  if (!clip) {
    return;
  }

  const src = await getSceneVideoSrc(clip);
  if (generation !== applyGeneration) return;

  if (!src) {
    hideToPoster(false);
    if (mode === 'phone-start' || mode === 'phone-end' || mode === 'publish-end') {
      emit('clipEnded');
    } else if (mode === 'advisor-arrive') {
      emit('clipPaused');
    }
    return;
  }

  const current = visibleSlot.value;
  const targetSlot: Slot = current ? otherSlot(current) : 'a';
  const played = await prepareSlot(targetSlot, src, false, true);
  if (generation !== applyGeneration) {
    slotVideo(targetSlot)?.pause();
    return;
  }

  if (!played) {
    if (mode === 'advisor-arrive') {
      emit('clipPaused');
    } else {
      emit('clipEnded');
    }
    return;
  }

  swapToSlot(targetSlot, true);

  if (mode === 'advisor-arrive') {
    advisorPauseEmitted = false;
  }
}

function onVideoEnded(event: Event) {
  if (debugClipActive.value) return;
  const video = event.target as HTMLVideoElement;
  if (!visibleSlot.value || slotVideo(visibleSlot.value) !== video) return;

  if (props.mode === 'idle') {
    video.pause();
    hideToPoster(true);
    scheduleIdleAmbient();
    return;
  }

  if (
    props.mode === 'phone-start' ||
    props.mode === 'phone-end' ||
    props.mode === 'publish-end' ||
    props.mode === 'advisor-leave'
  ) {
    video.pause();
    emit('clipEnded');
  }
}

function onVideoTimeUpdate(event: Event) {
  if (debugClipActive.value || props.mode !== 'advisor-arrive' || advisorPauseEmitted) return;

  const video = event.target as HTMLVideoElement;
  if (!visibleSlot.value || slotVideo(visibleSlot.value) !== video) return;
  if (video.currentTime < props.advisorPauseAtSec) return;

  advisorPauseEmitted = true;
  video.pause();
  emit('clipPaused');
}

function getActiveVideo() {
  return visibleSlot.value ? slotVideo(visibleSlot.value) : null;
}

function seekTo(seconds: number) {
  const video = getActiveVideo();
  if (!video) return;
  video.pause();
  video.currentTime = seconds;
}

function setDebugState(state: { view: SceneAlignView; blend: number } | null) {
  debugState.value = state;
}

function clearDebugMode() {
  debugClipActive.value = false;
  debugState.value = null;
  void applyMode(props.mode);
}

async function loadDebugClip(
  clip: SceneVideoClip,
  options: { time?: number; pause?: boolean } = {},
) {
  debugClipActive.value = true;
  clearIdleRestTimer();
  const generation = ++applyGeneration;

  const src = await getSceneVideoSrc(clip);
  if (generation !== applyGeneration) return;

  if (!src) {
    outgoingSlot.value = null;
    visibleSlot.value = null;
    return;
  }

  const targetSlot: Slot = visibleSlot.value ? otherSlot(visibleSlot.value) : 'a';
  const played = await prepareSlot(targetSlot, src, false, true);
  if (generation !== applyGeneration) return;

  if (!played) {
    outgoingSlot.value = null;
    visibleSlot.value = null;
    return;
  }

  // Debug seeks should snap, not fade.
  swapToSlot(targetSlot, false);
  const video = slotVideo(targetSlot);
  if (!video) return;

  video.pause();
  if (options.time !== undefined) {
    video.currentTime = options.time;
  }
  if (!options.pause) {
    void video.play();
  }
}

defineExpose({
  getActiveVideo,
  seekTo,
  setDebugState,
  loadDebugClip,
  clearDebugMode,
});

watch(
  () => props.mode,
  (mode) => {
    void applyMode(mode);
  },
);

watch(
  () => props.ambientEnabled,
  (enabled) => {
    if (!enabled) {
      freezeAmbient();
      return;
    }
    if (props.mode === 'idle' && !debugClipActive.value) {
      scheduleIdleAmbient();
    }
  },
);

onMounted(() => {
  void applyMode(props.mode);
});

onUnmounted(() => {
  clearIdleRestTimer();
  applyGeneration += 1;
  fadeToken += 1;
});
</script>

<template>
  <div
    class="ml-scene-backdrop"
    :class="{ 'is-soft-fade': softFadeEnabled }"
    aria-hidden="true"
  >
    <img
      class="ml-scene-backdrop__poster"
      :class="{ 'is-debug-overlay': debugState }"
      :style="posterStyle"
      :src="sceneBg"
      alt=""
    />
    <video
      ref="slotA"
      class="ml-scene-backdrop__video"
      :class="videoClass('a')"
      playsinline
      preload="auto"
      @ended="onVideoEnded"
      @timeupdate="onVideoTimeUpdate"
    />
    <video
      ref="slotB"
      class="ml-scene-backdrop__video"
      :class="videoClass('b')"
      playsinline
      preload="auto"
      @ended="onVideoEnded"
      @timeupdate="onVideoTimeUpdate"
    />
  </div>
</template>

<style scoped>
.ml-scene-backdrop {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  user-select: none;
}

.ml-scene-backdrop__poster,
.ml-scene-backdrop__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center 42%;
}

.ml-scene-backdrop__poster {
  z-index: 0;
}

.ml-scene-backdrop__poster.is-debug-overlay {
  pointer-events: none;
}

.ml-scene-backdrop__video {
  z-index: 1;
  opacity: 0;
}

.ml-scene-backdrop.is-soft-fade .ml-scene-backdrop__video {
  transition: opacity 0.45s ease;
}

.ml-scene-backdrop__video.is-visible {
  opacity: 1;
}

.ml-scene-backdrop__video.is-front {
  z-index: 2;
}
</style>
