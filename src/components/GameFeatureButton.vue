<script setup lang="ts">
import { computed } from 'vue';
import { resolveGameIcon } from '../composables/useGameIcon';
import type { GameFeatureButtonProps } from '../types';

const props = withDefaults(defineProps<GameFeatureButtonProps>(), {
  disabled: false,
});

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const iconSrc = computed(() => resolveGameIcon(props.icon));
</script>

<template>
  <button
    type="button"
    class="yp-feature-button yp-framed yp-framed--button yp-interactive"
    :disabled="props.disabled"
    :aria-label="props.subtitle ? `${props.label}，${props.subtitle}` : props.label"
    @click="emit('click', $event)"
  >
    <span class="yp-framed__content yp-feature-button__inner">
      <span v-if="iconSrc" class="yp-feature-button__icon" aria-hidden="true">
        <img :src="iconSrc" alt="" />
      </span>
      <span class="yp-feature-button__label yp-label">{{ props.label }}</span>
      <span v-if="props.subtitle" class="yp-feature-button__subtitle yp-caption-latin">
        {{ props.subtitle }}
      </span>
    </span>
  </button>
</template>

<style scoped>
.yp-feature-button {
  display: inline-flex;
  min-width: 240px;
  min-height: 176px;
  /* fill comes from rounded button-frame PNG */
  background: transparent;
  color: var(--yp-color-text-main);
  border-radius: var(--yp-frame-button-radius);
}

.yp-feature-button__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: var(--yp-frame-button-safe) 28px;
  text-align: center;
}

.yp-feature-button__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
}

.yp-feature-button__icon img {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}

.yp-feature-button__label {
  font-size: 1.25rem;
  font-weight: 700;
  text-shadow: var(--yp-text-glow);
}

.yp-feature-button__subtitle {
  margin-top: -2px;
}
</style>
