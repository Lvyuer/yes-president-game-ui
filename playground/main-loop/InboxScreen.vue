<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { GameButton } from '@/index';
import { INBOX_ITEMS, type InboxItem } from './data';
import inboxBase from './assets/inbox-ui-base.png';

type DecisionPath = 'approve' | 'reject' | null;

const props = defineProps<{
  highlightBillId?: string;
  highlightBillIds?: string[];
  /** Already signed bill ids — shown grayed at the bottom of the list. */
  signedBillIds?: string[];
  /** When set, only these inbox item ids are shown (week-loop campaign filtering). */
  visibleItemIds?: string[];
  itemGuard?: (id: string) => string | null;
}>();

const emit = defineEmits<{
  back: [];
  decide: [payload: { id: string; title: string; decision: string }];
}>();

function buildItems(signedIds: string[] | undefined, previous: InboxItem[] = []): InboxItem[] {
  const signed = new Set(signedIds ?? []);
  return INBOX_ITEMS.map((base) => {
    const local = previous.find((entry) => entry.id === base.id);
    const status: InboxItem['status'] =
      signed.has(base.id) || local?.status === 'done' ? 'done' : 'pending';
    return { ...base, status };
  });
}

const items = ref<InboxItem[]>(buildItems(props.signedBillIds));

const sortedItems = computed(() => {
  const visible = props.visibleItemIds
    ? items.value.filter((item) => props.visibleItemIds!.includes(item.id))
    : items.value;
  const pending = visible.filter((item) => item.status === 'pending');
  const done = visible.filter((item) => item.status === 'done');
  return [...pending, ...done];
});

const currentId = ref<string | null>(
  props.highlightBillId ??
    props.highlightBillIds?.find((id) => !props.signedBillIds?.includes(id)) ??
    items.value.find((i) => i.status === 'pending')?.id ??
    null,
);
const decisionPath = ref<DecisionPath>(null);
const remarks = ref('');
const guardNotice = ref('');

const current = computed(() => items.value.find((i) => i.id === currentId.value) ?? null);
const pendingCount = computed(() => items.value.filter((i) => i.status === 'pending').length);

const canSubmit = computed(
  () => current.value?.status === 'pending' && decisionPath.value !== null,
);

watch(
  () => props.signedBillIds?.join('|') ?? '',
  () => {
    items.value = buildItems(props.signedBillIds, items.value);
  },
);

watch(
  () => props.highlightBillId ?? props.highlightBillIds?.[0],
  (id) => {
    if (!id) return;
    if (props.signedBillIds?.includes(id)) {
      currentId.value =
        props.highlightBillIds?.find((entry) => !props.signedBillIds?.includes(entry)) ??
        items.value.find((item) => item.status === 'pending')?.id ??
        null;
      return;
    }
    currentId.value = id;
  },
  { immediate: true },
);

function isHighlighted(itemId: string, status: InboxItem['status']) {
  if (status !== 'pending') return false;
  if (props.highlightBillIds?.length) {
    return props.highlightBillIds.includes(itemId);
  }
  return itemId === props.highlightBillId;
}

watch(currentId, () => {
  decisionPath.value = null;
  remarks.value = '';
  guardNotice.value = '';
});

watch(
  () => pendingCount.value,
  (count) => {
    if (count === 0) currentId.value = null;
    else if (!current.value || current.value.status !== 'pending') {
      currentId.value = items.value.find((i) => i.status === 'pending')?.id ?? null;
    }
  },
);

function submitDecision() {
  if (!current.value || !canSubmit.value || !decisionPath.value) return;

  const guard = props.itemGuard?.(current.value.id);
  if (guard) {
    guardNotice.value = guard;
    return;
  }

  const pathLabel =
    decisionPath.value === 'approve' ? '签署与推进' : '驳回或拒绝';
  const remarksText = remarks.value.trim();
  const decision = remarksText
    ? `${pathLabel}：${remarksText}`
    : pathLabel;

  const id = current.value.id;
  const title = current.value.title;
  current.value.status = 'done';
  decisionPath.value = null;
  remarks.value = '';
  guardNotice.value = '';
  emit('decide', { id, title, decision });
}
</script>

<template>
  <div class="ml-inbox" data-screen-root>
    <img
      class="ml-inbox__base"
      :src="inboxBase"
      alt=""
      draggable="false"
    />

    <header class="ml-inbox__head">
      <GameButton variant="secondary" @click="emit('back')">返回</GameButton>
      <div>
        <p class="ml-inbox__en">EXECUTIVE INBOX</p>
        <h2 class="ml-inbox__title">处理文件</h2>
      </div>
    </header>

    <aside class="ml-inbox__list" aria-label="待处理文件">
      <div class="ml-inbox__list-head">
        <div class="ml-inbox__list-title">
          <h3>待处理文件</h3>
          <span class="ml-inbox__badge">{{ pendingCount }}件</span>
        </div>
        <p class="ml-inbox__list-hint">按紧急程度和截止时间排序</p>
      </div>

      <div class="ml-inbox__list-scroll">
        <button
          v-for="item in sortedItems"
          :key="item.id"
          type="button"
          class="ml-inbox__item"
          :class="{
            'is-active': item.id === currentId,
            'is-done': item.status === 'done',
            'is-highlight': isHighlighted(item.id, item.status),
          }"
          @click="currentId = item.id"
        >
          <span class="ml-inbox__thumb" aria-hidden="true" />
          <span class="ml-inbox__item-body">
            <strong>{{ item.title }}</strong>
            <span class="ml-inbox__meta">
              {{ item.source }} · 截止日期：{{ item.deadline }}
            </span>
          </span>
          <span class="ml-inbox__urgency" :data-tone="item.status === 'done' ? 'done' : item.urgency">
            {{ item.status === 'done' ? '已处理' : item.urgencyLabel }}
          </span>
        </button>
      </div>
    </aside>

    <section class="ml-inbox__paper" aria-label="法案详情">
      <template v-if="current">
        <div class="ml-inbox__panel-top">
          <span class="ml-inbox__review">{{ current.status === 'done' ? '已处理' : '请审阅' }}</span>
          <span class="ml-inbox__confidential">CONFIDENTIAL / PRESIDENT ONLY</span>
        </div>

        <h3 class="ml-inbox__detail-title">{{ current.title }}</h3>

        <div class="ml-inbox__chips">
          <span class="ml-inbox__chip">截止日期：{{ current.deadline }}</span>
          <span class="ml-inbox__chip">来自：{{ current.source }}</span>
        </div>

        <p class="ml-inbox__summary">{{ current.summary }}</p>

        <template v-if="current.status === 'pending'">
          <p v-if="guardNotice" class="ml-inbox__guard">{{ guardNotice }}</p>
          <div class="ml-decision">
            <div class="ml-decision__head">
              <h4>总体决策</h4>
              <p>处理路径将在提交后进入流程。</p>
            </div>
            <div class="ml-decision__options">
              <button
                type="button"
                class="ml-decision__card"
                :class="{ 'is-active': decisionPath === 'approve' }"
                @click="decisionPath = 'approve'"
              >
                <span class="ml-decision__card-title">签署与推进</span>
                <span class="ml-decision__card-desc">批准法案并公开执行</span>
                <span class="ml-decision__chev" aria-hidden="true">⌄</span>
              </button>
              <button
                type="button"
                class="ml-decision__card"
                :class="{ 'is-active': decisionPath === 'reject' }"
                @click="decisionPath = 'reject'"
              >
                <span class="ml-decision__card-title">驳回或拒绝</span>
                <span class="ml-decision__card-desc">退回法案，不予推动</span>
                <span class="ml-decision__chev" aria-hidden="true">⌄</span>
              </button>
            </div>
          </div>

          <label class="ml-remarks-label" for="inbox-remarks">备注 / 指示</label>
          <textarea
            id="inbox-remarks"
            v-model="remarks"
            class="ml-remarks"
            rows="3"
            placeholder="写下一份补充意见；若选择驳回，您可在此填写理由。"
          />

          <div class="ml-inbox__submit">
            <GameButton :disabled="!canSubmit" @click="submitDecision">
              提交决策
            </GameButton>
          </div>
        </template>

        <p v-else class="ml-inbox__done">本案已处理。</p>
      </template>

      <div v-else class="ml-inbox__empty">
        <p>暂无待处理文件</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ml-inbox {
  /* Slot percentages measured from inbox-ui-base.png (2560×1440) */
  --inbox-head-left: 1.8%;
  --inbox-head-top: 1.4%;
  --inbox-head-width: 96%;
  --inbox-head-height: 9%;

  --inbox-list-left: 2.2%;
  --inbox-list-top: 13.2%;
  --inbox-list-width: 30.5%;
  --inbox-list-height: 80%;

  --inbox-paper-left: 37.2%;
  --inbox-paper-top: 21.8%;
  --inbox-paper-width: 58.2%;
  --inbox-paper-height: 56.5%;

  position: absolute;
  inset: 0;
  z-index: 5;
  overflow: hidden;
  color: var(--yp-color-text-main);
}

.ml-inbox__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-inbox__head,
.ml-inbox__list,
.ml-inbox__paper {
  position: absolute;
  z-index: 1;
  box-sizing: border-box;
}

.ml-inbox__head {
  left: var(--inbox-head-left);
  top: var(--inbox-head-top);
  width: var(--inbox-head-width);
  height: var(--inbox-head-height);
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 8px;
}

.ml-inbox__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.2em;
  color: var(--yp-color-gold);
}

.ml-inbox__title {
  margin: 2px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
}

.ml-inbox__list {
  left: var(--inbox-list-left);
  top: var(--inbox-list-top);
  width: var(--inbox-list-width);
  height: var(--inbox-list-height);
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 12px;
  min-height: 0;
}

.ml-inbox__list-head {
  flex-shrink: 0;
  padding: 0 2px 2px;
}

.ml-inbox__list-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ml-inbox__list-title h3 {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.1rem;
}

.ml-inbox__badge {
  padding: 4px 10px;
  border: 1px solid rgba(184, 149, 98, 0.35);
  border-radius: 999px;
  font-family: var(--yp-font-latin);
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: var(--yp-color-gold-bright);
}

.ml-inbox__list-hint {
  margin: 6px 0 0;
  font-size: 0.85rem;
  color: var(--yp-color-text-muted);
}

.ml-inbox__list-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 2px;
}

.ml-inbox__item {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 14px 14px;
  text-align: left;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-radius: 8px;
  background: rgba(12, 14, 16, 0.35);
  color: var(--yp-color-text-main);
  cursor: pointer;
  transition:
    opacity 0.25s ease,
    filter 0.25s ease,
    border-color 0.25s ease,
    background 0.25s ease;
}

.ml-inbox__thumb {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(184, 149, 98, 0.28);
  border-radius: 6px;
  background: rgba(8, 10, 12, 0.45);
}

.ml-inbox__item-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ml-inbox__item-body strong {
  font-family: var(--yp-font-serif);
  font-size: 0.98rem;
}

.ml-inbox__item.is-active {
  border-color: rgba(215, 188, 126, 0.7);
  background: rgba(184, 149, 98, 0.14);
}

.ml-inbox__item.is-done {
  opacity: 0.42;
  filter: grayscale(0.75);
  border-color: rgba(120, 120, 120, 0.28);
  background: rgba(18, 18, 20, 0.4);
  color: rgba(180, 180, 180, 0.85);
}

.ml-inbox__item.is-done.is-active {
  opacity: 0.55;
  border-color: rgba(140, 140, 140, 0.45);
  background: rgba(28, 28, 30, 0.5);
}

.ml-inbox__item.is-done .ml-inbox__item-body strong {
  color: rgba(170, 170, 170, 0.9);
  text-decoration: line-through;
  text-decoration-color: rgba(150, 150, 150, 0.45);
}

.ml-inbox__item.is-done .ml-inbox__meta {
  color: rgba(140, 140, 140, 0.7);
}

.ml-inbox__item.is-done .ml-inbox__thumb {
  border-color: rgba(120, 120, 120, 0.3);
  background: rgba(30, 30, 32, 0.55);
  filter: grayscale(1);
}

.ml-inbox__urgency {
  flex-shrink: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  padding: 4px 8px;
  border-radius: 6px;
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

.ml-inbox__urgency[data-tone='done'] {
  color: rgba(160, 160, 160, 0.85);
  border-color: rgba(120, 120, 120, 0.4);
}

.ml-inbox__meta {
  font-size: 0.82rem;
  color: var(--yp-color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Parchment content — dark ink on light paper */
.ml-inbox__paper {
  left: var(--inbox-paper-left);
  top: var(--inbox-paper-top);
  width: var(--inbox-paper-width);
  height: var(--inbox-paper-height);
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 22px 28px 18px;
  overflow: auto;
  color: #2a241c;
}

.ml-inbox__panel-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.ml-inbox__review {
  padding: 4px 12px;
  border: 1px solid rgba(90, 70, 40, 0.35);
  border-radius: 999px;
  font-family: var(--yp-font-serif);
  font-size: 0.85rem;
  color: #3a3228;
}

.ml-inbox__confidential {
  font-family: var(--yp-font-latin);
  font-size: 0.65rem;
  letter-spacing: 0.14em;
  color: rgba(60, 50, 36, 0.55);
}

.ml-inbox__detail-title {
  margin: 0 0 10px;
  font-family: var(--yp-font-serif);
  font-size: 1.35rem;
  color: #1f1a14;
  flex-shrink: 0;
}

.ml-inbox__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.ml-inbox__chip {
  padding: 5px 10px;
  border: 1px solid rgba(90, 70, 40, 0.28);
  border-radius: 8px;
  font-size: 0.82rem;
  color: rgba(50, 42, 30, 0.75);
  background: rgba(255, 255, 255, 0.28);
}

.ml-inbox__summary {
  margin: 0 0 16px;
  font-size: 1.02rem;
  line-height: 1.65;
  color: rgba(42, 36, 28, 0.88);
  flex-shrink: 0;
}

.ml-decision {
  flex-shrink: 0;
}

.ml-decision__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ml-decision__head h4 {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1rem;
  color: #1f1a14;
}

.ml-decision__head p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(60, 50, 36, 0.6);
}

.ml-decision__options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}

.ml-decision__card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid rgba(90, 70, 40, 0.3);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.35);
  color: #2a241c;
  cursor: pointer;
  position: relative;
}

.ml-decision__card-title {
  font-family: var(--yp-font-serif);
  font-size: 0.98rem;
}

.ml-decision__card-desc {
  font-size: 0.8rem;
  color: rgba(60, 50, 36, 0.65);
  line-height: 1.4;
  padding-right: 18px;
}

.ml-decision__chev {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: rgba(90, 70, 40, 0.55);
}

.ml-decision__card.is-active {
  border-color: rgba(140, 105, 55, 0.75);
  background: rgba(184, 149, 98, 0.22);
  box-shadow: inset 0 0 0 1px rgba(140, 105, 55, 0.25);
}

.ml-remarks-label {
  display: block;
  margin-bottom: 6px;
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  color: #1f1a14;
  flex-shrink: 0;
}

.ml-remarks {
  width: 100%;
  box-sizing: border-box;
  min-height: 72px;
  padding: 10px 12px;
  border: 1px solid rgba(90, 70, 40, 0.28);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.4);
  color: #2a241c;
  font-family: var(--yp-font-sans);
  font-size: 0.98rem;
  line-height: 1.55;
  resize: none;
  flex: 1;
  min-height: 0;
}

.ml-remarks:focus {
  outline: none;
  box-shadow: inset 0 0 0 1px rgba(140, 105, 55, 0.45);
}

.ml-inbox__submit {
  margin-top: 12px;
  flex-shrink: 0;
}

.ml-inbox__item.is-highlight {
  box-shadow: 0 0 0 1px rgba(215, 188, 126, 0.55);
}

.ml-inbox__guard {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(158, 56, 56, 0.12);
  border: 1px solid rgba(158, 56, 56, 0.35);
  color: #7a3028;
  font-size: 0.9rem;
  line-height: 1.5;
}

.ml-inbox__done {
  margin: 16px 0 0;
  color: rgba(110, 80, 40, 0.9);
  font-family: var(--yp-font-serif);
}

.ml-inbox__empty {
  display: grid;
  place-items: center;
  flex: 1;
  color: rgba(60, 50, 36, 0.55);
  font-family: var(--yp-font-serif);
}

@media (max-width: 980px) {
  .ml-decision__options {
    grid-template-columns: 1fr;
  }

  .ml-inbox__meta {
    white-space: normal;
  }
}
</style>
