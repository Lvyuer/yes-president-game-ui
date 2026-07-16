<script setup lang="ts">
import { computed } from 'vue';
import { resolveGameIcon } from '../composables/useGameIcon';

const props = withDefaults(
  defineProps<{
    icon: string;
    label: string;
    disabled?: boolean;
    size?: 'sm' | 'md' | 'lg';
  }>(),
  {
    disabled: false,
    size: 'md',
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const iconSrc = computed(() => resolveGameIcon(props.icon));
</script>

<template>
  <button
    type="button"
    class="yp-icon-button yp-interactive"
    :class="`yp-icon-button--${props.size}`"
    :disabled="props.disabled"
    :aria-label="props.label"
    @click="emit('click', $event)"
  >
    <img v-if="iconSrc" :src="iconSrc" alt="" class="yp-icon-button__icon" />
  </button>
</template>

<style scoped>
.yp-icon-button {
  display: inline-grid;
  place-items: center;
  border: none;
  background: var(--yp-icon-button-base) center / contain no-repeat;
  box-shadow: none;
}

.yp-icon-button--sm {
  width: 44px;
  height: 44px;
}

.yp-icon-button--md {
  width: 56px;
  height: 56px;
}

.yp-icon-button--lg {
  width: 72px;
  height: 72px;
}

.yp-icon-button__icon {
  width: 42%;
  height: 42%;
  object-fit: contain;
}
</style>
