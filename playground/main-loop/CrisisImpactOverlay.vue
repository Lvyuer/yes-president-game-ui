<script setup lang="ts">
import { computed } from 'vue';
import { GameButton, GameNotice, resolveGameIcon } from '@/index';
import { type CrisisImpactHint } from './casePortStrike';
import { iconForMetricLabel } from './metricFormat';

const props = withDefaults(
  defineProps<{
    open: boolean;
    title: string;
    message: string;
    subline?: string;
    hints?: CrisisImpactHint[];
    noticeTitle?: string;
    cta?: string;
  }>(),
  {
    noticeTitle: '突发事件',
    cta: '查看现场',
    hints: () => [],
  },
);

const emit = defineEmits<{
  open: [];
  dismiss: [];
}>();

const chips = computed(() =>
  props.hints.map((hint) => {
    const icon = iconForMetricLabel(hint.label);
    const arrow = hint.direction === 'down' ? '↓' : '↑';
    return {
      ...hint,
      arrow,
      iconSrc: resolveGameIcon(icon),
    };
  }),
);

function continueCrisis() {
  emit('open');
  emit('dismiss');
}
</script>

<template>
  <Transition name="ml-crisis-impact">
    <div
      v-if="props.open"
      class="ml-crisis-impact"
      role="dialog"
      aria-label="突发事件"
    >
      <button
        type="button"
        class="ml-crisis-impact__backdrop"
        aria-label="查看现场"
        @click="continueCrisis"
      />
      <div class="ml-crisis-impact__card">
        <GameNotice :title="props.noticeTitle" tone="danger">
          <div class="ml-crisis-impact__body">
            <h4 class="ml-crisis-impact__headline">{{ props.title }}</h4>
            <p class="ml-crisis-impact__message">{{ props.message }}</p>
            <p v-if="props.subline" class="ml-crisis-impact__meta">{{ props.subline }}</p>

            <div
              v-if="chips.length"
              class="ml-crisis-impact__chips"
              aria-label="可能的数值变化"
            >
              <span
                v-for="chip in chips"
                :key="chip.id"
                class="ml-crisis-impact__chip"
                :class="`is-${chip.direction}`"
              >
                <img
                  v-if="chip.iconSrc"
                  class="ml-crisis-impact__chip-icon"
                  :src="chip.iconSrc"
                  alt=""
                />
                <span>{{ chip.label }}</span>
                <span class="ml-crisis-impact__chip-arrow" aria-hidden="true">{{
                  chip.arrow
                }}</span>
              </span>
            </div>

            <footer class="ml-crisis-impact__foot">
              <GameButton @click="continueCrisis">{{ props.cta }}</GameButton>
            </footer>
          </div>
        </GameNotice>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ml-crisis-impact {
  position: absolute;
  inset: 0;
  z-index: 36;
  display: grid;
  place-items: center;
}

.ml-crisis-impact__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.52);
  cursor: pointer;
  animation: ml-crisis-impact-pulse 2.8s ease-in-out infinite;
}

.ml-crisis-impact__card {
  position: relative;
  z-index: 1;
  width: min(460px, 92%);
}

.ml-crisis-impact__card :deep(.yp-notice) {
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.ml-crisis-impact__card :deep(.yp-notice__inner) {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 22px 24px 18px;
}

.ml-crisis-impact__card :deep(.yp-notice__title) {
  margin: 0 0 10px;
  font-family: var(--yp-font-serif);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: none;
  color: #f0b0b0;
}

.ml-crisis-impact__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ml-crisis-impact__headline {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.22rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-main);
}

.ml-crisis-impact__message {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-crisis-impact__meta {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: rgba(240, 176, 176, 0.78);
}

.ml-crisis-impact__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.ml-crisis-impact__chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px 5px 6px;
  border-radius: 999px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  background: rgba(0, 0, 0, 0.28);
  font-family: var(--yp-font-serif);
  font-size: 0.84rem;
  line-height: 1.2;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-muted);
}

.ml-crisis-impact__chip-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.ml-crisis-impact__chip-arrow {
  font-family: var(--yp-font-data);
  font-size: 0.9rem;
}

.ml-crisis-impact__chip.is-up {
  border-color: rgba(136, 168, 96, 0.45);
  color: #d4e8b0;
}

.ml-crisis-impact__chip.is-down {
  border-color: rgba(168, 88, 72, 0.45);
  color: #e8b0a8;
}

.ml-crisis-impact__foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(184, 149, 98, 0.28);
}

.ml-crisis-impact-enter-active {
  transition: opacity 0.28s ease;
}

.ml-crisis-impact-leave-active {
  transition: opacity 0.2s ease;
}

.ml-crisis-impact-enter-active .ml-crisis-impact__card {
  transition:
    opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-crisis-impact-leave-active .ml-crisis-impact__card {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ml-crisis-impact-enter-from,
.ml-crisis-impact-leave-to {
  opacity: 0;
}

.ml-crisis-impact-enter-from .ml-crisis-impact__card,
.ml-crisis-impact-leave-to .ml-crisis-impact__card {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@keyframes ml-crisis-impact-pulse {
  0%,
  100% {
    background: rgba(0, 0, 0, 0.52);
  }
  50% {
    background: rgba(32, 8, 8, 0.58);
  }
}

@media (max-width: 980px) {
  .ml-crisis-impact__headline {
    font-size: 1.08rem;
  }
}
</style>
