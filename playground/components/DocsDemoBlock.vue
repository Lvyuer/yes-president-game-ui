<script setup lang="ts">
import { GameTitleDivider } from '@/index';

defineProps<{
  title: string;
  description?: string;
}>();
</script>

<template>
  <section class="docs-demo">
    <header class="docs-demo__head">
      <h3 class="docs-demo__title">{{ title }}</h3>
      <p v-if="description" class="docs-demo__desc">{{ description }}</p>
      <GameTitleDivider class="docs-demo__rule" />
    </header>
    <div class="docs-demo__preview">
      <slot />
    </div>
    <details v-if="$slots.code" class="docs-demo__code">
      <summary>使用示例</summary>
      <pre><code><slot name="code" /></code></pre>
    </details>
  </section>
</template>

<style scoped>
.docs-demo {
  margin-bottom: 28px;
  background: rgba(12, 14, 16, 0.55);
  box-shadow: var(--yp-shadow-panel);
}

.docs-demo__head {
  padding: 18px 24px 0;
}

.docs-demo__title {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.05rem;
  color: var(--yp-color-text-main);
  letter-spacing: 0.04em;
}

.docs-demo__desc {
  margin: 6px 0 0;
  font-family: var(--yp-font-sans);
  font-size: 0.88rem;
  color: var(--yp-color-text-muted);
  line-height: 1.5;
}

.docs-demo__rule {
  margin-top: 12px;
  opacity: 0.9;
}

.docs-demo__preview {
  padding: 28px 24px;
  background:
    radial-gradient(circle at 15% 0%, rgba(184, 149, 98, 0.08), transparent 42%),
    rgba(4, 6, 8, 0.72);
}

.docs-demo__code {
  border-top: 1px solid rgba(184, 149, 98, 0.18);
}

.docs-demo__code summary {
  padding: 10px 24px;
  cursor: pointer;
  font-family: var(--yp-font-sans);
  font-size: 0.85rem;
  color: var(--yp-color-gold-bright);
  user-select: none;
}

.docs-demo__code pre {
  margin: 0;
  padding: 0 24px 18px;
  overflow: auto;
}

.docs-demo__code code {
  font-family: Consolas, "Courier New", monospace;
  font-size: 0.82rem;
  line-height: 1.55;
  color: #e8dfcb;
  white-space: pre;
}
</style>
