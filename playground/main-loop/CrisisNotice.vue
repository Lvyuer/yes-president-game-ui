<script setup lang="ts">
import { GameNotice } from '@/index';

const props = defineProps<{
  title: string;
  message: string;
  subline?: string;
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
  <Transition name="ml-crisis">
    <button
      v-if="props.visible"
      type="button"
      class="ml-crisis"
      aria-label="危机推送"
      @click="onOpen"
    >
      <GameNotice title="危机推送" tone="danger">
        <div class="ml-crisis__body">
          <h4 class="ml-crisis__headline">{{ props.title }}</h4>
          <p class="ml-crisis__message">{{ props.message }}</p>
          <p v-if="props.subline" class="ml-crisis__meta">{{ props.subline }}</p>
          <div class="ml-crisis__footer">
            <span class="ml-crisis__cta">查看现场</span>
            <span class="ml-crisis__arrow" aria-hidden="true">→</span>
          </div>
        </div>
      </GameNotice>
    </button>
  </Transition>
</template>

<style scoped>
.ml-crisis {
  position: absolute;
  top: 11%;
  right: 2.2%;
  z-index: 12;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  text-align: left;
  animation: ml-crisis-pulse 2.8s ease-in-out infinite;
}

.ml-crisis :deep(.yp-notice) {
  width: min(360px, 36vw);
  min-width: 0;
  min-height: 0;
  transition:
    filter 0.15s ease,
    transform 0.15s ease;
}

.ml-crisis:hover :deep(.yp-notice) {
  filter: brightness(1.06);
  transform: translateY(-1px);
}

.ml-crisis:focus-visible {
  outline: none;
}

.ml-crisis:focus-visible :deep(.yp-notice) {
  filter: brightness(1.08);
}

/* 压缩通知框内边距，给文案更多呼吸空间 */
.ml-crisis :deep(.yp-notice__inner) {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 22px 24px 18px;
}

.ml-crisis :deep(.yp-notice__title) {
  margin: 0 0 10px;
  font-family: var(--yp-font-latin);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #f0b0b0;
}

.ml-crisis__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ml-crisis__headline {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.12rem;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-main);
}

.ml-crisis__message {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-crisis__meta {
  margin: 2px 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: rgba(240, 176, 176, 0.78);
}

.ml-crisis__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(184, 149, 98, 0.28);
}

.ml-crisis__cta {
  font-family: var(--yp-font-serif);
  font-size: 0.92rem;
  color: var(--yp-color-gold-bright);
}

.ml-crisis__arrow {
  font-family: var(--yp-font-latin);
  font-size: 0.95rem;
  color: var(--yp-color-gold-bright);
  transition: transform 0.15s ease;
}

.ml-crisis:hover .ml-crisis__arrow {
  transform: translateX(3px);
}

.ml-crisis-enter-active {
  transition:
    opacity 0.38s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.48s cubic-bezier(0.22, 1.35, 0.36, 1);
}

.ml-crisis-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.ml-crisis-enter-from {
  opacity: 0;
  transform: translateX(48px) scale(0.96);
}

.ml-crisis-leave-to {
  opacity: 0;
  transform: translateX(18px) scale(0.98);
}

@keyframes ml-crisis-pulse {
  0%,
  100% {
    filter: drop-shadow(0 8px 18px rgba(0, 0, 0, 0.28));
  }
  50% {
    filter: drop-shadow(0 8px 22px rgba(120, 32, 32, 0.35));
  }
}

@media (max-width: 980px) {
  .ml-crisis {
    top: 14%;
    right: 3%;
  }

  .ml-crisis :deep(.yp-notice) {
    width: min(320px, 72vw);
  }

  .ml-crisis__headline {
    font-size: 1.02rem;
  }
}
</style>
