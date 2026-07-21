import { computed, ref, shallowRef } from 'vue';
import {
  applyNationDeltas,
  applyResourceDeltas,
  buildFeedbackBody,
  buildSettlementPresentation,
  cloneInitialNationMetrics,
  cloneInitialResources,
  PORT_STRIKE_ADVISOR,
  PORT_STRIKE_BILL_IDS,
  PORT_STRIKE_CRISIS,
  PORT_STRIKE_FEEDBACK,
  PORT_STRIKE_INTRO,
  SETTLEMENT_PRESENTATION,
  type NationMetricSnapshot,
  type PhoneAppId,
  type ResourceSnapshot,
  type SettlementPresentation,
} from './casePortStrike';
import { playCrisisNoticeSound } from './playCrisisNoticeSound';

export type PortStrikeGuardReason =
  | 'intro_playing'
  | 'watch_ftube_first'
  | 'negotiate_first'
  | 'finish_phone_tasks'
  | 'advisor_not_ready'
  | 'case_complete'
  | null;

export type AdvisorPhase = 'none' | 'arriving' | 'hold' | 'leaving';

export type PortStrikeCase = ReturnType<typeof usePortStrikeCase>;

export function usePortStrikeCase() {
  const crisisVisible = ref(false);
  const crisisDelivered = ref(false);
  const ftubeWatched = ref(false);
  const dmCompleted = ref(false);
  const tweetPosted = ref(false);
  const hotSearchSeen = ref(false);
  const signedBillIds = ref<string[]>([]);
  const advisorPhase = ref<AdvisorPhase>('none');
  const pendingAdvisorAfterPhoneEnd = ref(false);
  const introComplete = ref(false);
  const feedbackDone = ref(false);

  const resources = shallowRef<ResourceSnapshot[]>(cloneInitialResources());
  const nationMetrics = shallowRef<NationMetricSnapshot[]>(cloneInitialNationMetrics());

  const phoneStageComplete = computed(() => dmCompleted.value && tweetPosted.value);
  /** Close allowed unless a tweet was posted without viewing trending. */
  const canClosePhone = computed(() => !tweetPosted.value || hotSearchSeen.value);
  const billsComplete = computed(() =>
    PORT_STRIKE_BILL_IDS.every((id) => signedBillIds.value.includes(id)),
  );
  const advisorActive = computed(() => advisorPhase.value !== 'none');
  const caseActive = computed(() => !feedbackDone.value);
  const awaitingFeedback = computed(() => advisorPhase.value === 'leaving');

  const appBadges = computed<Partial<Record<PhoneAppId, boolean>>>(() => ({
    ftube: crisisDelivered.value && !ftubeWatched.value,
    felegram: ftubeWatched.value && !dmCompleted.value,
    f: dmCompleted.value && !tweetPosted.value,
  }));

  const inboxHighlight = computed(
    () => advisorPhase.value === 'hold' && !billsComplete.value && !feedbackDone.value,
  );


  function pushCrisisNotice() {
    if (crisisDelivered.value || ftubeWatched.value) return;
    crisisDelivered.value = true;
    crisisVisible.value = true;
    playCrisisNoticeSound();
  }

  function dismissCrisis() {
    crisisVisible.value = false;
  }

  function markFtubeWatched() {
    if (ftubeWatched.value) return false;
    ftubeWatched.value = true;
    crisisVisible.value = false;
    return true;
  }

  function completeNegotiation() {
    if (!ftubeWatched.value || dmCompleted.value) return false;
    dmCompleted.value = true;
    return true;
  }

  function postTweet() {
    if (!dmCompleted.value || tweetPosted.value) return false;
    tweetPosted.value = true;
    return true;
  }

  function markHotSearchSeen() {
    if (hotSearchSeen.value) return false;
    hotSearchSeen.value = true;
    return true;
  }

  function requestAdvisorAfterPhoneClose() {
    if (!phoneStageComplete.value || advisorPhase.value !== 'none') return false;
    pendingAdvisorAfterPhoneEnd.value = true;
    return true;
  }

  function consumePendingAdvisorAfterPhoneEnd() {
    if (!pendingAdvisorAfterPhoneEnd.value) return false;
    pendingAdvisorAfterPhoneEnd.value = false;
    advisorPhase.value = 'arriving';
    return true;
  }

  function enterAdvisorHold() {
    if (advisorPhase.value !== 'arriving') return false;
    advisorPhase.value = 'hold';
    return true;
  }

  function startAdvisorLeave() {
    if (advisorPhase.value !== 'hold' || !billsComplete.value) return false;
    advisorPhase.value = 'leaving';
    return true;
  }

  function completeAdvisorLeave() {
    if (advisorPhase.value !== 'leaving') return false;
    advisorPhase.value = 'none';
    return true;
  }

  function prepareSettlement(): SettlementPresentation | null {
    if (feedbackDone.value) return null;
    return buildSettlementPresentation(resources.value);
  }

  function commitSettlementFeedback() {
    applyFeedback();
  }

  /** @deprecated Use prepareSettlement + commitSettlementFeedback for staged HUD roll. */
  function beginSettlement(): SettlementPresentation | null {
    const presentation = prepareSettlement();
    if (!presentation) return null;
    commitSettlementFeedback();
    return presentation;
  }

  function signBill(billId: string) {
    if (advisorPhase.value !== 'hold') return false;
    if (!PORT_STRIKE_BILL_IDS.includes(billId as (typeof PORT_STRIKE_BILL_IDS)[number])) {
      return false;
    }
    if (signedBillIds.value.includes(billId)) return false;
    signedBillIds.value = [...signedBillIds.value, billId];
    return true;
  }

  function applyFeedback() {
    if (feedbackDone.value) return;
    resources.value = applyResourceDeltas(
      resources.value,
      PORT_STRIKE_FEEDBACK.deltas.resources,
    );
    nationMetrics.value = applyNationDeltas(
      nationMetrics.value,
      PORT_STRIKE_FEEDBACK.deltas.nation,
    );
    feedbackDone.value = true;
  }

  function completeIntro() {
    if (introComplete.value) return false;
    introComplete.value = true;
    pushCrisisNotice();
    return true;
  }

  /** Dev preview: skip phone stage and jump straight into advisor arrive. */
  function primeAdvisorPreview() {
    introComplete.value = true;
    crisisDelivered.value = true;
    crisisVisible.value = false;
    ftubeWatched.value = true;
    dmCompleted.value = true;
    tweetPosted.value = true;
    hotSearchSeen.value = true;
    signedBillIds.value = [];
    feedbackDone.value = false;
    pendingAdvisorAfterPhoneEnd.value = false;
    advisorPhase.value = 'arriving';
  }

  function guardReasonForApp(app: PhoneAppId): PortStrikeGuardReason {
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (advisorActive.value) return 'advisor_not_ready';
    if (app === 'ftube') return null;
    if (!ftubeWatched.value) return 'watch_ftube_first';
    if (app === 'felegram') return null;
    if (!dmCompleted.value) return 'negotiate_first';
    if (app === 'f') return null;
    return null;
  }

  function guardReasonForInbox(): PortStrikeGuardReason {
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (!ftubeWatched.value) return 'watch_ftube_first';
    if (!dmCompleted.value) return 'negotiate_first';
    if (!tweetPosted.value) return 'finish_phone_tasks';
    if (advisorPhase.value === 'arriving' || advisorPhase.value === 'leaving') {
      return 'advisor_not_ready';
    }
    if (advisorPhase.value === 'none') return 'advisor_not_ready';
    return null;
  }

  function guardMessage(reason: PortStrikeGuardReason): string {
    switch (reason) {
      case 'intro_playing':
        return '办公室开场片段播放中，请稍候。';
      case 'watch_ftube_first':
        return '先打开 FTube 看完现场，再决定怎么回应。';
      case 'negotiate_first':
        return '工会领袖在 Felegram 等你谈判，别急着公开表态或签文件。';
      case 'finish_phone_tasks':
        return '先在手机上完成谈判并发推，再处理法案。';
      case 'advisor_not_ready':
        if (advisorPhase.value === 'arriving') {
          return '幕僚正在呈递文件，请稍候。';
        }
        if (advisorPhase.value === 'leaving') {
          return '幕僚正在退场，请稍候结算。';
        }
        if (advisorActive.value) {
          return '幕僚还在办公室，请先处理法案。';
        }
        return '关手机后幕僚才会呈上待签文件。';
      case 'case_complete':
        return '本轮港口危机已处理完毕。';
      default:
        return '';
    }
  }

  function isBillCaseRelevant(itemId: string): boolean {
    return PORT_STRIKE_BILL_IDS.includes(itemId as (typeof PORT_STRIKE_BILL_IDS)[number]);
  }

  function feedbackResult() {
    return {
      title: PORT_STRIKE_FEEDBACK.title,
      body: buildFeedbackBody(),
    };
  }

  return {
    crisis: PORT_STRIKE_CRISIS,
    advisorCue: PORT_STRIKE_ADVISOR.cue,
    intro: PORT_STRIKE_INTRO,
    crisisVisible,
    crisisDelivered,
    ftubeWatched,
    dmCompleted,
    tweetPosted,
    hotSearchSeen,
    canClosePhone,
    signedBillIds,
    advisorPhase,
    introComplete,
    phoneStageComplete,
    billsComplete,
    advisorActive,
    feedbackDone,
    resources,
    nationMetrics,
    caseActive,
    awaitingFeedback,
    appBadges,
    inboxHighlight,
    dismissCrisis,
    markFtubeWatched,
    completeNegotiation,
    postTweet,
    markHotSearchSeen,
    completeIntro,
    primeAdvisorPreview,
    requestAdvisorAfterPhoneClose,
    consumePendingAdvisorAfterPhoneEnd,
    enterAdvisorHold,
    startAdvisorLeave,
    completeAdvisorLeave,
    prepareSettlement,
    commitSettlementFeedback,
    beginSettlement,
    signBill,
    guardReasonForApp,
    guardReasonForInbox,
    guardMessage,
    isBillCaseRelevant,
    feedbackResult,
    pendingLabel: PORT_STRIKE_FEEDBACK.pendingLabel,
    billIds: PORT_STRIKE_BILL_IDS,
    advisorTiming: {
      pauseAtSec: PORT_STRIKE_ADVISOR.pauseAtSec,
    },
    settlementTiming: SETTLEMENT_PRESENTATION,
  };
}
