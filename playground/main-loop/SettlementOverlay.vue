<script setup lang="ts">
import { computed } from 'vue';
import { GameButton } from '@/index';
import type { ResourceDeltaChip } from './casePortStrike';

const settlementModules = import.meta.glob('./assets/settlement-ui-base.{png,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const settlementBaseSrc = computed(() => Object.values(settlementModules)[0] ?? null);

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
    <div v-if="props.open" class="ml-settle" role="dialog" aria-label="蝴蝶效应结算">
      <button type="button" class="ml-settle__backdrop" aria-label="关闭" @click="emit('dismiss')" />
      <div class="ml-settle__card" :class="{ 'has-base': !!settlementBaseSrc }">
        <img
          v-if="settlementBaseSrc"
          class="ml-settle__base"
          :src="settlementBaseSrc"
          alt=""
          draggable="false"
        />

        <div class="ml-settle__content">
          <header class="ml-settle__head">
            <p class="ml-settle__eyebrow">BUTTERFLY EFFECT</p>
            <h3 class="ml-settle__title">{{ props.headline }}</h3>
          </header>

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

          <footer class="ml-settle__foot">
            <GameButton @click="emit('dismiss')">知道了</GameButton>
          </footer>
        </div>
      </div>
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
}

.ml-settle__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.48);
  cursor: pointer;
}

.ml-settle__card {
  position: relative;
  z-index: 1;
  width: min(460px, 92%);
  overflow: hidden;
  border: 1px solid rgba(184, 149, 98, 0.42);
  background:
    linear-gradient(180deg, rgba(18, 14, 10, 0.94) 0%, rgba(10, 8, 6, 0.97) 100%);
  box-shadow:
    0 22px 52px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 236, 196, 0.08);
}

.ml-settle__card.has-base {
  border: 0;
  background: transparent;
  box-shadow: none;
}

.ml-settle__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
}

.ml-settle__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 26px 28px 22px;
}

.ml-settle__head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ml-settle__eyebrow {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(212, 192, 138, 0.82);
}

.ml-settle__title {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--yp-color-text-main);
}

.ml-settle__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.ml-settle__chip {
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  background: rgba(0, 0, 0, 0.28);
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

.ml-settle__foot {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.ml-settle-enter-active {
  transition: opacity 0.28s ease;
}

.ml-settle-leave-active {
  transition: opacity 0.2s ease;
}

.ml-settle-enter-active .ml-settle__card {
  transition:
    opacity 0.32s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.36s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-settle-leave-active .ml-settle__card {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ml-settle-enter-from,
.ml-settle-leave-to {
  opacity: 0;
}

.ml-settle-enter-from .ml-settle__card,
.ml-settle-leave-to .ml-settle__card {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
