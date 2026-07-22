<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { GameButton } from '@/index';
import { DIRECTIONS } from './data';
import publishBase from './assets/publish-ui-base.png';

const props = defineProps<{
  showcaseDirectionId?: string | null;
  showcaseBody?: string | null;
}>();

const emit = defineEmits<{
  back: [];
  publish: [payload: { direction: string; body: string }];
}>();

const selected = ref<string | null>(null);
const body = ref('');

const bodyTooShort = computed(
  () => body.value.trim().length > 0 && body.value.trim().length < 8,
);

const canSubmit = computed(
  () => !!selected.value && body.value.trim().length >= 8,
);

const showcaseActive = computed(
  () => !!props.showcaseDirectionId && !!props.showcaseBody,
);

onMounted(() => {
  if (props.showcaseDirectionId) {
    selected.value = props.showcaseDirectionId;
  }
});

function applyShowcaseDraft() {
  if (!props.showcaseDirectionId || !props.showcaseBody) return;
  selected.value = props.showcaseDirectionId;
  body.value = props.showcaseBody;
}

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
  <div class="ml-publish" data-screen-root>
    <img
      class="ml-publish__base"
      :src="publishBase"
      alt=""
      draggable="false"
    />

    <header class="ml-publish__head">
      <GameButton variant="secondary" @click="emit('back')">返回草稿列表</GameButton>
      <div>
        <p class="ml-publish__en">PILOT DRAFTING</p>
        <h2 class="ml-publish__title">发布法案</h2>
      </div>
    </header>

    <div class="ml-publish__dirs-label">
      <span class="ml-publish__no">01</span>
      <div>
        <h3 class="ml-publish__section">法案草拟方向</h3>
        <p class="ml-publish__desc">
          这些方向将帮助 AI 生成内容，不代表严格限制。
        </p>
      </div>
    </div>

    <div class="ml-publish__dirs" role="listbox" aria-label="法案草拟方向">
      <button
        v-for="(dir, index) in DIRECTIONS"
        :key="dir.id"
        type="button"
        role="option"
        class="ml-publish__dir"
        :class="{ 'is-active': selected === dir.id }"
        :aria-selected="selected === dir.id"
        @click="selected = dir.id"
      >
        <span class="ml-publish__dir-no">{{ String(index + 1).padStart(2, '0') }}</span>
        <span class="ml-publish__dir-body">
          <strong>{{ dir.label }}</strong>
          <span>{{ dir.desc }}</span>
        </span>
        <span class="ml-publish__dir-arrow" aria-hidden="true">→</span>
      </button>
    </div>

    <div class="ml-publish__draft-label">
      <span class="ml-publish__no">02</span>
      <h3 class="ml-publish__section">起草法案内容</h3>
      <span class="ml-publish__tag">DRAFT / 文本框</span>
    </div>

    <section class="ml-publish__draft" aria-label="起草法案内容">
      <label class="ml-publish__label" for="bill-body">法案内容正文</label>
      <textarea
        id="bill-body"
        v-model="body"
        class="ml-publish__textarea"
        rows="8"
        placeholder="请用一句话概括法案目的，例如：为进口补贴与建筑工人提供临时保障……"
      />
      <p v-if="bodyTooShort" class="ml-publish__hint">
        法案内容过短，请至少写一句完整表述
      </p>
      <p v-else-if="showcaseActive && !body.trim()" class="ml-publish__hint ml-publish__hint--guide">
        示范草案已选好方向，填入正文后即可颁布
      </p>

      <footer class="ml-publish__footer">
        <p class="ml-publish__disclaimer">
          草稿仅供 AI 辅助草拟，无决策或法律效益保障
        </p>
        <div class="ml-publish__actions">
          <GameButton
            v-if="showcaseActive"
            variant="secondary"
            @click="applyShowcaseDraft"
          >
            填入示范草案
          </GameButton>
          <GameButton :disabled="!canSubmit" @click="submit">确认颁布</GameButton>
        </div>
      </footer>
    </section>
  </div>
</template>

<style scoped>
.ml-publish {
  /* Slot percentages measured from publish-ui-base.png (3840×2160) */
  --pub-head-left: 1.8%;
  --pub-head-top: 1.6%;
  --pub-head-width: 96.4%;
  --pub-head-height: 6.6%;

  --pub-dirs-label-left: 1.8%;
  --pub-dirs-label-top: 10.5%;
  --pub-dirs-label-width: 29.5%;

  --pub-dir-left: 1.82%;
  --pub-dir-width: 29.43%;
  --pub-dir-height: 7.25%;

  --pub-draft-label-left: 37.8%;
  --pub-draft-label-top: 10.5%;
  --pub-draft-label-width: 57%;

  --pub-draft-left: 39.2%;
  --pub-draft-top: 26.2%;
  --pub-draft-width: 54.8%;
  --pub-draft-height: 53.5%;

  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
  color: var(--yp-color-text-main);
}

.ml-publish__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-publish__head,
.ml-publish__dirs-label,
.ml-publish__dir,
.ml-publish__draft-label,
.ml-publish__draft {
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
}

.ml-publish__head {
  left: var(--pub-head-left);
  top: var(--pub-head-top);
  width: var(--pub-head-width);
  height: var(--pub-head-height);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 10px;
}

.ml-publish__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--yp-color-gold);
}

.ml-publish__title {
  margin: 2px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
  color: var(--yp-color-text-main);
}

.ml-publish__dirs-label {
  left: var(--pub-dirs-label-left);
  top: var(--pub-dirs-label-top);
  width: var(--pub-dirs-label-width);
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.ml-publish__draft-label {
  left: var(--pub-draft-label-left);
  top: var(--pub-draft-label-top);
  width: var(--pub-draft-label-width);
  display: flex;
  align-items: center;
  gap: 12px;
}

.ml-publish__no {
  font-family: var(--yp-font-latin);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--yp-color-gold-bright);
  line-height: 1.1;
}

.ml-publish__section {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.15rem;
  color: var(--yp-color-text-main);
}

.ml-publish__desc {
  margin: 6px 0 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--yp-color-text-muted);
}

.ml-publish__tag {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  border-radius: 6px;
  font-family: var(--yp-font-latin);
  font-size: 0.68rem;
  letter-spacing: 0.12em;
  color: var(--yp-color-text-muted);
}

.ml-publish__dir {
  left: var(--pub-dir-left);
  width: var(--pub-dir-width);
  height: var(--pub-dir-height);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 0 18px;
  text-align: left;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--yp-color-text-muted);
  cursor: pointer;
}

.ml-publish__dir:nth-child(1) { top: 25.14%; }
.ml-publish__dir:nth-child(2) { top: 33.61%; }
.ml-publish__dir:nth-child(3) { top: 42.22%; }
.ml-publish__dir:nth-child(4) { top: 50.74%; }
.ml-publish__dir:nth-child(5) { top: 59.4%; }

.ml-publish__dir-no {
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.08em;
  color: var(--yp-color-gold);
}

.ml-publish__dir-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.ml-publish__dir-body strong {
  font-family: var(--yp-font-serif);
  font-size: 1rem;
  color: var(--yp-color-text-main);
}

.ml-publish__dir-body span {
  font-size: 0.82rem;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-publish__dir-arrow {
  font-family: var(--yp-font-latin);
  color: var(--yp-color-gold-bright);
  opacity: 0.7;
}

.ml-publish__dir:hover,
.ml-publish__dir.is-active {
  background: rgba(184, 149, 98, 0.12);
}

.ml-publish__dir.is-active {
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.45);
}

.ml-publish__dir:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.7);
}

.ml-publish__draft {
  left: var(--pub-draft-left);
  top: var(--pub-draft-top);
  width: var(--pub-draft-width);
  height: var(--pub-draft-height);
  display: flex;
  flex-direction: column;
  padding: 18px 22px 16px;
  min-height: 0;
}

.ml-publish__label {
  display: block;
  margin-bottom: 8px;
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  color: var(--yp-color-text-main);
}

.ml-publish__textarea {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 14px;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-radius: 10px;
  background: rgba(8, 10, 12, 0.35);
  color: var(--yp-color-text-main);
  font-family: var(--yp-font-sans);
  font-size: 1.05rem;
  line-height: 1.7;
  resize: none;
}

.ml-publish__textarea:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(215, 188, 126, 0.4);
}

.ml-publish__hint {
  margin: 8px 0 0;
  font-size: 0.85rem;
  color: var(--yp-color-warning);
}

.ml-publish__hint--guide {
  color: var(--yp-color-text-muted);
}

.ml-publish__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.ml-publish__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 14px;
  flex-shrink: 0;
}

.ml-publish__disclaimer {
  margin: 0;
  max-width: 28em;
  font-size: 0.85rem;
  line-height: 1.5;
  color: rgba(216, 209, 194, 0.45);
}

@media (max-width: 980px) {
  .ml-publish__dir-body span {
    display: none;
  }

  .ml-publish__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ml-publish__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
