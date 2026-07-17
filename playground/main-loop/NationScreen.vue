<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GameButton, GamePanel, GameProgressBar, GameTitleDivider } from '@/index';
import { NATION_METRICS, type NationMetric } from './data';

const emit = defineEmits<{
  back: [];
}>();

const metricKey = ref('support');
const view = ref<'domestic' | 'network' | 'trend'>('domestic');

const metric = computed(
  () => NATION_METRICS.find((m) => m.key === metricKey.value) ?? NATION_METRICS[0],
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
</script>

<template>
  <div class="ml-screen">
    <header class="ml-screen__head">
      <GameButton variant="secondary" @click="emit('back')">返回</GameButton>
      <div>
        <p class="ml-screen__en">NATION DATA</p>
        <h2 class="ml-screen__title">国家数据</h2>
      </div>
    </header>

    <div class="ml-nation">
      <aside class="ml-nation__side">
        <button
          v-for="item in NATION_METRICS"
          :key="item.key"
          type="button"
          class="ml-metric"
          :class="{ 'is-active': item.key === metricKey }"
          @click="selectMetric(item)"
        >
          <span class="ml-metric__group">{{ item.group }}</span>
          <strong>{{ item.label }}</strong>
          <span class="ml-metric__row">
            <span>{{ item.value }}</span>
            <span>{{ item.delta }}</span>
          </span>
        </button>
      </aside>

      <GamePanel :title="metric.label" :subtitle="metric.description" size="medium">
        <div class="ml-views">
          <button
            type="button"
            class="ml-view-tab"
            :class="{ 'is-active': view === 'domestic' }"
            @click="view = 'domestic'"
          >
            国内态势
          </button>
          <button
            type="button"
            class="ml-view-tab"
            :class="{ 'is-active': view === 'network' }"
            @click="view = 'network'"
          >
            国际网络
          </button>
          <button
            type="button"
            class="ml-view-tab"
            :class="{ 'is-active': view === 'trend' }"
            @click="view = 'trend'"
          >
            趋势
          </button>
        </div>

        <GameProgressBar :label="metric.label" :value="metric.progress" tone="warning" />

        <div v-if="view === 'domestic'" class="ml-canvas ml-canvas--map">
          <p>稳定区域 · 摇摆区域 · 危机点位（示意）</p>
          <div class="ml-map-dots">
            <span class="dot strong" />
            <span class="dot warning" />
            <span class="dot crisis" />
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

        <GameTitleDivider />
        <footer class="ml-summary">
          <div><span>关键观察</span><strong>{{ metric.summary[0] }}</strong></div>
          <div><span>本周变化</span><strong>{{ metric.summary[1] }}</strong></div>
          <div><span>关联指标</span><strong>{{ metric.summary[2] }}</strong></div>
        </footer>
      </GamePanel>
    </div>
  </div>
</template>

<style scoped>
.ml-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 18px 18px;
  background: rgba(5, 6, 7, 0.96);
  overflow: auto;
  z-index: 5;
}

.ml-screen__head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ml-screen__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--yp-color-gold);
}

.ml-screen__title {
  margin: 2px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
}

.ml-nation {
  display: grid;
  grid-template-columns: minmax(200px, 240px) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.ml-nation__side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 70vh;
  overflow: auto;
}

.ml-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  text-align: left;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-radius: 8px;
  background: rgba(12, 14, 16, 0.55);
  color: var(--yp-color-text-main);
  cursor: pointer;
}

.ml-metric.is-active {
  border-color: rgba(215, 188, 126, 0.7);
  background: rgba(184, 149, 98, 0.12);
}

.ml-metric__group {
  font-family: var(--yp-font-latin);
  font-size: 0.62rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--yp-color-gold);
}

.ml-metric__row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
}

.ml-metric__row span:first-child {
  font-family: var(--yp-font-data);
  font-weight: 700;
}

.ml-views {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.ml-view-tab {
  padding: 8px 14px;
  border: 1px solid rgba(184, 149, 98, 0.28);
  border-radius: 999px;
  background: transparent;
  color: var(--yp-color-text-muted);
  cursor: pointer;
  font-size: 0.9rem;
}

.ml-view-tab.is-active {
  color: var(--yp-color-gold-bright);
  border-color: rgba(215, 188, 126, 0.6);
  background: rgba(184, 149, 98, 0.12);
}

.ml-canvas {
  margin-top: 16px;
  min-height: 208px;
  border: 1px dashed rgba(184, 149, 98, 0.25);
  border-radius: 12px;
  padding: 16px;
  color: var(--yp-color-text-muted);
}

.ml-map-dots {
  display: flex;
  gap: 10px;
  margin-top: 16px;
}

.dot {
  width: 12px;
  height: 12px;
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
  height: 252px;
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
  height: 208px;
}

.ml-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-top: 12px;
}

.ml-summary div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ml-summary span {
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
}

.ml-summary strong {
  color: var(--yp-color-gold-bright);
  font-family: var(--yp-font-serif);
}

@media (max-width: 980px) {
  .ml-nation {
    grid-template-columns: 1fr;
  }

  .ml-summary {
    grid-template-columns: 1fr;
  }
}
</style>
