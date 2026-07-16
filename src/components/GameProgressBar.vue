<script setup lang="ts">
import { computed } from 'vue';
import type { GameProgressBarProps } from '../types';

const props = withDefaults(defineProps<GameProgressBarProps>(), {
  max: 100,
  tone: 'neutral',
  showThumb: true,
});

const percent = computed(() => {
  const clamped = Math.min(props.max, Math.max(0, props.value));
  return props.max > 0 ? (clamped / props.max) * 100 : 0;
});

const displayValue = computed(() => `${Math.round(percent.value)}%`);
</script>

<template>
  <div class="yp-progress" :class="`yp-progress--${props.tone}`">
    <div v-if="props.label || $slots.label" class="yp-progress__header">
      <span v-if="props.label" class="yp-progress__label">{{ props.label }}</span>
      <slot name="label" />
      <span class="yp-progress__value" aria-live="polite">{{ displayValue }}</span>
    </div>
    <div
      class="yp-progress__track"
      role="progressbar"
      :aria-valuenow="props.value"
      :aria-valuemin="0"
      :aria-valuemax="props.max"
      :aria-label="props.label"
    >
      <div
        class="yp-progress__fill"
        :style="{ width: `calc((100% - 20px) * ${percent} / 100)` }"
      />
      <span
        v-if="props.showThumb"
        class="yp-progress__thumb"
        :style="{ left: `calc(10px + (100% - 20px) * ${percent} / 100)` }"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.yp-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.yp-progress__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  font-family: var(--yp-font-sans);
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
}

.yp-progress__value {
  font-family: var(--yp-font-latin);
  letter-spacing: 0.12em;
  color: var(--yp-color-gold-bright);
}

.yp-progress__track {
  position: relative;
  height: 28px;
  box-sizing: border-box;
  border-style: solid;
  border-color: transparent;
  border-width: var(--yp-frame-progress-width);
  border-image-source: var(--yp-frame-progress);
  border-image-slice: var(--yp-frame-progress-slice) fill;
  border-image-repeat: stretch;
  background: transparent;
}

.yp-progress__fill {
  position: absolute;
  top: 50%;
  left: 10px;
  height: 10px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(112, 168, 100, 0.9), rgba(184, 149, 98, 0.95));
  transition: width var(--yp-motion-base);
  pointer-events: none;
}

.yp-progress__thumb {
  position: absolute;
  top: 50%;
  width: 22px;
  height: 28px;
  transform: translate(-50%, -50%);
  background: var(--yp-progress-thumb) center / contain no-repeat;
  pointer-events: none;
  transition: left var(--yp-motion-base);
  z-index: 1;
}

.yp-progress--warning .yp-progress__fill {
  background: linear-gradient(90deg, rgba(179, 138, 74, 0.95), rgba(215, 188, 126, 0.9));
}

.yp-progress--danger .yp-progress__fill {
  background: linear-gradient(90deg, rgba(158, 56, 56, 0.95), rgba(179, 90, 74, 0.9));
}

.yp-progress--neutral .yp-progress__fill {
  background: linear-gradient(90deg, rgba(90, 110, 120, 0.9), rgba(184, 149, 98, 0.8));
}

.yp-progress--success .yp-progress__fill {
  background: linear-gradient(90deg, rgba(112, 168, 100, 0.9), rgba(184, 149, 98, 0.95));
}
</style>
