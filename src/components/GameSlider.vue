<script setup lang="ts">
import { computed, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: number;
    max?: number;
    min?: number;
    step?: number;
    label?: string;
    tone?: 'success' | 'warning' | 'danger' | 'neutral';
    disabled?: boolean;
    showValue?: boolean;
  }>(),
  {
    modelValue: 0,
    min: 0,
    max: 100,
    step: 1,
    tone: 'neutral',
    disabled: false,
    showValue: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: number];
  change: [value: number];
}>();

const trackRef = ref<HTMLElement | null>(null);
const dragging = ref(false);

const percent = computed(() => {
  const range = props.max - props.min;
  if (range <= 0) return 0;
  const clamped = Math.min(props.max, Math.max(props.min, props.modelValue));
  return ((clamped - props.min) / range) * 100;
});

const displayValue = computed(() => `${Math.round(props.modelValue)}`);

function snap(value: number) {
  const stepped = Math.round((value - props.min) / props.step) * props.step + props.min;
  return Math.min(props.max, Math.max(props.min, stepped));
}

function valueFromClientX(clientX: number) {
  const el = trackRef.value;
  if (!el) return props.modelValue;
  const rect = el.getBoundingClientRect();
  // Match visual thumb travel: left fill-offset+nudge → right edge + end inset
  const styles = getComputedStyle(el);
  const fillOffset = Number.parseFloat(styles.getPropertyValue('--yp-progress-fill-offset')) || 0;
  const nudge = Number.parseFloat(styles.getPropertyValue('--yp-progress-thumb-nudge')) || 0;
  const endInset = Number.parseFloat(styles.getPropertyValue('--yp-progress-thumb-end')) || 0;
  const start = fillOffset + nudge;
  const end = rect.width - endInset;
  const span = Math.max(1, end - start);
  const ratio = (clientX - rect.left - start) / span;
  const raw = props.min + Math.min(1, Math.max(0, ratio)) * (props.max - props.min);
  return snap(raw);
}

function commit(value: number) {
  emit('update:modelValue', value);
  emit('change', value);
}

function onPointerDown(event: PointerEvent) {
  if (props.disabled) return;
  dragging.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  commit(valueFromClientX(event.clientX));
}

function onPointerMove(event: PointerEvent) {
  if (!dragging.value || props.disabled) return;
  commit(valueFromClientX(event.clientX));
}

function onPointerUp(event: PointerEvent) {
  dragging.value = false;
  try {
    (event.currentTarget as HTMLElement).releasePointerCapture(event.pointerId);
  } catch {
    /* ignore */
  }
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  let next = props.modelValue;
  if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next += props.step;
  else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next -= props.step;
  else if (event.key === 'Home') next = props.min;
  else if (event.key === 'End') next = props.max;
  else return;
  event.preventDefault();
  commit(snap(next));
}
</script>

<template>
  <div
    class="yp-slider"
    :class="[`yp-slider--${props.tone}`, { 'yp-slider--disabled': props.disabled }]"
  >
    <div v-if="props.label || props.showValue" class="yp-slider__header">
      <span v-if="props.label" class="yp-slider__label">{{ props.label }}</span>
      <span v-if="props.showValue" class="yp-slider__value">{{ displayValue }}</span>
    </div>
    <div
      ref="trackRef"
      class="yp-slider__track"
      role="slider"
      tabindex="0"
      :aria-valuenow="props.modelValue"
      :aria-valuemin="props.min"
      :aria-valuemax="props.max"
      :aria-label="props.label || '滑块'"
      :aria-disabled="props.disabled || undefined"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @keydown="onKeydown"
    >
      <div
        class="yp-slider__fill"
        :style="{
          width: percent > 0
            ? `calc((100% - var(--yp-progress-fill-offset)) * ${percent} / 100)`
            : '0',
        }"
      />
      <span
        class="yp-slider__thumb"
        :style="{
          left: `clamp(calc(4px + var(--yp-progress-fill-offset)), calc(var(--yp-progress-fill-offset) + var(--yp-progress-thumb-nudge) + (100% - var(--yp-progress-fill-offset) - var(--yp-progress-thumb-nudge)) * ${percent} / 100), calc(100% - var(--yp-progress-thumb-end)))`,
        }"
      />
    </div>
  </div>
</template>

<style scoped>
.yp-slider {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 520px;
  user-select: none;
  touch-action: none;
}

.yp-slider__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-left: var(--yp-progress-track-shift);
  width: calc(100% - var(--yp-progress-track-shift));
  box-sizing: border-box;
  font-family: var(--yp-font-sans);
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
  overflow: visible;
}

.yp-slider__value {
  flex: 0 0 auto;
  margin: 0;
  padding: 0;
  font-family: var(--yp-font-latin);
  letter-spacing: 0.08em;
  color: var(--yp-color-gold-bright);
  text-align: right;
  transform: translateX(22px);
}

.yp-slider__track {
  position: relative;
  height: 48px;
  box-sizing: border-box;
  margin-left: var(--yp-progress-track-shift);
  width: calc(100% - var(--yp-progress-track-shift));
  border-radius: var(--yp-frame-progress-radius);
  border-style: solid;
  border-color: transparent;
  border-width: var(--yp-frame-progress-width);
  border-image-source: var(--yp-frame-progress);
  border-image-slice: var(--yp-frame-progress-slice) fill;
  border-image-repeat: stretch;
  cursor: pointer;
  outline: none;
}

.yp-slider__track:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 1px rgba(215, 188, 126, 0.4),
    0 0 10px rgba(184, 149, 98, 0.25);
}

.yp-slider__fill {
  position: absolute;
  top: 50%;
  left: var(--yp-progress-fill-offset);
  height: 10px;
  transform: translateY(-50%);
  border-radius: 2px;
  background: linear-gradient(90deg, rgba(184, 149, 98, 0.75), rgba(215, 188, 126, 0.95));
  pointer-events: none;
}

.yp-slider__thumb {
  position: absolute;
  top: 50%;
  width: 24px;
  height: 30px;
  transform: translate(-50%, -50%);
  background: var(--yp-progress-thumb) center / contain no-repeat;
  pointer-events: none;
  z-index: 1;
}

.yp-slider--disabled {
  opacity: 0.5;
  pointer-events: none;
}

.yp-slider--success .yp-slider__fill {
  background: linear-gradient(90deg, rgba(112, 168, 100, 0.9), rgba(184, 149, 98, 0.95));
}

.yp-slider--danger .yp-slider__fill {
  background: linear-gradient(90deg, rgba(158, 56, 56, 0.95), rgba(179, 90, 74, 0.9));
}
</style>
