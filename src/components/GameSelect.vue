<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue?: string;
    options: { value: string; label: string; disabled?: boolean }[];
    label?: string;
    placeholder?: string;
    disabled?: boolean;
  }>(),
  {
    modelValue: '',
    placeholder: '请选择',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  change: [value: string];
}>();

const open = ref(false);
const rootRef = ref<HTMLElement | null>(null);
const listId = `yp-select-${Math.random().toString(36).slice(2, 9)}`;

const selected = computed(
  () => props.options.find((item) => item.value === props.modelValue) ?? null,
);

const displayLabel = computed(() => selected.value?.label ?? props.placeholder);

function toggle() {
  if (props.disabled) return;
  open.value = !open.value;
}

function selectOption(value: string) {
  const option = props.options.find((item) => item.value === value);
  if (!option || option.disabled) return;
  emit('update:modelValue', value);
  emit('change', value);
  open.value = false;
}

function onDocPointer(event: MouseEvent) {
  if (!open.value || !rootRef.value) return;
  if (!rootRef.value.contains(event.target as Node)) {
    open.value = false;
  }
}

function onKeydown(event: KeyboardEvent) {
  if (props.disabled) return;
  if (event.key === 'Escape') {
    open.value = false;
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    toggle();
  }
  if (!open.value) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault();
    const enabled = props.options.filter((item) => !item.disabled);
    if (!enabled.length) return;
    const current = enabled.findIndex((item) => item.value === props.modelValue);
    const delta = event.key === 'ArrowDown' ? 1 : -1;
    const next = enabled[(current + delta + enabled.length) % enabled.length];
    selectOption(next.value);
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointer);
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointer);
});

async function focusTrigger() {
  await nextTick();
}
</script>

<template>
  <div
    ref="rootRef"
    class="yp-select"
    :class="{ 'yp-select--open': open, 'yp-select--disabled': props.disabled }"
  >
    <span v-if="props.label" class="yp-select__label yp-caption-latin">{{ props.label }}</span>

    <button
      type="button"
      class="yp-select__trigger yp-framed yp-framed--select yp-interactive"
      :disabled="props.disabled"
      :aria-expanded="open"
      :aria-controls="listId"
      aria-haspopup="listbox"
      @click="toggle"
      @keydown="onKeydown"
      @focus="focusTrigger"
    >
      <span
        class="yp-framed__content yp-select__value"
        :class="{ 'yp-select__value--placeholder': !selected }"
      >
        {{ displayLabel }}
      </span>
    </button>

    <ul
      v-show="open"
      :id="listId"
      class="yp-select__list yp-framed yp-framed--select-list"
      role="listbox"
      :aria-label="props.label || '选项列表'"
    >
      <div class="yp-framed__content yp-select__list-inner">
        <li
          v-for="option in props.options"
          :key="option.value"
          class="yp-select__option"
          role="option"
          :aria-selected="option.value === props.modelValue"
          :aria-disabled="option.disabled || undefined"
          :class="{
            'is-selected': option.value === props.modelValue,
            'is-disabled': option.disabled,
          }"
          @click="selectOption(option.value)"
        >
          {{ option.label }}
        </li>
      </div>
    </ul>
  </div>
</template>

<style scoped>
.yp-select {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  max-width: 520px;
}

.yp-select__label {
  color: var(--yp-color-gold-bright);
}

.yp-select__trigger {
  display: block;
  width: 100%;
  min-height: 64px;
  background: transparent;
  text-align: left;
}

.yp-select__value {
  display: flex;
  align-items: center;
  min-height: inherit;
  padding: 0 var(--yp-frame-select-safe-right) 0 var(--yp-frame-select-safe-x);
  font-family: var(--yp-font-sans);
  font-size: 1rem;
  color: var(--yp-color-text-main);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.55);
}

.yp-select__value--placeholder {
  color: rgba(216, 209, 194, 0.45);
}

.yp-select__list {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  z-index: 20;
  margin: 0;
  padding: 0;
  list-style: none;
  background: transparent;
  max-height: 280px;
  overflow: auto;
}

.yp-select__list-inner {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: calc(var(--yp-frame-select-list-safe) + 8px) var(--yp-frame-select-list-safe)
    var(--yp-frame-select-list-safe);
}

.yp-select__option {
  padding: 10px 14px;
  min-height: 40px;
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  color: var(--yp-color-text-on-cream);
  cursor: pointer;
  border-style: solid;
  border-color: transparent;
  border-width: var(--yp-frame-select-hover-width);
  background-clip: padding-box;
}

.yp-select__option:hover:not(.is-disabled),
.yp-select__option.is-selected:not(.is-disabled) {
  border-image-source: var(--yp-frame-select-hover);
  border-image-slice: var(--yp-frame-select-hover-slice) fill;
  border-image-repeat: stretch;
  color: var(--yp-color-text-main);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.55);
}

.yp-select__option.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.yp-select--disabled {
  opacity: 0.6;
}

.yp-select--open .yp-select__trigger {
  filter: brightness(1.06);
}
</style>
