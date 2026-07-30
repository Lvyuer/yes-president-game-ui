<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GameButton } from '@/index';
import { NATION_GROUP_ORDER, NATION_METRICS, type NationMetric } from './data';
import nationBase from './assets/nation-ui-base.png';

const props = defineProps<{
  metrics?: NationMetric[];
  feedbackPending?: boolean;
}>();

const emit = defineEmits<{
  back: [];
}>();

const metricKey = ref('gdp');
const view = ref<'domestic' | 'network' | 'trend'>('domestic');

const flatMetrics = computed(() => props.metrics ?? NATION_METRICS);

const metric = computed(
  () => flatMetrics.value.find((m) => m.key === metricKey.value) ?? flatMetrics.value[0],
);

watch(metricKey, () => {
  view.value = metric.value.defaultView;
});

function selectMetric(item: NationMetric) {
  metricKey.value = item.key;
}

const trendPoints = computed(() => {
  const values = metric.value.trend;
  const max = 100;
  const w = 640;
  const h = 208;
  const step = w / Math.max(1, values.length - 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - (v / max) * h;
      return `${x},${y}`;
    })
    .join(' ');
});

const summaryLabels = ['政策动向', '支出影响', '政策状态'] as const;

const viewTabs = [
  { id: 'domestic' as const, label: '国内地图' },
  { id: 'network' as const, label: '地区影响' },
  { id: 'trend' as const, label: '趋势' },
];

/** Tops measured from nation-ui-base.png metric slots (v2) — six secondary metrics */
const METRIC_TOPS = [
  '15.74%',
  '27.22%',
  '38.29%',
  '49.35%',
  '60.42%',
  '71.44%',
] as const;
</script>

<template>
  <div class="ml-nation" :class="{ 'is-pending': props.feedbackPending }" data-screen-root>
    <img
      class="ml-nation__base"
      :src="nationBase"
      alt=""
      draggable="false"
    />

    <header class="ml-nation__head">
      <GameButton variant="secondary" @click="emit('back')">返回首页</GameButton>
      <div>
        <p class="ml-nation__en">NATIONAL INTELLIGENCE</p>
        <h2 class="ml-nation__title">国家数据</h2>
      </div>
    </header>

    <p class="ml-nation__group ml-nation__group--macro">{{ NATION_GROUP_ORDER[0] }}</p>
    <p class="ml-nation__group ml-nation__group--route">{{ NATION_GROUP_ORDER[1] }}</p>

    <button
      v-for="(item, index) in flatMetrics"
      :key="item.key"
      type="button"
      class="ml-metric"
      :class="{ 'is-active': item.key === metricKey }"
      :style="{ top: METRIC_TOPS[index] }"
      @click="selectMetric(item)"
    >
      <span class="ml-metric__label">{{ item.label }}</span>
      <span class="ml-metric__values">
        <span class="ml-metric__value">{{ item.value }}</span>
        <span class="ml-metric__delta">{{ item.delta }}</span>
      </span>
    </button>

    <div class="ml-views" role="tablist" aria-label="视图切换">
      <button
        v-for="tab in viewTabs"
        :key="tab.id"
        type="button"
        role="tab"
        class="ml-view-tab"
        :class="{ 'is-active': view === tab.id }"
        :aria-selected="view === tab.id"
        @click="view = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <section class="ml-nation__detail" aria-label="指标详情">
      <header class="ml-nation__detail-head">
        <div class="ml-nation__detail-intro">
          <p class="ml-nation__crumb">
            {{ metric.group }} / {{ metric.groupEn }}
          </p>
          <h3 class="ml-nation__detail-title">{{ metric.label }}</h3>
          <p class="ml-nation__detail-desc">{{ metric.description }}</p>
        </div>
        <div class="ml-nation__detail-value">
          <span class="ml-nation__value">{{ metric.value }}</span>
          <span class="ml-nation__delta">{{ metric.delta }}</span>
        </div>
      </header>

      <div v-if="view === 'domestic'" class="ml-canvas ml-canvas--map">
        <p class="ml-canvas__placeholder">地图可视化占位</p>
        <div class="ml-map-legend">
          <span><i class="dot strong" />稳定区域</span>
          <span><i class="dot warning" />摇摆区域</span>
          <span><i class="dot crisis" />重点点位</span>
        </div>
      </div>

      <div v-else-if="view === 'network'" class="ml-canvas ml-canvas--net">
        <div class="node center">分众国</div>
        <div class="node n">北方联盟</div>
        <div class="node e">东方集团</div>
        <div class="node s">海湾贸易国</div>
        <div class="node w">西方盟友</div>
      </div>

      <div v-else class="ml-canvas">
        <svg class="ml-trend" viewBox="0 0 640 208" role="img" aria-label="趋势图">
          <polyline
            :points="trendPoints"
            fill="none"
            stroke="rgba(215,188,126,0.9)"
            stroke-width="3"
          />
        </svg>
      </div>
    </section>

    <footer class="ml-summary">
      <div class="ml-summary__primary">
        <span>{{ summaryLabels[0] }}</span>
        <strong>{{ metric.summary[0] }}</strong>
      </div>
      <div class="ml-summary__secondary">
        <div>
          <span>{{ summaryLabels[1] }}</span>
          <strong>{{ metric.summary[1] }}</strong>
        </div>
        <div>
          <span>{{ summaryLabels[2] }}</span>
          <strong>{{ metric.summary[2] }}</strong>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.ml-nation.is-pending .ml-metric__value,
.ml-nation.is-pending .ml-nation__value {
  opacity: 0.55;
}

.ml-nation {
  /* Slot percentages measured from nation-ui-base.png v2 (3840×2160) */
  --nation-head-left: 1.6%;
  --nation-head-top: 1.5%;
  --nation-head-width: 50%;
  --nation-head-height: 8%;

  --nation-metric-left: 2.11%;
  --nation-metric-width: 27.29%;
  --nation-metric-height: 8.9%;

  --nation-tabs-left: 33.2%;
  --nation-tabs-top: 20.2%;
  --nation-tabs-width: 36%;
  --nation-tabs-height: 4.4%;

  --nation-detail-left: 33.2%;
  --nation-detail-top: 25.6%;
  --nation-detail-width: 63.5%;
  --nation-detail-height: 54%;

  --nation-summary-left: 33%;
  --nation-summary-top: 85%;
  --nation-summary-width: 63.8%;
  --nation-summary-height: 8.2%;

  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
  color: var(--yp-color-text-main);
}

.ml-nation__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-nation__head,
.ml-nation__group,
.ml-metric,
.ml-views,
.ml-nation__detail,
.ml-summary {
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
}

.ml-nation__head {
  left: var(--nation-head-left);
  top: var(--nation-head-top);
  width: var(--nation-head-width);
  height: var(--nation-head-height);
  display: flex;
  align-items: center;
  gap: 16px;
}

.ml-nation__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--yp-color-gold);
}

.ml-nation__title {
  margin: 2px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
}

.ml-nation__group {
  left: 2.4%;
  width: 26%;
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 0.92rem;
  color: var(--yp-color-gold-bright);
  letter-spacing: 0.04em;
}

.ml-nation__group--macro {
  top: 11.8%;
}

.ml-nation__group--route {
  top: 48.2%;
}

.ml-metric {
  left: var(--nation-metric-left);
  width: var(--nation-metric-width);
  height: var(--nation-metric-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 18px;
  text-align: left;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--yp-color-text-main);
  cursor: pointer;
}

.ml-metric__label {
  font-family: var(--yp-font-serif);
  font-size: 1rem;
}

.ml-metric__values {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  flex-shrink: 0;
}

.ml-metric__value {
  font-family: var(--yp-font-data);
  font-weight: 700;
  font-size: 1rem;
}

.ml-metric__delta {
  font-size: 0.72rem;
  color: var(--yp-color-text-muted);
}

.ml-metric:hover,
.ml-metric.is-active {
  background: rgba(184, 149, 98, 0.14);
}

.ml-metric.is-active {
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.55);
}

.ml-metric:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.75);
}

.ml-views {
  left: var(--nation-tabs-left);
  top: var(--nation-tabs-top);
  width: var(--nation-tabs-width);
  height: var(--nation-tabs-height);
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
  padding: 0 10px;
}

.ml-view-tab {
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--yp-color-text-muted);
  cursor: pointer;
  font-family: var(--yp-font-serif);
  font-size: 0.92rem;
}

.ml-view-tab.is-active {
  color: var(--yp-color-gold-bright);
  background: rgba(184, 149, 98, 0.16);
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.45);
}

.ml-view-tab:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.8);
}

.ml-nation__detail {
  left: var(--nation-detail-left);
  top: var(--nation-detail-top);
  width: var(--nation-detail-width);
  height: var(--nation-detail-height);
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 18px 22px 14px;
  overflow: auto;
}

.ml-nation__detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.ml-nation__crumb {
  margin: 0 0 6px;
  font-family: var(--yp-font-latin);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  color: var(--yp-color-gold);
}

.ml-nation__detail-title {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
}

.ml-nation__detail-desc {
  margin: 8px 0 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
  max-width: 36em;
}

.ml-nation__detail-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  flex-shrink: 0;
}

.ml-nation__value {
  font-family: var(--yp-font-data);
  font-weight: 700;
  font-size: 1.65rem;
}

.ml-nation__delta {
  font-size: 0.82rem;
  color: var(--yp-color-text-muted);
}

.ml-canvas {
  flex: 1;
  min-height: 0;
  border: 1px dashed rgba(184, 149, 98, 0.22);
  border-radius: 12px;
  padding: 14px;
  color: var(--yp-color-text-muted);
  background: rgba(8, 10, 12, 0.25);
}

.ml-canvas__placeholder {
  margin: 0;
  min-height: 140px;
  height: calc(100% - 36px);
  display: grid;
  place-items: center;
  font-size: 0.9rem;
}

.ml-map-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.85rem;
}

.ml-map-legend span {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.strong {
  background: #70a864;
}

.dot.warning {
  background: #b38a4a;
}

.dot.crisis {
  background: #9e3838;
}

.ml-canvas--net {
  position: relative;
}

.node {
  position: absolute;
  padding: 8px 12px;
  border: 1px solid rgba(184, 149, 98, 0.4);
  border-radius: 8px;
  background: rgba(18, 22, 26, 0.9);
  font-size: 0.82rem;
  color: var(--yp-color-text-main);
}

.node.center {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: var(--yp-color-gold-bright);
}

.node.n {
  left: 50%;
  top: 12px;
  transform: translateX(-50%);
}

.node.s {
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
}

.node.e {
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.node.w {
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
}

.ml-trend {
  width: 100%;
  height: 100%;
  min-height: 160px;
}

.ml-summary {
  left: var(--nation-summary-left);
  top: var(--nation-summary-top);
  width: var(--nation-summary-width);
  height: var(--nation-summary-height);
  display: grid;
  grid-template-columns: 34% 66%;
  align-items: stretch;
  padding: 0;
}

.ml-summary__primary,
.ml-summary__secondary > div {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  padding: 8px 18px;
  min-width: 0;
}

.ml-summary__secondary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: stretch;
  min-width: 0;
}

.ml-summary span {
  font-size: 0.82rem;
  color: var(--yp-color-text-muted);
}

.ml-summary strong {
  color: var(--yp-color-gold-bright);
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 980px) {
  .ml-nation__detail-head {
    flex-direction: column;
  }

  .ml-nation__detail-value {
    align-items: flex-start;
  }

  .ml-views {
    width: 48%;
  }

  .ml-view-tab {
    font-size: 0.78rem;
  }

  .ml-summary__secondary {
    grid-template-columns: 1fr;
  }
}
</style>
