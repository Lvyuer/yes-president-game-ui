<script setup lang="ts">
import type { GameNoticeProps } from '../types';

const props = withDefaults(defineProps<GameNoticeProps>(), {
  tone: 'info',
});
</script>

<template>
  <article
    class="yp-notice yp-framed yp-framed--notice"
    :class="`yp-notice--${props.tone}`"
  >
    <div class="yp-framed__content yp-notice__inner">
      <h3 class="yp-notice__title yp-title">{{ props.title }}</h3>
      <p v-if="props.message" class="yp-notice__message yp-body">{{ props.message }}</p>
      <slot />
    </div>
  </article>
</template>

<style scoped>
.yp-notice {
  min-width: 320px;
  min-height: 112px;
  background: transparent;
  border-radius: var(--yp-frame-notice-radius);
}

.yp-notice__inner {
  padding: var(--yp-frame-notice-safe) calc(var(--yp-frame-notice-safe) + 8px);
}

.yp-notice__title {
  margin: 0 0 6px;
  font-size: 1.05rem;
}

.yp-notice__message {
  margin: 0;
  font-size: 0.9rem;
}

.yp-notice--warning .yp-notice__title {
  color: #f0d9a8;
}

.yp-notice--danger .yp-notice__title {
  color: #f0b0b0;
}

.yp-notice--success .yp-notice__title {
  color: #c8e8c0;
}
</style>
