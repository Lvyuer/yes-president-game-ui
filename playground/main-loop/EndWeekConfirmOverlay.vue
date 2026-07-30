<script setup lang="ts">
import { computed } from 'vue';
import { GameButton, GamePanel } from '@/index';
import type { DirectiveRecord } from './weekLoopTypes';
import { formatPnl } from './greenhoodMarket';

const props = defineProps<{
  open: boolean;
  directives: DirectiveRecord[];
  openAgendaCount: number;
  hasPortEmergency?: boolean;
  hasPortDirective?: boolean;
  /** W1：尚未向幕僚表态接令 */
  needsYachtDraft?: boolean;
  greenhoodWeekRealizedUsd?: number;
}>();

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

const summary = computed(() => {
  if (props.hasPortEmergency && !props.hasPortDirective) {
    return '本周尚未颁布港口补偿令。港口突发仅此一周——结束本周将按到期重罚结算，无法拖到下周。';
  }
  if (props.needsYachtDraft) {
    return '本周尚未就国会听证令表态接令。结束本周将按「几乎没管」结算调水门（期限−1）。';
  }
  if (props.directives.length === 0) {
    return '本周尚未签署任何正式指令。仍在办的有期限议题将按「几乎没管」结算，公开期限减 1 周。';
  }
  return `本周已记 ${props.directives.length} 条正式推进。未处理的议题将按规则结算。`;
});
</script>

<template>
  <Transition name="ml-week-overlay">
    <div v-if="props.open" class="ml-week-overlay" role="dialog" aria-label="结束本周确认">
      <button type="button" class="ml-week-overlay__backdrop" aria-label="取消" @click="emit('cancel')" />

      <GamePanel class="ml-week-overlay__panel" size="notice" subtitle="END WEEK" title="结束本周？">
        <p class="ml-week-overlay__lead">{{ summary }}</p>

        <ul v-if="props.directives.length" class="ml-week-overlay__list">
          <li v-for="item in props.directives" :key="item.agendaId">
            {{ item.label }}
          </li>
        </ul>

        <p class="ml-week-overlay__hint">
          仍有 {{ props.openAgendaCount }} 件在办议题。点确认后日历前进，正式指令开始执行，结果写进下一周简报。
        </p>

        <p
          v-if="props.greenhoodWeekRealizedUsd && props.greenhoodWeekRealizedUsd !== 0"
          class="ml-week-overlay__market"
        >
          本周 Greenhood 已实现盈亏：{{ formatPnl(props.greenhoodWeekRealizedUsd) }}（将写入家族资产）
        </p>

        <template #footer>
          <div class="ml-week-overlay__actions">
            <GameButton variant="secondary" @click="emit('cancel')">再想想</GameButton>
            <GameButton @click="emit('confirm')">确认结束本周</GameButton>
          </div>
        </template>
      </GamePanel>
    </div>
  </Transition>
</template>

<style scoped>
.ml-week-overlay {
  position: absolute;
  inset: 0;
  z-index: 58;
  display: grid;
  place-items: center;
  padding: calc(16px * var(--yp-hud-scale, 1));
  box-sizing: border-box;
}

.ml-week-overlay__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.62);
  cursor: pointer;
}

.ml-week-overlay__panel {
  position: relative;
  z-index: 1;
  width: min(480px, 92%);
}

.ml-week-overlay__lead {
  margin: 0 0 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--yp-color-text-main);
}

.ml-week-overlay__list {
  margin: 0 0 12px;
  padding-left: 1.1em;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #9fd4a8;
}

.ml-week-overlay__hint {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--yp-color-text-muted);
}

.ml-week-overlay__market {
  margin: 10px 0 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: #9fd4a8;
}

.ml-week-overlay__actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
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
