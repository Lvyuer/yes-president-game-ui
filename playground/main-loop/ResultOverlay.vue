<script setup lang="ts">
import { GameButton, GamePanel } from '@/index';

const props = defineProps<{
  open: boolean;
  title: string;
  body: string;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();
</script>

<template>
  <div v-if="props.open" class="ml-result" role="dialog" aria-label="处理结果">
    <button type="button" class="ml-result__backdrop" aria-label="关闭" @click="emit('dismiss')" />
    <div class="ml-result__card">
      <GamePanel :title="props.title" subtitle="RESULT" size="compact">
        <p>{{ props.body }}</p>
        <template #footer>
          <GameButton @click="emit('dismiss')">知道了</GameButton>
        </template>
      </GamePanel>
    </div>
  </div>
</template>

<style scoped>
.ml-result {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
}

.ml-result__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.55);
  cursor: pointer;
}

.ml-result__card {
  position: relative;
  z-index: 1;
  width: min(420px, 90%);
}

.ml-result__card p {
  margin: 0;
  line-height: 1.65;
  color: var(--yp-color-text-muted);
  white-space: pre-wrap;
}
</style>
