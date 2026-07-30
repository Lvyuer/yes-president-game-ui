<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { GameButton, resolveGameIcon } from '@/index';
import type {
  BriefFocusCallout,
  MetricLedgerRow,
  MetricTone,
  SettlementEntry,
  SettlementTone,
  WeekBrief,
  WeekEventEntry,
} from './weekLoopTypes';
import { iconForMetricLabel } from './metricFormat';
import { felegramBriefMarkNames } from './casePortStrike';
import briefBase from './assets/week-brief-ui-base.png';

type BriefPageId = 'settlement' | 'ledger' | 'events';
type TextSegment = { text: string; highlight: boolean; kind?: 'doc' | 'contact' };

const props = defineProps<{
  open: boolean;
  brief: WeekBrief;
  reviewMode?: boolean;
  /** W3 结算后收束：末页 CTA 进本局结束，不进议题板 */
  finaleMode?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  continue: [];
  switchToAgenda: [];
}>();

const pageIndex = ref(0);

const title = computed(() => `每周简报 · 第 ${props.brief.week} 周`);

const settlements = computed(() => props.brief.settlements ?? []);

const focusCallouts = computed(() => props.brief.focusCallouts ?? []);

const eventDetails = computed((): WeekEventEntry[] => {
  if (props.brief.eventDetails?.length) return props.brief.eventDetails;
  return props.brief.thisWeekEvents.map((headline) => ({
    headline,
    paragraphs: [],
  }));
});

const ledgerRows = computed((): MetricLedgerRow[] => {
  if (props.brief.metricLedger?.length) return props.brief.metricLedger;
  const fallback = [
    ...(props.brief.situationChanges ?? []),
    ...(props.brief.nationChanges ?? []),
  ];
  return fallback.map((row) => ({
    ...row,
    deltaText: row.direction === 'flat' ? '持平' : '—',
    tone: (row.direction === 'flat' ? 'neutral' : row.direction === 'up' ? 'good' : 'bad') as MetricTone,
    sources: [],
    unchanged: row.direction === 'flat',
  }));
});

const situationLedger = computed(() =>
  ledgerRows.value.filter((row) =>
    ['民众支持率', '总统威望度', '个人安全值', '治安指数', '家族资产'].includes(row.label),
  ),
);

const nationLedger = computed(() =>
  ledgerRows.value.filter((row) =>
    ['GDP 增速', 'CPI', '失业率', '文化影响', '军事态势', '外交态势'].includes(row.label),
  ),
);

const pages = computed((): { id: BriefPageId; label: string }[] => {
  const list: { id: BriefPageId; label: string }[] = [];
  if (settlements.value.length > 0) {
    list.push({ id: 'settlement', label: '上周结算' });
    list.push({ id: 'ledger', label: '数值变动' });
  }
  list.push({ id: 'events', label: '本周事件' });
  return list;
});

const currentPage = computed(() => pages.value[pageIndex.value] ?? pages.value[0]);

const isFirstPage = computed(() => pageIndex.value <= 0);
const isLastPage = computed(() => pageIndex.value >= pages.value.length - 1);

const settlementSummary = computed(() => {
  const changed = ledgerRows.value.filter((row) => !row.unchanged).length;
  const good = ledgerRows.value.filter((row) => row.tone === 'good' && !row.unchanged).length;
  const bad = ledgerRows.value.filter((row) => row.tone === 'bad' && !row.unchanged).length;
  return { changed, good, bad };
});

watch(
  () => props.open,
  (open) => {
    if (open) pageIndex.value = 0;
  },
);

watch(pages, (next) => {
  if (pageIndex.value >= next.length) {
    pageIndex.value = Math.max(0, next.length - 1);
  }
});

function deltaClass(direction: 'up' | 'down' | 'flat') {
  if (direction === 'up') return 'is-up';
  if (direction === 'down') return 'is-down';
  return 'is-flat';
}

function toneClass(tone: MetricTone | SettlementTone) {
  if (tone === 'good') return 'is-good';
  if (tone === 'bad') return 'is-bad';
  if (tone === 'warn') return 'is-warn';
  return 'is-neutral';
}

function metricIconSrc(label: string) {
  return resolveGameIcon(iconForMetricLabel(label));
}

function kindLabel(kind: BriefFocusCallout['kind']) {
  if (kind === 'document') return '签署';
  if (kind === 'bill') return '法案';
  return '手机';
}

/** 高亮《文件名》与 Felegram 联系人正式名，便于扫读「该找谁」 */
function highlightSegments(text: string): TextSegment[] {
  type Range = { start: number; end: number; kind: 'doc' | 'contact' };
  const ranges: Range[] = [];

  const docRe = /《[^》]+》/g;
  let docMatch: RegExpExecArray | null;
  while ((docMatch = docRe.exec(text)) !== null) {
    ranges.push({
      start: docMatch.index,
      end: docMatch.index + docMatch[0].length,
      kind: 'doc',
    });
  }

  for (const name of felegramBriefMarkNames()) {
    let from = 0;
    while (from < text.length) {
      const index = text.indexOf(name, from);
      if (index < 0) break;
      ranges.push({ start: index, end: index + name.length, kind: 'contact' });
      from = index + name.length;
    }
  }

  ranges.sort((a, b) => a.start - b.start || b.end - b.start - (a.end - a.start));
  const kept: Range[] = [];
  for (const range of ranges) {
    if (kept.some((item) => !(range.end <= item.start || range.start >= item.end))) {
      continue;
    }
    kept.push(range);
  }
  kept.sort((a, b) => a.start - b.start);

  if (kept.length === 0) return [{ text, highlight: false }];

  const segments: TextSegment[] = [];
  let last = 0;
  for (const range of kept) {
    if (range.start > last) {
      segments.push({ text: text.slice(last, range.start), highlight: false });
    }
    segments.push({
      text: text.slice(range.start, range.end),
      highlight: true,
      kind: range.kind,
    });
    last = range.end;
  }
  if (last < text.length) {
    segments.push({ text: text.slice(last), highlight: false });
  }
  return segments;
}

function markClass(seg: TextSegment) {
  if (!seg.highlight) return undefined;
  return seg.kind === 'contact' ? 'ml-brief-mark ml-brief-mark--contact' : 'ml-brief-mark';
}

function goPrev() {
  if (!isFirstPage.value) pageIndex.value -= 1;
}

function goNext() {
  if (!isLastPage.value) pageIndex.value += 1;
}

function onPrimary() {
  if (!isLastPage.value) {
    goNext();
    return;
  }
  if (props.reviewMode) {
    emit('close');
    return;
  }
  emit('continue');
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    goPrev();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    goNext();
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));

function primaryLabel() {
  if (!isLastPage.value) return '下一页 →';
  if (props.reviewMode) return '关闭';
  if (props.finaleMode) return '查看本局收束 →';
  return '查看本周议题板 →';
}

function renderSettlementFallback(): SettlementEntry[] {
  return (props.brief.lastWeekResults ?? []).map((line, index) => ({
    id: `legacy-${index}`,
    title: line.split(' — ')[0] ?? '上周结果',
    verdict: '—',
    tone: 'neutral' as SettlementTone,
    cause: '',
    detail: line,
    changes: [],
  }));
}

const displaySettlements = computed(() =>
  settlements.value.length > 0 ? settlements.value : renderSettlementFallback(),
);
</script>

<template>
  <Transition name="ml-week-overlay">
    <div v-if="props.open" class="ml-week-overlay" role="dialog" :aria-label="title">
      <button type="button" class="ml-week-overlay__backdrop" aria-label="关闭" @click="emit('close')" />

      <div class="ml-brief-board">
        <img class="ml-brief-board__base" :src="briefBase" alt="" />

        <div class="ml-brief-board__slot">
          <header class="ml-brief-board__head">
            <div>
              <p class="ml-brief-board__en">WEEKLY BRIEF</p>
              <h2 class="ml-brief-board__title">{{ title }}</h2>
            </div>
            <div class="ml-brief-board__head-right">
              <div
                v-if="!props.finaleMode"
                class="ml-week-doc-tabs"
                role="tablist"
                aria-label="文牍切换"
              >
                <button
                  type="button"
                  class="ml-week-doc-tabs__btn is-active"
                  role="tab"
                  aria-selected="true"
                >
                  每周简报
                </button>
                <button
                  type="button"
                  class="ml-week-doc-tabs__btn"
                  role="tab"
                  aria-selected="false"
                  @click="emit('switchToAgenda')"
                >
                  议题板
                </button>
              </div>
              <p class="ml-brief-board__meta">
                {{ currentPage?.label }} · 距大选还有 {{ props.brief.electionCountdownWeeks }} 周
              </p>
            </div>
          </header>

          <div class="ml-brief-board__body">
            <!-- Page 1: Settlement -->
            <section v-if="currentPage?.id === 'settlement'" class="ml-brief-page">
              <h3 class="ml-week-block__title">上周结算</h3>

              <ul class="ml-settlement-list">
                <li
                  v-for="entry in displaySettlements"
                  :key="entry.id"
                  class="ml-settlement-card"
                >
                  <div class="ml-settlement-card__head">
                    <h4 class="ml-settlement-card__title">{{ entry.title }}</h4>
                    <span
                      v-if="entry.verdict !== '—'"
                      class="ml-settlement-card__badge"
                      :class="toneClass(entry.tone)"
                    >
                      {{ entry.verdict }}
                    </span>
                  </div>
                  <p v-if="entry.cause" class="ml-settlement-card__cause">
                    <template v-for="(seg, segIndex) in highlightSegments(entry.cause)" :key="segIndex">
                      <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                      <template v-else>{{ seg.text }}</template>
                    </template>
                  </p>
                  <p class="ml-settlement-card__detail">
                    <template v-for="(seg, segIndex) in highlightSegments(entry.detail)" :key="segIndex">
                      <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                      <template v-else>{{ seg.text }}</template>
                    </template>
                  </p>

                  <ul v-if="entry.changes.length" class="ml-settlement-card__changes">
                    <li
                      v-for="change in entry.changes"
                      :key="`${entry.id}-${change.label}`"
                      :class="toneClass(change.tone)"
                    >
                      <span class="ml-settlement-card__metric">
                        <img
                          v-if="metricIconSrc(change.label)"
                          class="ml-brief-metric-icon"
                          :src="metricIconSrc(change.label)"
                          alt=""
                        />
                        <span>{{ change.label }}</span>
                      </span>
                      <span>
                        {{ change.from }} → {{ change.to }}
                        <em v-if="change.deltaText">（{{ change.deltaText }}）</em>
                      </span>
                    </li>
                  </ul>

                  <p v-if="entry.unchangedNote" class="ml-settlement-card__unchanged">
                    {{ entry.unchangedNote }}
                  </p>
                </li>
              </ul>

              <p v-if="settlementSummary.changed > 0" class="ml-brief-page__summary">
                上周共 {{ settlementSummary.changed }} 项指标变动
                <template v-if="settlementSummary.good > 0">，{{ settlementSummary.good }} 项向好</template>
                <template v-if="settlementSummary.bad > 0">，{{ settlementSummary.bad }} 项承压</template>
                。
              </p>
            </section>

            <!-- Page 2: Ledger -->
            <section v-else-if="currentPage?.id === 'ledger'" class="ml-brief-page">
              <h3 class="ml-week-block__title">数值变动总表</h3>

              <div class="ml-week-metrics-grid">
                <section class="ml-week-block">
                  <h4 class="ml-week-block__subtitle">局势</h4>
                  <ul class="ml-week-metrics ml-week-metrics--ledger">
                    <li
                      v-for="item in situationLedger"
                      :key="item.label"
                      :class="{ 'is-unchanged': item.unchanged }"
                    >
                      <div class="ml-week-metrics__row">
                        <span class="ml-week-metrics__name">
                          <img
                            v-if="metricIconSrc(item.label)"
                            class="ml-brief-metric-icon"
                            :src="metricIconSrc(item.label)"
                            alt=""
                          />
                          <span>{{ item.label }}</span>
                        </span>
                        <span class="ml-week-metrics__delta" :class="deltaClass(item.direction)">
                          {{ item.from }} → {{ item.to }}
                          <em v-if="item.deltaText">（{{ item.deltaText }}）</em>
                        </span>
                      </div>
                      <p v-if="item.sources.length" class="ml-week-metrics__sources">
                        来源：{{ item.sources.join('、') }}
                      </p>
                      <p v-else-if="item.unchanged" class="ml-week-metrics__sources">上周持平</p>
                    </li>
                  </ul>
                </section>

                <section class="ml-week-block">
                  <h4 class="ml-week-block__subtitle">国家数据</h4>
                  <ul class="ml-week-metrics ml-week-metrics--ledger">
                    <li
                      v-for="item in nationLedger"
                      :key="item.label"
                      :class="{ 'is-unchanged': item.unchanged }"
                    >
                      <div class="ml-week-metrics__row">
                        <span class="ml-week-metrics__name">
                          <img
                            v-if="metricIconSrc(item.label)"
                            class="ml-brief-metric-icon"
                            :src="metricIconSrc(item.label)"
                            alt=""
                          />
                          <span>{{ item.label }}</span>
                        </span>
                        <span class="ml-week-metrics__delta" :class="deltaClass(item.direction)">
                          {{ item.from }} → {{ item.to }}
                          <em v-if="item.deltaText">（{{ item.deltaText }}）</em>
                        </span>
                      </div>
                      <p v-if="item.sources.length" class="ml-week-metrics__sources">
                        来源：{{ item.sources.join('、') }}
                      </p>
                      <p v-else-if="item.unchanged" class="ml-week-metrics__sources">上周持平</p>
                    </li>
                  </ul>
                </section>
              </div>
            </section>

            <!-- Page 3: Events -->
            <section v-else class="ml-brief-page">
              <h3 class="ml-week-block__title">本周发生了什么</h3>

              <ol class="ml-event-list">
                <li
                  v-for="(event, index) in eventDetails"
                  :key="index"
                  class="ml-event-card"
                  :class="{ 'is-emergency': event.kind === 'emergency' }"
                >
                  <span class="ml-event-card__index" aria-hidden="true">
                    {{ String(index + 1).padStart(2, '0') }}
                  </span>
                  <div class="ml-event-card__body">
                    <div class="ml-event-card__topline">
                      <span
                        v-if="event.kind === 'emergency'"
                        class="ml-event-card__tag"
                      >突发事件</span>
                      <p class="ml-event-card__headline">{{ event.headline }}</p>
                    </div>
                    <p
                      v-if="event.kind === 'emergency'"
                      class="ml-event-card__urgency"
                    >
                      本周突然砸上桌，拖过本周就来不及了
                    </p>
                    <p
                      v-for="(para, paraIndex) in event.paragraphs"
                      :key="paraIndex"
                      class="ml-event-card__detail"
                    >
                      <template v-for="(seg, segIndex) in highlightSegments(para)" :key="segIndex">
                        <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                        <template v-else>{{ seg.text }}</template>
                      </template>
                    </p>
                  </div>
                </li>
              </ol>

              <aside class="ml-brief-reminder">
                <span class="ml-brief-reminder__label">选举提醒</span>
                <p class="ml-brief-reminder__text">
                  <template
                    v-for="(seg, segIndex) in highlightSegments(props.brief.electionReminder)"
                    :key="segIndex"
                  >
                    <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                    <template v-else>{{ seg.text }}</template>
                  </template>
                </p>
              </aside>

              <aside v-if="focusCallouts.length" class="ml-brief-focus" aria-label="本周重点总结">
                <div class="ml-brief-focus__head">
                  <span class="ml-brief-focus__eyebrow">本周重点总结</span>
                  <span class="ml-brief-focus__hint">事情 · 操作 · 后果</span>
                </div>
                <ul class="ml-brief-focus__list">
                  <li
                    v-for="item in focusCallouts"
                    :key="item.id"
                    class="ml-brief-focus__item"
                    :class="`is-${item.kind}`"
                  >
                    <div class="ml-brief-focus__topline">
                      <span class="ml-brief-focus__kind">{{ kindLabel(item.kind) }}</span>
                      <strong class="ml-brief-focus__label">{{ item.label }}</strong>
                    </div>
                    <dl class="ml-brief-focus__meta">
                      <div>
                        <dt>事情</dt>
                        <dd>
                          <template
                            v-for="(seg, segIndex) in highlightSegments(item.summary)"
                            :key="segIndex"
                          >
                            <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                            <template v-else>{{ seg.text }}</template>
                          </template>
                        </dd>
                      </div>
                      <div>
                        <dt>操作</dt>
                        <dd>
                          <template
                            v-for="(seg, segIndex) in highlightSegments(item.action)"
                            :key="segIndex"
                          >
                            <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                            <template v-else>{{ seg.text }}</template>
                          </template>
                        </dd>
                      </div>
                      <div>
                        <dt>后果</dt>
                        <dd>
                          <template
                            v-for="(seg, segIndex) in highlightSegments(item.consequence)"
                            :key="segIndex"
                          >
                            <mark v-if="seg.highlight" :class="markClass(seg)">{{ seg.text }}</mark>
                            <template v-else>{{ seg.text }}</template>
                          </template>
                        </dd>
                      </div>
                    </dl>
                  </li>
                </ul>
              </aside>
            </section>
          </div>

          <footer class="ml-brief-board__footer">
            <div class="ml-brief-board__pager">
              <span class="ml-brief-board__pager-text">
                {{ pageIndex + 1 }} / {{ pages.length }}
              </span>
              <div class="ml-brief-board__dots" aria-hidden="true">
                <span
                  v-for="(page, index) in pages"
                  :key="page.id"
                  class="ml-brief-board__dot"
                  :class="{ 'is-active': index === pageIndex }"
                />
              </div>
            </div>

            <div class="ml-brief-board__nav">
              <GameButton v-if="!isFirstPage" variant="secondary" @click="goPrev">上一页</GameButton>
              <GameButton @click="onPrimary">{{ primaryLabel() }}</GameButton>
            </div>
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
  z-index: 55;
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

.ml-brief-board {
  --brief-slot-left: 5.4%;
  --brief-slot-top: 7.8%;
  --brief-slot-width: 89.2%;
  --brief-slot-height: 84.4%;

  position: relative;
  z-index: 1;
  width: min(1580px, 98vw, calc(min(94vh, 920px) * 3201 / 1668));
  aspect-ratio: 3201 / 1668;
  max-height: min(94vh, 920px);
}

.ml-brief-board__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
}

.ml-brief-board__slot {
  position: absolute;
  left: var(--brief-slot-left);
  top: var(--brief-slot-top);
  width: var(--brief-slot-width);
  height: var(--brief-slot-height);
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  box-sizing: border-box;
  padding: 10px 14px;
  color: var(--yp-color-text-main);
}

.ml-brief-board__head {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(184, 149, 98, 0.28);
}

.ml-brief-board__head-right {
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

.ml-brief-board__en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.95rem;
  letter-spacing: 0.18em;
  color: var(--yp-color-gold);
}

.ml-brief-board__title {
  margin: 4px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.85rem;
  font-weight: 700;
  color: var(--yp-color-text-main);
}

.ml-brief-board__meta {
  margin: 0;
  font-size: 1.12rem;
  color: var(--yp-color-text-muted);
  white-space: nowrap;
}

.ml-brief-board__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-right: 8px;
}

.ml-brief-board__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding-top: 6px;
}

.ml-brief-board__pager {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ml-brief-board__pager-text {
  font-size: 1rem;
  color: var(--yp-color-text-muted);
}

.ml-brief-board__dots {
  display: flex;
  gap: 6px;
}

.ml-brief-board__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: rgba(184, 149, 98, 0.35);
}

.ml-brief-board__dot.is-active {
  background: var(--yp-color-gold-bright);
}

.ml-brief-board__nav {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

.ml-brief-page__intro {
  margin: 0 0 14px;
  font-size: 1.05rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-brief-page__summary {
  margin: 14px 0 0;
  padding: 12px 14px;
  border-radius: 6px;
  background: rgba(184, 149, 98, 0.12);
  font-size: 1.08rem;
  line-height: 1.5;
  color: var(--yp-color-text-main);
}

.ml-week-block {
  margin: 0;
}

.ml-week-block__title {
  margin: 0 0 16px;
  font-family: var(--yp-font-serif);
  font-size: 1.22rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--yp-color-gold-bright);
}

.ml-week-block__subtitle {
  margin: 0 0 10px;
  font-family: var(--yp-font-serif);
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--yp-color-gold);
}

.ml-week-block__text {
  margin: 0;
  font-size: 1.12rem;
  line-height: 1.65;
  color: var(--yp-color-text-main);
}

.ml-brief-reminder {
  margin-top: 14px;
  padding: 14px 16px;
  border-top: 1px solid rgba(184, 149, 98, 0.28);
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px 16px;
  align-items: baseline;
}

.ml-brief-reminder__label {
  font-family: var(--yp-font-serif);
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--yp-color-gold);
  white-space: nowrap;
}

.ml-brief-reminder__text {
  margin: 0;
  font-size: 1.08rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-brief-focus {
  margin: 16px 0 0;
  padding: 14px 16px;
  border-radius: 8px;
  border: 1px solid rgba(232, 200, 120, 0.35);
  background: linear-gradient(180deg, rgba(184, 149, 98, 0.16), rgba(0, 0, 0, 0.18));
}

.ml-brief-focus__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 12px;
}

.ml-brief-focus__eyebrow {
  font-family: var(--yp-font-serif);
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--yp-color-gold-bright);
}

.ml-brief-focus__hint {
  font-size: 0.9rem;
  color: var(--yp-color-text-muted);
}

.ml-brief-focus__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ml-brief-focus__item {
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid var(--yp-color-gold-bright);
  background: rgba(0, 0, 0, 0.22);
}

.ml-brief-focus__item.is-channel {
  border-left-color: rgba(184, 149, 98, 0.55);
}

.ml-brief-focus__topline {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 10px;
  margin-bottom: 8px;
}

.ml-brief-focus__kind {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #1a140c;
  background: var(--yp-color-gold-bright);
}

.ml-brief-focus__label {
  font-family: var(--yp-font-serif);
  font-size: 1.12rem;
  font-weight: 700;
  color: var(--yp-color-text-main);
}

.ml-brief-focus__meta {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ml-brief-focus__meta > div {
  display: grid;
  grid-template-columns: 2.8em minmax(0, 1fr);
  gap: 8px 10px;
  align-items: start;
}

.ml-brief-focus__meta dt {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--yp-color-gold);
  padding-top: 0.15em;
}

.ml-brief-focus__meta dd {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.55;
  color: var(--yp-color-text-muted);
}

.ml-brief-mark {
  display: inline;
  padding: 0 0.15em;
  margin: 0;
  border-radius: 2px;
  background: rgba(232, 200, 120, 0.22);
  color: var(--yp-color-gold-bright);
  font-weight: 700;
  font-style: normal;
}

.ml-brief-mark--contact {
  background: rgba(120, 176, 220, 0.24);
  color: #c8e4f8;
  box-shadow: inset 0 -1px 0 rgba(150, 200, 235, 0.55);
}

.ml-settlement-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ml-settlement-card {
  padding: 12px 14px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.22);
  border: 1px solid rgba(184, 149, 98, 0.22);
}

.ml-settlement-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.ml-settlement-card__title {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.15rem;
  font-weight: 700;
}

.ml-settlement-card__badge {
  flex-shrink: 0;
  padding: 3px 11px;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.ml-settlement-card__badge.is-good,
.is-good {
  color: #9fd4a8;
}

.ml-settlement-card__badge.is-bad,
.is-bad {
  color: #ffb08a;
}

.ml-settlement-card__badge.is-warn,
.is-warn {
  color: #e8c878;
}

.ml-settlement-card__badge.is-neutral,
.is-neutral {
  color: var(--yp-color-text-muted);
}

.ml-settlement-card__cause {
  margin: 0 0 6px;
  font-size: 1.05rem;
  color: var(--yp-color-gold);
}

.ml-settlement-card__detail {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.6;
}

.ml-settlement-card__changes {
  margin: 12px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 1.02rem;
}

.ml-settlement-card__changes li {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  align-items: center;
}

.ml-settlement-card__metric {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ml-brief-metric-icon {
  width: 18px;
  height: 18px;
  object-fit: contain;
  flex: 0 0 auto;
}

.ml-settlement-card__changes em {
  font-style: normal;
  opacity: 0.85;
}

.ml-settlement-card__unchanged {
  margin: 12px 0 0;
  padding: 10px 12px;
  border-radius: 6px;
  background: rgba(159, 212, 168, 0.1);
  border-left: 3px solid #9fd4a8;
  font-size: 1.02rem;
  line-height: 1.5;
  color: #c8e8cc;
}

.ml-event-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.ml-event-card {
  display: grid;
  grid-template-columns: 2.6rem minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 18px 0;
  border-bottom: 1px solid rgba(184, 149, 98, 0.18);
}

.ml-event-card.is-emergency {
  margin: 4px -14px 8px;
  padding: 16px 14px;
  border: 1px solid rgba(168, 72, 56, 0.42);
  border-radius: 10px;
  background: linear-gradient(
    180deg,
    rgba(72, 18, 14, 0.28) 0%,
    rgba(24, 12, 10, 0.12) 100%
  );
  box-shadow: inset 0 0 0 1px rgba(240, 160, 120, 0.06);
}

.ml-event-card.is-emergency + .ml-event-card {
  border-top: 0;
}

.ml-event-card:first-child {
  padding-top: 2px;
}

.ml-event-card.is-emergency:first-child {
  padding-top: 16px;
}

.ml-event-card:last-child {
  border-bottom: 0;
}

.ml-event-card.is-emergency:last-child {
  border-bottom: 1px solid rgba(168, 72, 56, 0.42);
}

.ml-event-card__index {
  font-family: var(--yp-font-latin);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  color: var(--yp-color-gold);
  padding-top: 0.25em;
}

.ml-event-card.is-emergency .ml-event-card__index {
  color: #f0a090;
  padding-top: 0.55em;
}

.ml-event-card__topline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 12px;
  margin-bottom: 8px;
}

.ml-event-card__tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  border: 1px solid rgba(232, 120, 96, 0.55);
  background: rgba(140, 36, 28, 0.45);
  font-family: var(--yp-font-serif);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffc8b4;
  line-height: 1.2;
}

.ml-event-card__headline {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.28rem;
  font-weight: 700;
  line-height: 1.4;
  color: var(--yp-color-text-main);
}

.ml-event-card.is-emergency .ml-event-card__headline {
  color: #ffe8dc;
}

.ml-event-card__urgency {
  margin: 0 0 12px;
  font-size: 0.88rem;
  line-height: 1.45;
  letter-spacing: 0.04em;
  color: #f0a890;
}

.ml-event-card__detail {
  margin: 0 0 10px;
  font-size: 1.08rem;
  line-height: 1.7;
  color: var(--yp-color-text-muted);
}

.ml-event-card__detail:last-child {
  margin-bottom: 0;
}

.ml-brief-page {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.ml-week-metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px 28px;
}

.ml-week-metrics {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ml-week-metrics--ledger li {
  padding: 6px 0;
  border-bottom: 1px solid rgba(184, 149, 98, 0.12);
}

.ml-week-metrics--ledger li.is-unchanged {
  opacity: 0.72;
}

.ml-week-metrics__row {
  display: flex;
  justify-content: flex-start;
  gap: 20px;
  font-size: 1.08rem;
}

.ml-week-metrics__name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: var(--yp-color-text-muted);
}

.ml-week-metrics__delta.is-up {
  color: #9fd4a8;
}

.ml-week-metrics__delta.is-down {
  color: #ffb08a;
}

.ml-week-metrics__delta.is-flat {
  color: var(--yp-color-text-main);
}

.ml-week-metrics__delta em {
  font-style: normal;
  opacity: 0.85;
}

.ml-week-metrics__sources {
  margin: 4px 0 0;
  font-size: 0.95rem;
  color: var(--yp-color-text-muted);
}

@media (max-width: 720px) {
  .ml-week-metrics-grid {
    grid-template-columns: 1fr;
  }

  .ml-brief-board {
    max-height: min(84vh, 640px);
  }

  .ml-brief-board__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .ml-brief-board__meta {
    white-space: normal;
  }

  .ml-brief-board__footer {
    flex-direction: column;
    align-items: stretch;
  }

  .ml-brief-board__nav {
    width: 100%;
    justify-content: flex-end;
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
