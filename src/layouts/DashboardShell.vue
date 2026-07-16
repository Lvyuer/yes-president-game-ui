<script setup lang="ts">
import GameResourceBar from '../components/GameResourceBar.vue';
import ActionGrid from './ActionGrid.vue';
import NoticeStack from './NoticeStack.vue';
import type { GameResourceItem } from '../types';
import type { ActionGridItem } from './ActionGrid.vue';
import type { NoticeStackItem } from './NoticeStack.vue';

defineProps<{
  resources: GameResourceItem[];
  actions: ActionGridItem[];
  notices: NoticeStackItem[];
}>();
</script>

<template>
  <div class="yp-dashboard-shell">
    <header class="yp-dashboard-shell__top">
      <GameResourceBar :items="resources" />
    </header>

    <div class="yp-dashboard-shell__main">
      <section class="yp-dashboard-shell__actions">
        <ActionGrid :items="actions" />
      </section>

      <aside class="yp-dashboard-shell__side">
        <NoticeStack :items="notices" />
      </aside>
    </div>

    <section class="yp-dashboard-shell__panel">
      <slot />
    </section>

    <footer v-if="$slots.footer" class="yp-dashboard-shell__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<style scoped>
.yp-dashboard-shell {
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  padding: 24px;
  background: #000;
}

.yp-dashboard-shell__main {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

.yp-dashboard-shell__panel {
  flex: 1;
}

.yp-dashboard-shell__footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

@media (max-width: 1100px) {
  .yp-dashboard-shell__main {
    grid-template-columns: 1fr;
  }
}
</style>
