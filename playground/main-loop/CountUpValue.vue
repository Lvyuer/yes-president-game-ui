<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { easeOutCubic, interpolateResourceValue } from './metricFormat';

type Phase = 'idle' | 'intro' | 'rolling' | 'holding' | 'outro' | 'settled';

const props = withDefaults(
  defineProps<{
    resourceId: string;
    fromValue: string;
    toValue: string;
    durationMs?: number;
    delayMs?: number;
    introMs?: number;
    outroMs?: number;
    direction?: 'up' | 'down' | 'flat';
    playToken?: number;
    /** 父级递增后触发收尾（结算卡确定） */
    outroToken?: number;
  }>(),
  {
    durationMs: 2000,
    delayMs: 0,
    introMs: 700,
    outroMs: 800,
    direction: 'flat',
    playToken: 0,
    outroToken: 0,
  },
);

const displayValue = ref(props.fromValue);
const phase = ref<Phase>('idle');

const showDelta = computed(
  () => props.fromValue !== props.toValue && props.direction !== 'flat',
);

const showChrome = computed(
  () =>
    showDelta.value &&
    (phase.value === 'intro' ||
      phase.value === 'rolling' ||
      phase.value === 'holding' ||
      phase.value === 'outro'),
);

let frameId: number | null = null;
let delayTimer: number | null = null;
let introTimer: number | null = null;
let outroTimer: number | null = null;

function clearTimers() {
  if (frameId !== null) {
    cancelAnimationFrame(frameId);
    frameId = null;
  }
  if (delayTimer !== null) {
    window.clearTimeout(delayTimer);
    delayTimer = null;
  }
  if (introTimer !== null) {
    window.clearTimeout(introTimer);
    introTimer = null;
  }
  if (outroTimer !== null) {
    window.clearTimeout(outroTimer);
    outroTimer = null;
  }
}

function beginOutro() {
  if (phase.value === 'outro' || phase.value === 'settled') return;

  displayValue.value = props.toValue;

  // 尚未展开过 delta 时，直接落回最终数字
  if (phase.value === 'idle' || !showDelta.value) {
    phase.value = 'settled';
    return;
  }

  phase.value = 'outro';
  outroTimer = window.setTimeout(() => {
    phase.value = 'settled';
    outroTimer = null;
  }, props.outroMs);
}

/** 滚完后停在「旧→箭头→新」，等玩家点确定再收尾 */
function beginHold() {
  phase.value = 'holding';
}

function beginRolling() {
  phase.value = 'rolling';
  const start = performance.now();

  const tick = (now: number) => {
    const elapsed = now - start;
    const progress = Math.min(1, elapsed / props.durationMs);
    const eased = easeOutCubic(progress);
    displayValue.value = interpolateResourceValue(
      props.resourceId,
      props.fromValue,
      props.toValue,
      eased,
    );

    if (progress < 1) {
      frameId = requestAnimationFrame(tick);
      return;
    }

    displayValue.value = props.toValue;
    frameId = null;
    beginHold();
  };

  frameId = requestAnimationFrame(tick);
}

function beginIntro() {
  displayValue.value = props.fromValue;
  phase.value = 'intro';
  introTimer = window.setTimeout(() => {
    introTimer = null;
    beginRolling();
  }, props.introMs);
}

function runAnimation() {
  clearTimers();

  if (!showDelta.value) {
    displayValue.value = props.toValue;
    phase.value = 'settled';
    return;
  }

  // 入场前先显示旧值，避免闪一下 delta 结构
  displayValue.value = props.fromValue;
  phase.value = 'idle';

  if (props.delayMs > 0) {
    delayTimer = window.setTimeout(() => {
      delayTimer = null;
      beginIntro();
    }, props.delayMs);
    return;
  }

  beginIntro();
}

watch(
  () => [props.playToken, props.fromValue, props.toValue, props.direction] as const,
  () => {
    runAnimation();
  },
  { immediate: true },
);

watch(
  () => props.outroToken,
  (token) => {
    if (!token) return;
    clearTimers();
    beginOutro();
  },
);

onBeforeUnmount(() => {
  clearTimers();
});
</script>

<template>
  <span
    class="ml-count-up"
    :class="{
      'is-idle': phase === 'idle',
      'is-intro': phase === 'intro',
      'is-rolling': phase === 'rolling',
      'is-holding': phase === 'holding',
      'is-outro': phase === 'outro',
      'is-settled': phase === 'settled',
      'is-up': direction === 'up',
      'is-down': direction === 'down',
      'has-delta': showDelta,
    }"
  >
    <template v-if="showChrome">
      <span class="ml-count-up__chrome">
        <span class="ml-count-up__from">{{ fromValue }}</span>
        <span class="ml-count-up__sep" aria-hidden="true">→</span>
        <span
          class="ml-count-up__arrow"
          :class="`is-${direction}`"
          :aria-label="direction === 'up' ? '上升' : '下降'"
        >
          <svg v-if="direction === 'up'" viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M8 3.2 13.6 11H2.4L8 3.2z" />
          </svg>
          <svg v-else viewBox="0 0 16 16" aria-hidden="true">
            <path fill="currentColor" d="M8 12.8 2.4 5h11.2L8 12.8z" />
          </svg>
        </span>
      </span>
      <span class="ml-count-up__to">{{ displayValue }}</span>
    </template>
    <template v-else>
      <span class="ml-count-up__to">{{ displayValue }}</span>
    </template>
  </span>
</template>

<style scoped>
.ml-count-up {
  display: inline-flex;
  align-items: center;
  gap: 0;
  transform-origin: left center;
  white-space: nowrap;
}

.ml-count-up__chrome {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 6px;
  max-width: 12em;
  overflow: hidden;
  opacity: 1;
  transform: translateX(0);
  transition:
    opacity 0.7s ease,
    max-width 0.75s cubic-bezier(0.4, 0, 0.2, 1),
    margin-right 0.75s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.7s ease;
}

/* 入场：从收起展开（与收尾对称） */
.ml-count-up.is-intro .ml-count-up__chrome {
  animation: ml-count-chrome-in 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.ml-count-up.is-intro .ml-count-up__arrow {
  animation: ml-count-arrow-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both;
}

.ml-count-up.is-intro .ml-count-up__to {
  animation: ml-count-to-pulse-in 0.55s ease 0.12s both;
}

@keyframes ml-count-chrome-in {
  from {
    max-width: 0;
    margin-right: 0;
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    max-width: 12em;
    margin-right: 6px;
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes ml-count-arrow-in {
  from {
    opacity: 0;
    transform: scale(0.4) translateY(4px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes ml-count-to-pulse-in {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.06);
  }
}

.ml-count-up.is-outro .ml-count-up__chrome {
  max-width: 0;
  margin-right: 0;
  opacity: 0;
  transform: translateX(-6px);
  pointer-events: none;
}

.ml-count-up__from {
  font-family: var(--yp-font-data);
  font-size: 0.72em;
  font-weight: 600;
  color: rgba(201, 185, 148, 0.72);
  text-decoration: line-through;
  text-decoration-color: rgba(201, 185, 148, 0.35);
  flex: 0 0 auto;
}

.ml-count-up__sep {
  font-family: var(--yp-font-latin);
  font-size: 0.62em;
  font-weight: 600;
  color: rgba(212, 192, 138, 0.55);
  transform: translateY(-1px);
  flex: 0 0 auto;
}

.ml-count-up__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.05em;
  height: 1.05em;
  flex: 0 0 auto;
}

.ml-count-up__arrow svg {
  width: 100%;
  height: 100%;
}

.ml-count-up__arrow.is-up {
  color: #b8d888;
  filter: drop-shadow(0 0 6px rgba(168, 204, 120, 0.55));
}

.ml-count-up__arrow.is-down {
  color: #e09088;
  filter: drop-shadow(0 0 6px rgba(200, 88, 72, 0.5));
}

.ml-count-up__to {
  display: inline-block;
  font-family: inherit;
  font-size: 1em;
  font-weight: inherit;
  transition:
    color 0.45s ease,
    text-shadow 0.45s ease,
    transform 0.45s ease;
}

.ml-count-up.is-intro.is-up .ml-count-up__to,
.ml-count-up.is-rolling.is-up .ml-count-up__to,
.ml-count-up.is-holding.is-up .ml-count-up__to {
  color: #e2f0c4;
  text-shadow:
    0 0 14px rgba(168, 204, 120, 0.55),
    0 0 28px rgba(168, 204, 120, 0.2);
}

.ml-count-up.is-intro.is-down .ml-count-up__to,
.ml-count-up.is-rolling.is-down .ml-count-up__to,
.ml-count-up.is-holding.is-down .ml-count-up__to {
  color: #f0b8b0;
  text-shadow:
    0 0 14px rgba(200, 88, 72, 0.5),
    0 0 28px rgba(200, 88, 72, 0.2);
}

.ml-count-up.is-rolling .ml-count-up__to,
.ml-count-up.is-holding .ml-count-up__to {
  transform: scale(1.06);
}

.ml-count-up.is-outro .ml-count-up__to,
.ml-count-up.is-settled .ml-count-up__to,
.ml-count-up.is-idle .ml-count-up__to {
  transform: scale(1);
  color: inherit;
  text-shadow: none;
}
</style>
