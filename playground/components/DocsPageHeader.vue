<script setup lang="ts">
import { GameTitleDivider } from '@/index';

defineProps<{
  title: string;
  english: string;
  description: string;
}>();
</script>

<template>
  <header class="docs-page-header">
    <p class="docs-page-header__en">{{ english }}</p>
    <h1 class="docs-page-header__title">{{ title }}</h1>
    <p class="docs-page-header__desc">{{ description }}</p>
    <GameTitleDivider class="docs-page-header__rule" />
  </header>
</template>

<style scoped>
.docs-page-header {
  margin-bottom: 28px;
}

.docs-page-header__en {
  margin: 0 0 6px;
  font-family: var(--yp-font-latin);
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--yp-color-gold);
}

.docs-page-header__title {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 2rem;
  color: var(--yp-color-text-main);
  letter-spacing: 0.06em;
  text-shadow: var(--yp-text-glow);
}

.docs-page-header__desc {
  margin: 12px 0 0;
  max-width: 720px;
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  line-height: 1.65;
  color: var(--yp-color-text-muted);
}

.docs-page-header__rule {
  margin-top: 18px;
}
</style>
