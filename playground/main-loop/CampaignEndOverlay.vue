<script setup lang="ts">
import { GameButton, GamePanel } from '@/index';

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  restart: [];
}>();
</script>

<template>
  <Transition name="ml-week-overlay">
    <div v-if="open" class="ml-week-overlay" role="dialog" aria-label="三周体验结束">
      <div class="ml-week-overlay__backdrop" />

      <GamePanel class="ml-week-overlay__panel" size="notice" subtitle="W1–W3" title="三周体验结束">
        <p class="ml-week-overlay__lead">
          你已走完第 1–3 周的跨周循环体验：调水门埋因、第 2 周港口突发灭火、空口不算、双速结算。
        </p>
        <p class="ml-week-overlay__hint">可重新开始，从第 1 周再跑一遍不同选择。</p>

        <template #footer>
          <GameButton @click="emit('restart')">重新开始（第 1 周）</GameButton>
        </template>
      </GamePanel>
    </div>
  </Transition>
</template>

<style scoped>
.ml-week-overlay {
  position: absolute;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: calc(16px * var(--yp-hud-scale, 1));
  box-sizing: border-box;
}

.ml-week-overlay__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.72);
}

.ml-week-overlay__panel {
  position: relative;
  z-index: 1;
  width: min(460px, 92%);
}

.ml-week-overlay__lead {
  margin: 0 0 10px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--yp-color-text-main);
}

.ml-week-overlay__hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--yp-color-text-muted);
}

.ml-week-overlay-enter-active,
.ml-week-overlay-leave-active {
  transition: opacity 0.22s ease;
}

.ml-week-overlay-enter-from,
.ml-week-overlay-leave-to {
  opacity: 0;
}
</style>
