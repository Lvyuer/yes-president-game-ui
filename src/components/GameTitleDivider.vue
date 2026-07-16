<script setup lang="ts">
withDefaults(
  defineProps<{
    /** 是否铺满容器宽度（两侧用细线延伸） */
    stretch?: boolean;
  }>(),
  { stretch: true },
);
</script>

<template>
  <div
    class="yp-title-divider"
    :class="{ 'yp-title-divider--stretch': stretch }"
    role="separator"
    aria-hidden="true"
  >
    <span class="yp-title-divider__line yp-title-divider__line--left" />
    <span class="yp-title-divider__ornament" />
    <span class="yp-title-divider__line yp-title-divider__line--right" />
  </div>
</template>

<style scoped>
.yp-title-divider {
  display: flex;
  align-items: center;
  gap: 0;
  width: 100%;
  min-height: 28px;
}

.yp-title-divider__line {
  flex: 1 1 auto;
  height: 2px;
  min-width: 24px;
  background:
    linear-gradient(
      90deg,
      transparent 0%,
      rgba(215, 188, 126, 0.25) 12%,
      rgba(215, 188, 126, 0.85) 50%,
      rgba(215, 188, 126, 0.25) 88%,
      transparent 100%
    );
  opacity: 0.9;
}

.yp-title-divider__line--left {
  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(215, 188, 126, 0.35) 30%,
      rgba(215, 188, 126, 0.95)
    );
}

.yp-title-divider__line--right {
  background:
    linear-gradient(
      90deg,
      rgba(215, 188, 126, 0.95),
      rgba(215, 188, 126, 0.35) 70%,
      transparent
    );
}

.yp-title-divider__ornament {
  flex: 0 0 auto;
  width: 120px;
  height: 28px;
  background: var(--yp-divider-title-ornament) center / contain no-repeat;
}

.yp-title-divider:not(.yp-title-divider--stretch) {
  justify-content: center;
}

.yp-title-divider:not(.yp-title-divider--stretch) .yp-title-divider__line {
  display: none;
}

.yp-title-divider:not(.yp-title-divider--stretch) .yp-title-divider__ornament {
  width: min(100%, 420px);
  height: 36px;
  background-image: var(--yp-divider-title);
}
</style>
