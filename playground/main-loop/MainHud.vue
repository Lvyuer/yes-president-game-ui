<script setup lang="ts">
import { computed } from 'vue';
import { GameResourceBar, resolveGameIcon } from '@/index';
import type { GameResourceItem } from '@/index';
import CountUpValue from './CountUpValue.vue';
import type { ResourceSnapshot } from './casePortStrike';
import { RESOURCES, TERM_META } from './data';

export type ResourceRollState = {
  from: ResourceSnapshot[];
  to: ResourceSnapshot[];
  token: number;
  /** 递增后触发顶栏收尾（由结算卡「确定」驱动） */
  outroToken: number;
  durationMs: number;
  staggerMs: number;
  introMs: number;
  outroMs: number;
};

const props = defineProps<{
  termLabel?: string;
  midtermLabel?: string;
  midtermProgress?: number;
  resources?: GameResourceItem[];
  pendingLabel?: string;
  feedbackPending?: boolean;
  resourceRoll?: ResourceRollState | null;
}>();

const termText = computed(() => props.termLabel ?? TERM_META.termLabel);
const midtermText = computed(() => props.midtermLabel ?? TERM_META.midtermLabel);
const progress = computed(() => {
  const value = props.midtermProgress ?? TERM_META.midtermProgress;
  return Math.min(100, Math.max(0, value));
});

const resourceItems = computed(() => props.resources ?? RESOURCES);
const isRolling = computed(() => !!props.resourceRoll);

const rollingItems = computed(() => {
  if (!props.resourceRoll) return [];
  const { from, to } = props.resourceRoll;
  return to.map((item, index) => {
    const fromItem = from.find((entry) => entry.id === item.id) ?? from[index];
    const fromValue = fromItem?.value ?? item.value;
    const delta = parseFloat(item.value.replace(/[^\d.-]/g, '')) - parseFloat(fromValue.replace(/[^\d.-]/g, ''));
    let direction: 'up' | 'down' | 'flat' = 'flat';
    if (delta > 0) direction = 'up';
    if (delta < 0) direction = 'down';
    return {
      ...item,
      iconSrc: resolveGameIcon(item.icon),
      fromValue,
      toValue: item.value,
      direction,
    };
  });
});
</script>

<template>
  <div class="ml-hud" :class="{ 'is-pending': props.feedbackPending, 'is-rolling': isRolling }">
    <p v-if="props.feedbackPending && props.pendingLabel" class="ml-hud__pending">
      {{ props.pendingLabel }}
    </p>

    <GameResourceBar v-if="!isRolling" class="ml-hud__bar" :items="resourceItems" />

    <div v-else class="ml-hud__bar yp-resource-bar yp-framed yp-framed--resource-bar">
      <div class="yp-framed__content yp-resource-bar__inner">
        <div
          v-for="(item, index) in rollingItems"
          :key="item.id"
          class="yp-resource-bar__item"
          :class="{
            'is-roll-up': item.direction === 'up',
            'is-roll-down': item.direction === 'down',
          }"
        >
          <img
            v-if="item.iconSrc"
            :src="item.iconSrc"
            alt=""
            class="yp-resource-bar__icon"
            aria-hidden="true"
          />
          <div class="yp-resource-bar__text">
            <span class="yp-resource-bar__label">{{ item.label }}</span>
            <span class="yp-resource-bar__value yp-data">
              <CountUpValue
                :resource-id="item.id"
                :from-value="item.fromValue"
                :to-value="item.toValue"
                :direction="item.direction"
                :duration-ms="props.resourceRoll?.durationMs ?? 2000"
                :delay-ms="index * (props.resourceRoll?.staggerMs ?? 280)"
                :intro-ms="props.resourceRoll?.introMs ?? 700"
                :outro-ms="props.resourceRoll?.outroMs ?? 800"
                :play-token="props.resourceRoll?.token ?? 0"
                :outro-token="props.resourceRoll?.outroToken ?? 0"
              />
            </span>
          </div>
        </div>
      </div>
    </div>

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
  position: relative;
}

.ml-hud.is-pending .ml-hud__bar :deep(.yp-resource-bar__value) {
  opacity: 0.55;
}

.ml-hud__pending {
  position: absolute;
  top: -10px;
  right: 0;
  margin: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(184, 149, 98, 0.22);
  border: 1px solid rgba(215, 188, 126, 0.45);
  font-size: 0.78rem;
  color: var(--yp-color-gold-bright);
  animation: ml-hud-pulse 1.6s ease-in-out infinite;
  z-index: 2;
}

@keyframes ml-hud-pulse {
  0%,
  100% {
    opacity: 0.75;
  }
  50% {
    opacity: 1;
  }
}

.ml-hud__bar {
  min-width: 0;
}

.ml-hud__bar :deep(.yp-resource-bar),
.ml-hud__bar.yp-resource-bar {
  width: 100%;
  min-height: var(--yp-hud-top-time-min-h);
  background: transparent;
}

.ml-hud__bar :deep(.yp-resource-bar__inner),
.ml-hud__bar .yp-resource-bar__inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
  min-height: inherit;
  box-sizing: border-box;
  padding: calc(var(--yp-frame-resource-bar-safe) + 2px)
    calc(var(--yp-frame-resource-bar-safe) + 6px);
}

.ml-hud__bar :deep(.yp-resource-bar__item),
.ml-hud__bar .yp-resource-bar__item {
  position: relative;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 12px;
  transition: filter 0.25s ease;
}

.ml-hud.is-rolling .ml-hud__bar .yp-resource-bar__item.is-roll-up {
  animation: ml-hud-item-flash-up 2.6s ease-out;
}

.ml-hud.is-rolling .ml-hud__bar .yp-resource-bar__item.is-roll-down {
  animation: ml-hud-item-flash-down 2.6s ease-out;
}

@keyframes ml-hud-item-flash-up {
  0% {
    filter: drop-shadow(0 0 0 rgba(168, 204, 120, 0));
  }
  35% {
    filter: drop-shadow(0 0 10px rgba(168, 204, 120, 0.55));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(168, 204, 120, 0));
  }
}

@keyframes ml-hud-item-flash-down {
  0% {
    filter: drop-shadow(0 0 0 rgba(180, 72, 64, 0));
  }
  35% {
    filter: drop-shadow(0 0 10px rgba(180, 72, 64, 0.5));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(180, 72, 64, 0));
  }
}

.ml-hud__bar :deep(.yp-resource-bar__item:first-child),
.ml-hud__bar .yp-resource-bar__item:first-child {
  padding-left: 4px;
}

.ml-hud__bar :deep(.yp-resource-bar__item:last-child),
.ml-hud__bar .yp-resource-bar__item:last-child {
  padding-right: 4px;
}

.ml-hud__bar :deep(.yp-resource-bar__item:not(:first-child)::before),
.ml-hud__bar .yp-resource-bar__item:not(:first-child)::before {
  content: '';
  position: absolute;
  left: 0;
  top: 12%;
  bottom: 12%;
  width: 2px;
  border-radius: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(215, 188, 126, 0.35) 12%,
    rgba(232, 210, 150, 0.9) 50%,
    rgba(215, 188, 126, 0.35) 88%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(184, 149, 98, 0.25);
  pointer-events: none;
}

.ml-hud__bar :deep(.yp-resource-bar__label),
.ml-hud__bar .yp-resource-bar__label {
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  text-transform: none;
  color: var(--yp-color-text-muted);
}

.ml-hud__bar :deep(.yp-resource-bar__value),
.ml-hud__bar .yp-resource-bar__value {
  font-family: var(--yp-font-data);
  font-size: 2.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-main);
  text-shadow: var(--yp-text-glow);
}

.ml-hud.is-rolling .ml-hud__bar :deep(.yp-resource-bar__value),
.ml-hud.is-rolling .ml-hud__bar .yp-resource-bar__value {
  font-size: 2.35rem;
  letter-spacing: 0.02em;
  transition: font-size 0.75s cubic-bezier(0.4, 0, 0.2, 1);
}

.ml-hud.is-rolling .ml-hud__bar :deep(.yp-resource-bar__value:has(.ml-count-up.is-intro)),
.ml-hud.is-rolling .ml-hud__bar :deep(.yp-resource-bar__value:has(.ml-count-up.is-rolling)),
.ml-hud.is-rolling .ml-hud__bar :deep(.yp-resource-bar__value:has(.ml-count-up.is-holding)) {
  font-size: 1.95rem;
  letter-spacing: 0.01em;
}

.ml-hud__bar :deep(.yp-resource-bar__icon),
.ml-hud__bar .yp-resource-bar__icon {
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  object-fit: contain;
  opacity: 0.92;
  filter: sepia(0.25) saturate(0.85);
}

.ml-hud__bar :deep(.yp-resource-bar__text),
.ml-hud__bar .yp-resource-bar__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  min-width: 0;
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
