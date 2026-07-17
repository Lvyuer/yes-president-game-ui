<script setup lang="ts">
import { computed, ref } from 'vue';
import { GameButton, GamePanel, GameTitleDivider } from '@/index';
import { DIRECTIONS } from './data';

const emit = defineEmits<{
  back: [];
  publish: [payload: { direction: string; body: string }];
}>();

const selected = ref<string | null>(null);
const body = ref('');

const canSubmit = computed(
  () => !!selected.value && body.value.trim().length >= 8,
);

function submit() {
  if (!canSubmit.value || !selected.value) return;
  const dir = DIRECTIONS.find((d) => d.id === selected.value);
  emit('publish', {
    direction: dir?.label ?? selected.value,
    body: body.value.trim(),
  });
}
</script>

<template>
  <div class="ml-screen">
    <header class="ml-screen__head">
      <GameButton variant="secondary" @click="emit('back')">返回</GameButton>
      <div>
        <p class="ml-screen__en">PUBLISH BILL</p>
        <h2 class="ml-screen__title">发布法案</h2>
      </div>
    </header>

    <div class="ml-screen__grid">
      <GamePanel title="政策方向" subtitle="选择一条路线" size="compact">
        <div class="ml-dirs">
          <button
            v-for="dir in DIRECTIONS"
            :key="dir.id"
            type="button"
            class="ml-dir"
            :class="{ 'is-active': selected === dir.id }"
            @click="selected = dir.id"
          >
            <strong>{{ dir.label }}</strong>
            <span>{{ dir.desc }}</span>
          </button>
        </div>
      </GamePanel>

      <GamePanel title="法案草案" subtitle="总统签署区" size="medium">
        <label class="ml-label">正文（至少 8 字）</label>
        <textarea
          v-model="body"
          class="ml-textarea"
          rows="8"
          placeholder="起草本周法案要点…"
        />
        <GameTitleDivider />
        <div class="ml-screen__footer">
          <GameButton :disabled="!canSubmit" @click="submit">确认签署</GameButton>
        </div>
      </GamePanel>
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
  color: var(--yp-color-text-main);
}

.ml-screen__grid {
  display: grid;
  grid-template-columns: minmax(260px, 0.4fr) minmax(0, 0.6fr);
  gap: 16px;
  align-items: start;
}

.ml-dirs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ml-dir {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 18px;
  text-align: left;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-radius: 8px;
  background: rgba(12, 14, 16, 0.55);
  color: var(--yp-color-text-muted);
  cursor: pointer;
}

.ml-dir strong {
  font-family: var(--yp-font-serif);
  color: var(--yp-color-text-main);
}

.ml-dir span {
  font-size: 0.9rem;
  line-height: 1.65;
}

.ml-dir.is-active {
  border-color: rgba(215, 188, 126, 0.65);
  background: rgba(184, 149, 98, 0.12);
}

.ml-label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.14em;
  color: var(--yp-color-gold-bright);
}

.ml-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(184, 149, 98, 0.28);
  border-radius: 10px;
  background: rgba(8, 10, 12, 0.7);
  color: var(--yp-color-text-main);
  font-family: var(--yp-font-sans);
  font-size: 1.05rem;
  line-height: 1.7;
  resize: vertical;
}

.ml-textarea:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.4);
}

.ml-screen__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}

@media (max-width: 980px) {
  .ml-screen__grid {
    grid-template-columns: 1fr;
  }
}
</style>
