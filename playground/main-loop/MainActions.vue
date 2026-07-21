<script setup lang="ts">
import { ActionGrid } from '@/index';
import { MAIN_ACTIONS } from './data';

const props = defineProps<{
  highlightAction?: 'phone' | 'publish' | 'inbox' | 'nation';
}>();

const emit = defineEmits<{
  action: [id: 'phone' | 'publish' | 'inbox' | 'nation'];
}>();

function onAction(index: number) {
  const item = MAIN_ACTIONS[index];
  if (item) emit('action', item.action);
}
</script>

<template>
  <div
    class="ml-actions-wrap"
    :class="{
      'is-phone-highlight': props.highlightAction === 'phone',
      'is-inbox-highlight': props.highlightAction === 'inbox',
    }"
  >
    <ActionGrid class="ml-actions" :items="MAIN_ACTIONS" @action="onAction" />
  </div>
</template>

<style scoped>
.ml-actions-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.ml-actions {
  width: min(var(--yp-hud-dock-max-w), var(--yp-hud-dock-w));
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--yp-hud-dock-gap);
  overflow: visible;
}

.ml-actions :deep(.yp-action-grid),
.ml-actions :deep(.yp-action-grid > *) {
  overflow: visible;
}

.ml-actions :deep(.yp-feature-button) {
  min-width: 0;
  min-height: var(--yp-hud-dock-btn-min-h);
  width: 100%;
  color: var(--yp-color-text-main);
}

.ml-actions :deep(.yp-feature-button__inner) {
  padding: 22px 14px 18px;
  gap: 8px;
  overflow: visible;
}

.ml-actions :deep(.yp-feature-button__icon) {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: 88px;
  height: 88px;
  opacity: 0.95;
  filter: sepia(0.2) saturate(0.9) brightness(1.05);
}

.ml-actions :deep(.yp-feature-button__icon img) {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}

.ml-actions :deep(.yp-feature-button__label) {
  flex: 0 0 auto;
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.2;
  color: var(--yp-color-text-main);
  text-shadow: var(--yp-text-glow);
}

.ml-actions :deep(.yp-feature-button__subtitle) {
  flex: 0 0 auto;
  margin-top: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--yp-color-gold-bright);
  opacity: 0.9;
}

/* phone = 1st, inbox = 3rd — bounce whole button + rounded halo matching frame */
.ml-actions-wrap.is-phone-highlight :deep(.yp-action-grid > :nth-child(1)),
.ml-actions-wrap.is-inbox-highlight :deep(.yp-action-grid > :nth-child(3)) {
  position: relative;
  z-index: 3;
}

.ml-actions-wrap.is-phone-highlight :deep(.yp-action-grid > :nth-child(1) .yp-feature-button),
.ml-actions-wrap.is-inbox-highlight :deep(.yp-action-grid > :nth-child(3) .yp-feature-button) {
  animation: ml-dock-bounce 1.05s cubic-bezier(0.34, 1.4, 0.64, 1) infinite;
  will-change: transform;
}

.ml-actions-wrap.is-phone-highlight :deep(.yp-action-grid > :nth-child(1) .yp-feature-button::before),
.ml-actions-wrap.is-inbox-highlight :deep(.yp-action-grid > :nth-child(3) .yp-feature-button::before) {
  content: '';
  position: absolute;
  inset: -5px;
  z-index: 4;
  border-radius: calc(var(--yp-frame-button-radius) + 5px);
  border: 2px solid rgba(232, 205, 140, 0.95);
  background: rgba(184, 149, 98, 0.14);
  box-shadow:
    0 0 0 3px rgba(215, 188, 126, 0.22),
    0 0 22px rgba(215, 188, 126, 0.55),
    inset 0 0 18px rgba(215, 188, 126, 0.18);
  pointer-events: none;
  animation: ml-dock-halo 1.05s ease-in-out infinite;
}

@keyframes ml-dock-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  18% {
    transform: translateY(-16px) scale(1.06);
  }
  32% {
    transform: translateY(-3px) scale(1.02);
  }
  48% {
    transform: translateY(-12px) scale(1.05);
  }
  62% {
    transform: translateY(0) scale(1);
  }
  /* hold so the jump reads clearly between cycles */
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes ml-dock-halo {
  0%,
  100% {
    opacity: 0.75;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.03);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ml-actions-wrap.is-phone-highlight :deep(.yp-action-grid > :nth-child(1) .yp-feature-button),
  .ml-actions-wrap.is-inbox-highlight :deep(.yp-action-grid > :nth-child(3) .yp-feature-button) {
    animation: none;
  }

  .ml-actions-wrap.is-phone-highlight :deep(.yp-action-grid > :nth-child(1) .yp-feature-button::before),
  .ml-actions-wrap.is-inbox-highlight :deep(.yp-action-grid > :nth-child(3) .yp-feature-button::before) {
    animation: none;
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .ml-actions {
    width: min(420px, 92%);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
