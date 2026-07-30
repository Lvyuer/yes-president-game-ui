<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import gsap from 'gsap';
import { prefersReducedMotion } from './phoneMotion';
import type { FTrendItem } from './useFSocialStore';

const props = defineProps<{
  items: FTrendItem[];
}>();

const emit = defineEmits<{
  seen: [];
}>();

const rootRef = ref<HTMLElement | null>(null);
const liveHeat = reactive<number[]>([]);
const TICK_MS = 220;

function syncHeatFromItems() {
  for (let i = 0; i < props.items.length; i++) {
    const base = props.items[i]?.heat ?? 0;
    if (liveHeat[i] == null || liveHeat[i]! < base) {
      liveHeat[i] = base;
    }
  }
  liveHeat.length = props.items.length;
}

watch(
  () => props.items,
  () => syncHeatFromItems(),
  { immediate: true, deep: true },
);

let timer: number | null = null;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function tick() {
  for (let i = 0; i < liveHeat.length; i++) {
    const step = i === 0 ? randInt(800, 2200) : randInt(40, 180) * Math.max(1, 5 - i);
    liveHeat[i] = (liveHeat[i] ?? 0) + step;
  }
}

function formatHeat(n: number): string {
  if (n >= 100000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(Math.max(0, Math.round(n)));
}

function startTicker() {
  if (timer !== null) return;
  timer = window.setInterval(tick, TICK_MS);
}

function stopTicker() {
  if (timer === null) return;
  window.clearInterval(timer);
  timer = null;
}

onMounted(async () => {
  emit('seen');
  syncHeatFromItems();
  startTicker();
  await nextTick();
  const rows = rootRef.value?.querySelectorAll('.ml-hotsearch__row');
  if (!rows?.length || prefersReducedMotion()) return;
  gsap.fromTo(
    rows,
    { opacity: 0, y: 10 },
    { opacity: 1, y: 0, duration: 0.28, stagger: 0.04, ease: 'power2.out', clearProps: 'transform' },
  );
});

onUnmounted(() => {
  stopTicker();
});
</script>

<template>
  <div ref="rootRef" class="ml-hotsearch" aria-label="今日热议">
    <div class="ml-hotsearch__search" aria-hidden="true">
      <svg class="ml-hotsearch__search-ic" viewBox="0 0 24 24">
        <path
          d="M10.5 4a6.5 6.5 0 015.2 10.4l4 4-1.1 1.1-4-4A6.5 6.5 0 1110.5 4zm0 1.5a5 5 0 100 10 5 5 0 000-10z"
          fill="currentColor"
        />
      </svg>
      <span class="ml-hotsearch__search-ph">搜索热议话题</span>
    </div>

    <div class="ml-hotsearch__heading">
      <svg class="ml-hotsearch__flame" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 2c1.5 3 2 5.2 1.2 7.2-.5 1.2.2 2.3 1.4 2.8 1.8.8 3.4-.4 3.9-2.1C20 13.2 19.2 20 12 20S4 14.5 7.2 9.2C8.5 7 10 4.8 12 2z"
          fill="#f4212e"
        />
      </svg>
      <span class="ml-hotsearch__heading-text">今日热议</span>
      <span class="ml-hotsearch__heading-sub">每分钟更新</span>
    </div>

    <ol class="ml-hotsearch__list">
      <li
        v-for="(item, index) in props.items"
        :key="`${item.rank}-${item.linkedPostId ?? item.text}`"
        class="ml-hotsearch__row"
        :class="{ 'is-lead': Boolean(item.linkedPostId) }"
      >
        <span class="ml-hotsearch__rank" :class="{ 'is-top': item.rank <= 3 }">
          {{ item.rank }}
        </span>
        <div class="ml-hotsearch__body">
          <p class="ml-hotsearch__text">{{ item.text }}</p>
          <div class="ml-hotsearch__meta">
            <span v-if="item.linkedPostId" class="ml-hotsearch__badge">总统发声</span>
            <span class="ml-hotsearch__heat">{{ formatHeat(liveHeat[index] ?? item.heat) }}</span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.ml-hotsearch {
  position: absolute;
  inset: 0;
  overflow: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
  background: #000;
  color: #e7e9ea;
}

.ml-hotsearch::-webkit-scrollbar {
  display: none;
}

.ml-hotsearch__search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 12px 0;
  padding: 10px 14px;
  border-radius: 999px;
  background: #202327;
  color: #71767b;
}

.ml-hotsearch__search-ic {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.ml-hotsearch__search-ph {
  font-size: 0.88rem;
}

.ml-hotsearch__heading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid #2f3336;
}

.ml-hotsearch__flame {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.ml-hotsearch__heading-text {
  font-size: 0.95rem;
  font-weight: 700;
}

.ml-hotsearch__heading-sub {
  margin-left: auto;
  font-size: 0.72rem;
  color: #71767b;
}

.ml-hotsearch__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.ml-hotsearch__row {
  display: grid;
  grid-template-columns: 28px 1fr;
  gap: 10px;
  align-items: start;
  padding: 14px 16px;
  border-bottom: 1px solid #2f3336;
}

.ml-hotsearch__row.is-lead {
  background: rgba(29, 155, 240, 0.07);
}

.ml-hotsearch__rank {
  font-family: var(--yp-font-latin);
  font-size: 1.05rem;
  font-weight: 700;
  color: #71767b;
  line-height: 1.2;
}

.ml-hotsearch__rank.is-top {
  color: #f4212e;
}

.ml-hotsearch__body {
  min-width: 0;
}

.ml-hotsearch__text {
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  line-height: 1.4;
  word-break: break-word;
}

.ml-hotsearch__meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.ml-hotsearch__badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(29, 155, 240, 0.18);
  color: #1d9bf0;
  font-size: 0.68rem;
  font-weight: 600;
}

.ml-hotsearch__heat {
  font-size: 0.72rem;
  color: #71767b;
  font-variant-numeric: tabular-nums;
}
</style>
