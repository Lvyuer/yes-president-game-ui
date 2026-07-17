<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GameButton, GamePanel } from '@/index';
import { INBOX_ITEMS, type InboxItem } from './data';

const emit = defineEmits<{
  back: [];
  decide: [payload: { title: string; decision: string }];
}>();

const items = ref<InboxItem[]>(INBOX_ITEMS.map((item) => ({ ...item })));
const currentId = ref<string | null>(items.value.find((i) => i.status === 'pending')?.id ?? null);

const current = computed(() => items.value.find((i) => i.id === currentId.value) ?? null);
const pendingCount = computed(() => items.value.filter((i) => i.status === 'pending').length);

watch(
  () => pendingCount.value,
  (count) => {
    if (count === 0) currentId.value = null;
    else if (!current.value || current.value.status !== 'pending') {
      currentId.value = items.value.find((i) => i.status === 'pending')?.id ?? null;
    }
  },
);

function decide(decision: string) {
  if (!current.value || current.value.status !== 'pending') return;
  const title = current.value.title;
  current.value.status = 'done';
  emit('decide', { title, decision });
}
</script>

<template>
  <div class="ml-screen">
    <header class="ml-screen__head">
      <GameButton variant="secondary" @click="emit('back')">返回</GameButton>
      <div>
        <p class="ml-screen__en">INBOX</p>
        <h2 class="ml-screen__title">处理法案</h2>
      </div>
      <span class="ml-count">待办 {{ pendingCount }}</span>
    </header>

    <div class="ml-inbox">
      <div class="ml-inbox__list">
        <button
          v-for="item in items"
          :key="item.id"
          type="button"
          class="ml-inbox__item"
          :class="{
            'is-active': item.id === currentId,
            'is-done': item.status === 'done',
          }"
          @click="currentId = item.id"
        >
          <span class="ml-inbox__urgency" :data-tone="item.urgency">{{ item.urgencyLabel }}</span>
          <strong>{{ item.title }}</strong>
          <span class="ml-inbox__meta">{{ item.source }} · {{ item.direction }}</span>
        </button>
      </div>

      <div class="ml-inbox__detail">
        <GamePanel
          v-if="current"
          :title="current.title"
          :subtitle="`${current.source} · ${current.urgencyLabel}`"
          size="medium"
        >
          <p class="ml-inbox__summary">{{ current.summary }}</p>
          <p v-if="current.status !== 'pending'" class="ml-inbox__done">本案已处理。</p>
          <template v-if="current.status === 'pending'" #footer>
            <GameButton variant="success" @click="decide('签署同意')">签署同意</GameButton>
            <GameButton variant="danger" @click="decide('驳回拒绝')">驳回拒绝</GameButton>
            <GameButton variant="secondary" @click="decide('批示修改')">批示修改</GameButton>
          </template>
        </GamePanel>
        <div v-else class="ml-inbox__empty">
          <p>暂无待处理法案</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-screen {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px 18px 18px;
  background: rgba(5, 6, 7, 0.96);
  overflow: auto;
  z-index: 5;
}

.ml-screen__head {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ml-screen__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--yp-color-gold);
}

.ml-screen__title {
  margin: 2px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
}

.ml-count {
  margin-left: auto;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.1em;
  color: var(--yp-color-text-muted);
  border: 1px solid rgba(184, 149, 98, 0.28);
  border-radius: 999px;
  padding: 8px 14px;
}

.ml-inbox {
  display: grid;
  grid-template-columns: minmax(260px, 0.38fr) minmax(0, 0.62fr);
  gap: 16px;
  min-height: 0;
  flex: 1;
}

.ml-inbox__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: auto;
}

.ml-inbox__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  text-align: left;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-radius: 8px;
  background: rgba(12, 14, 16, 0.55);
  color: var(--yp-color-text-main);
  cursor: pointer;
}

.ml-inbox__item.is-active {
  border-color: rgba(215, 188, 126, 0.7);
  background: rgba(184, 149, 98, 0.12);
}

.ml-inbox__item.is-done {
  opacity: 0.45;
}

.ml-inbox__urgency {
  align-self: flex-start;
  font-family: var(--yp-font-latin);
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  color: var(--yp-color-gold-bright);
}

.ml-inbox__urgency[data-tone='urgent'] {
  color: #f0d9a8;
  border-color: rgba(179, 138, 74, 0.55);
}

.ml-inbox__urgency[data-tone='crisis'] {
  color: #f0b0b0;
  border-color: rgba(158, 56, 56, 0.55);
}

.ml-inbox__meta {
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
}

.ml-inbox__summary {
  margin: 0;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--yp-color-text-muted);
}

.ml-inbox__done {
  margin: 16px 0 0;
  color: var(--yp-color-gold-bright);
}

.ml-inbox__empty {
  display: grid;
  place-items: center;
  min-height: 240px;
  color: var(--yp-color-text-muted);
  border: 1px dashed rgba(184, 149, 98, 0.25);
  border-radius: 12px;
}

@media (max-width: 980px) {
  .ml-inbox {
    grid-template-columns: 1fr;
  }
}
</style>
