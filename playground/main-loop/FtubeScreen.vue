<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import gsap from 'gsap';
import type { FtubeEpisode } from './casePortStrike';
import {
  getFtubeTopic,
  requiredTopicIdForEpisode,
  topicsForEpisode,
  type FtubeTopic,
} from './ftubeTopics';
import ftubeHomeBase from './assets/ftube-home-base.png';
import ftubeDetailBase from './assets/ftube-detail-base.png';
import FtubeFeedCard from './FtubeFeedCard.vue';
import FtubeThumb from './FtubeThumb.vue';
import {
  killMediaMotion,
  playCollapseTo,
  playExpandFrom,
} from './phoneMotion';

const props = defineProps<{
  locked: boolean;
  episode?: FtubeEpisode;
  ftubeWatched?: boolean;
  reopenWatched?: boolean;
  /** @deprecated Prefer ftubeWatched / reopenWatched */
  watched?: boolean;
  /** False while phone open intro is still playing — blocks hit races. */
  interactive?: boolean;
  guardMessage?: string;
}>();

const emit = defineEmits<{
  watched: [];
}>();

type View = 'feed' | 'detail';

/** Slots measured from ftube-home-base.png (1440×2560). */
const FEED_SLOT = { left: 2.4, top: 16.1, width: 95.2, height: 81.6 };

const view = ref<View>('feed');
const activeTopicId = ref<string | null>(null);
const liked = ref(false);
const disliked = ref(false);

const episode = computed<FtubeEpisode>(() => props.episode ?? 'crisis');
const requiredId = computed(() => requiredTopicIdForEpisode(episode.value));
const feedTopics = computed(() => topicsForEpisode(episode.value));
const baseSrc = computed(() =>
  view.value === 'detail' ? ftubeDetailBase : ftubeHomeBase,
);

const activeTopic = computed<FtubeTopic | null>(() => {
  if (!activeTopicId.value) return null;
  return getFtubeTopic(activeTopicId.value) ?? null;
});

const watchStats = computed(() => {
  const topic = activeTopic.value;
  if (!topic) return '';
  if (topic.id === 'port-strike') return '248 万次观看 · 直播中';
  if (topic.id === 'port-reopen') return '96 万次观看 · 1 小时前';
  return '12 万次观看 · 今天';
});

const requiredWatched = computed(() => {
  if (episode.value === 'reopen') {
    return Boolean(props.reopenWatched ?? props.watched);
  }
  return Boolean(props.ftubeWatched ?? props.watched);
});

function isTopicWatched(id: string): boolean {
  if (id === 'port-strike') return Boolean(props.ftubeWatched);
  if (id === 'port-reopen') return Boolean(props.reopenWatched);
  return false;
}

const rootRef = ref<HTMLElement | null>(null);
const videoSlotRef = ref<HTMLElement | null>(null);
const hitRef = ref<HTMLButtonElement | null>(null);
const playerRef = ref<HTMLElement | null>(null);
const playerOpen = ref(false);
const navLocked = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);
const playerBox = ref({ left: 0, top: 4, width: 100, height: 28 });

watch(
  () => props.episode,
  () => {
    view.value = 'feed';
    activeTopicId.value = null;
    playerOpen.value = false;
    liked.value = false;
    disliked.value = false;
  },
);

function openTopic(topic: FtubeTopic) {
  if (props.interactive === false || props.locked || navLocked.value) return;
  activeTopicId.value = topic.id;
  view.value = 'detail';
  playerOpen.value = false;
  liked.value = false;
  disliked.value = false;
}

function toggleLike() {
  liked.value = !liked.value;
  if (liked.value) disliked.value = false;
}

function toggleDislike() {
  disliked.value = !disliked.value;
  if (disliked.value) liked.value = false;
}

function backToFeed() {
  if (navLocked.value) return;
  void closePlayer().then(() => {
    view.value = 'feed';
    activeTopicId.value = null;
  });
}

function containerRect(): DOMRect | null {
  return rootRef.value?.getBoundingClientRect() ?? null;
}

function syncPlayerBoxFromSlot() {
  const root = rootRef.value?.getBoundingClientRect();
  const slot = videoSlotRef.value?.getBoundingClientRect();
  if (!root || !slot || root.width <= 0 || root.height <= 0) {
    playerBox.value = { left: 0, top: 4, width: 100, height: 28 };
    return;
  }
  playerBox.value = {
    left: ((slot.left - root.left) / root.width) * 100,
    top: ((slot.top - root.top) / root.height) * 100,
    width: (slot.width / root.width) * 100,
    height: (slot.height / root.height) * 100,
  };
}

function cardRect(container: DOMRect): DOMRect {
  const card = playerBox.value;
  return new DOMRect(
    container.left + (card.left / 100) * container.width,
    container.top + (card.top / 100) * container.height,
    (card.width / 100) * container.width,
    (card.height / 100) * container.height,
  );
}

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
  const card = playerBox.value;
  gsap.set(node, {
    opacity: 1,
    left: `${card.left}%`,
    top: `${card.top}%`,
    width: `${card.width}%`,
    height: `${card.height}%`,
    borderRadius: '0',
    pointerEvents: 'auto',
    clearProps: 'transform',
  });
}

async function openPlayer() {
  const topic = activeTopic.value;
  if (
    !topic?.video ||
    props.interactive === false ||
    props.locked ||
    playerOpen.value ||
    navLocked.value
  ) {
    return;
  }

  navLocked.value = true;
  syncPlayerBoxFromSlot();
  playerOpen.value = true;

  try {
    await nextTick();
    syncPlayerBoxFromSlot();

    const container = containerRect();
    if (container && container.width > 0 && playerRef.value) {
      await playExpandFrom(
        playerRef.value,
        fromRect(container),
        container,
        cardRect(container),
      );
    }

    snapPlayerToCard();

    const el = videoRef.value;
    if (el) {
      try {
        el.currentTime = 0;
        await el.play();
      } catch {
        /* gesture already counts */
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

/** Parent bottom "返回": close player, then detail→feed, else let phone handle. */
async function goBack(): Promise<boolean> {
  if (playerOpen.value) {
    await closePlayer();
    return true;
  }
  if (view.value === 'detail') {
    backToFeed();
    return true;
  }
  return false;
}

defineExpose({ goBack });

function finishWatch() {
  const topic = activeTopic.value;
  if (topic && topic.id === requiredId.value && !requiredWatched.value) {
    emit('watched');
  }
  void closePlayer();
}

function onVideoEnded() {
  finishWatch();
}

watch(requiredWatched, (done) => {
  if (done && activeTopic.value?.id === requiredId.value) {
    void closePlayer();
  }
});

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
    :class="{
      'is-nav-locked': navLocked,
      'is-inert': props.interactive === false,
      'is-detail': view === 'detail',
    }"
  >
    <img
      v-show="view === 'feed'"
      class="ml-ftube__base"
      :src="baseSrc"
      alt=""
      draggable="false"
    />

    <div v-if="props.locked" class="ml-ftube__guard">
      <p>{{ props.guardMessage }}</p>
    </div>

    <template v-else>
      <!-- Feed list over home dashed slot -->
      <div
        v-show="view === 'feed'"
        class="ml-ftube__feed"
        :style="{
          left: `${FEED_SLOT.left}%`,
          top: `${FEED_SLOT.top}%`,
          width: `${FEED_SLOT.width}%`,
          height: `${FEED_SLOT.height}%`,
        }"
      >
        <p v-if="!requiredWatched" class="ml-ftube__hint">请查看置顶报道</p>
        <FtubeFeedCard
          v-for="topic in feedTopics"
          :key="topic.id"
          :required="topic.id === requiredId && !requiredWatched"
          :done="isTopicWatched(topic.id)"
          @click.stop="openTopic(topic)"
        >
          <FtubeThumb
            :tag="topic.tag"
            :tone="topic.thumbTone"
            :image="topic.thumb"
            :video="topic.video"
          />
          <div class="ml-ftube__card-body">
            <p class="ml-ftube__card-title">{{ topic.title }}</p>
            <p class="ml-ftube__card-summary">{{ topic.summary }}</p>
            <p
              v-if="topic.id === requiredId && !requiredWatched"
              class="ml-ftube__card-badge"
            >
              必看
            </p>
          </div>
        </FtubeFeedCard>
      </div>

      <!-- YouTube-like watch page -->
      <div v-if="view === 'detail' && activeTopic" class="ml-ftube__watch">
        <div ref="videoSlotRef" class="ml-ftube__video-slot">
          <button type="button" class="ml-ftube__back" @click.stop="backToFeed">
            ←
          </button>
          <div class="ml-ftube__video-inner">
            <span v-if="activeTopic.playerLabel" class="ml-ftube__video-label">
              {{ activeTopic.playerLabel }}
            </span>
            <button
              v-if="activeTopic.video"
              ref="hitRef"
              type="button"
              class="ml-ftube__hit"
              :class="{ 'is-hidden': playerOpen }"
              :tabindex="playerOpen ? -1 : 0"
              :aria-label="'播放 ' + activeTopic.title"
              @click.stop="openPlayer"
            >
              <img
                v-if="activeTopic.thumb"
                class="ml-ftube__hit-poster"
                :src="activeTopic.thumb"
                alt=""
                draggable="false"
              />
              <span class="ml-ftube__play-icon" aria-hidden="true">
                <svg viewBox="0 0 64 64" width="100%" height="100%">
                  <circle cx="32" cy="32" r="30" fill="rgba(220, 38, 38, 0.92)" />
                  <path d="M26 18 L48 32 L26 46 Z" fill="#fff" />
                </svg>
              </span>
            </button>
            <div
              v-else
              class="ml-ftube__cover"
              :style="
                activeTopic.thumb
                  ? undefined
                  : { background: activeTopic.thumbTone }
              "
            >
              <img
                v-if="activeTopic.thumb"
                class="ml-ftube__hit-poster"
                :src="activeTopic.thumb"
                alt=""
                draggable="false"
              />
              <span v-else>暂无视频 · 文字速览</span>
            </div>
          </div>
        </div>

        <div class="ml-ftube__info">
          <h1 class="ml-ftube__headline">{{ activeTopic.title }}</h1>
          <p class="ml-ftube__stats">{{ watchStats }}</p>

          <div class="ml-ftube__actions" role="toolbar" aria-label="视频操作">
            <button
              type="button"
              class="ml-ftube__action"
              :class="{ 'is-on': liked }"
              @click.stop="toggleLike"
            >
              <svg
                class="ml-ftube__action-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"
                />
              </svg>
              <span>{{ liked ? '已赞' : '赞' }}</span>
            </button>
            <button
              type="button"
              class="ml-ftube__action"
              :class="{ 'is-on': disliked }"
              @click.stop="toggleDislike"
            >
              <svg
                class="ml-ftube__action-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  fill="currentColor"
                  d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"
                />
              </svg>
              <span>不喜欢</span>
            </button>
          </div>

          <div class="ml-ftube__channel">
            <div class="ml-ftube__channel-avatar" aria-hidden="true">F</div>
            <div class="ml-ftube__channel-meta">
              <p class="ml-ftube__channel-name">FTube 现场</p>
              <p class="ml-ftube__channel-subs">128 万订阅者</p>
            </div>
            <button type="button" class="ml-ftube__subscribe" @click.stop>
              订阅
            </button>
          </div>

          <p class="ml-ftube__desc">{{ activeTopic.summary }}</p>
        </div>

        <div class="ml-ftube__comments-wrap">
          <div class="ml-ftube__comments-head">
            <span>评论</span>
            <span class="ml-ftube__comments-count">
              {{ activeTopic.comments.length }}
            </span>
          </div>
          <div class="ml-ftube__comments-scroll">
            <ul class="ml-ftube__comments">
              <li v-for="item in activeTopic.comments" :key="item.id">
                <div class="ml-ftube__comment-avatar" aria-hidden="true">
                  {{ item.user.slice(0, 1) }}
                </div>
                <div class="ml-ftube__comment-body">
                  <p class="ml-ftube__comment-user">
                    {{ item.user }}
                    <span class="ml-ftube__comment-time">{{ item.timeLabel }}</span>
                  </p>
                  <p class="ml-ftube__comment-text">{{ item.text }}</p>
                  <p v-if="item.likes" class="ml-ftube__comment-likes">
                    ▴ {{ item.likes }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <div
      v-if="playerOpen && activeTopic?.video"
      ref="playerRef"
      class="ml-ftube__player"
      role="dialog"
      aria-label="视频播放器"
      :style="{
        left: `${playerBox.left}%`,
        top: `${playerBox.top}%`,
        width: `${playerBox.width}%`,
        height: `${playerBox.height}%`,
      }"
    >
      <button type="button" class="ml-ftube__player-close" @click.stop="closePlayer">
        关闭
      </button>
      <video
        ref="videoRef"
        class="ml-ftube__player-video"
        :src="activeTopic.video"
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
  background: #0b0b0b;
  font-family: 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.ml-ftube.is-nav-locked .ml-ftube__hit,
.ml-ftube.is-inert .ml-ftube__hit,
.ml-ftube.is-inert .ml-ftube-card,
.ml-ftube.is-inert .ml-ftube__back,
.ml-ftube.is-inert .ml-ftube__action,
.ml-ftube.is-inert .ml-ftube__subscribe {
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
  z-index: 5;
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

.ml-ftube__feed {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 8px 6px 12px;
  background: #0b0b0b;
  -webkit-overflow-scrolling: touch;
}

.ml-ftube__hint {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(220, 38, 38, 0.18);
  border: 1px solid rgba(220, 38, 38, 0.35);
  color: #fecaca;
  font-size: 0.78rem;
}

.ml-ftube__card-title {
  margin: 0 0 6px;
  font-size: 0.92rem;
  font-weight: 800;
  line-height: 1.35;
}

.ml-ftube__card-summary {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.55);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ml-ftube__card-badge {
  margin: 8px 0 0;
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  background: #dc2626;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
}

.ml-ftube__watch {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0f0f0f;
}

.ml-ftube__video-slot {
  position: relative;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
}

.ml-ftube__video-inner {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #111;
}

.ml-ftube__back {
  position: absolute;
  left: 8px;
  top: 8px;
  z-index: 4;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
}

.ml-ftube__video-label {
  position: absolute;
  right: 8px;
  top: 8px;
  left: auto;
  z-index: 2;
  max-width: 55%;
  padding: 3px 8px;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.65);
  font-size: 0.62rem;
  line-height: 1.3;
  text-align: right;
  pointer-events: none;
}

.ml-ftube__cover {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.65);
}

.ml-ftube__hit {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: #000;
  cursor: pointer;
}

.ml-ftube__hit-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
}

.ml-ftube__hit.is-hidden {
  opacity: 0;
  pointer-events: none;
}

.ml-ftube__play-icon {
  position: relative;
  z-index: 1;
  width: min(56px, 22%);
  aspect-ratio: 1;
  filter: drop-shadow(0 6px 14px rgba(0, 0, 0, 0.45));
  transition: transform 0.15s ease;
}

.ml-ftube__hit:hover .ml-ftube__play-icon {
  transform: scale(1.06);
}

.ml-ftube__info {
  flex: 0 0 auto;
  padding: 10px 12px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: #0f0f0f;
}

.ml-ftube__headline {
  margin: 0 0 6px;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1.35;
  color: #f1f1f1;
}

.ml-ftube__stats {
  margin: 0 0 10px;
  font-size: 0.68rem;
  color: rgba(255, 255, 255, 0.55);
}

.ml-ftube__actions {
  display: flex;
  gap: 8px;
  margin: 0 0 12px;
}

.ml-ftube__action {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(241, 241, 241, 0.92);
  font-size: 0.62rem;
  letter-spacing: 0.02em;
  cursor: pointer;
}

.ml-ftube__action.is-on {
  border-color: rgba(220, 38, 38, 0.55);
  background: rgba(220, 38, 38, 0.16);
  color: #fecaca;
}

.ml-ftube__action-icon {
  width: 20px;
  height: 20px;
  display: block;
  opacity: 0.92;
}

.ml-ftube__channel {
  display: grid;
  grid-template-columns: 36px 1fr auto;
  gap: 10px;
  align-items: center;
  margin: 0 0 10px;
}

.ml-ftube__channel-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #dc2626;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 800;
}

.ml-ftube__channel-name {
  margin: 0 0 2px;
  font-size: 0.78rem;
  font-weight: 700;
}

.ml-ftube__channel-subs {
  margin: 0;
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.5);
}

.ml-ftube__subscribe {
  padding: 8px 14px;
  border: 0;
  border-radius: 999px;
  background: #f1f1f1;
  color: #0f0f0f;
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
}

.ml-ftube__desc {
  margin: 0;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 0.7rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.72);
}

.ml-ftube__comments-wrap {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0f0f0f;
}

.ml-ftube__comments-head {
  flex: 0 0 auto;
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin: 0;
  padding: 10px 12px 8px;
  background: #0f0f0f;
  font-size: 0.82rem;
  font-weight: 700;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.ml-ftube__comments-count {
  font-size: 0.7rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.45);
}

.ml-ftube__comments-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 10px 12px 20px;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.ml-ftube__comments {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: 14px;
}

.ml-ftube__comments li {
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 10px;
  align-items: start;
}

.ml-ftube__comment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.72rem;
  font-weight: 700;
}

.ml-ftube__comment-user {
  margin: 0 0 4px;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.88);
}

.ml-ftube__comment-time {
  margin-left: 8px;
  font-size: 0.62rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.4);
}

.ml-ftube__comment-text {
  margin: 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}

.ml-ftube__comment-likes {
  margin: 6px 0 0;
  font-size: 0.62rem;
  color: rgba(255, 255, 255, 0.4);
}

.ml-ftube__player {
  position: absolute;
  z-index: 8;
  display: block;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
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
