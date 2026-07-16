<script setup lang="ts">
import GameNotice from '../components/GameNotice.vue';
import type { GameNoticeTone } from '../types';

export interface NoticeStackItem {
  title: string;
  message?: string;
  tone?: GameNoticeTone;
}

defineProps<{
  items: NoticeStackItem[];
}>();
</script>

<template>
  <div class="yp-notice-stack">
    <GameNotice
      v-for="(item, index) in items"
      :key="`${item.title}-${index}`"
      :title="item.title"
      :message="item.message"
      :tone="item.tone"
    />
  </div>
</template>

<style scoped>
.yp-notice-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
