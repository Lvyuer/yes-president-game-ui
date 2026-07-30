<script setup lang="ts">
import { computed } from 'vue';
import { GameButton, resolveGameIcon } from '@/index';
import type { AgendaBoard } from './weekLoopTypes';
import { parseMetricConsequenceLine } from './metricFormat';
import agendaBase from './assets/agenda-board-ui-base.png';

const props = defineProps<{
  open: boolean;
  board: AgendaBoard;
  reviewMode?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  continue: [];
  switchToBrief: [];
}>();

const title = computed(() => `议题板 · 第 ${props.board.week} 周`);

function isEmergency(item: AgendaBoard['items'][number]) {
  return item.kind === 'emergency' || (item.weeksTotal === 1 && item.weeksRemaining === 1);
}

function deadlineProgress(remaining: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((remaining / total) * 100)));
}

function deadlineLabel(item: AgendaBoard['items'][number]) {
  if (isEmergency(item)) {
    return '本周内';
  }
  if (item.weeksRemaining == null || item.weeksTotal == null) {
    return '无硬性期限';
  }
  return `还剩 ${item.weeksRemaining} / ${item.weeksTotal} 周`;
}

function isUrgentDeadline(item: AgendaBoard['items'][number]) {
  if (isEmergency(item)) return true;
  if (item.weeksRemaining == null) return false;
  return item.weeksRemaining <= 1;
}

function consequenceChips(lines: string[], tone: 'good' | 'bad') {
  return lines.map((line) => {
    const parsed = parseMetricConsequenceLine(line);
    return {
      ...parsed,
      tone,
      iconSrc: resolveGameIcon(parsed.icon),
    };
  });
}

function onPrimary() {
  if (props.reviewMode) {
    emit('close');
    return;
  }
  emit('continue');
}
</script>

<template>
  <Transition name="ml-week-overlay">
    <div v-if="props.open" class="ml-week-overlay" role="dialog" :aria-label="title">
      <button type="button" class="ml-week-overlay__backdrop" aria-label="关闭" @click="emit('close')" />

      <div class="ml-agenda-board">
        <img class="ml-agenda-board__base" :src="agendaBase" alt="" />

        <div class="ml-agenda-board__slot">
          <header class="ml-agenda-board__head">
            <div>
              <p class="ml-agenda-board__en">AGENDA BOARD</p>
              <h2 class="ml-agenda-board__title">{{ title }}</h2>
            </div>
            <div class="ml-agenda-board__head-right">
              <div class="ml-week-doc-tabs" role="tablist" aria-label="文牍切换">
                <button
                  type="button"
                  class="ml-week-doc-tabs__btn"
                  role="tab"
                  aria-selected="false"
                  @click="emit('switchToBrief')"
                >
                  每周简报
                </button>
                <button
                  type="button"
                  class="ml-week-doc-tabs__btn is-active"
                  role="tab"
                  aria-selected="true"
                >
                  议题板
                </button>
              </div>
              <p class="ml-agenda-board__meta">{{ props.board.metaLine }}</p>
            </div>
          </header>

          <div class="ml-agenda-board__body">
            <article
              v-for="item in props.board.items"
              :key="item.id"
              class="ml-agenda-item"
              :class="{ 'is-emergency': isEmergency(item) }"
            >
              <div class="ml-agenda-item__main">
                <h4 class="ml-agenda-item__title">
                  {{ item.title }}
                  <span v-if="item.isNew" class="ml-agenda-item__new">NEW</span>
                  <span v-if="isEmergency(item)" class="ml-agenda-item__emergency">突发事件</span>
                </h4>
                <p class="ml-agenda-item__desc">{{ item.whyOnDesk }}</p>
                <p v-if="item.actionHint" class="ml-agenda-item__action">
                  <span class="ml-agenda-item__action-label">本周建议</span>
                  {{ item.actionHint }}
                </p>
                <p v-if="item.lastWeekResult" class="ml-agenda-item__note">
                  上周结果：{{ item.lastWeekResult }}
                </p>
                <p class="ml-agenda-item__note">
                  <strong>相关方</strong> · {{ item.stakeholders.join('、') }}
                </p>

                <div
                  v-if="item.resolveConsequences?.length || item.expiryConsequences?.length"
                  class="ml-agenda-item__outcomes"
                >
                  <div v-if="item.resolveConsequences?.length" class="ml-agenda-item__outcome">
                    <div class="ml-agenda-item__hint is-good">可能的收益</div>
                    <div class="ml-agenda-item__metric-row">
                      <span
                        v-for="(chip, index) in consequenceChips(item.resolveConsequences, 'good')"
                        :key="`ok-${chip.label}-${index}`"
                        class="ml-agenda-item__metric-chip is-good"
                      >
                        <img
                          v-if="chip.iconSrc"
                          class="ml-agenda-item__metric-icon"
                          :src="chip.iconSrc"
                          alt=""
                        />
                        <span>{{ chip.label }}</span>
                        <span v-if="chip.arrow" class="ml-agenda-item__metric-arrow">{{
                          chip.arrow
                        }}</span>
                      </span>
                    </div>
                  </div>

                  <div v-if="item.expiryConsequences?.length" class="ml-agenda-item__outcome">
                    <div class="ml-agenda-item__hint is-bad">可能的损害</div>
                    <div class="ml-agenda-item__metric-row">
                      <span
                        v-for="(chip, index) in consequenceChips(item.expiryConsequences, 'bad')"
                        :key="`bad-${chip.label}-${index}`"
                        class="ml-agenda-item__metric-chip is-bad"
                      >
                        <img
                          v-if="chip.iconSrc"
                          class="ml-agenda-item__metric-icon"
                          :src="chip.iconSrc"
                          alt=""
                        />
                        <span>{{ chip.label }}</span>
                        <span v-if="chip.arrow" class="ml-agenda-item__metric-arrow">{{
                          chip.arrow
                        }}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="ml-agenda-item__side">
                <div class="ml-agenda-item__field">
                  <span class="ml-agenda-item__label">期限</span>
                  <template v-if="item.weeksRemaining !== null && item.weeksTotal !== null">
                    <div
                      class="ml-agenda-item__val"
                      :class="isUrgentDeadline(item) ? 'is-warn' : ''"
                    >
                      {{ deadlineLabel(item) }}
                    </div>
                    <div
                      class="ml-agenda-item__deadline-bar"
                      :class="{ 'is-urgent': isUrgentDeadline(item) }"
                      role="meter"
                      :aria-valuenow="item.weeksRemaining"
                      :aria-valuemin="0"
                      :aria-valuemax="item.weeksTotal"
                      :aria-label="deadlineLabel(item)"
                    >
                      <span
                        class="ml-agenda-item__deadline-fill"
                        :style="{ width: `${deadlineProgress(item.weeksRemaining, item.weeksTotal)}%` }"
                      />
                    </div>
                  </template>
                  <div v-else class="ml-agenda-item__val is-muted">无硬性期限</div>
                </div>

                <div class="ml-agenda-item__field">
                  <span class="ml-agenda-item__label">本周指令</span>
                  <div
                    class="ml-agenda-item__val"
                    :class="item.formalDirectiveThisWeek || item.thisWeekDirectiveLabel ? 'is-ok' : ''"
                  >
                    {{
                      item.thisWeekDirectiveLabel
                        ?? (item.formalDirectiveThisWeek
                          ? '已签署，结束本周后生效'
                          : '无正式指令')
                    }}
                  </div>
                </div>
              </div>
            </article>
          </div>

          <footer class="ml-agenda-board__footer">
            <GameButton @click="onPrimary">
              {{ props.reviewMode ? '关闭' : '开始本周工作 →' }}
            </GameButton>
          </footer>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ml-week-overlay {
  position: absolute;
  inset: 0;
  z-index: 56;
  display: grid;
  place-items: center;
  padding: calc(16px * var(--yp-hud-scale, 1));
  box-sizing: border-box;
}

.ml-week-overlay__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.68);
  cursor: pointer;
}

.ml-agenda-board {
  --agenda-slot-left: 4.8%;
  --agenda-slot-top: 7.4%;
  --agenda-slot-width: 90.4%;
  --agenda-slot-height: 85%;

  position: relative;
  z-index: 1;
  width: min(1580px, 98vw, calc(min(94vh, 920px) * 3464 / 1721));
  aspect-ratio: 3464 / 1721;
  max-height: min(94vh, 920px);
}

.ml-agenda-board__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

.ml-agenda-board__slot {
  position: absolute;
  left: var(--agenda-slot-left);
  top: var(--agenda-slot-top);
  width: var(--agenda-slot-width);
  height: var(--agenda-slot-height);
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  box-sizing: border-box;
  padding: 6px 10px;
  color: var(--yp-color-text-main);
}

.ml-agenda-board__head {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(184, 149, 98, 0.28);
}

.ml-agenda-board__head-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.ml-week-doc-tabs {
  display: inline-flex;
  padding: 2px;
  border: 1px solid rgba(184, 149, 98, 0.4);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.28);
}

.ml-week-doc-tabs__btn {
  margin: 0;
  padding: 5px 12px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  font-family: var(--yp-font-serif);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  color: var(--yp-color-text-muted);
  cursor: pointer;
}

.ml-week-doc-tabs__btn.is-active {
  background: rgba(184, 149, 98, 0.28);
  color: var(--yp-color-text-main);
  box-shadow: inset 0 0 0 1px rgba(232, 210, 150, 0.35);
}

.ml-week-doc-tabs__btn:not(.is-active):hover {
  color: var(--yp-color-gold-bright);
}

.ml-agenda-board__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  letter-spacing: 0.18em;
  color: var(--yp-color-gold);
}

.ml-agenda-board__title {
  margin: 4px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.55rem;
  font-weight: 700;
  color: var(--yp-color-text-main);
}

.ml-agenda-board__meta {
  margin: 0;
  font-size: 1rem;
  color: var(--yp-color-text-muted);
  text-align: right;
}

.ml-agenda-board__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding-right: 4px;
}

.ml-agenda-board__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding-top: 4px;
}

.ml-agenda-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 168px;
  gap: 14px 20px;
  align-items: start;
  height: fit-content;
  padding: 14px 14px 12px;
  margin: 0 0 10px;
  border: 1px solid rgba(184, 149, 98, 0.22);
  border-left: 3px solid rgba(184, 149, 98, 0.55);
  background: rgba(0, 0, 0, 0.18);
}

.ml-agenda-item:last-of-type {
  margin-bottom: 0;
}

.ml-agenda-item:first-of-type {
  margin-top: 2px;
}

.ml-agenda-item__title {
  margin: 0 0 6px;
  font-family: var(--yp-font-serif);
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--yp-color-text-main);
}

.ml-agenda-item.is-emergency {
  border-left-color: #c45c3e;
  background: rgba(196, 92, 62, 0.1);
}

.ml-agenda-item__emergency {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  background: #8b3a28;
  vertical-align: middle;
}

.ml-agenda-item__new {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #fff;
  background: #c45c3e;
  vertical-align: middle;
}

.ml-agenda-item__desc {
  margin: 0 0 8px;
  font-size: 0.98rem;
  line-height: 1.5;
  color: var(--yp-color-text-main);
}

.ml-agenda-item__action {
  margin: 0 0 10px;
  padding: 8px 10px;
  border-radius: 6px;
  border-left: 3px solid var(--yp-color-gold-bright);
  background: rgba(184, 149, 98, 0.12);
  font-size: 0.94rem;
  line-height: 1.45;
  color: var(--yp-color-gold-bright);
}

.ml-agenda-item__action-label {
  display: inline-block;
  margin-right: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--yp-color-gold);
  vertical-align: middle;
}

.ml-agenda-item__note {
  margin: 0 0 5px;
  font-size: 0.92rem;
  line-height: 1.45;
  color: var(--yp-color-text-muted);
}

.ml-agenda-item__note strong {
  color: var(--yp-color-text-main);
  font-weight: 600;
}

.ml-agenda-item__outcomes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(184, 149, 98, 0.18);
}

.ml-agenda-item__outcome {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ml-agenda-item__metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ml-agenda-item__metric-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px 3px 5px;
  border-radius: 999px;
  border: 1px solid rgba(184, 149, 98, 0.28);
  background: rgba(0, 0, 0, 0.28);
  font-size: 0.82rem;
  line-height: 1.2;
  color: var(--yp-color-text-main);
}

.ml-agenda-item__metric-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
}

.ml-agenda-item__metric-arrow {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.ml-agenda-item__side {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-left: 14px;
  border-left: 1px solid rgba(184, 149, 98, 0.22);
}

.ml-agenda-item__field {
  min-width: 0;
}

.ml-agenda-item__label {
  display: block;
  margin-bottom: 4px;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--yp-color-text-muted);
}

.ml-agenda-item__val {
  font-size: 0.95rem;
  line-height: 1.4;
  color: var(--yp-color-text-main);
}

.ml-agenda-item__val.is-warn {
  color: #ffb08a;
}

.ml-agenda-item__val.is-muted {
  color: var(--yp-color-text-muted);
}

.ml-agenda-item__val.is-ok {
  color: #9fd4a8;
}

.ml-agenda-item__deadline-bar {
  margin-top: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(184, 149, 98, 0.18);
  overflow: hidden;
}

.ml-agenda-item__deadline-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(184, 149, 98, 0.75), rgba(232, 196, 120, 0.95));
}

.ml-agenda-item__deadline-bar.is-urgent .ml-agenda-item__deadline-fill {
  background: linear-gradient(90deg, rgba(196, 92, 62, 0.85), rgba(255, 176, 138, 0.95));
}

.ml-agenda-item__hint {
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}

.ml-agenda-item__hint.is-good {
  color: #9fd4a8;
}

.ml-agenda-item__hint.is-bad {
  color: #ffb08a;
}

.ml-agenda-item__metric-chip.is-good {
  border-color: rgba(159, 212, 168, 0.45);
  color: #9fd4a8;
}

.ml-agenda-item__metric-chip.is-bad {
  border-color: rgba(255, 176, 138, 0.5);
  color: #ffb08a;
}

@media (max-width: 760px) {
  .ml-agenda-item {
    grid-template-columns: 1fr;
  }

  .ml-agenda-board {
    max-height: min(84vh, 640px);
  }

  .ml-agenda-item__side {
    padding-left: 0;
    border-left: 0;
    padding-top: 8px;
    border-top: 1px solid rgba(184, 149, 98, 0.16);
  }

  .ml-agenda-board__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .ml-agenda-board__meta {
    text-align: left;
  }
}

.ml-week-overlay-enter-active,
.ml-week-overlay-leave-active {
  transition: opacity 0.22s ease;
}

.ml-week-overlay-enter-from,
.ml-week-overlay-leave-to {
  opacity: 0;
}
</style>
