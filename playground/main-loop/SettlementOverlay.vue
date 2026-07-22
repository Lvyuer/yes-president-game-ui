<script setup lang="ts">
import { GameButton, GamePanel } from '@/index';
import type { ResourceDeltaChip } from './casePortStrike';

const props = defineProps<{
  open: boolean;
  title: string;
  headline: string;
  summary: string;
  chips: ResourceDeltaChip[];
}>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <Transition name="ml-settle">
    <div v-if="props.open" class="ml-settle" role="dialog" :aria-label="props.title || '蝴蝶效应结算'">
      <button type="button" class="ml-settle__backdrop" aria-label="关闭" @click="emit('dismiss')" />

      <GamePanel
        class="ml-settle__panel"
        size="notice"
        subtitle="BUTTERFLY EFFECT"
        :title="props.headline"
      >
        <div v-if="props.chips.length" class="ml-settle__chips" aria-label="资源变化">
          <span
            v-for="chip in props.chips"
            :key="chip.id"
            class="ml-settle__chip"
            :class="`is-${chip.direction}`"
          >
            {{ chip.formatted }}
          </span>
        </div>

        <p class="ml-settle__summary">{{ props.summary }}</p>

        <template #footer>
          <GameButton @click="emit('dismiss')">知道了</GameButton>
        </template>
      </GamePanel>
    </div>
  </Transition>
</template>

<style scoped>
.ml-settle {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 24px;
  box-sizing: border-box;
}

.ml-settle__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.48);
  cursor: pointer;
}

.ml-settle__panel {
  position: relative;
  z-index: 1;
  width: min(460px, 92%);
  min-width: 0;
  min-height: 0;
}

.ml-settle__panel :deep(.yp-panel__inner) {
  gap: 14px;
}

.ml-settle__panel :deep(.yp-panel__subtitle) {
  letter-spacing: 0.18em;
}

.ml-settle__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}

.ml-settle__chip {
  padding: 6px 12px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  background: rgba(0, 0, 0, 0.22);
  font-family: var(--yp-font-data);
  font-size: 0.92rem;
  letter-spacing: 0.02em;
  color: var(--yp-color-text-muted);
}

.ml-settle__chip.is-up {
  border-color: rgba(136, 168, 96, 0.45);
  color: #d4e8b0;
}

.ml-settle__chip.is-down {
  border-color: rgba(168, 88, 72, 0.45);
  color: #e8b0a8;
}

.ml-settle__summary {
  margin: 0;
  font-size: 1rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-settle-enter-active {
  transition: opacity 0.28s ease;
}

.ml-settle-leave-active {
  transition: opacity 0.2s ease;
}

.ml-settle-enter-active .ml-settle__panel {
  transition:
    opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-settle-leave-active .ml-settle__panel {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ml-settle-enter-from,
.ml-settle-leave-to {
  opacity: 0;
}

.ml-settle-enter-from .ml-settle__panel,
.ml-settle-leave-to .ml-settle__panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
