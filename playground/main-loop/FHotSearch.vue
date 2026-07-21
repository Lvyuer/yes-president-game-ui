<script setup lang="ts">
import { onMounted, onUnmounted, reactive } from 'vue';
import hotsearchBase from './assets/f-hotsearch-ui-base.png';

const emit = defineEmits<{
  seen: [];
}>();

type Metrics = { comments: number; reposts: number; likes: number; views: number };

/** Persist across leave/re-enter so ticker resumes from current values. */
const sharedCounts = reactive<Metrics[]>([
  { comments: 1280, reposts: 3420, likes: 18600, views: 92400 },
  { comments: 860, reposts: 1240, likes: 9800, views: 41200 },
  { comments: 420, reposts: 680, likes: 5400, views: 22800 },
  { comments: 210, reposts: 340, likes: 2900, views: 15600 },
  { comments: 96, reposts: 140, likes: 1200, views: 8200 },
]);

const TICK_MS = 180;

/**
 * #1 rises fastest so the lead stays readable; no neon flourish.
 * [comments, reposts, likes, views]
 */
const STEP_RANGES: Array<Array<[number, number]>> = [
  [
    [70, 170],
    [140, 320],
    [400, 900],
    [1800, 3800],
  ],
  [
    [16, 40],
    [35, 80],
    [90, 210],
    [350, 900],
  ],
  [
    [8, 24],
    [16, 45],
    [45, 120],
    [180, 480],
  ],
  [
    [5, 14],
    [10, 28],
    [24, 65],
    [90, 250],
  ],
  [
    [2, 8],
    [5, 14],
    [12, 32],
    [40, 120],
  ],
];

/**
 * Action-bar number slots measured against f-hotsearch-ui-base.png (1440×2560).
 */
const SLOTS: Array<Array<{ left: string; top: string }>> = [
  [
    { left: '32.4%', top: '29.9%' },
    { left: '46.4%', top: '29.9%' },
    { left: '61.0%', top: '29.9%' },
    { left: '74.4%', top: '29.9%' },
  ],
  [
    { left: '32.4%', top: '46.9%' },
    { left: '46.4%', top: '46.9%' },
    { left: '61.0%', top: '46.9%' },
    { left: '74.4%', top: '46.9%' },
  ],
  [
    { left: '32.4%', top: '63.9%' },
    { left: '46.4%', top: '63.9%' },
    { left: '61.0%', top: '63.9%' },
    { left: '74.4%', top: '63.9%' },
  ],
  [
    { left: '32.4%', top: '81.0%' },
    { left: '46.4%', top: '81.0%' },
    { left: '61.0%', top: '81.0%' },
    { left: '74.4%', top: '81.0%' },
  ],
  [
    { left: '32.4%', top: '98.0%' },
    { left: '46.4%', top: '98.0%' },
    { left: '61.0%', top: '98.0%' },
    { left: '74.4%', top: '98.0%' },
  ],
];

const METRIC_KEYS: Array<keyof Metrics> = ['comments', 'reposts', 'likes', 'views'];

let timer: number | null = null;

function randInt(min: number, max: number) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function tick() {
  for (let i = 0; i < sharedCounts.length; i++) {
    const ranges = STEP_RANGES[i];
    const row = sharedCounts[i];
    row.comments += randInt(ranges[0][0], ranges[0][1]);
    row.reposts += randInt(ranges[1][0], ranges[1][1]);
    row.likes += randInt(ranges[2][0], ranges[2][1]);
    row.views += randInt(ranges[3][0], ranges[3][1]);
  }
}

/** Compact counts in an X-like voice (K / 万). */
function formatCount(n: number): string {
  if (n >= 100000) {
    return `${(n / 10000).toFixed(1)}万`;
  }
  if (n >= 10000) {
    return `${(n / 10000).toFixed(1)}万`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(n);
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

onMounted(() => {
  emit('seen');
  startTicker();
});

onUnmounted(() => {
  stopTicker();
});
</script>

<template>
  <div class="ml-hotsearch" aria-label="今日热议">
    <img class="ml-hotsearch__base" :src="hotsearchBase" alt="" draggable="false" />

    <template v-for="(row, rowIndex) in sharedCounts" :key="rowIndex">
      <span
        v-for="(key, metricIndex) in METRIC_KEYS"
        :key="`${rowIndex}-${key}`"
        class="ml-hotsearch__count"
        :class="{ 'is-lead': rowIndex === 0 }"
        :style="{
          left: SLOTS[rowIndex][metricIndex].left,
          top: SLOTS[rowIndex][metricIndex].top,
        }"
      >
        {{ formatCount(row[key]) }}
      </span>
    </template>
  </div>
</template>

<style scoped>
.ml-hotsearch {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #71767b;
}

.ml-hotsearch__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-hotsearch__count {
  position: absolute;
  z-index: 2;
  transform: translateY(-50%);
  font-family: var(--yp-font-sans);
  font-size: 0.62rem;
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  letter-spacing: 0;
  color: #71767b;
  pointer-events: none;
  white-space: nowrap;
}

/* Lead post: quieter emphasis — brighter text + weight, no glow */
.ml-hotsearch__count.is-lead {
  font-size: 0.68rem;
  font-weight: 700;
  color: #e7e9ea;
}
</style>
