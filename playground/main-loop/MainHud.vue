<script setup lang="ts">
import { computed } from 'vue';
import { GameResourceBar } from '@/index';
import { RESOURCES, TERM_META } from './data';

const props = defineProps<{
  termLabel?: string;
  midtermLabel?: string;
  midtermProgress?: number;
}>();

const termText = computed(() => props.termLabel ?? TERM_META.termLabel);
const midtermText = computed(() => props.midtermLabel ?? TERM_META.midtermLabel);
const progress = computed(() => {
  const value = props.midtermProgress ?? TERM_META.midtermProgress;
  return Math.min(100, Math.max(0, value));
});
</script>

<template>
  <div class="ml-hud">
    <GameResourceBar class="ml-hud__bar" :items="RESOURCES" />
    <div class="ml-hud__time yp-framed yp-framed--resource-item">
      <div class="yp-framed__content ml-hud__time-inner">
        <p class="ml-hud__term">{{ termText }}</p>

        <div class="ml-hud__meta">
          <svg
            class="ml-hud__hourglass"
            viewBox="0 0 16 16"
            aria-hidden="true"
            focusable="false"
          >
            <path
              fill="currentColor"
              d="M3.5 1.5h9v1.2l-3.4 3.6 3.4 3.6v1.6H9.2v1.5H6.8V11.5H3.5V9.9l3.4-3.6L3.5 2.7V1.5zm1.6 1.4 2.9 3.1L5.1 9.1h5.8L8 5.9l2.9-3.1H5.1z"
            />
          </svg>
          <p class="ml-hud__midterm">{{ midtermText }}</p>
        </div>

        <div
          class="ml-hud__track"
          role="progressbar"
          :aria-valuenow="progress"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="midtermText"
        >
          <div class="ml-hud__fill" :style="{ width: `${progress}%` }" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-hud {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(var(--yp-hud-top-time-min-w), var(--yp-hud-top-time-max-w));
  gap: var(--yp-hud-top-gap);
  align-items: stretch;
}

.ml-hud__bar {
  min-width: 0;
}

/* 对齐参考图：顶栏拉满均分四项；保留大图标/大字 */
.ml-hud__bar :deep(.yp-resource-bar) {
  width: 100%;
  min-height: var(--yp-hud-top-time-min-h);
}

.ml-hud__bar :deep(.yp-resource-bar__inner) {
  padding: calc(var(--yp-frame-resource-bar-safe) + 2px)
    calc(var(--yp-frame-resource-bar-safe) + 6px);
  gap: 4px 8px;
  justify-content: space-between;
}

.ml-hud__bar :deep(.yp-resource-bar__item) {
  flex: 1 1 0;
  gap: 12px;
  padding: 0 12px;
}

.ml-hud__bar :deep(.yp-resource-bar__item:first-child) {
  padding-left: 4px;
}

.ml-hud__bar :deep(.yp-resource-bar__item:last-child) {
  padding-right: 4px;
}

.ml-hud__bar :deep(.yp-resource-bar__label) {
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  text-transform: none;
  color: var(--yp-color-text-muted);
}

.ml-hud__bar :deep(.yp-resource-bar__value) {
  font-family: var(--yp-font-data);
  font-size: 2.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-main);
  text-shadow: var(--yp-text-glow);
}

.ml-hud__bar :deep(.yp-resource-bar__icon) {
  width: 96px;
  height: 96px;
  opacity: 0.92;
  filter: sepia(0.25) saturate(0.85);
}

.ml-hud__time {
  background: transparent;
  min-height: var(--yp-hud-top-time-min-h);
}

.ml-hud__time-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: calc(var(--yp-frame-resource-item-safe) + 4px)
    calc(var(--yp-frame-resource-item-safe) + 12px)
    calc(var(--yp-frame-resource-item-safe) + 8px);
  height: 100%;
  box-sizing: border-box;
  text-align: center;
}

/* 参考图：大号宋体居中标题 */
.ml-hud__term {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.65rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  line-height: 1.25;
  color: var(--yp-color-text-main);
  text-shadow:
    0 1px 0 rgba(255, 248, 232, 0.18),
    0 2px 3px rgba(0, 0, 0, 0.75);
  white-space: nowrap;
}

/* 参考图：沙漏 + 副文，约标题 60% 字号，哑金色 */
.ml-hud__meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 100%;
}

.ml-hud__hourglass {
  flex: 0 0 auto;
  width: 1.05rem;
  height: 1.05rem;
  color: var(--yp-color-gold);
  opacity: 0.92;
}

.ml-hud__midterm {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1rem;
  font-weight: 400;
  letter-spacing: 0.06em;
  line-height: 1.3;
  color: var(--yp-color-gold);
  white-space: nowrap;
}

/* 参考图：细胶囊进度条，无百分比文案 */
.ml-hud__track {
  width: 88%;
  height: 8px;
  margin-top: 2px;
  border-radius: 999px;
  border: 1px solid rgba(230, 225, 211, 0.55);
  background: rgba(0, 0, 0, 0.45);
  overflow: hidden;
  box-sizing: border-box;
}

.ml-hud__fill {
  height: 100%;
  border-radius: inherit;
  background: #e6e1d3;
  transition: width var(--yp-motion-base);
}

@media (max-width: 900px) {
  .ml-hud {
    grid-template-columns: 1fr;
  }

  .ml-hud__term {
    letter-spacing: 0.08em;
  }

  .ml-hud__midterm {
    white-space: normal;
  }
}
</style>
