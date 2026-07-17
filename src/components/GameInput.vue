<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import type { GameInputProps } from '../types';

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<GameInputProps>(), {
  modelValue: '',
  type: 'text',
  disabled: false,
  readonly: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const attrs = useAttrs();

const inputId = computed(
  () => (attrs.id as string | undefined) ?? `yp-input-${Math.random().toString(36).slice(2, 9)}`,
);

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value);
}
</script>

<template>
  <label class="yp-input" :class="{ 'yp-input--disabled': props.disabled }">
    <span v-if="props.label" class="yp-input__label yp-caption-latin">{{ props.label }}</span>
    <span class="yp-input__frame yp-framed yp-framed--input">
      <span class="yp-framed__content yp-input__shell">
        <input
          :id="inputId"
          class="yp-input__control"
          :type="props.type"
          :value="props.modelValue"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :readonly="props.readonly"
          v-bind="attrs"
          @input="onInput"
        />
      </span>
    </span>
    <span v-if="props.hint" class="yp-input__hint">{{ props.hint }}</span>
  </label>
</template>

<style scoped>
.yp-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 520px;
}

.yp-input__label {
  color: var(--yp-color-gold-bright);
}

.yp-input__frame {
  display: block;
  width: 100%;
  min-height: 68px;
  background: transparent;
}

.yp-input__shell {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: inherit;
  padding: 0 var(--yp-frame-input-safe);
  border-radius: var(--yp-frame-input-radius);
  overflow: hidden;
  transition:
    filter var(--yp-motion-base),
    box-shadow var(--yp-motion-base);
}

.yp-input__control {
  width: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--yp-color-text-main);
  font-family: var(--yp-font-sans);
  font-size: 1rem;
  line-height: 1.4;
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.55);
  caret-color: var(--yp-color-gold-bright);
}

.yp-input__control::placeholder {
  color: rgba(216, 209, 194, 0.45);
}

.yp-input__control:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.yp-input__control:focus {
  outline: none;
}

.yp-input__hint {
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
  color: var(--yp-color-text-muted);
}

.yp-input--disabled {
  opacity: 0.72;
}

/*
  Focus hugs the gold trim (asset cropped tight to alpha).
  Soft inset wash follows the rounded inner fill — no square corners past the frame.
*/
.yp-input__frame:focus-within {
  outline: none;
}

.yp-input__frame:focus-within .yp-input__shell {
  filter: brightness(1.12);
  box-shadow:
    inset 0 0 0 1px rgba(215, 188, 126, 0.4),
    inset 0 0 12px rgba(184, 149, 98, 0.28);
}
</style>
