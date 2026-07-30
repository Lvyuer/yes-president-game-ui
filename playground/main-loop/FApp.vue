<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import gsap from 'gsap';
import FHotSearch from './FHotSearch.vue';
import { prefersReducedMotion } from './phoneMotion';
import { CHIP_POLICY_POST_TEXT } from './greenhoodMarket';
import { useFSocialStore, type FPost } from './useFSocialStore';
import playerAvatarSrc from './assets/avatars/player.png';

const props = defineProps<{
  locked: boolean;
  /** 调水门表态帖是否已发 */
  posted: boolean;
  /** 是否已解锁芯片放风帖（通气 + 已买 TECH） */
  chipPostAvailable?: boolean;
  /** 芯片放风帖是否已发 */
  chipPosted?: boolean;
  /** 调水门等脚本帖：打开发帖时一键填入（与芯片放风同交互） */
  autofillPostText?: string;
  guardMessage?: string;
}>();

const emit = defineEmits<{
  post: [content: string];
  chipPost: [content: string];
  hotSearchSeen: [];
}>();

type TabId = 'home' | 'trending';
type ComposeMode = 'yacht' | 'chip';

const {
  posts,
  trends,
  ensureHydrated,
  appendFeed,
  publishPlayerPost,
} = useFSocialStore();
const tab = ref<TabId>('home');
const composing = ref(false);
const composeMode = ref<ComposeMode>('yacht');
const draft = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadLabel = ref('Posting');
const listRef = ref<HTMLElement | null>(null);
const composeRef = ref<HTMLElement | null>(null);
const homePaneRef = ref<HTMLElement | null>(null);
const loadingMore = ref(false);
const justPostedId = ref<string | null>(null);

let uploadTween: gsap.core.Tween | null = null;

const chipPostReady = computed(
  () => Boolean(props.chipPostAvailable) && !props.chipPosted,
);

/** 调水门脚本帖：信息流上方一键填写条 */
const yachtPostReady = computed(
  () => Boolean(props.autofillPostText) && !props.posted,
);

const canOpenCompose = computed(() => {
  if (props.locked || uploading.value) return false;
  return !props.posted || chipPostReady.value;
});

const canPublish = computed(() => {
  if (draft.value.trim().length === 0 || uploading.value) return false;
  if (composeMode.value === 'chip') return chipPostReady.value;
  return !props.posted;
});

const composeTitle = computed(() =>
  composeMode.value === 'chip' ? '芯片放风帖' : props.autofillPostText ? '调水门表态' : '发帖',
);

const composeReadonly = computed(
  () => composeMode.value === 'chip' || (composeMode.value === 'yacht' && Boolean(props.autofillPostText)),
);

const composePlaceholder = computed(() => {
  if (composeMode.value === 'chip') return '算力松绑放风…';
  if (props.autofillPostText) return '调水门表态…';
  return '说说你的看法…';
});

onMounted(() => {
  ensureHydrated();
  void animateFeedIn();
  void nextTick(() => fillIfShort());
});

watch(
  () => [props.posted, props.chipPosted] as const,
  () => {
    if (!canOpenCompose.value) composing.value = false;
  },
);

function clearUploadTween() {
  uploadTween?.kill();
  uploadTween = null;
}

async function animateFeedIn() {
  await nextTick();
  const items = listRef.value?.querySelectorAll('.ml-fapp__post');
  if (!items?.length) return;
  if (prefersReducedMotion()) {
    gsap.set(items, { opacity: 1, y: 0 });
    return;
  }
  gsap.fromTo(
    items,
    { opacity: 0, y: 14 },
    { opacity: 1, y: 0, duration: 0.32, stagger: 0.045, ease: 'power2.out', clearProps: 'transform' },
  );
}

async function openCompose(mode: ComposeMode = 'yacht') {
  if (!canOpenCompose.value) return;
  if (mode === 'yacht' && props.posted) {
    if (!chipPostReady.value) return;
    mode = 'chip';
  }
  if (mode === 'chip' && !chipPostReady.value) return;

  composeMode.value = mode;
  composing.value = true;
  if (mode === 'chip') {
    draft.value = CHIP_POLICY_POST_TEXT;
  } else if (props.autofillPostText) {
    draft.value = props.autofillPostText;
  } else {
    draft.value = '';
  }
  await nextTick();
  if (!composeRef.value) return;
  if (prefersReducedMotion()) {
    gsap.set(composeRef.value, { opacity: 1, y: 0 });
    return;
  }
  gsap.fromTo(
    composeRef.value,
    { opacity: 0, y: 28 },
    { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
  );
}

async function closeCompose() {
  if (uploading.value) return;
  if (composeRef.value && !prefersReducedMotion()) {
    await gsap.to(composeRef.value, { opacity: 0, y: 16, duration: 0.18, ease: 'power2.in' });
  }
  composing.value = false;
}

async function switchTab(next: TabId) {
  if (props.locked || next === tab.value) return;
  const leavingHome = tab.value === 'home';
  tab.value = next;
  if (next === 'trending') emit('hotSearchSeen');

  await nextTick();
  if (prefersReducedMotion()) return;

  if (next === 'home' && homePaneRef.value) {
    gsap.fromTo(
      homePaneRef.value,
      { opacity: 0.35, x: -12 },
      { opacity: 1, x: 0, duration: 0.22, ease: 'power2.out', clearProps: 'transform' },
    );
    void nextTick(() => fillIfShort());
  } else if (!leavingHome) {
    /* trending mounts fresh; FHotSearch handles its own enter */
  }
}

/** Keep appending while near the bottom so wheel/trackpad scrolling never runs dry. */
function ensureMorePosts() {
  const el = listRef.value;
  if (!el || props.locked || loadingMore.value) return;
  const remain = el.scrollHeight - el.scrollTop - el.clientHeight;
  if (remain > 280) return;

  loadingMore.value = true;
  const added = appendFeed(8);
  loadingMore.value = false;
  if (!added) return;

  // If still not enough content to scroll, keep filling.
  void nextTick(() => {
    fillIfShort();
    if (prefersReducedMotion()) return;
    const items = el.querySelectorAll('.ml-fapp__post');
    const fresh = Array.from(items).slice(-8);
    if (!fresh.length) return;
    gsap.fromTo(
      fresh,
      { opacity: 0.35, y: 8 },
      { opacity: 1, y: 0, duration: 0.22, stagger: 0.02, ease: 'power2.out', clearProps: 'transform' },
    );
  });
}

function fillIfShort() {
  const el = listRef.value;
  if (!el || props.locked) return;
  let guard = 0;
  while (el.scrollHeight <= el.clientHeight + 40 && guard < 6) {
    if (!appendFeed(8)) break;
    guard += 1;
  }
}

function onFeedScroll() {
  ensureMorePosts();
}

function formatCount(n: number): string {
  if (n >= 100000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function initials(name: string): string {
  return name.slice(0, 1);
}

async function publish() {
  if (!canPublish.value || uploading.value) return;
  const content = draft.value.trim();
  if (!content) return;
  const mode = composeMode.value;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadLabel.value = 'Posting';
  const duration = prefersReducedMotion() ? 0.28 : 0.9;

  await new Promise<void>((resolve) => {
    clearUploadTween();
    uploadTween = gsap.to(uploadProgress, {
      value: 100,
      duration,
      ease: prefersReducedMotion() ? 'none' : 'power1.out',
      onUpdate: () => {
        const p = uploadProgress.value;
        if (p < 55) uploadLabel.value = 'Posting';
        else if (p < 92) uploadLabel.value = 'Almost done';
        else uploadLabel.value = 'Posted';
      },
      onComplete: () => resolve(),
    });
  });

  clearUploadTween();
  const post = publishPlayerPost(content);
  justPostedId.value = post.id;
  uploading.value = false;
  composing.value = false;
  draft.value = '';
  tab.value = 'home';
  if (mode === 'chip') emit('chipPost', content);
  else emit('post', content);
  await nextTick();
  if (listRef.value) listRef.value.scrollTop = 0;
  const lead = listRef.value?.querySelector('.ml-fapp__post.is-fresh');
  if (lead && !prefersReducedMotion()) {
    gsap.fromTo(
      lead,
      { opacity: 0, y: -18, scale: 0.98 },
      { opacity: 1, y: 0, scale: 1, duration: 0.38, ease: 'back.out(1.4)', clearProps: 'transform' },
    );
  }
  window.setTimeout(() => {
    if (justPostedId.value === post.id) justPostedId.value = null;
  }, 1800);
}

function postKey(post: FPost) {
  return post.id;
}
</script>

<template>
  <div class="ml-fapp" aria-label="F">
    <div v-if="props.locked" class="ml-fapp__guard">
      <p>{{ props.guardMessage }}</p>
    </div>

    <template v-else>
      <header class="ml-fapp__top">
        <span class="ml-fapp__avatar-btn" aria-hidden="true">
          <img class="ml-fapp__avatar-img" :src="playerAvatarSrc" alt="" draggable="false" />
        </span>
        <span class="ml-fapp__brand">F</span>
        <button
          type="button"
          class="ml-fapp__post-btn"
          :disabled="!canOpenCompose || uploading"
          @click="openCompose(props.posted ? 'chip' : 'yacht')"
        >
          {{ chipPostReady && props.posted ? '放风' : '发帖' }}
        </button>
      </header>

      <div v-if="yachtPostReady" class="ml-fapp__chip-cue">
        <p>媒体部已备稿。可发调水门切割/冷处理表态。</p>
        <button type="button" class="ml-fapp__chip-btn" :disabled="uploading" @click="openCompose('yacht')">
          一键填写调水门表态
        </button>
      </div>

      <div v-if="chipPostReady" class="ml-fapp__chip-cue">
        <p>仓位已建。可发算力松绑帖推 TECH。</p>
        <button type="button" class="ml-fapp__chip-btn" :disabled="uploading" @click="openCompose('chip')">
          一键填写算力松绑
        </button>
      </div>

      <div v-show="tab === 'home'" ref="homePaneRef" class="ml-fapp__pane">
        <div
          ref="listRef"
          class="ml-fapp__feed"
          role="feed"
          aria-label="信息流"
          @scroll.passive="onFeedScroll"
        >
          <article
            v-for="post in posts"
            :key="postKey(post)"
            class="ml-fapp__post"
            :class="{
              'is-player': post.isPlayer,
              'is-fresh': post.id === justPostedId,
            }"
          >
            <div class="ml-fapp__avatar" :class="{ 'is-player': post.isPlayer }" aria-hidden="true">
              <img
                v-if="post.isPlayer"
                class="ml-fapp__avatar-img"
                :src="playerAvatarSrc"
                alt=""
                draggable="false"
              />
              <template v-else>{{ initials(post.authorName) }}</template>
            </div>
            <div class="ml-fapp__post-body">
              <div class="ml-fapp__post-meta">
                <span class="ml-fapp__name">{{ post.authorName }}</span>
                <span class="ml-fapp__handle">@{{ post.authorHandle }}</span>
              </div>
              <p class="ml-fapp__text">{{ post.text }}</p>
              <div class="ml-fapp__metrics" aria-hidden="true">
                <span class="ml-fapp__metric">
                  <svg viewBox="0 0 24 24"><path d="M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z" fill="currentColor"/></svg>
                  {{ formatCount(post.metrics.comments) }}
                </span>
                <span class="ml-fapp__metric">
                  <svg viewBox="0 0 24 24"><path d="M4.5 3.88l4.432 4.14-1.364 1.46L5.5 7.55V16c0 1.1.896 2 2 2H13v2H7.5c-2.209 0-4-1.79-4-4V7.55L1.432 9.48.068 8.02 4.5 3.88zM16.5 6H11V4h5.5c2.209 0 4 1.79 4 4v8.45l2.068-1.93 1.364 1.46-4.432 4.14-4.432-4.14 1.364-1.46 2.068 1.93V8c0-1.1-.896-2-2-2z" fill="currentColor"/></svg>
                  {{ formatCount(post.metrics.reposts) }}
                </span>
                <span class="ml-fapp__metric">
                  <svg viewBox="0 0 24 24"><path d="M16.697 5.5c-1.222-.06-2.628.5-3.733 1.5-1.105-1-2.511-1.56-3.733-1.5-2.16.11-3.87 1.99-3.87 4.28 0 4.75 5.03 8.14 7.003 9.54.4.28.94.28 1.34 0 1.97-1.4 7.003-4.79 7.003-9.54 0-2.29-1.71-4.17-3.87-4.28z" fill="currentColor"/></svg>
                  {{ formatCount(post.metrics.likes) }}
                </span>
              </div>
            </div>
          </article>
        </div>
      </div>

      <div v-if="tab === 'trending'" class="ml-fapp__pane ml-fapp__pane--fill">
        <FHotSearch :items="trends" @seen="emit('hotSearchSeen')" />
      </div>

      <nav class="ml-fapp__tabs" aria-label="F 导航">
        <button
          type="button"
          class="ml-fapp__tab"
          :class="{ 'is-active': tab === 'home' }"
          aria-label="首页"
          @click="switchTab('home')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 4.5L3.5 11.2V20h6.2v-5.2h4.6V20h6.2v-8.8L12 4.5z" fill="currentColor" />
          </svg>
        </button>
        <button
          type="button"
          class="ml-fapp__tab"
          :class="{ 'is-active': tab === 'trending' }"
          aria-label="F 热榜"
          @click="switchTab('trending')"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M10.5 4a6.5 6.5 0 015.2 10.4l4 4-1.1 1.1-4-4A6.5 6.5 0 1110.5 4zm0 1.5a5 5 0 100 10 5 5 0 000-10z"
              fill="currentColor"
            />
          </svg>
        </button>
      </nav>

      <div
        v-if="composing"
        ref="composeRef"
        class="ml-fapp__compose"
        role="dialog"
        :aria-label="composeTitle"
      >
        <div class="ml-fapp__compose-head">
          <button type="button" class="ml-fapp__compose-cancel" :disabled="uploading" @click="closeCompose">
            取消
          </button>
          <span class="ml-fapp__compose-label">{{ composeTitle }}</span>
          <button type="button" class="ml-fapp__compose-post" :disabled="!canPublish" @click="publish">
            发布
          </button>
        </div>
        <textarea
          v-model="draft"
          class="ml-fapp__editor"
          :placeholder="composePlaceholder"
          rows="6"
          :readonly="composeReadonly"
          :disabled="uploading"
        />
        <div v-if="uploading" class="ml-fapp__upload" role="status" aria-live="polite">
          <div class="ml-fapp__upload-line" :style="{ width: `${uploadProgress}%` }" />
          <div class="ml-fapp__upload-status">
            <span class="ml-fapp__upload-dot" aria-hidden="true" />
            <span>{{ uploadLabel }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ml-fapp {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  background: #000;
  color: #e7e9ea;
  overflow: hidden;
  font-family: var(--yp-font-sans);
}

.ml-fapp__guard {
  margin: auto 8%;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.82);
  border: 1px solid #2f3336;
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #8b98a5;
}

.ml-fapp__top {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 44px 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-bottom: 1px solid #2f3336;
}

.ml-fapp__avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #2f3336;
  color: #e7e9ea;
  font-size: 0.8rem;
  font-weight: 600;
  user-select: none;
  overflow: hidden;
}

.ml-fapp__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.ml-fapp__brand {
  justify-self: center;
  color: #e7e9ea;
  font-family: var(--yp-font-latin);
  font-size: 1.2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  user-select: none;
}

.ml-fapp__post-btn {
  min-width: 72px;
  height: 32px;
  padding: 0 14px;
  border: 0;
  border-radius: 999px;
  background: #e7e9ea;
  color: #0f1419;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}

.ml-fapp__post-btn:hover:not(:disabled) {
  background: #fff;
}

.ml-fapp__post-btn:active:not(:disabled) {
  transform: scale(0.96);
}

.ml-fapp__post-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.ml-fapp__chip-cue {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px 12px;
  border-bottom: 1px solid #2f3336;
  background: #0a0a0a;
}

.ml-fapp__chip-cue p {
  margin: 0;
  color: #c8cdd2;
  font-size: 0.78rem;
  line-height: 1.4;
}

.ml-fapp__chip-btn {
  align-self: flex-start;
  height: 30px;
  padding: 0 12px;
  border: 1px solid #536471;
  border-radius: 999px;
  background: transparent;
  color: #e7e9ea;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.ml-fapp__chip-btn:hover:not(:disabled) {
  border-color: #e7e9ea;
}

.ml-fapp__chip-btn:disabled {
  opacity: 0.45;
  cursor: default;
}

.ml-fapp__pane {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.ml-fapp__pane--fill {
  position: relative;
}

.ml-fapp__feed {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overscroll-behavior-y: auto;
  scrollbar-width: thin;
}

.ml-fapp__feed::-webkit-scrollbar {
  width: 4px;
}

.ml-fapp__feed::-webkit-scrollbar-thumb {
  background: #2f3336;
  border-radius: 4px;
}

.ml-fapp__post {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #2f3336;
}

.ml-fapp__post.is-player {
  background: rgba(29, 155, 240, 0.07);
}

.ml-fapp__post.is-fresh {
  box-shadow: inset 3px 0 0 #1d9bf0;
}

.ml-fapp__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #2f3336;
  font-size: 0.85rem;
  font-weight: 600;
  overflow: hidden;
}

.ml-fapp__avatar.is-player {
  background: #1d9bf0;
  color: #fff;
}

.ml-fapp__post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: baseline;
  margin-bottom: 2px;
}

.ml-fapp__name {
  font-size: 0.9rem;
  font-weight: 700;
}

.ml-fapp__handle {
  font-size: 0.78rem;
  color: #71767b;
}

.ml-fapp__text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.ml-fapp__metrics {
  display: flex;
  gap: 22px;
  margin-top: 10px;
  color: #71767b;
}

.ml-fapp__metric {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.72rem;
  font-variant-numeric: tabular-nums;
}

.ml-fapp__metric svg {
  width: 15px;
  height: 15px;
  opacity: 0.9;
}

.ml-fapp__tabs {
  flex: 0 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-top: 1px solid #2f3336;
  background: #000;
}

.ml-fapp__tab {
  display: grid;
  place-items: center;
  height: 52px;
  border: 0;
  background: transparent;
  color: #71767b;
  cursor: pointer;
  transition: color 0.15s ease;
}

.ml-fapp__tab.is-active {
  color: #e7e9ea;
  box-shadow: inset 0 -2px 0 #1d9bf0;
}

.ml-fapp__tab svg {
  width: 22px;
  height: 22px;
  transition: transform 0.18s ease;
}

.ml-fapp__tab:active svg {
  transform: scale(0.88);
}

.ml-fapp__compose {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: #000;
}

.ml-fapp__compose-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  border-bottom: 1px solid #2f3336;
}

.ml-fapp__compose-label {
  color: #71767b;
  font-size: 0.78rem;
  font-weight: 600;
}

.ml-fapp__compose-cancel {
  border: 0;
  background: transparent;
  color: #e7e9ea;
  font-size: 0.9rem;
  cursor: pointer;
}

.ml-fapp__compose-post {
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: #e7e9ea;
  color: #0f1419;
  font-size: 0.85rem;
  font-weight: 700;
  cursor: pointer;
}

.ml-fapp__compose-post:disabled {
  opacity: 0.4;
  cursor: default;
}

.ml-fapp__editor {
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  margin: 0;
  padding: 16px 14px;
  border: 0;
  resize: none;
  background: transparent;
  color: #e7e9ea;
  font-family: var(--yp-font-sans);
  font-size: 1rem;
  line-height: 1.5;
}

.ml-fapp__editor:focus {
  outline: none;
}

.ml-fapp__editor::placeholder {
  color: #71767b;
}

.ml-fapp__upload {
  position: absolute;
  inset: 0;
  pointer-events: all;
  background: rgba(0, 0, 0, 0.28);
}

.ml-fapp__upload-line {
  position: absolute;
  left: 0;
  top: 0;
  height: 2px;
  background: #1d9bf0;
}

.ml-fapp__upload-status {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #000;
  border: 1px solid #2f3336;
  font-family: var(--yp-font-latin);
  font-size: 0.78rem;
}

.ml-fapp__upload-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #2f3336;
  border-top-color: #1d9bf0;
  animation: ml-fapp-spin 0.75s linear infinite;
}

@keyframes ml-fapp-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ml-fapp__upload-dot {
    animation: none;
  }

  .ml-fapp__post-btn,
  .ml-fapp__tab svg {
    transition: none;
  }
}
</style>
