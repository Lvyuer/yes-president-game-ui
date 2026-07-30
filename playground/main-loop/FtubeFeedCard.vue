<script setup lang="ts">
import cardFrame from './assets/ftube-card-frame.png';

defineProps<{
  required?: boolean;
  done?: boolean;
}>();

/** Cropped frame slice ≈43; keep width ≤ slice to avoid upscale artifacts. */
const frameStyle = {
  '--ftube-card-frame': `url(${cardFrame})`,
};
</script>

<template>
  <button
    type="button"
    class="ml-ftube-card"
    :class="{ 'is-required': required, 'is-done': done }"
    :style="frameStyle"
  >
    <div class="ml-ftube-card__frame" aria-hidden="true" />
    <div class="ml-ftube-card__body">
      <slot />
    </div>
  </button>
</template>

<style scoped>
.ml-ftube-card {
  position: relative;
  display: block;
  width: 100%;
  margin-bottom: 14px;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.ml-ftube-card__frame {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  border-style: solid;
  border-width: 14px;
  border-image-source: var(--ftube-card-frame);
  border-image-slice: 43 fill;
  border-image-repeat: stretch;
}

.ml-ftube-card__body {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 42%) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
  padding: 14px 14px 16px;
  min-width: 0;
}

.ml-ftube-card__body > :first-child {
  width: 100%;
  max-width: none;
  min-width: 0;
}

.ml-ftube-card__body > :last-child {
  min-width: 0;
}

.ml-ftube-card.is-required .ml-ftube-card__frame {
  filter: drop-shadow(0 0 0 1px rgba(220, 38, 38, 0.85))
    drop-shadow(0 0 8px rgba(220, 38, 38, 0.35));
}

.ml-ftube-card.is-done {
  opacity: 0.72;
}

.ml-ftube-card:hover .ml-ftube-card__frame {
  filter: brightness(1.08);
}

.ml-ftube-card.is-required:hover .ml-ftube-card__frame {
  filter: brightness(1.08) drop-shadow(0 0 0 1px rgba(220, 38, 38, 0.85))
    drop-shadow(0 0 8px rgba(220, 38, 38, 0.35));
}
</style>
