<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import gsap from 'gsap';
import {
  PORT_STRIKE_REOPEN_VIDEO_SRC,
  PORT_STRIKE_VIDEO_SRC,
} from './casePortStrike';
import type { FtubeEpisode } from './casePortStrike';
import ftubeBase from './assets/ftube-ui-base.png';
import ftubeReopenBase from './assets/ftube-ui-reopen-base.png';
import {
  killMediaMotion,
  playCollapseTo,
  playExpandFrom,
} from './phoneMotion';

const props = defineProps<{
  locked: boolean;
  watched: boolean;
  episode?: FtubeEpisode;
  /** False while phone open intro is still playing — blocks hit races. */
  interactive?: boolean;
  guardMessage?: string;
}>();

const emit = defineEmits<{
  watched: [];
}>();

const isReopen = computed(() => props.episode === 'reopen');

const baseSrc = computed(() => (isReopen.value ? ftubeReopenBase : ftubeBase));

const videoSrc = computed(() =>
  isReopen.value ? PORT_STRIKE_REOPEN_VIDEO_SRC : PORT_STRIKE_VIDEO_SRC,
);

/** Featured video card slot — measured from each episode's UI base (1440×2560). */
const CARD = computed(() =>
  isReopen.value
    ? { left: 2.78, top: 34.61, width: 94.79, height: 25.7 }
    : { left: 2.78, top: 34.73, width: 94.38, height: 28.55 },
);

const rootRef = ref<HTMLElement | null>(null);
const hitRef = ref<HTMLButtonElement | null>(null);
const playerRef = ref<HTMLElement | null>(null);
const playerOpen = ref(false);
const navLocked = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);

function containerRect(): DOMRect | null {
  return rootRef.value?.getBoundingClientRect() ?? null;
}

function cardRect(container: DOMRect): DOMRect {
  const card = CARD.value;
  return new DOMRect(
    container.left + (card.left / 100) * container.width,
    container.top + (card.top / 100) * container.height,
    (card.width / 100) * container.width,
    (card.height / 100) * container.height,
  );
}

/** Start from the play icon (or card center if missing). */
function fromRect(container: DOMRect): DOMRect {
  const icon = hitRef.value?.querySelector('.ml-ftube__play-icon');
  if (icon instanceof HTMLElement) {
    return icon.getBoundingClientRect();
  }
  const card = cardRect(container);
  const size = Math.min(card.width, card.height) * 0.35;
  return new DOMRect(
    card.left + (card.width - size) / 2,
    card.top + (card.height - size) / 2,
    size,
    size,
  );
}

function snapPlayerToCard() {
  const node = playerRef.value;
  if (!node) return;
  const card = CARD.value;
  gsap.set(node, {
    opacity: 1,
    left: `${card.left}%`,
    top: `${card.top}%`,
    width: `${card.width}%`,
    height: `${card.height}%`,
    borderRadius: '6px',
    pointerEvents: 'auto',
    clearProps: 'transform',
  });
}

async function openPlayer() {
  if (
    props.interactive === false ||
    props.locked ||
    props.watched ||
    playerOpen.value ||
    navLocked.value
  ) {
    return;
  }

  navLocked.value = true;
  playerOpen.value = true;

  try {
    await nextTick();

    const container = containerRect();
    if (container && container.width > 0 && playerRef.value) {
      await playExpandFrom(
        playerRef.value,
        fromRect(container),
        container,
        cardRect(container),
      );
    }

    // Guarantee a visible, clickable player even if the timeline was interrupted.
    snapPlayerToCard();

    const el = videoRef.value;
    if (el) {
      try {
        el.currentTime = 0;
        await el.play();
      } catch {
        /* Autoplay may require a prior gesture; click already counts as one. */
      }
    }
  } finally {
    navLocked.value = false;
  }
}

async function closePlayer() {
  if (!playerOpen.value || navLocked.value) return;
  navLocked.value = true;

  try {
    const el = videoRef.value;
    if (el) el.pause();

    const container = containerRect();
    if (container && container.width > 0 && playerRef.value) {
      await playCollapseTo(playerRef.value, fromRect(container), container);
    }

    playerOpen.value = false;
  } finally {
    navLocked.value = false;
  }
}

/** Parent bottom "返回": close enlarged player first if open. */
async function goBack(): Promise<boolean> {
  if (playerOpen.value) {
    await closePlayer();
    return true;
  }
  return false;
}

defineExpose({ goBack });

function finishWatch() {
  if (!props.watched) {
    emit('watched');
  }
  void closePlayer();
}

function onVideoEnded() {
  finishWatch();
}

watch(
  () => props.watched,
  (done) => {
    if (done) void closePlayer();
  },
);

onBeforeUnmount(() => {
  const el = videoRef.value;
  if (el) el.pause();
  killMediaMotion();
});
</script>

<template>
  <div
    ref="rootRef"
    class="ml-ftube"
    :class="{ 'is-nav-locked': navLocked, 'is-inert': props.interactive === false }"
  >
    <img class="ml-ftube__base" :src="baseSrc" alt="" draggable="false" />

    <div v-if="props.locked" class="ml-ftube__guard">
      <p>{{ props.guardMessage }}</p>
    </div>

    <button
      v-else-if="!props.watched"
      ref="hitRef"
      type="button"
      class="ml-ftube__hit"
      :class="{ 'is-hidden': playerOpen }"
      :tabindex="playerOpen ? -1 : 0"
      :style="{
        left: `${CARD.left}%`,
        top: `${CARD.top}%`,
        width: `${CARD.width}%`,
        height: `${CARD.height}%`,
      }"
      :aria-label="isReopen ? '播放复工视频' : '播放现场视频'"
      @click.stop="openPlayer"
    >
      <span class="ml-ftube__play-icon" aria-hidden="true">
        <svg viewBox="0 0 64 64" width="100%" height="100%">
          <circle cx="32" cy="32" r="30" fill="rgba(220, 38, 38, 0.92)" />
          <path d="M26 18 L48 32 L26 46 Z" fill="#fff" />
        </svg>
      </span>
    </button>

    <div
      v-if="playerOpen"
      ref="playerRef"
      class="ml-ftube__player"
      role="dialog"
      :aria-label="isReopen ? '复工视频播放器' : '现场视频播放器'"
      :style="{
        left: `${CARD.left}%`,
        top: `${CARD.top}%`,
        width: `${CARD.width}%`,
        height: `${CARD.height}%`,
      }"
    >
      <button type="button" class="ml-ftube__player-close" @click.stop="closePlayer">关闭</button>

      <video
        ref="videoRef"
        class="ml-ftube__player-video"
        :src="videoSrc"
        controls
        playsinline
        autoplay
        @ended="onVideoEnded"
      />
    </div>
  </div>
</template>

<style scoped>
.ml-ftube {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #f2f2f2;
}

.ml-ftube.is-nav-locked .ml-ftube__hit,
.ml-ftube.is-inert .ml-ftube__hit {
  pointer-events: none;
}

.ml-ftube__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-ftube__guard {
  position: absolute;
  inset: 18% 8% 22%;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.78);
  border: 1px dashed rgba(240, 176, 176, 0.35);
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(240, 176, 176, 0.95);
}

.ml-ftube__hit {
  position: absolute;
  z-index: 2;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
}

.ml-ftube__hit.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.ml-ftube__play-icon {
  width: min(56px, 22%);
  aspect-ratio: 1;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
  transition: transform 0.15s ease;
}

.ml-ftube__hit:hover .ml-ftube__play-icon {
  transform: scale(1.06);
}

.ml-ftube__player {
  position: absolute;
  z-index: 8;
  display: block;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  border-radius: 6px;
  background: #000;
  will-change: transform, opacity, left, top, width, height;
}

.ml-ftube__player-close {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 2;
  padding: 4px 10px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: rgba(20, 20, 20, 0.85);
  color: #fff;
  font-size: 0.7rem;
  cursor: pointer;
}

.ml-ftube__player-video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  background: #000;
}
</style>
