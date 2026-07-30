<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MainLoopScreen } from '../main-loop/data';
import { NATION_METRICS, type NationMetric } from '../main-loop/data';
import type { SceneBackdropMode } from '../main-loop/sceneVideos';
import type {
  PhoneAppId,
  DeskTodoId,
  AidePhase,
  FelegramContactId,
  FelegramThreadId,
  FelegramThreadSnapshot,
  SettlementPresentation,
} from '../main-loop/casePortStrike';
import MainLoopShell from '../main-loop/MainLoopShell.vue';
import MainHud from '../main-loop/MainHud.vue';
import MainScene from '../main-loop/MainScene.vue';
import MainActions from '../main-loop/MainActions.vue';
import PublishScreen from '../main-loop/PublishScreen.vue';
import InboxScreen from '../main-loop/InboxScreen.vue';
import NationScreen from '../main-loop/NationScreen.vue';
import PhoneOverlay from '../main-loop/PhoneOverlay.vue';
import IosMessagePushStack from '../main-loop/IosMessagePushStack.vue';
import CrisisImpactOverlay from '../main-loop/CrisisImpactOverlay.vue';
import AdvisorBillsNotice from '../main-loop/AdvisorBillsNotice.vue';
import TaskBoard from '../main-loop/TaskBoard.vue';
import SettlementOverlay from '../main-loop/SettlementOverlay.vue';
import WeekBriefOverlay from '../main-loop/WeekBriefOverlay.vue';
import WeekTransitionOverlay from '../main-loop/WeekTransitionOverlay.vue';
import AgendaBoardOverlay from '../main-loop/AgendaBoardOverlay.vue';
import EndWeekConfirmOverlay from '../main-loop/EndWeekConfirmOverlay.vue';
import CampaignEndOverlay from '../main-loop/CampaignEndOverlay.vue';
import SceneAlignDebug from '../main-loop/SceneAlignDebug.vue';
import type { ResourceRollState } from '../main-loop/MainHud.vue';
import { isAdvisorPreviewEnabled, isSceneAlignDebugEnabled, isSettlementPreviewEnabled } from '../main-loop/sceneAlignDebug';
import { DISABLE_PORT_STRIKE_FLOW_LOCKS, usePortStrikeCase } from '../main-loop/usePortStrikeCase';
import {
  AIDE_WEEKLOOP_PORT_ACT,
  AIDE_WEEKLOOP_PORT_ECHO_ACT,
  AIDE_WEEKLOOP_PORT_WITH_HEARING_ACT,
  AIDE_YACHT_WEEK1_ACT,
  FAMILY_GROUP,
  WEEKLOOP_UNION_CONTACT,
  YACHT_SCANDAL_POST_TEXT,
  YACHT_WEEK1_AIDE_NOTICE,
  YACHT_WEEK2_MEDIA_CONTACT,
  YACHT_WEEK1_VANCE_CONTACT,
  YACHT_WEEK3_AIDE_NOTICE,
  felegramUnreadCount,
} from '../main-loop/casePortStrike';
import { useGreenhood } from '../main-loop/useGreenhood';
import { LEAK_PROFIT_THRESHOLD_USD, type GreenhoodSymbolId } from '../main-loop/greenhoodMarket';
import { useFSocialStore } from '../main-loop/useFSocialStore';
import { useWeekLoop } from '../main-loop/useWeekLoop';
import {
  dimScene,
  fadeChrome,
  killScreenTransition,
  playEnter,
  playLeave,
  prepChromeForFadeIn,
} from '../main-loop/screenMotion';
import {
  killWeekMotion,
  playWeekTransition,
  skipWeekTransition,
} from '../main-loop/weekMotion';
import type { NationMetricSnapshot } from '../main-loop/weekLoopTypes';

type SecondaryScreen = Exclude<MainLoopScreen, 'main'>;

const portCase = usePortStrikeCase();
const greenhood = useGreenhood();
const fSocial = useFSocialStore();
const weekLoop = useWeekLoop();
const skipWeekLoop = ref(false);
const weekSignedBillIds = ref<string[]>([]);

/** 周循环处理文件：只收「别人递上来」的被动件（听证令）。港口补偿走发布法案。 */
const WEEK_INBOX_DIRECTIVES: Record<
  string,
  { agendaId: string; quality: 'basic' | 'advance_not_clear'; label: string }
> = {
  'vp-yacht-hearing': {
    agendaId: 'vp-yacht-water',
    quality: 'basic',
    label: '配合听证/切割令',
  },
};

const shellRef = ref<InstanceType<typeof MainLoopShell> | null>(null);
const hudChromeRef = ref<HTMLElement | null>(null);
const dockChromeRef = ref<HTMLElement | null>(null);
const mainSceneRef = ref<InstanceType<typeof MainScene> | null>(null);
const publishScreenRef = ref<InstanceType<typeof PublishScreen> | null>(null);
const inboxScreenRef = ref<InstanceType<typeof InboxScreen> | null>(null);
const nationScreenRef = ref<InstanceType<typeof NationScreen> | null>(null);

const sceneDebug = isSceneAlignDebugEnabled();
const debugBackdrop = computed(() => shellRef.value?.getSceneBackdrop() ?? null);

const screen = ref<MainLoopScreen>('main');
const transitioning = ref(false);
const phoneOpen = ref(false);
const sceneMode = ref<SceneBackdropMode>('idle');
const phoneInputLocked = ref(false);
const initialPhoneApp = ref<PhoneAppId | null>(null);
const initialFelegramThread = ref<FelegramThreadId | null>(null);
const advisorCueVisible = ref(false);
const publishCueVisible = ref(false);
const settlementOpen = ref(false);
const settlementPresentation = ref<SettlementPresentation | null>(null);
const resourceRoll = ref<ResourceRollState | null>(null);
const actionNotice = ref('');
const w1FreePushPrimed = ref(false);
const w3EchoPrimed = ref(false);
const weekTransitionOpen = ref(false);
const weekTransitionRef = ref<InstanceType<typeof WeekTransitionOverlay> | null>(null);

const agendaNewCount = computed(
  () => weekLoop.agenda.value.items.filter((item) => item.isNew).length,
);

let settlementCardTimer: ReturnType<typeof setTimeout> | null = null;
let resourceRollClearTimer: ReturnType<typeof setTimeout> | null = null;

const showDock = computed(() => {
  if (
    screen.value !== 'main' ||
    phoneOpen.value ||
    phoneInputLocked.value ||
    !weekLoop.isFreePhase.value ||
    weekLoop.briefOpen.value ||
    weekLoop.agendaOpen.value
  ) {
    return false;
  }
  if (skipWeekLoop.value) {
    return portCase.introComplete.value;
  }
  if (!weekLoop.portEmergencyWeek.value) {
    return true;
  }
  return portCase.introComplete.value;
});

const showHudSlot = computed(() => screen.value === 'main');

const electionProgress = computed(() => {
  const remaining = weekLoop.agenda.value.electionCountdownWeeks;
  return Math.min(100, Math.max(0, 100 - remaining * 8));
});

const weekTransitionElectionWeeks = computed(
  () =>
    weekLoop.pendingBrief.value?.electionCountdownWeeks ??
    weekLoop.agenda.value.electionCountdownWeeks,
);

watch(
  () => weekLoop.phase.value,
  (phase) => {
    if (skipWeekLoop.value) return;
    if (phase !== 'free') return;

    if (weekLoop.portEmergencyWeek.value && !portCase.introComplete.value) {
      portCase.completeIntro();
      return;
    }

    if (
      weekLoop.isWeekOne.value &&
      !weekLoop.yachtDraftOrdered.value &&
      !w1FreePushPrimed.value
    ) {
      w1FreePushPrimed.value = true;
      portCase.primeYachtWeek1Aide();
      portCase.enqueueMessagePush({
        id: YACHT_WEEK1_AIDE_NOTICE.id,
        title: YACHT_WEEK1_AIDE_NOTICE.title,
        message: YACHT_WEEK1_AIDE_NOTICE.message,
        subline: YACHT_WEEK1_AIDE_NOTICE.subline,
        threadId: 'aide',
        app: YACHT_WEEK1_AIDE_NOTICE.targetApp,
        avatar: { kind: 'contact', contactId: 'aide' },
      });
    }

    // W3 港口回声：复工视频推送与幕僚消息同批入队，对话前就能看到
    if (
      weekLoop.weekNumber.value === 3 &&
      weekLoop.portEchoPending.value &&
      !w3EchoPrimed.value
    ) {
      w3EchoPrimed.value = true;
      portCase.completeIntro();
      portCase.enablePortReopenEcho();
      portCase.primeYachtWeek3Aide(AIDE_WEEKLOOP_PORT_ECHO_ACT);
      // 听证令若上周未签，W3 继续待办（reset 会清掉 unlocked）
      if (weekLoop.yachtFileReady.value) {
        portCase.unlockHearingDeskTodo();
      }
      portCase.enqueueMessagePush({
        id: YACHT_WEEK3_AIDE_NOTICE.id,
        title: YACHT_WEEK3_AIDE_NOTICE.title,
        message: YACHT_WEEK3_AIDE_NOTICE.message,
        subline: YACHT_WEEK3_AIDE_NOTICE.subline,
        threadId: 'aide',
        app: YACHT_WEEK3_AIDE_NOTICE.targetApp,
        avatar: { kind: 'contact', contactId: 'aide' },
      });
    }

    portCase.enqueueUnreadFelegramPushes(felegramHiddenContactIds.value);
  },
);

watch(
  () => weekLoop.weekNumber.value,
  (week) => {
    if (skipWeekLoop.value) return;
    portCase.resetMessagePushThreadFlags();
    if (week === weekLoop.PORT_EMERGENCY_WEEK) {
      portCase.enableCrisisDeskTodos();
      const aideAct = weekLoop.yachtFileReady.value
        ? AIDE_WEEKLOOP_PORT_WITH_HEARING_ACT
        : AIDE_WEEKLOOP_PORT_ACT;
      portCase.primeYachtWeek2Aide(aideAct);
      portCase.primeYachtWeek2Media();
      portCase.enqueueUnreadFelegramPushes(felegramHiddenContactIds.value);
    }
  },
);

const weekLoopInboxIds = computed(() => {
  const ids: string[] = [];
  if (weekLoop.yachtFileReady.value) {
    ids.push('vp-yacht-hearing');
  }
  return ids;
});

/** 周循环：港口补偿是否已在「发布法案」颁布 */
const weekPortPublished = computed(() =>
  weekLoop.directivesThisWeek.value.some(
    (entry) => entry.agendaId === 'port-strike' && entry.quality === 'basic',
  ),
);

function nationMetricsFromSnapshot(snapshot: NationMetricSnapshot): NationMetric[] {
  const values: Record<string, string> = {
    gdp: snapshot.gdp,
    cpi: snapshot.cpi,
    unemployment: snapshot.unemployment,
    culture: snapshot.culture,
    military: snapshot.military,
    diplomacy: snapshot.diplomacy,
  };
  return NATION_METRICS.map((metric) => ({
    ...metric,
    value: values[metric.key] ?? metric.value,
  }));
}

const nationScreenMetrics = computed(() => {
  if (skipWeekLoop.value) {
    return portCase.nationMetrics.value;
  }
  return nationMetricsFromSnapshot(weekLoop.metrics.value.nation);
});

const felegramHiddenContactIds = computed((): FelegramContactId[] => {
  if (skipWeekLoop.value) return [];
  const hidden: FelegramContactId[] = [];
  // W1：无港口，隐藏工会；媒体部戏份在 W2
  if (!weekLoop.hasPortAgenda.value) hidden.push('union');
  if (weekLoop.isWeekOne.value) hidden.push('media');
  return hidden;
});

const felegramOutcomeOverrides = computed((): Partial<Record<FelegramContactId, string>> => {
  if (skipWeekLoop.value) return {};
  return {
    union: '成交：补偿入私人账户 · 工会恢复部分通行 · 去「发布法案」颁布港口补偿令',
  };
});

const felegramContactScriptOverrides = computed(() => {
  if (skipWeekLoop.value) return undefined;
  if (weekLoop.isWeekOne.value) {
    return {
      vance: YACHT_WEEK1_VANCE_CONTACT,
    };
  }
  if (weekLoop.hasPortAgenda.value || weekLoop.portEmergencyWeek.value) {
    return {
      union: WEEKLOOP_UNION_CONTACT,
      media: YACHT_WEEK2_MEDIA_CONTACT,
    };
  }
  return undefined;
});

const weekLoopAideActOverride = computed(() => {
  if (skipWeekLoop.value) return null;
  if (weekLoop.isWeekOne.value) return AIDE_YACHT_WEEK1_ACT;
  if (weekLoop.hasPortAgenda.value || weekLoop.portEmergencyWeek.value) {
    return weekLoop.yachtFileReady.value
      ? AIDE_WEEKLOOP_PORT_WITH_HEARING_ACT
      : AIDE_WEEKLOOP_PORT_ACT;
  }
  if (weekLoop.weekNumber.value === 3 && weekLoop.portEchoPending.value) {
    return AIDE_WEEKLOOP_PORT_ECHO_ACT;
  }
  return null;
});

watch(
  () => [skipWeekLoop.value, weekLoop.weekNumber.value] as const,
  ([skip, week]) => {
    if (skip) return;
    fSocial.setFeedTheme(week === 1 ? 'yacht-week1' : 'port-strike');
  },
  { immediate: true },
);

const greenhoodNarrativeFlags = ref({
  familyBuyEchoed: false,
  familyProfitEchoed: false,
  familyLossEchoed: false,
  fTrendProfitPushed: false,
  familyChipPostedEchoed: false,
});

const fTrendBadgePending = ref(false);
const chipPostDone = ref(false);

const chipPostAvailable = computed(
  () =>
    portCase.familyTechTipRaised.value &&
    greenhood.hasBoughtTechThisWeek.value &&
    !chipPostDone.value,
);

/** W2 调水门表态帖：媒体部上线后一键填写 */
const fAutofillPostText = computed(() => {
  if (skipWeekLoop.value) return undefined;
  if (weekLoop.portEmergencyWeek.value || weekLoop.weekNumber.value === 2) {
    return YACHT_SCANDAL_POST_TEXT;
  }
  return undefined;
});

const familyChipUnread = computed(() => {
  if (skipWeekLoop.value) return false;
  return felegramUnreadCount(portCase.felegramThreads.value.family) > 0;
});

const familyScriptPending = computed(() => {
  if (skipWeekLoop.value) return false;
  const count = portCase.felegramThreads.value.family?.replyCount ?? 0;
  return count < FAMILY_GROUP.beats.length;
});

function resetGreenhoodNarrativeFlags() {
  greenhoodNarrativeFlags.value = {
    familyBuyEchoed: false,
    familyProfitEchoed: false,
    familyLossEchoed: false,
    fTrendProfitPushed: false,
    familyChipPostedEchoed: false,
  };
  fTrendBadgePending.value = false;
  chipPostDone.value = false;
}

const phoneAppBadges = computed(() => ({
  ...portCase.appBadges.value,
  felegram:
    familyChipUnread.value ||
    familyScriptPending.value ||
    (!skipWeekLoop.value &&
      weekLoop.weekNumber.value === 3 &&
      weekLoop.portEchoPending.value &&
      !portCase.aideBriefingCompleted.value)
      ? true
      : portCase.appBadges.value.felegram,
  greenhood:
    greenhood.insiderTipReceived.value && !greenhood.hasTradedThisWeek.value
      ? true
      : undefined,
  f:
    fTrendBadgePending.value || chipPostAvailable.value
      ? true
      : portCase.appBadges.value.f,
}));

const inboxHighlightIds = computed(() => {
  if (!skipWeekLoop.value) {
    const pending = weekLoopInboxIds.value.filter((id) => !weekSignedBillIds.value.includes(id));
    return pending.length > 0 ? pending : undefined;
  }
  if (!portCase.inboxHighlight.value) return undefined;
  return portCase.billIds.filter((id) => !portCase.signedBillIds.value.includes(id));
});

const dockHighlightAction = computed(() => {
  if (skipWeekLoop.value) {
    if (portCase.inboxHighlight.value || advisorCueVisible.value) {
      return 'inbox' as const;
    }
    if (portCase.publishHighlight.value || publishCueVisible.value) {
      return 'publish' as const;
    }
    if (
      portCase.deskTodos.value.some((item) => item.id === 'post-tweet' && !item.done) &&
      portCase.dmCompleted.value &&
      !portCase.tweetPosted.value
    ) {
      return 'phone' as const;
    }
    if (portCase.reopenPhoneHighlight.value && portCase.introComplete.value) {
      return 'phone' as const;
    }
    if (portCase.aidePhoneHighlight.value && portCase.introComplete.value) {
      return 'phone' as const;
    }
    if (portCase.crisisVisible.value && portCase.introComplete.value) {
      return 'phone' as const;
    }
    return undefined;
  }

  // 周循环引导：W1 幕僚 → W2 危机 → 发布法案（港口）/ 处理文件（听证令）→ W3 幕僚复盘 → 复工
  if (weekLoop.isWeekOne.value && !weekLoop.yachtDraftOrdered.value) {
    return 'phone' as const;
  }
  if (
    portCase.crisisVisible.value &&
    portCase.introComplete.value &&
    weekLoop.portEmergencyWeek.value
  ) {
    return 'phone' as const;
  }
  if (
    weekLoop.weekNumber.value === 3 &&
    weekLoop.portEchoPending.value &&
    !portCase.aideBriefingCompleted.value
  ) {
    return 'phone' as const;
  }
  if (portCase.reopenPhoneHighlight.value) {
    return 'phone' as const;
  }
  if (weekLoop.hasPortAgenda.value && !weekPortPublished.value) {
    return 'publish' as const;
  }
  const pendingInbox = weekLoopInboxIds.value.filter(
    (id) => !weekSignedBillIds.value.includes(id),
  );
  if (pendingInbox.length > 0) {
    return 'inbox' as const;
  }
  return undefined;
});

function sceneBackdropEl(): HTMLElement | null {
  const backdrop = shellRef.value?.getSceneBackdrop();
  const el = backdrop?.$el;
  return el instanceof HTMLElement ? el : null;
}

function mainChromeEls(): (HTMLElement | null)[] {
  const sceneEl = mainSceneRef.value?.$el;
  return [
    hudChromeRef.value,
    dockChromeRef.value,
    sceneEl instanceof HTMLElement ? sceneEl : null,
  ];
}

function secondaryRootEl(target: MainLoopScreen = screen.value): HTMLElement | null {
  const comp =
    target === 'publish'
      ? publishScreenRef.value
      : target === 'inbox'
        ? inboxScreenRef.value
        : target === 'nation'
          ? nationScreenRef.value
          : null;
  const el = comp?.$el;
  return el instanceof HTMLElement ? el : null;
}

function showActionNotice(message: string) {
  actionNotice.value = message;
  window.setTimeout(() => {
    if (actionNotice.value === message) {
      actionNotice.value = '';
    }
  }, 3200);
}

async function openSecondary(id: SecondaryScreen) {
  if (transitioning.value) {
    killScreenTransition();
  }
  if (screen.value === id) return;

  if (id === 'inbox') {
    if (skipWeekLoop.value) {
      const reason = portCase.guardReasonForInbox();
      if (reason) {
        showActionNotice(portCase.guardMessage(reason));
        return;
      }
    }
    advisorCueVisible.value = false;
  }

  if (id === 'publish') {
    if (skipWeekLoop.value) {
      const reason = portCase.guardReasonForPublish();
      if (reason) {
        showActionNotice(portCase.guardMessage(reason));
        return;
      }
    }
    publishCueVisible.value = false;
  }

  transitioning.value = true;

  try {
    if (screen.value !== 'main') {
      const leaving = screen.value;
      await playLeave(secondaryRootEl(leaving));
      screen.value = 'main';
      await nextTick();
    }

    await fadeChrome(mainChromeEls(), 0);
    await dimScene(sceneBackdropEl(), true);

    screen.value = id;
    await nextTick();
    await playEnter(secondaryRootEl(id));
  } finally {
    transitioning.value = false;
  }
}

async function goMain() {
  if (screen.value === 'main') return;
  if (transitioning.value) {
    killScreenTransition();
  }

  const leaving = screen.value;
  const shouldResumeAdvisor =
    leaving === 'inbox' &&
    portCase.advisorPhase.value === 'hold' &&
    portCase.billsComplete.value;

  transitioning.value = true;

  try {
    await playLeave(secondaryRootEl(leaving));
    await dimScene(sceneBackdropEl(), false);

    screen.value = 'main';
    await nextTick();

    prepChromeForFadeIn(mainChromeEls());
    await fadeChrome(mainChromeEls(), 1);

    if (leaving === 'publish' && skipWeekLoop.value && portCase.publishHighlight.value) {
      publishCueVisible.value = true;
    }

    if (shouldResumeAdvisor && portCase.startAdvisorLeave()) {
      advisorCueVisible.value = false;
      sceneMode.value = 'advisor-leave';
      phoneInputLocked.value = true;
    }
  } finally {
    transitioning.value = false;
  }
}

function openPhone(app: PhoneAppId | null = null) {
  if (phoneInputLocked.value || transitioning.value) return;
  if (!DISABLE_PORT_STRIKE_FLOW_LOCKS && portCase.advisorActive.value) {
    showActionNotice(portCase.guardMessage('advisor_not_ready'));
    return;
  }

  initialPhoneApp.value = app;
  phoneOpen.value = true;
  sceneMode.value = 'phone-start';
}

function onMessagePushOpen(id: string) {
  const item = portCase.messagePushVisible.value.find((entry) => entry.id === id);
  if (!item) return;
  portCase.dismissMessagePush(id);
  if (item.threadId) {
    initialFelegramThread.value = item.threadId;
  }
  openPhone(item.app);
}

function onMessagePushDismiss(id: string) {
  portCase.dismissMessagePush(id);
}

function onFelegramThreadNavigated() {
  initialFelegramThread.value = null;
}

function onFelegramThreadFocus(threadId: FelegramThreadId | null) {
  portCase.setActiveFelegramThread(threadId);
}

function closePhone() {
  if (skipWeekLoop.value && !DISABLE_PORT_STRIKE_FLOW_LOCKS && !portCase.canClosePhone.value) {
    showActionNotice('先看看 F 热榜，再退出手机。');
    return;
  }
  phoneOpen.value = false;
  initialPhoneApp.value = null;
  initialFelegramThread.value = null;
  portCase.setActiveFelegramThread(null);
  sceneMode.value = 'phone-end';
  phoneInputLocked.value = true;
}

function onCloseBlocked() {
  if (DISABLE_PORT_STRIKE_FLOW_LOCKS) return;
  showActionNotice('先看看 F 热榜，再退出手机。');
}

function clearSettlementTimers() {
  if (settlementCardTimer !== null) {
    window.clearTimeout(settlementCardTimer);
    settlementCardTimer = null;
  }
  if (resourceRollClearTimer !== null) {
    window.clearTimeout(resourceRollClearTimer);
    resourceRollClearTimer = null;
  }
}

/** 先触发顶栏 outro，再卸掉 roll，避免直接跳到终值 */
function beginResourceRollOutroThenClear(delayMs = 0) {
  if (resourceRollClearTimer !== null) {
    window.clearTimeout(resourceRollClearTimer);
    resourceRollClearTimer = null;
  }

  const run = () => {
    const roll = resourceRoll.value;
    if (!roll) return;
    resourceRoll.value = {
      ...roll,
      outroToken: Date.now(),
    };
    resourceRollClearTimer = window.setTimeout(() => {
      resourceRoll.value = null;
      resourceRollClearTimer = null;
    }, roll.outroMs + 80);
  };

  if (delayMs <= 0) {
    run();
    return;
  }
  resourceRollClearTimer = window.setTimeout(() => {
    resourceRollClearTimer = null;
    run();
  }, delayMs);
}

function playSettlementPresentation() {
  const presentation = portCase.prepareSettlement();
  if (!presentation) return;

  settlementPresentation.value = presentation;
  const timing = portCase.settlementTiming;

  clearSettlementTimers();

  const startHudRoll = () => {
    resourceRoll.value = {
      from: presentation.resourceFrom,
      to: presentation.resourceTo,
      token: Date.now(),
      outroToken: 0,
      durationMs: timing.rollDurationMs,
      staggerMs: timing.rollStaggerMs,
      introMs: timing.rollIntroMs,
      outroMs: timing.rollOutroMs,
    };
  };

  // 结算卡弹出时才启动顶栏变化（cardDelayMs=0 则同时出现）
  settlementCardTimer = window.setTimeout(() => {
    settlementOpen.value = true;
    settlementCardTimer = null;
    startHudRoll();
  }, timing.cardDelayMs);
}

function startSettlementPresentation() {
  if (!skipWeekLoop.value) return;
  if (!portCase.canSettle.value) return;
  if (!portCase.markSettlementStarted()) return;
  playSettlementPresentation();
}

function dismissSettlement() {
  settlementOpen.value = false;
  if (!portCase.feedbackDone.value) {
    portCase.commitSettlementFeedback();
  }
  clearSettlementTimers();

  // 点确定后才开始顶栏收尾
  beginResourceRollOutroThenClear(0);
}

function onSceneClipEnded() {
  if (sceneMode.value === 'phone-start') {
    sceneMode.value = 'phone-hold';
    return;
  }

  if (sceneMode.value === 'phone-end') {
    sceneMode.value = 'idle';
    phoneInputLocked.value = false;
    if (portCase.canSettle.value && skipWeekLoop.value) {
      startSettlementPresentation();
      return;
    }
    if (startAdvisorArrival()) {
      return;
    }
    if (skipWeekLoop.value && portCase.publishHighlight.value) {
      publishCueVisible.value = true;
    }
    return;
  }

  if (sceneMode.value === 'publish-end') {
    sceneMode.value = 'idle';
    phoneInputLocked.value = false;
    // 调查案「假数据」叮嘱仅港口案例链路；周循环颁布补偿令不触发
    if (skipWeekLoop.value) {
      portCase.pushAideNotice();
    }
    return;
  }

  if (sceneMode.value === 'advisor-leave') {
    sceneMode.value = 'idle';
    phoneInputLocked.value = false;
    portCase.completeAdvisorLeave();
  }
}

function onSceneClipPaused() {
  if (sceneMode.value !== 'advisor-arrive') return;
  sceneMode.value = 'advisor-hold';
  if (portCase.enterAdvisorHold()) {
    advisorCueVisible.value = true;
    phoneInputLocked.value = false;
  }
}

function onAction(id: 'phone' | 'publish' | 'inbox' | 'nation') {
  if (transitioning.value) return;
  if (!skipWeekLoop.value && !weekLoop.isFreePhase.value) return;

  if (
    skipWeekLoop.value &&
    !DISABLE_PORT_STRIKE_FLOW_LOCKS &&
    id !== 'phone' &&
    portCase.reopenPending.value &&
    !portCase.reopenWatched.value
  ) {
    showActionNotice(portCase.guardMessage('watch_reopen_first'));
    return;
  }

  if (id === 'phone') {
    openPhone();
    return;
  }

  void openSecondary(id);
}

function onCrisisOpen() {
  openPhone(portCase.crisis.targetApp);
}

function onAdvisorCueOpen() {
  void openSecondary('inbox');
}

function onPublishCueOpen() {
  void openSecondary('publish');
}

function startAdvisorArrival(): boolean {
  if (!skipWeekLoop.value) return false;
  if (!portCase.requestAdvisorAfterPhoneClose()) return false;
  if (!portCase.consumePendingAdvisorAfterPhoneEnd()) return false;
  sceneMode.value = 'advisor-arrive';
  phoneInputLocked.value = true;
  return true;
}

function onFtubeWatched() {
  portCase.markFtubeWatched();
}

function onReopenWatched() {
  portCase.markReopenWatched();
}

function onNegotiationComplete() {
  portCase.completeNegotiation();
}

function onAideComplete(phase: AidePhase) {
  if (!skipWeekLoop.value && weekLoop.isWeekOne.value && phase === 'briefing') {
    weekLoop.markFormalDirective(
      'vp-yacht-water',
      'advance_not_clear',
      '已答应接国会听证令',
    );
    portCase.completeAideBriefing({ force: true, act: AIDE_YACHT_WEEK1_ACT });
    greenhood.primeInsider('tech');
    showActionNotice('国会那份听证令下周会送到「处理文件」。芯片窗口可看家族群教学，不耽误正事。');
    return;
  }
  if (phase === 'briefing') {
    const echoWeek =
      !skipWeekLoop.value &&
      weekLoop.weekNumber.value === 3 &&
      weekLoop.portEchoPending.value;

    portCase.completeAideBriefing({
      force: !skipWeekLoop.value && weekLoop.isWeekOne.value,
      act: weekLoopAideActOverride.value ?? undefined,
    });
    if (!skipWeekLoop.value && weekLoop.portEmergencyWeek.value) {
      portCase.unlockUnionTalkTodo();
      if (weekLoop.yachtFileReady.value) {
        portCase.unlockHearingDeskTodo();
        showActionNotice('待办已更新：签署听证令、找工会领袖谈。');
      } else {
        showActionNotice('待办已更新：去找工会领袖谈。');
      }
      return;
    }
    if (echoWeek) {
      showActionNotice('待办已更新：点右上角 FTube 视频推送，看港口复工现场。');
    }
    return;
  }
  portCase.completeAideChat();
}

function onFamilyOpen() {
  if (skipWeekLoop.value) return;
  greenhood.primeInsider('tech');
}

function onFelegramThreadUpdate(payload: {
  threadId: FelegramThreadId;
  snapshot: FelegramThreadSnapshot;
}) {
  portCase.commitFelegramThread(payload.threadId, payload.snapshot);
}

function onInviteFamilyMembers(contactIds: FelegramContactId[]) {
  portCase.inviteFamilyMembers(contactIds);
}

function onGreenhoodBuy(symbolId: GreenhoodSymbolId) {
  const result = greenhood.buy(symbolId);
  if (!result.ok || symbolId !== 'tech') return;
  if (greenhoodNarrativeFlags.value.familyBuyEchoed) return;
  greenhoodNarrativeFlags.value.familyBuyEchoed = true;
  // 买卖成交后再过一会才有群聊反应，避免“一点击就回消息”
  portCase.appendFamilyMessages(
    [
      { senderId: 'aide', text: '@总统 跟了。' },
      { senderId: 'vance', text: '@总统 仓位有了。下一步去 F 放一条「算力松绑」。' },
      { senderId: 'aide', text: '帖子里别提我们买了。' },
      { role: 'system', text: '指引：打开 F → 发布「算力松绑」' },
    ],
    { delayMs: 1600 },
  );
  fTrendBadgePending.value = true;
}

function onGreenhoodSell(symbolId: GreenhoodSymbolId) {
  const result = greenhood.sell(symbolId);
  if (!result.ok || symbolId !== 'tech') return;

  const weekRealized = greenhood.weekRealizedUsd.value;
  if (weekRealized > 0 && !greenhoodNarrativeFlags.value.familyProfitEchoed) {
    greenhoodNarrativeFlags.value.familyProfitEchoed = true;
    portCase.appendFamilyMessages(
      [
        { senderId: 'vance', text: '@总统 成了成了——这一波吃满了。👊🔥' },
        { senderId: 'aide', text: '漂亮。数字看着真舒服。' },
        { senderId: 'vance', text: '哥几个今晚该庆一下。外面一句别提。' },
        { senderId: 'aide', text: '对，高兴归高兴，仓位的事烂在群里。' },
        { role: 'system', text: '本轮窗口已落袋。可继续主线，或结束本周。' },
      ],
      { delayMs: 1800 },
    );
    if (!greenhoodNarrativeFlags.value.fTrendProfitPushed) {
      greenhoodNarrativeFlags.value.fTrendProfitPushed = true;
      fSocial.pushTrend('TECH盘中异动');
      fTrendBadgePending.value = true;
    }
    return;
  }

  if (weekRealized <= 0 && !greenhoodNarrativeFlags.value.familyLossEchoed) {
    greenhoodNarrativeFlags.value.familyLossEchoed = true;
    portCase.appendFamilyMessages([{ senderId: 'aide', text: '先撤。窗口过了。' }], {
      delayMs: 1400,
    });
  }
}

function onChipPost(_content: string) {
  if (chipPostDone.value) return;
  chipPostDone.value = true;
  greenhood.boostFromChipPost();
  fSocial.pushTrend('算力松绑');
  fTrendBadgePending.value = true;
  if (!greenhoodNarrativeFlags.value.familyChipPostedEchoed) {
    greenhoodNarrativeFlags.value.familyChipPostedEchoed = true;
    portCase.appendFamilyMessages(
      [
        { senderId: 'vance', text: '@总统 放了。回 Greenhood 看盘，涨起来就出。' },
        { senderId: 'aide', text: '别贪，回吐前走人。' },
        { role: 'system', text: '指引：回 Greenhood → 刷新行情 → 卖出 TECH' },
      ],
      { delayMs: 1500 },
    );
  }
  showActionNotice('政策放风已发出。TECH 进入强势窗口——回 Greenhood 刷新行情后卖出。');
}

function onGreenhoodRefresh(symbolId: GreenhoodSymbolId) {
  greenhood.refresh(symbolId);
}

function onDeskTodoSelect(id: DeskTodoId) {
  const item = portCase.deskTodos.value.find((entry) => entry.id === id);
  if (!item || item.done) return;

  if (item.action === 'publish') {
    if (phoneOpen.value) {
      phoneOpen.value = false;
      initialPhoneApp.value = null;
      sceneMode.value = 'idle';
      phoneInputLocked.value = false;
    }
    void openSecondary('publish');
    return;
  }

  if (item.action === 'inbox') {
    if (phoneOpen.value) {
      phoneOpen.value = false;
      initialPhoneApp.value = null;
      sceneMode.value = 'idle';
      phoneInputLocked.value = false;
    }
    void openSecondary('inbox');
    return;
  }

  openPhone(item.phoneApp ?? 'f');
}

function onTweetPosted() {
  portCase.postTweet({ bypassDmGate: !skipWeekLoop.value });
}

function onCampaignRestart() {
  weekSignedBillIds.value = [];
  w1FreePushPrimed.value = false;
  w3EchoPrimed.value = false;
  portCase.resetWeekLoopCase();
  portCase.resetFamilyTechNarrative();
  greenhood.resetAll();
  resetGreenhoodNarrativeFlags();
  weekLoop.restartCampaign();
  if (!skipWeekLoop.value) {
    fSocial.setFeedTheme('yacht-week1');
  }
}

async function onConfirmEndWeek() {
  if (!skipWeekLoop.value) {
    const endingPortWeek = weekLoop.portEmergencyWeek.value;
    const from = weekLoop.hudResources.value.map((item) => ({
      id: item.id,
      label: item.label,
      value: String(item.value ?? ''),
      icon: typeof item.icon === 'string' ? item.icon : '',
    }));
    const realized = greenhood.weekRealizedUsd.value;

    transitioning.value = true;
    await fadeChrome([dockChromeRef.value], 0);

    const began = weekLoop.beginEndWeek({
      marketRealizedUsd: realized,
      scandalPostDone: portCase.tweetPosted.value,
    });
    if (!began) {
      transitioning.value = false;
      await fadeChrome([dockChromeRef.value], 1);
      return;
    }

    if (realized > LEAK_PROFIT_THRESHOLD_USD) {
      fSocial.pushTrend('总统家族内幕交易？');
      fTrendBadgePending.value = true;
    }
    greenhood.startNewWeek();
    resetGreenhoodNarrativeFlags();
    publishCueVisible.value = false;

    if (weekLoop.weekNumber.value >= 3 || (endingPortWeek && !weekLoop.hasPortAgenda.value)) {
      portCase.resetWeekLoopCase();
    }

    const to = weekLoop.hudResources.value.map((item) => ({
      id: item.id,
      label: item.label,
      value: String(item.value ?? ''),
      icon: typeof item.icon === 'string' ? item.icon : '',
    }));
    const changed = from.some((item, index) => item.value !== to[index]?.value);
    if (changed) {
      clearSettlementTimers();
      const durationMs = 1400;
      const staggerMs = 180;
      const introMs = 300;
      const outroMs = 800;
      const holdMs = 420;
      resourceRoll.value = {
        from,
        to,
        token: Date.now(),
        outroToken: 0,
        durationMs,
        staggerMs,
        introMs,
        outroMs,
      };
      // 等最后一项滚完并短暂停住，再播回归，避免直接卸掉 CountUp
      const lastStartAt = Math.max(0, from.length - 1) * staggerMs;
      beginResourceRollOutroThenClear(introMs + lastStartAt + durationMs + holdMs);
    }

    weekTransitionOpen.value = true;
    await nextTick();
    const targets =
      weekTransitionRef.value?.getTargets() ?? {
        dim: null,
        calendar: null,
        sheets: [],
      };
    await playWeekTransition(targets);

    weekTransitionOpen.value = false;
    weekLoop.finishEndWeek();
    transitioning.value = false;
    return;
  }
  weekLoop.confirmEndWeek();
}

function onSkipWeekTransition() {
  skipWeekTransition();
}

function onHotSearchSeen() {
  portCase.markHotSearchSeen();
  fTrendBadgePending.value = false;
}

function guardForApp(app: PhoneAppId): string | null {
  if (!skipWeekLoop.value) return null;
  const reason = portCase.guardReasonForApp(app);
  return reason ? portCase.guardMessage(reason) : null;
}

function inboxItemGuard(id: string): string | null {
  if (!skipWeekLoop.value && id in WEEK_INBOX_DIRECTIVES) return null;
  if (!portCase.isBillCaseRelevant(id)) return null;
  const reason = portCase.guardReasonForInbox();
  return reason ? portCase.guardMessage(reason) : null;
}

async function onPublish(_payload: { direction: string; body: string }) {
  if (!skipWeekLoop.value) {
    if (!weekLoop.hasPortAgenda.value) {
      showActionNotice('本周没有可颁布的港口补偿令。');
      await goMain();
      return;
    }
    if (weekPortPublished.value) {
      showActionNotice('港口补偿令本周已颁布。');
      await goMain();
      return;
    }

    weekLoop.markFormalDirective('port-strike', 'basic', '港口临时补偿令');
    portCase.markBillPublishedForDesk();
    await goMain();
    publishCueVisible.value = false;
    sceneMode.value = 'publish-end';
    showActionNotice('港口劳工补偿令已颁布，结束本周后生效。');
    return;
  }

  if (!portCase.publishBill()) {
    const reason = portCase.guardReasonForPublish();
    if (reason) {
      showActionNotice(portCase.guardMessage(reason));
    }
    return;
  }

  await goMain();
  publishCueVisible.value = false;
  sceneMode.value = 'publish-end';
  phoneInputLocked.value = true;
  showActionNotice(portCase.publishSuccessMessage);
}

async function onDecide(payload: { id: string; title: string; decision: string }) {
  const isSign = payload.decision.startsWith('签署');
  const weekDirective = WEEK_INBOX_DIRECTIVES[payload.id];

  if (!skipWeekLoop.value && isSign && weekDirective) {
    weekLoop.markFormalDirective(
      weekDirective.agendaId,
      weekDirective.quality,
      weekDirective.label,
    );
    weekSignedBillIds.value = [...weekSignedBillIds.value, payload.id];
    if (payload.id === 'vp-yacht-hearing') {
      portCase.markHearingDeskDone();
    }
    showActionNotice('已签署，结束本周后生效。');
    await goMain();
    return;
  }

  const isCaseBill = portCase.isBillCaseRelevant(payload.id);

  if (isCaseBill && isSign) {
    portCase.signBill(payload.id);
  }

  // 幕僚定格期间：案例法案签完才关 Inbox
  if (
    isCaseBill &&
    portCase.advisorPhase.value === 'hold' &&
    !portCase.billsComplete.value
  ) {
    return;
  }

  await goMain();
}

onMounted(() => {
  if (isSettlementPreviewEnabled()) {
    skipWeekLoop.value = true;
    phoneInputLocked.value = false;
    portCase.completeIntro();
    portCase.primeSettlementPreview();
    playSettlementPresentation();
    return;
  }

  if (isAdvisorPreviewEnabled()) {
    skipWeekLoop.value = true;
    // 跳过开场/手机，直接测：幕僚呈递 → 定格签字 → 续播退场 → 结算
    portCase.primeAdvisorPreview();
    phoneInputLocked.value = true;
    sceneMode.value = 'advisor-arrive';
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const hashQuery = window.location.hash.includes('?')
    ? window.location.hash.slice(window.location.hash.indexOf('?') + 1)
    : '';
  const hashParams = new URLSearchParams(hashQuery);
  const debugFelegram =
    params.get('felegramDebug') === '1' || hashParams.get('felegramDebug') === '1';

  if (debugFelegram) {
    skipWeekLoop.value = true;
    phoneInputLocked.value = false;
    portCase.completeIntro();
    portCase.markFtubeWatched();
    initialPhoneApp.value = 'felegram';
    phoneOpen.value = true;
    sceneMode.value = 'phone-hold';
    return;
  }

  phoneInputLocked.value = false;
  weekLoop.enterWeek();
});

onBeforeUnmount(() => {
  clearSettlementTimers();
  killScreenTransition();
  killWeekMotion();
});
</script>

<template>
  <MainLoopShell
    ref="shellRef"
    :scene-mode="sceneMode"
    :advisor-pause-at-sec="portCase.advisorTiming.pauseAtSec"
    @scene-clip-ended="onSceneClipEnded"
    @scene-clip-paused="onSceneClipPaused"
  >
    <template v-if="showHudSlot" #hud>
      <div ref="hudChromeRef" class="ml-chrome ml-chrome--fill">
        <MainHud
          :resources="resourceRoll?.from ?? weekLoop.hudResources.value"
          :resource-roll="resourceRoll"
          :term-label="weekLoop.termLabel.value"
          :midterm-label="weekLoop.midtermLabel.value"
          :midterm-progress="electionProgress"
          :feedback-pending="portCase.awaitingFeedback.value"
          :pending-label="portCase.pendingLabel"
          :show-week-controls="!skipWeekLoop && weekLoop.isFreePhase.value"
          @end-week="weekLoop.requestEndWeek()"
        />
      </div>
    </template>

    <MainScene ref="mainSceneRef" v-show="screen === 'main'" class="ml-chrome">
      <AdvisorBillsNotice
        :visible="skipWeekLoop && publishCueVisible"
        :title="portCase.publishCue.title"
        :message="portCase.publishCue.message"
        :subline="portCase.publishCue.subline"
        :cta="portCase.publishCue.cta"
        @open="onPublishCueOpen"
      />
      <AdvisorBillsNotice
        :visible="skipWeekLoop && advisorCueVisible"
        :title="portCase.advisorCue.title"
        :message="portCase.advisorCue.message"
        :subline="portCase.advisorCue.subline"
        :cta="portCase.advisorCue.cta"
        @open="onAdvisorCueOpen"
      />
      <Transition name="ml-action-notice">
        <p v-if="actionNotice" class="ml-action-notice" role="status">{{ actionNotice }}</p>
      </Transition>
    </MainScene>

    <PublishScreen
      v-if="screen === 'publish'"
      ref="publishScreenRef"
      :showcase-direction-id="
        skipWeekLoop || weekLoop.hasPortAgenda.value
          ? portCase.publishDraft.directionId
          : null
      "
      :showcase-body="
        skipWeekLoop || weekLoop.hasPortAgenda.value ? portCase.publishDraft.body : null
      "
      @back="goMain"
      @publish="onPublish"
    />
    <InboxScreen
      v-if="screen === 'inbox'"
      ref="inboxScreenRef"
      :highlight-bill-ids="inboxHighlightIds"
      :signed-bill-ids="skipWeekLoop ? portCase.signedBillIds.value : weekSignedBillIds"
      :visible-item-ids="skipWeekLoop ? undefined : weekLoopInboxIds"
      :item-guard="inboxItemGuard"
      @back="goMain"
      @decide="onDecide"
    />
    <NationScreen
      v-if="screen === 'nation'"
      ref="nationScreenRef"
      :metrics="nationScreenMetrics"
      :feedback-pending="skipWeekLoop && portCase.awaitingFeedback.value"
      @back="goMain"
    />

    <template v-if="showDock" #actions>
      <div ref="dockChromeRef" class="ml-chrome ml-chrome--fill ml-chrome--dock">
        <MainActions
          :highlight-action="dockHighlightAction"
          :show-dossier="!skipWeekLoop && weekLoop.isFreePhase.value"
          :dossier-new-count="agendaNewCount"
          @action="onAction"
          @open-dossier="weekLoop.openBriefReview()"
        />
      </div>
    </template>

    <template #overlays>
      <CrisisImpactOverlay
        :open="
          portCase.crisisVisible.value &&
          portCase.introComplete.value &&
          (skipWeekLoop || (weekLoop.isFreePhase.value && weekLoop.portEmergencyWeek.value)) &&
          !weekLoop.briefOpen.value &&
          !weekLoop.agendaOpen.value
        "
        :title="portCase.crisis.title"
        :message="portCase.crisis.message"
        :subline="portCase.crisis.subline"
        :hints="portCase.crisis.impactHints"
        @open="onCrisisOpen"
        @dismiss="portCase.dismissCrisis()"
      />
      <PhoneOverlay
        :open="phoneOpen"
        :initial-app="initialPhoneApp"
        :app-badges="phoneAppBadges"
        :ftube-episode="portCase.ftubeEpisode.value"
        :ftube-watched="portCase.ftubeWatched.value"
        :reopen-watched="portCase.reopenWatched.value"
        :dm-completed="portCase.dmCompleted.value"
        :aide-unlocked="
          !skipWeekLoop || DISABLE_PORT_STRIKE_FLOW_LOCKS || portCase.aideUnlocked.value
        "
        :aide-briefing-completed="
          !skipWeekLoop ||
          DISABLE_PORT_STRIKE_FLOW_LOCKS ||
          portCase.aideBriefingCompleted.value
        "
        :aide-phase="portCase.aidePhase.value"
        :felegram-threads="portCase.felegramThreads.value"
        :family-group="portCase.familyGroup.value"
        :family-tech-tip-raised="portCase.familyTechTipRaised.value"
        :chip-post-available="chipPostAvailable"
        :chip-posted="chipPostDone"
        :autofill-post-text="fAutofillPostText"
        :initial-felegram-thread="initialFelegramThread"
        :greenhood-store="greenhood"
        :tweet-posted="DISABLE_PORT_STRIKE_FLOW_LOCKS ? false : portCase.tweetPosted.value"
        :can-close="
          !skipWeekLoop || DISABLE_PORT_STRIKE_FLOW_LOCKS || portCase.canClosePhone.value
        "
        :guard-for-app="guardForApp"
        :hidden-contact-ids="felegramHiddenContactIds"
        :contact-outcome-overrides="felegramOutcomeOverrides"
        :aide-act-override="weekLoopAideActOverride"
        :contact-script-overrides="felegramContactScriptOverrides"
        @close="closePhone"
        @close-blocked="onCloseBlocked"
        @ftube-watched="onFtubeWatched"
        @reopen-watched="onReopenWatched"
        @negotiation-complete="onNegotiationComplete"
        @aide-complete="onAideComplete"
        @felegram-thread-update="onFelegramThreadUpdate"
        @invite-family-members="onInviteFamilyMembers"
        @family-open="onFamilyOpen"
        @greenhood-buy="onGreenhoodBuy"
        @greenhood-sell="onGreenhoodSell"
        @greenhood-refresh="onGreenhoodRefresh"
        @tweet-posted="onTweetPosted"
        @chip-post="onChipPost"
        @felegram-thread-focus="onFelegramThreadFocus"
        @felegram-thread-navigated="onFelegramThreadNavigated"
        @hot-search-seen="onHotSearchSeen"
      />
      <!-- 挂在 stage overlays：相对整台舞台右上，压过手机 App -->
      <IosMessagePushStack
        v-if="screen === 'main'"
        :items="portCase.messagePushVisible.value"
        @open="onMessagePushOpen"
        @dismiss="onMessagePushDismiss"
      />
      <TaskBoard
        v-if="screen === 'main'"
        :items="portCase.deskTodos.value"
        @select="onDeskTodoSelect"
      />
      <WeekTransitionOverlay
        v-if="!skipWeekLoop"
        ref="weekTransitionRef"
        :open="weekTransitionOpen"
        :week="weekLoop.weekNumber.value"
        :election-countdown-weeks="weekTransitionElectionWeeks"
        @skip="onSkipWeekTransition"
      />
      <WeekBriefOverlay
        v-if="!skipWeekLoop"
        :open="weekLoop.briefOpen.value"
        :brief="weekLoop.brief.value"
        :review-mode="weekLoop.overlayMode.value === 'review'"
        :finale-mode="weekLoop.pendingCampaignEnd.value"
        @close="weekLoop.closeBrief()"
        @continue="weekLoop.closeBrief()"
        @switch-to-agenda="weekLoop.showAgendaPanel()"
      />
      <AgendaBoardOverlay
        v-if="!skipWeekLoop"
        :open="weekLoop.agendaOpen.value"
        :board="weekLoop.agenda.value"
        :review-mode="weekLoop.overlayMode.value === 'review'"
        @close="weekLoop.closeAgenda()"
        @continue="weekLoop.closeAgenda()"
        @switch-to-brief="weekLoop.showBriefPanel()"
      />
      <EndWeekConfirmOverlay
        v-if="!skipWeekLoop"
        :open="weekLoop.endWeekConfirmOpen.value"
        :directives="weekLoop.directivesThisWeek.value"
        :open-agenda-count="weekLoop.agenda.value.items.length"
        :has-port-emergency="weekLoop.portEmergencyWeek.value"
        :has-port-directive="weekLoop.directivesThisWeek.value.some((d) => d.agendaId === 'port-strike')"
        :needs-yacht-draft="weekLoop.isWeekOne.value && !weekLoop.yachtDraftOrdered.value"
        :greenhood-week-realized-usd="greenhood.weekRealizedUsd.value"
        @confirm="onConfirmEndWeek"
        @cancel="weekLoop.cancelEndWeek()"
      />
      <CampaignEndOverlay
        v-if="!skipWeekLoop"
        :open="weekLoop.phase.value === 'campaign_end'"
        @restart="onCampaignRestart"
      />
      <SettlementOverlay
        :open="settlementOpen"
        :title="settlementPresentation?.title ?? ''"
        :headline="settlementPresentation?.headline ?? ''"
        :summary="settlementPresentation?.summary ?? ''"
        :chips="settlementPresentation?.resourceChips ?? []"
        @dismiss="dismissSettlement"
      />
    </template>
  </MainLoopShell>

  <SceneAlignDebug v-if="sceneDebug" :backdrop="debugBackdrop" />
</template>

<style scoped>
.ml-chrome {
  opacity: 1;
}

.ml-chrome--fill {
  width: 100%;
}

.ml-chrome--dock {
  display: flex;
  justify-content: center;
}

.ml-action-notice {
  position: absolute;
  bottom: 18%;
  left: 50%;
  z-index: 11;
  margin: 0;
  padding: 10px 18px;
  transform: translateX(-50%);
  border: 1px solid rgba(184, 149, 98, 0.35);
  background: rgba(8, 10, 12, 0.88);
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--yp-color-text-muted);
  white-space: nowrap;
  pointer-events: none;
}

.ml-action-notice-enter-active,
.ml-action-notice-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.ml-action-notice-enter-from,
.ml-action-notice-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(8px);
}
</style>
