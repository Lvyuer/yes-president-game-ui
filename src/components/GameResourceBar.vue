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
        class="yp-resource-bar__item"
      >
        <img
          v-if="item.iconSrc"
          :src="item.iconSrc"
          alt=""
          class="yp-resource-bar__icon"
          aria-hidden="true"
        />
        <div class="yp-resource-bar__text">
          <span class="yp-resource-bar__label">{{ item.label }}</span>
          <span class="yp-resource-bar__value yp-data">{{ item.value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.yp-resource-bar {
  width: 100%;
  min-height: 168px;
  background: transparent;
}

.yp-resource-bar__inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 8px;
  min-height: inherit;
  box-sizing: border-box;
  padding: calc(var(--yp-frame-resource-bar-safe) + 8px)
    calc(var(--yp-frame-resource-bar-safe) + 14px);
}

.yp-resource-bar__item {
  position: relative;
  display: flex;
  flex: 1 1 0;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 12px;
}

.yp-resource-bar__item:first-child {
  padding-left: 4px;
}

.yp-resource-bar__item:last-child {
  padding-right: 4px;
}

.yp-resource-bar__item:not(:first-child)::before {
  content: "";
  position: absolute;
  left: 0;
  top: 12%;
  bottom: 12%;
  width: 2px;
  border-radius: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(215, 188, 126, 0.35) 12%,
    rgba(232, 210, 150, 0.9) 50%,
    rgba(215, 188, 126, 0.35) 88%,
    transparent 100%
  );
  box-shadow: 0 0 6px rgba(184, 149, 98, 0.25);
  pointer-events: none;
}

.yp-resource-bar__icon {
  flex: 0 0 auto;
  width: 96px;
  height: 96px;
  object-fit: contain;
  object-position: center;
  opacity: 0.95;
  overflow: hidden;
}

.yp-resource-bar__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  min-width: 0;
}

.yp-resource-bar__label {
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
  letter-spacing: 0.08em;
  color: var(--yp-color-text-muted);
  white-space: nowrap;
}

.yp-resource-bar__value {
  font-family: var(--yp-font-data);
  font-size: 2.35rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.05;
  white-space: nowrap;
  color: var(--yp-color-text-main);
  text-shadow: var(--yp-text-glow);
}

@media (max-width: 720px) {
  .yp-resource-bar__inner {
    flex-wrap: wrap;
  }

  .yp-resource-bar__item {
    flex: 1 1 calc(50% - 8px);
  }

  .yp-resource-bar__item:nth-child(odd)::before {
    display: none;
  }
}
</style>
