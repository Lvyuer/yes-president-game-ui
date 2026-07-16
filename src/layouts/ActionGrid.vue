<script setup lang="ts">
import GameFeatureButton from '../components/GameFeatureButton.vue';

export interface ActionGridItem {
  icon?: string;
  label: string;
  subtitle?: string;
  disabled?: boolean;
}

const props = defineProps<{
  items: ActionGridItem[];
}>();

const emit = defineEmits<{
  action: [index: number];
}>();
</script>

<template>
  <div class="yp-action-grid">
    <GameFeatureButton
      v-for="(item, index) in props.items"
      :key="`${item.label}-${index}`"
      :icon="item.icon"
      :label="item.label"
      :subtitle="item.subtitle"
      :disabled="item.disabled"
      @click="emit('action', index)"
    />
  </div>
</template>

<style scoped>
.yp-action-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(200px, 1fr));
  gap: 20px;
}

@media (max-width: 1200px) {
  .yp-action-grid {
    grid-template-columns: repeat(2, minmax(200px, 1fr));
  }
}
</style>
