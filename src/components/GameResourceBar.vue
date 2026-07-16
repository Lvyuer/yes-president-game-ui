<script setup lang="ts">
import { computed } from 'vue';
import { resolveGameIcon } from '../composables/useGameIcon';

const props = defineProps<{
  items: {
    id: string;
    label: string;
    value: string | number;
    icon?: string;
  }[];
}>();

const resolvedItems = computed(() =>
  props.items.map((item) => ({
    ...item,
    iconSrc: resolveGameIcon(item.icon),
  })),
);
</script>

<template>
  <div class="yp-resource-bar yp-framed yp-framed--resource-bar">
    <div class="yp-framed__content yp-resource-bar__inner">
      <div
        v-for="item in resolvedItems"
        :key="item.id"
        class="yp-resource-bar__item yp-framed yp-framed--resource-item"
      >
        <div class="yp-framed__content yp-resource-bar__item-inner">
          <img
            v-if="item.iconSrc"
            :src="item.iconSrc"
            alt=""
            class="yp-resource-bar__icon"
            aria-hidden="true"
          />
          <span class="yp-resource-bar__label yp-caption-latin">{{ item.label }}</span>
          <span class="yp-resource-bar__value yp-title">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yp-resource-bar {
  width: 100%;
  min-height: 72px;
  background: transparent;
}

.yp-resource-bar__inner {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: center;
  padding: var(--yp-frame-resource-bar-safe) calc(var(--yp-frame-resource-bar-safe) + 8px);
}

.yp-resource-bar__item {
  min-height: 48px;
  background: transparent;
}

.yp-resource-bar__item-inner {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: inherit;
  padding: 0 var(--yp-frame-resource-item-safe);
}

.yp-resource-bar__icon {
  width: 22px;
  height: 22px;
  object-fit: contain;
}

.yp-resource-bar__label {
  color: var(--yp-color-text-muted);
}

.yp-resource-bar__value {
  font-size: 1.05rem;
  font-weight: 700;
}
</style>
