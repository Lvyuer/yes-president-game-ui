<script setup lang="ts">
import { computed } from 'vue';
import { GameNotice } from '@/index';
import type { DeskTodoId } from './casePortStrike';

export type DeskTodoItem = {
  id: DeskTodoId;
  title: string;
  detail: string;
  done: boolean;
};

const props = defineProps<{
  items: DeskTodoItem[];
}>();

const emit = defineEmits<{
  select: [id: DeskTodoId];
}>();

const visible = computed(() => props.items.length > 0);
</script>

<template>
  <Transition name="ml-task-board">
    <div v-if="visible" class="ml-task-board" aria-label="待办事项">
      <GameNotice title="待办事项" tone="warning">
        <ul class="ml-task-board__list">
          <li v-for="item in props.items" :key="item.id">
            <button
              type="button"
              class="ml-task-board__item"
              :class="{ 'is-done': item.done }"
              :aria-label="item.done ? `已完成：${item.title}` : item.title"
              @click="emit('select', item.id)"
            >
              <span class="ml-task-board__check" aria-hidden="true">
                <span v-if="item.done" class="ml-task-board__check-mark" />
              </span>
              <span class="ml-task-board__copy">
                <span class="ml-task-board__item-title">{{ item.title }}</span>
                <span class="ml-task-board__item-detail">{{ item.detail }}</span>
              </span>
              <span v-if="!item.done" class="ml-task-board__arrow" aria-hidden="true">→</span>
            </button>
          </li>
        </ul>
      </GameNotice>
    </div>
  </Transition>
</template>

<style scoped>
.ml-task-board {
  position: absolute;
  top: calc(var(--yp-hud-safe-top) + var(--yp-hud-top-time-min-h) + 12px);
  left: 2.4%;
  z-index: 50;
  width: min(320px, 30vw);
  pointer-events: auto;
}

.ml-task-board :deep(.yp-notice) {
  width: 100%;
  min-width: 0;
  min-height: 0;
}

.ml-task-board :deep(.yp-notice__inner) {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px 14px;
}

.ml-task-board :deep(.yp-notice__title) {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ml-task-board__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ml-task-board__item {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: start;
  width: 100%;
  margin: 0;
  padding: 8px 4px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;
}

.ml-task-board__item:hover,
.ml-task-board__item:focus-visible {
  background: rgba(232, 201, 138, 0.08);
  outline: none;
}

.ml-task-board__item.is-done {
  opacity: 0.55;
  cursor: default;
}

.ml-task-board__check {
  width: 16px;
  height: 16px;
  margin-top: 3px;
  border: 1.5px solid rgba(232, 201, 138, 0.7);
  border-radius: 3px;
  display: grid;
  place-items: center;
  box-sizing: border-box;
}

.ml-task-board__item.is-done .ml-task-board__check {
  background: rgba(232, 201, 138, 0.18);
}

.ml-task-board__check-mark {
  width: 7px;
  height: 4px;
  border-left: 2px solid #e8c98a;
  border-bottom: 2px solid #e8c98a;
  transform: translateY(-1px) rotate(-45deg);
}

.ml-task-board__copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ml-task-board__item-title {
  font-family: var(--yp-font-serif);
  font-size: 0.9rem;
  font-weight: 650;
  line-height: 1.35;
  color: var(--yp-color-text-main);
}

.ml-task-board__item.is-done .ml-task-board__item-title {
  text-decoration: line-through;
}

.ml-task-board__item-detail {
  font-size: 0.76rem;
  line-height: 1.45;
  color: var(--yp-color-text-muted);
}

.ml-task-board__arrow {
  margin-top: 2px;
  color: #e8c98a;
  font-size: 0.95rem;
}

.ml-task-board-enter-active,
.ml-task-board-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-task-board-enter-from,
.ml-task-board-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}

@media (max-width: 900px) {
  .ml-task-board {
    top: auto;
    bottom: calc(var(--yp-hud-safe-bottom) + var(--yp-hud-dock-btn-min-h) * 0.55);
    left: 50%;
    width: min(340px, 88vw);
    transform: translateX(-50%);
  }

  .ml-task-board-enter-from,
  .ml-task-board-leave-to {
    transform: translateX(-50%) translateY(10px);
  }
}
</style>
