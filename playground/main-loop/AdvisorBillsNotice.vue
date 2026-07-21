<script setup lang="ts">
import { GameNotice } from '@/index';

const props = defineProps<{
  title: string;
  message: string;
  subline?: string;
  cta?: string;
  visible: boolean;
}>();

const emit = defineEmits<{
  open: [];
  dismiss: [];
}>();

function onOpen() {
  emit('open');
  emit('dismiss');
}
</script>

<template>
  <Transition name="ml-advisor-cue">
    <button
      v-if="props.visible"
      type="button"
      class="ml-advisor-cue"
      aria-label="幕僚待签文件"
      @click="onOpen"
    >
      <GameNotice title="办公室" tone="warning">
        <div class="ml-advisor-cue__body">
          <h4 class="ml-advisor-cue__headline">{{ props.title }}</h4>
          <p class="ml-advisor-cue__message">{{ props.message }}</p>
          <p v-if="props.subline" class="ml-advisor-cue__meta">{{ props.subline }}</p>
          <div class="ml-advisor-cue__footer">
            <span class="ml-advisor-cue__cta">{{ props.cta ?? '打开处理法案' }}</span>
            <span class="ml-advisor-cue__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </GameNotice>
    </button>
  </Transition>
</template>

<style scoped>
.ml-advisor-cue {
  position: absolute;
  top: 11%;
  right: 2.2%;
  z-index: 12;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  animation: ml-advisor-cue-pulse 2.8s ease-in-out infinite;
}

.ml-advisor-cue :deep(.yp-notice) {
  width: min(360px, 36vw);
  min-width: 0;
  min-height: 0;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;
}

.ml-advisor-cue:hover :deep(.yp-notice) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.ml-advisor-cue:focus-visible {
  outline: none;
}

.ml-advisor-cue:focus-visible :deep(.yp-notice) {
  filter: brightness(1.08);
}

.ml-advisor-cue :deep(.yp-notice__inner) {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 22px 24px 18px;
}

.ml-advisor-cue :deep(.yp-notice__title) {
  margin: 0 0 10px;
  font-family: var(--yp-font-latin);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #e8c98a;
}

.ml-advisor-cue__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ml-advisor-cue__headline {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.12rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-main);
}

.ml-advisor-cue__message {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-advisor-cue__meta {
  margin: 2px 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: rgba(212, 192, 138, 0.82);
}

.ml-advisor-cue__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(184, 149, 98, 0.28);
}

.ml-advisor-cue__cta {
  font-family: var(--yp-font-serif);
  font-size: 0.92rem;
  color: var(--yp-color-gold-bright);
}

.ml-advisor-cue__arrow {
  font-family: var(--yp-font-latin);
  font-size: 0.95rem;
  color: var(--yp-color-gold-bright);
  transition: transform 0.15s ease;
}

.ml-advisor-cue:hover .ml-advisor-cue__arrow {
  transform: translateX(3px);
}

.ml-advisor-cue-enter-active {
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.48s cubic-bezier(0.22, 1, 0.35, 1);
}

.ml-advisor-cue-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.ml-advisor-cue-enter-from {
  opacity: 0;
  transform: translateX(48px) scale(0.96);
}

.ml-advisor-cue-leave-to {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}

@keyframes ml-advisor-cue-pulse {
  0%,
  100% {
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.28));
  }
  50% {
    filter: drop-shadow(0 8px 22px rgba(120, 88, 32, 0.35));
  }
}

@media (max-width: 980px) {
  .ml-advisor-cue {
    top: 14%;
    right: 3%;
  }

  .ml-advisor-cue :deep(.yp-notice) {
    width: min(320px, 72vw);
  }

  .ml-advisor-cue__headline {
    font-size: 1.02rem;
  }
}
</style>
