import { computed, ref } from 'vue';
import type { GameResourceItem } from '@/index';
import { RESOURCES } from './data';
import {
  addDirective,
  buildWeekViewFromCampaign,
  createInitialCampaignState,
  hasOpenPortAgenda,
  hasYachtDraftOrdered,
  hasYachtFileReady,
  isPortEmergencyWeek,
  PORT_EMERGENCY_WEEK,
  resetCampaign,
  settleWeek,
  type SettleWeekInputs,
} from './weekCampaign';
import type {
  AgendaBoard,
  CampaignState,
  DirectiveQuality,
  SettleWeekResult,
  WeekBrief,
  WeekMetricsSnapshot,
  WeekPhase,
} from './weekLoopTypes';

export type WeekOverlayMode = 'auto' | 'review';

export function useWeekLoop() {
  const campaignState = ref<CampaignState>(createInitialCampaignState());
  const weekNumber = computed(() => campaignState.value.weekNumber);
  const phase = ref<WeekPhase>('brief');
  const brief = ref<WeekBrief>(buildWeekViewFromCampaign(campaignState.value).brief);
  const agenda = ref<AgendaBoard>(buildWeekViewFromCampaign(campaignState.value).agenda);
  const metrics = ref<WeekMetricsSnapshot>(campaignState.value.metrics);

  const briefOpen = ref(false);
  const agendaOpen = ref(false);
  const endWeekConfirmOpen = ref(false);
  const overlayMode = ref<WeekOverlayMode>('auto');
  /** W3 结算后先播简报，关简报再进 campaign_end */
  const pendingCampaignEnd = ref(false);
  /** 结束本周转场期间暂存 settleWeek 结果，播完再落地 brief/agenda */
  const pendingSettle = ref<SettleWeekResult | null>(null);

  const isFreePhase = computed(() => phase.value === 'free');
  const isSettling = computed(() => phase.value === 'settling');
  const pendingBrief = computed(() => pendingSettle.value?.brief ?? null);
  const campaignEnded = computed(() => campaignState.value.campaignEnded);
  const directivesThisWeek = computed(() => campaignState.value.directivesThisWeek);
  const portEmergencyWeek = computed(() => isPortEmergencyWeek(campaignState.value));
  const hasPortAgenda = computed(() => hasOpenPortAgenda(campaignState.value));
  const yachtFileReady = computed(() => hasYachtFileReady(campaignState.value));
  const yachtDraftOrdered = computed(() => hasYachtDraftOrdered(campaignState.value));
  const isWeekOne = computed(() => weekNumber.value === 1);
  const portEchoPending = computed(() => !!campaignState.value.flags.portEchoPending);

  const blocksPortIntro = computed(
    () => phase.value === 'brief' || phase.value === 'agenda' || briefOpen.value || agendaOpen.value,
  );

  const hudResources = computed<GameResourceItem[]>(() => {
    const snap = metrics.value.primary;
    const valueById: Record<string, string> = {
      support: snap.support,
      prestige: snap.prestige,
      personal_safety: snap.personalSafety,
      public_order: snap.publicOrder,
      dynasty_wealth: snap.dynastyWealth,
    };
    return RESOURCES.map((item) => ({
      ...item,
      value: valueById[item.id] ?? item.value,
    }));
  });

  const termLabel = computed(() => `第 2 任期 · 第 ${weekNumber.value} 周`);
  const midtermLabel = computed(
    () => `距大选还有 ${agenda.value.electionCountdownWeeks} 周`,
  );

  function syncViewFromCampaign() {
    const view = buildWeekViewFromCampaign(campaignState.value);
    brief.value = view.brief;
    agenda.value = view.agenda;
    metrics.value = campaignState.value.metrics;
  }

  /** 看过议题板后清掉 NEW / dock 角标 */
  function markAgendasSeen() {
    const agendas = campaignState.value.agendas;
    if (!agendas.some((item) => item.status === 'open' && item.isNew)) return;

    campaignState.value = {
      ...campaignState.value,
      agendas: agendas.map((item) =>
        item.status === 'open' && item.isNew ? { ...item, isNew: false } : item,
      ),
    };
    agenda.value = buildWeekViewFromCampaign(campaignState.value).agenda;
  }

  function enterWeek() {
    syncViewFromCampaign();
    overlayMode.value = 'auto';
    phase.value = 'brief';
    briefOpen.value = true;
    agendaOpen.value = false;
    endWeekConfirmOpen.value = false;
  }

  function closeBrief() {
    briefOpen.value = false;
    if (overlayMode.value === 'review') {
      overlayMode.value = 'auto';
      return;
    }

    if (pendingCampaignEnd.value) {
      pendingCampaignEnd.value = false;
      phase.value = 'campaign_end';
      return;
    }

    if (phase.value === 'brief') {
      phase.value = 'agenda';
      agendaOpen.value = true;
      return;
    }

    // 自动流已在议题板阶段、经页签回看简报后关闭 → 回到议题板
    if (phase.value === 'agenda') {
      agendaOpen.value = true;
    }
  }

  function closeAgenda() {
    markAgendasSeen();
    agendaOpen.value = false;
    if (overlayMode.value === 'review') {
      overlayMode.value = 'auto';
      return;
    }

    if (phase.value === 'agenda') {
      phase.value = 'free';
    }
  }

  /** 简报 ↔ 议题板互切（不改变 review/auto；自动流从简报切走时推进到 agenda 阶段） */
  function showBriefPanel() {
    if (agendaOpen.value) markAgendasSeen();
    agendaOpen.value = false;
    briefOpen.value = true;
  }

  function showAgendaPanel() {
    briefOpen.value = false;
    agendaOpen.value = true;
    if (overlayMode.value === 'auto' && phase.value === 'brief') {
      phase.value = 'agenda';
    }
  }

  function openBriefReview() {
    overlayMode.value = 'review';
    agendaOpen.value = false;
    briefOpen.value = true;
  }

  function openAgendaReview() {
    overlayMode.value = 'review';
    briefOpen.value = false;
    agendaOpen.value = true;
  }

  function requestEndWeek() {
    if (phase.value !== 'free') return;
    endWeekConfirmOpen.value = true;
  }

  function cancelEndWeek() {
    endWeekConfirmOpen.value = false;
  }

  function markFormalDirective(
    agendaId: string,
    quality: DirectiveQuality = 'basic',
    label = '正式指令',
  ) {
    campaignState.value = addDirective(campaignState.value, agendaId, quality, label);
    agenda.value = buildWeekViewFromCampaign(campaignState.value).agenda;
  }

  function beginEndWeek(inputs: SettleWeekInputs = {}) {
    if (phase.value !== 'free') return false;

    endWeekConfirmOpen.value = false;
    phase.value = 'settling';

    const result = settleWeek(campaignState.value, inputs);
    campaignState.value = result.state;
    metrics.value = result.metrics;
    pendingSettle.value = result;
    return true;
  }

  function finishEndWeek() {
    const result = pendingSettle.value;
    if (!result || phase.value !== 'settling') return false;

    brief.value = result.brief;
    agenda.value = result.agenda;
    pendingSettle.value = null;

    if (result.campaignEnded) {
      pendingCampaignEnd.value = true;
      phase.value = 'brief';
      briefOpen.value = true;
      agendaOpen.value = false;
      return true;
    }

    pendingCampaignEnd.value = false;
    phase.value = 'brief';
    briefOpen.value = true;
    agendaOpen.value = false;
    return true;
  }

  function confirmEndWeek(inputs: SettleWeekInputs = {}) {
    if (!beginEndWeek(inputs)) return;
    finishEndWeek();
  }

  function restartCampaign() {
    pendingCampaignEnd.value = false;
    campaignState.value = resetCampaign();
    enterWeek();
  }

  return {
    campaignState,
    weekNumber,
    phase,
    brief,
    agenda,
    metrics,
    briefOpen,
    agendaOpen,
    endWeekConfirmOpen,
    overlayMode,
    pendingCampaignEnd,
    pendingSettle,
    pendingBrief,
    isFreePhase,
    isSettling,
    campaignEnded,
    directivesThisWeek,
    portEmergencyWeek,
    hasPortAgenda,
    yachtFileReady,
    yachtDraftOrdered,
    isWeekOne,
    portEchoPending,
    PORT_EMERGENCY_WEEK,
    blocksPortIntro,
    hudResources,
    termLabel,
    midtermLabel,
    enterWeek,
    closeBrief,
    closeAgenda,
    showBriefPanel,
    showAgendaPanel,
    openBriefReview,
    openAgendaReview,
    requestEndWeek,
    cancelEndWeek,
    markFormalDirective,
    beginEndWeek,
    finishEndWeek,
    confirmEndWeek,
    restartCampaign,
    /** @deprecated use requestEndWeek */
    endWeek: requestEndWeek,
  };
}
