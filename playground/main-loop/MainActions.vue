<script setup lang="ts">
import { ActionGrid } from '@/index';
import { MAIN_ACTIONS } from './data';

const emit = defineEmits<{
  action: [id: 'phone' | 'publish' | 'inbox' | 'nation'];
}>();

function onAction(index: number) {
  const item = MAIN_ACTIONS[index];
  if (item) emit('action', item.action);
}
</script>

<template>
  <div class="ml-actions-wrap">
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

@media (max-width: 900px) {
  .ml-actions {
    width: min(420px, 92%);
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
