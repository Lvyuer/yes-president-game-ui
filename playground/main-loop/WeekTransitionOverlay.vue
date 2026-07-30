<script setup lang="ts">
import { computed, ref, watch, type ComponentPublicInstance } from 'vue';
import type { WeekTransitionTargets } from './weekMotion';
import calendarBodySrc from './assets/week-transition/week-calendar-body.png';
import calendarSheetSrc from './assets/week-transition/week-calendar-sheet.png';
import calendarSheetTornSrc from './assets/week-transition/week-calendar-sheet-torn.png';

const props = defineProps<{
  open: boolean;
  week: number;
  electionCountdownWeeks: number;
}>();

const emit = defineEmits<{
  skip: [];
}>();

const dimRef = ref<HTMLElement | null>(null);
const calendarRef = ref<HTMLElement | null>(null);
const sheetEls = ref<HTMLElement[]>([]);

function bindSheet(el: Element | ComponentPublicInstance | null) {
  if (!(el instanceof HTMLElement) || sheetEls.value.includes(el)) return;
  sheetEls.value.push(el);
}

watch(
  () => props.open,
  (open) => {
    if (open) sheetEls.value = [];
  },
);

const sheetWeeks = computed(() => {
  const current = props.week;
  const prev = Math.max(1, current - 1);
  if (prev === current) return [current];
  return [prev, current];
});

function onSkip() {
  emit('skip');
}

function getTargets(): WeekTransitionTargets {
  return {
    dim: dimRef.value,
    calendar: calendarRef.value,
    sheets: sheetEls.value,
  };
}

defineExpose({ getTargets });
</script>

<template>
  <div
    v-if="props.open"
    class="ml-week-transition"
    role="presentation"
    aria-hidden="true"
    @click="onSkip"
  >
    <div ref="dimRef" class="ml-week-transition__dim" />

    <div ref="calendarRef" class="ml-week-transition__calendar">
      <div class="ml-week-transition__calendar-slot">
        <div
          v-for="(sheetWeek, index) in sheetWeeks"
          :key="sheetWeek"
          :ref="bindSheet"
          class="ml-week-transition__calendar-sheet"
          :class="{ 'is-final': index === sheetWeeks.length - 1 }"
          :data-sheet-intact="calendarSheetSrc"
          :data-sheet-torn="calendarSheetTornSrc"
        >
          <img
            class="ml-week-transition__calendar-sheet-img"
            :src="calendarSheetSrc"
            alt=""
            draggable="false"
          />
          <div class="ml-week-transition__calendar-copy">
            <p class="ml-week-transition__calendar-week">第 {{ sheetWeek }} 周</p>
            <p v-if="index === sheetWeeks.length - 1" class="ml-week-transition__calendar-meta">
              距大选还有 {{ props.electionCountdownWeeks }} 周
            </p>
          </div>
        </div>
      </div>
      <img
        class="ml-week-transition__calendar-body"
        :src="calendarBodySrc"
        alt=""
        draggable="false"
      />
    </div>

    <p class="ml-week-transition__hint">点击跳过</p>
  </div>
</template>

<style scoped>
.ml-week-transition {
  position: absolute;
  inset: 0;
  z-index: 52;
  overflow: hidden;
  pointer-events: auto;
  cursor: pointer;
}

.ml-week-transition__dim {
  position: absolute;
  inset: var(--yp-hud-top-time-min-h, 168px) 0 0 0;
  background: rgba(0, 0, 0, 0.92);
  opacity: 0;
  visibility: hidden;
}

.ml-week-transition__calendar {
  position: absolute;
  left: 50%;
  top: calc(var(--yp-hud-top-time-min-h, 168px) + 1%);
  width: min(720px, 74vw);
  aspect-ratio: 1 / 1;
  transform: translateX(-50%);
  opacity: 0;
  visibility: hidden;
}

.ml-week-transition__calendar-body {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
  z-index: 3;
}

.ml-week-transition__calendar-slot {
  position: absolute;
  /*
   * 新底座洞口实测约 L13.7/T21.0/W71.0/H51.8。
   * body 叠在纸上遮边；略放大盖满凹角与右下，避免露缝。
   */
  left: 13.2%;
  top: 20.5%;
  width: 72.0%;
  height: 53.0%;
  z-index: 2;
  overflow: visible;
  transform: none;
}

.ml-week-transition__calendar-sheet {
  position: absolute;
  inset: 0;
  opacity: 0;
  visibility: hidden;
  z-index: 1;
  background: #e6d9c4;
}

.ml-week-transition__calendar-sheet.is-final {
  z-index: 2;
}

.ml-week-transition__calendar-sheet-img {
  position: absolute;
  width: calc(100% * 100 / 76.86);
  height: calc(100% * 100 / 85.69);
  left: calc(-11.52% * 100 / 76.86);
  top: calc(-7.37% * 100 / 85.69);
  max-width: none;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

.ml-week-transition__calendar-copy {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  padding: 10% 8%;
  color: #2a2118;
  text-align: center;
  pointer-events: none;
}

.ml-week-transition__calendar-week {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-weight: 700;
  font-size: clamp(1.95rem, 3.6vw, 2.7rem);
  letter-spacing: 0.14em;
  font-variant-numeric: tabular-nums;
  color: #1c1610;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.28);
}

.ml-week-transition__calendar-meta {
  margin: 0;
  font-family: var(--yp-font-sans);
  font-weight: 500;
  font-size: clamp(0.82rem, 1.3vw, 0.98rem);
  letter-spacing: 0.08em;
  color: rgba(28, 22, 16, 0.62);
}

.ml-week-transition__hint {
  position: absolute;
  left: 50%;
  bottom: calc(12px + var(--yp-hud-safe-bottom, 18px));
  transform: translateX(-50%);
  margin: 0;
  font-family: var(--yp-font-sans);
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: rgba(255, 255, 255, 0.42);
  pointer-events: none;
}
</style>
