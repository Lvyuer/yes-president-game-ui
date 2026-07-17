<script setup lang="ts">
import GameTitleDivider from './GameTitleDivider.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
    subtitle?: string;
    size?: 'large' | 'medium' | 'compact' | 'notice';
    framed?: boolean;
  }>(),
  {
    size: 'medium',
    framed: true,
  },
);
</script>

<template>
  <section
    class="yp-panel"
    :class="[
      `yp-panel--${props.size}`,
      { 'yp-framed yp-framed--panel': props.framed },
    ]"
  >
    <div class="yp-framed__content yp-panel__inner">
      <header v-if="$slots.header || props.title || props.subtitle" class="yp-panel__header">
        <slot name="header">
          <div v-if="props.subtitle" class="yp-panel__subtitle yp-caption-latin">
            {{ props.subtitle }}
          </div>
          <h2 v-if="props.title" class="yp-panel__title yp-title">
            {{ props.title }}
          </h2>
          <GameTitleDivider v-if="props.title" />
        </slot>
      </header>

      <div class="yp-panel__body yp-body">
        <slot />
      </div>

      <footer v-if="$slots.footer" class="yp-panel__footer">
        <slot name="footer" />
      </footer>
    </div>
  </section>
</template>

<style scoped>
.yp-panel {
  color: var(--yp-color-text-main);
  /* fill comes from border-image (rounded). Solid CSS bg leaks square corners. */
  background: transparent;
  border-radius: var(--yp-frame-panel-radius);
  box-shadow: var(--yp-shadow-panel);
}

.yp-panel--large {
  min-width: 600px;
  min-height: 420px;
}

.yp-panel--medium {
  min-width: 360px;
  min-height: 300px;
}

.yp-panel--compact {
  min-width: 320px;
  min-height: 220px;
}

.yp-panel--notice {
  min-width: 320px;
  min-height: 120px;
}

.yp-panel__inner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--yp-frame-panel-safe);
  min-height: inherit;
}

.yp-panel__header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.yp-panel__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
}

.yp-panel__body {
  flex: 1;
}

.yp-panel__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}
</style>
