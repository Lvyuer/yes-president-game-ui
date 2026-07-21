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
      <span class="yp-select__arrow" aria-hidden="true" />
    </button>

    <div
      v-show="open"
      :id="listId"
      class="yp-select__panel yp-framed yp-framed--select-list"
      role="listbox"
      :aria-label="props.label || '选项列表'"
    >
      <span class="yp-select__panel-ornament" aria-hidden="true" />
      <ul class="yp-framed__content yp-select__list">
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
          <span class="yp-select__option-label">{{ option.label }}</span>
        </li>
      </ul>
    </div>
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
  overflow: visible;
}

.yp-select__label {
  color: var(--yp-color-gold-bright);
}

.yp-select__trigger {
  position: relative;
  display: block;
  width: 100%;
  min-height: 72px;
  background: transparent;
  text-align: left;
  border-radius: var(--yp-frame-select-radius);
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

.yp-select__arrow {
  position: absolute;
  top: 50%;
  right: 0;
  z-index: 2;
  width: var(--yp-frame-select-arrow-width);
  height: calc(100% - 18px);
  transform: translateY(-50%);
  pointer-events: none;
}

.yp-select__arrow::before {
  content: "";
  position: absolute;
  top: 10%;
  bottom: 10%;
  left: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    rgba(215, 188, 126, 0.5) 20%,
    rgba(215, 188, 126, 0.5) 80%,
    transparent
  );
  box-shadow: 1px 0 0 rgba(0, 0, 0, 0.45);
}

.yp-select__arrow::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid var(--yp-color-gold-bright);
  filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.65));
  transform: translate(-50%, -35%);
}

/* Same width as trigger. Frame stays on the panel — scroll lives on the list
   so border-image is never clipped. Small gap below trigger keeps the top tab readable. */
.yp-select__panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  box-sizing: border-box;
  z-index: 20;
  overflow: visible;
  background: transparent;
}

/*
  Fixed overlay for the centered top tab from 下拉列表边框.png.
  Shoulder line aligns to the base frame gold stroke (~4px below panel top),
  so the tab peaks above the rectangle without a floating/double-edge seam.
*/
.yp-select__panel-ornament {
  position: absolute;
  top: var(--yp-select-list-ornament-top);
  left: 50%;
  z-index: 3;
  width: var(--yp-select-list-ornament-width);
  height: var(--yp-select-list-ornament-height);
  transform: translateX(-50%);
  background: var(--yp-select-list-ornament) center top / 100% 100% no-repeat;
  pointer-events: none;
}

.yp-select__list {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: calc(var(--yp-frame-select-list-safe-top)) var(--yp-frame-select-list-safe-x)
    var(--yp-frame-select-list-safe-y);
  list-style: none;
  /* Fit ~5 rows before scrolling; short lists keep a full, unclipped frame */
  max-height: min(
    calc(
      var(--yp-frame-select-list-safe-top) + (72px * 5) + var(--yp-frame-select-list-safe-y)
    ),
    70vh
  );
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(184, 149, 98, 0.55) transparent;
}

.yp-select__list::-webkit-scrollbar {
  width: 6px;
}

.yp-select__list::-webkit-scrollbar-thumb {
  background: rgba(184, 149, 98, 0.45);
  border-radius: 3px;
}

.yp-select__list::-webkit-scrollbar-track {
  background: transparent;
}

.yp-select__option {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 72px;
  padding: 8px 12px;
  margin: 0;
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  color: var(--yp-color-text-main);
  cursor: pointer;
  border-style: solid;
  border-color: transparent;
  border-width: var(--yp-frame-select-hover-width);
  background-clip: padding-box;
  box-sizing: border-box;
}

/* Soft row separators — no new asset needed */
.yp-select__option:not(:last-child)::after {
  content: "";
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(120, 90, 48, 0.28) 12%,
    rgba(120, 90, 48, 0.28) 88%,
    transparent 100%
  );
  pointer-events: none;
}

.yp-select__option:hover:not(.is-disabled)::after,
.yp-select__option.is-selected:not(.is-disabled)::after {
  opacity: 0;
}

.yp-select__option:hover:not(.is-disabled),
.yp-select__option.is-selected:not(.is-disabled) {
  border-image-source: var(--yp-frame-select-hover);
  border-image-slice: var(--yp-frame-select-hover-slice) fill;
  border-image-repeat: stretch;
  color: var(--yp-color-text-main);
  text-shadow: 0 1px 1px rgba(0, 0, 0, 0.55);
}

.yp-select__option-label {
  position: relative;
  z-index: 1;
}

.yp-select__option.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.yp-select--disabled {
  opacity: 0.6;
}

.yp-select--open .yp-select__trigger .yp-framed__content {
  filter: brightness(1.06);
}
</style>
