<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'danger' | 'success';
    disabled?: boolean;
  }>(),
  {
    variant: 'primary',
    disabled: false,
  },
);

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    type="button"
    class="yp-button yp-interactive yp-framed"
    :class="[
      `yp-button--${props.variant}`,
      props.disabled ? 'yp-framed--button-sm-disabled' : 'yp-framed--button-sm',
    ]"
    :disabled="props.disabled"
    @click="emit('click', $event)"
  >
    <span class="yp-framed__content yp-button__label">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.yp-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* keep near source plaque aspect (~4:1) so ends don't read as scroll rollers */
  min-width: 200px;
  min-height: 68px;
  padding: 0;
  background: transparent;
  border-radius: var(--yp-frame-button-sm-radius);
}

.yp-button__label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--yp-frame-button-sm-safe);
  min-height: inherit;
  font-family: var(--yp-font-serif);
  letter-spacing: 0.08em;
  font-size: 1.05rem;
  color: var(--yp-color-text-on-cream);
  text-shadow: 0 1px 0 rgba(255, 248, 232, 0.35);
}

.yp-button--danger .yp-button__label {
  color: #7a2c2c;
}

.yp-button--success .yp-button__label {
  color: #2f5a2f;
}

.yp-button:disabled .yp-button__label {
  padding-inline: var(--yp-frame-button-sm-disabled-safe);
  color: #6a6a6a;
  text-shadow: none;
}

/* disabled frame already gray; don't double-fade via .yp-interactive:disabled */
.yp-button.yp-interactive:disabled {
  opacity: 1;
  filter: none;
}
</style>
