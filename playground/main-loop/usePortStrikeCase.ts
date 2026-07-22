import { computed, ref, shallowRef } from 'vue';
import {
  AIDE_BRIEFING_ACT,
  AIDE_INVESTIGATION_ACT,
  applyNationDeltas,
  applyResourceDeltas,
  buildFeedbackBody,
  buildSettlementPresentation,
  cloneInitialNationMetrics,
  cloneInitialResources,
  FELEGRAM_CONTACTS,
  PORT_STRIKE_ADVISOR,
  PORT_STRIKE_AIDE_NOTICE,
  PORT_STRIKE_BILL_IDS,
  PORT_STRIKE_CRISIS,
  PORT_STRIKE_DESK_TODOS,
  PORT_STRIKE_FEEDBACK,
  PORT_STRIKE_PUBLISH_DRAFT,
  PORT_STRIKE_REOPEN,
  SETTLEMENT_PRESENTATION,
  type AidePhase,
  type DeskTodoId,
  type FelegramContactId,
  type FtubeEpisode,
  type NationMetricSnapshot,
  type PhoneAppId,
  type ResourceSnapshot,
  type SettlementPresentation,
} from './casePortStrike';
import { playCrisisNoticeSound } from './playCrisisNoticeSound';

export type { FtubeEpisode };

export type PortStrikeGuardReason =
  | 'intro_playing'
  | 'watch_ftube_first'
  | 'watch_reopen_first'
  | 'aide_briefing_first'
  | 'negotiate_first'
  | 'finish_phone_tasks'
  | 'publish_first'
  | 'publish_already_done'
  | 'aide_chat_first'
  | 'advisor_not_ready'
  | 'case_complete'
  | null;

export type AdvisorPhase = 'none' | 'arriving' | 'hold' | 'leaving';

export type DeskTodoView = {
  id: DeskTodoId;
  title: string;
  detail: string;
  done: boolean;
  action: 'publish' | 'phone';
  phoneApp?: PhoneAppId;
};

export type PortStrikeCase = ReturnType<typeof usePortStrikeCase>;

function contactBeatCount(contactId: FelegramContactId): number {
  if (contactId === 'aide') return AIDE_BRIEFING_ACT.beats.length;
  return FELEGRAM_CONTACTS.find((item) => item.id === contactId)?.beats.length ?? 0;
}

export function usePortStrikeCase() {
  const crisisVisible = ref(false);
  const crisisDelivered = ref(false);
  const ftubeWatched = ref(false);
  const dmCompleted = ref(false);
  const tweetPosted = ref(false);
  const hotSearchSeen = ref(false);
  const billPublished = ref(false);
  const aideUnlocked = ref(false);
  const aideBriefingCompleted = ref(false);
  const aideNoticeVisible = ref(false);
  const aideChatCompleted = ref(false);
  const felegramReplyCounts = ref<Record<FelegramContactId, number>>({
    union: 0,
    media: 0,
    vance: 0,
    aide: 0,
  });
  const aideInvestigationReplyCount = ref(0);
  const signedBillIds = ref<string[]>([]);
  const advisorPhase = ref<AdvisorPhase>('none');
  const pendingAdvisorAfterPhoneEnd = ref(false);
  const introComplete = ref(false);
  const feedbackDone = ref(false);
  const reopenPending = ref(false);
  const reopenVisible = ref(false);
  const reopenWatched = ref(false);
  const settlementPending = ref(false);

  const resources = shallowRef<ResourceSnapshot[]>(cloneInitialResources());
  const nationMetrics = shallowRef<NationMetricSnapshot[]>(cloneInitialNationMetrics());

  const phoneStageComplete = computed(() => dmCompleted.value && tweetPosted.value);

  const canClosePhone = computed(() => !tweetPosted.value || hotSearchSeen.value);
  const billsComplete = computed(() =>
    PORT_STRIKE_BILL_IDS.every((id) => signedBillIds.value.includes(id)),
  );
  const advisorActive = computed(() => advisorPhase.value !== 'none');
  const caseActive = computed(() => !feedbackDone.value);
  const awaitingFeedback = computed(() => settlementPending.value && !feedbackDone.value);

  const ftubeEpisode = computed<FtubeEpisode>(() =>
    reopenPending.value ? 'reopen' : 'crisis',
  );

  const aidePhase = computed<AidePhase>(() =>
    billPublished.value && aideBriefingCompleted.value ? 'investigation' : 'briefing',
  );

  const reopenPhoneHighlight = computed(
    () => reopenVisible.value || (reopenPending.value && !reopenWatched.value),
  );

  const aidePhoneHighlight = computed(
    () =>
      aideNoticeVisible.value ||
      (aideUnlocked.value && !aideBriefingCompleted.value && !reopenPending.value) ||
      (billPublished.value && !aideChatCompleted.value && !reopenPending.value),
  );

  const unionDone = computed(
    () => (felegramReplyCounts.value.union ?? 0) >= contactBeatCount('union'),
  );
  const mediaDone = computed(
    () => (felegramReplyCounts.value.media ?? 0) >= contactBeatCount('media'),
  );

  const deskTodos = computed<DeskTodoView[]>(() => {
    const items: DeskTodoView[] = [];
    if (unionDone.value) {
      const def = PORT_STRIKE_DESK_TODOS['publish-bill'];
      items.push({
        id: def.id,
        title: def.title,
        detail: def.detail,
        done: billPublished.value,
        action: def.action,
        phoneApp: def.phoneApp,
      });
    }
    if (mediaDone.value) {
      const def = PORT_STRIKE_DESK_TODOS['post-tweet'];
      items.push({
        id: def.id,
        title: def.title,
        detail: def.detail,
        done: tweetPosted.value,
        action: def.action,
        phoneApp: def.phoneApp,
      });
    }
    return items;
  });

  const canSettle = computed(
    () =>
      reopenPending.value &&
      reopenWatched.value &&
      billsComplete.value &&
      billPublished.value &&
      !feedbackDone.value &&
      advisorPhase.value === 'none',
  );

  const publishHighlight = computed(
    () =>
      phoneStageComplete.value &&
      !billPublished.value &&
      !feedbackDone.value &&
      advisorPhase.value === 'none' &&
      !reopenPending.value,
  );

  const appBadges = computed<Partial<Record<PhoneAppId, boolean>>>(() => ({
    ftube:
      (crisisDelivered.value && !ftubeWatched.value) ||
      (reopenPending.value && !reopenWatched.value),
    felegram:
      (ftubeWatched.value && !dmCompleted.value && !reopenPending.value) ||
      (billPublished.value && !aideChatCompleted.value && !reopenPending.value),
    f: dmCompleted.value && !tweetPosted.value && !reopenPending.value,
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

  function pushReopenNotice() {
    if (!reopenPending.value || reopenWatched.value) return;
    reopenVisible.value = true;
    playCrisisNoticeSound();
  }

  function dismissReopenNotice() {
    reopenVisible.value = false;
  }

  function markFtubeWatched() {
    if (ftubeWatched.value) return false;
    ftubeWatched.value = true;
    crisisVisible.value = false;
    aideUnlocked.value = true;
    return true;
  }

  function markReopenWatched() {
    if (!reopenPending.value || reopenWatched.value) return false;
    reopenWatched.value = true;
    reopenVisible.value = false;
    return true;
  }

  function syncDmCompleted() {
    if (dmCompleted.value) return;
    if (!aideBriefingCompleted.value || !unionDone.value || !mediaDone.value) return;
    dmCompleted.value = true;
  }

  function completeNegotiation() {
    if (!ftubeWatched.value || dmCompleted.value) return false;
    if (!aideBriefingCompleted.value) return false;
    dmCompleted.value = true;
    for (const contact of FELEGRAM_CONTACTS.filter((item) => item.advancesCase)) {
      setFelegramReplyCount(contact.id, contact.beats.length);
    }
    setFelegramReplyCount('aide', AIDE_BRIEFING_ACT.beats.length);
    aideBriefingCompleted.value = true;
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

  function publishBill() {
    if (!phoneStageComplete.value || billPublished.value) return false;
    if (advisorPhase.value !== 'none') return false;
    billPublished.value = true;
    aideInvestigationReplyCount.value = 0;
    return true;
  }

  function pushAideNotice() {
    if (!billPublished.value || aideChatCompleted.value) return;
    aideNoticeVisible.value = true;
    playCrisisNoticeSound();
  }

  function dismissAideNotice() {
    aideNoticeVisible.value = false;
  }

  function completeAideBriefing() {
    if (!aideUnlocked.value || aideBriefingCompleted.value) return false;
    aideBriefingCompleted.value = true;
    setFelegramReplyCount('aide', AIDE_BRIEFING_ACT.beats.length);
    syncDmCompleted();
    return true;
  }

  function completeAideChat() {
    if (!billPublished.value || aideChatCompleted.value) return false;
    aideChatCompleted.value = true;
    aideNoticeVisible.value = false;
    aideInvestigationReplyCount.value = AIDE_INVESTIGATION_ACT.beats.length;
    return true;
  }

  function setFelegramReplyCount(contactId: FelegramContactId, replyCount: number) {
    if (contactId === 'aide' && aidePhase.value === 'investigation') {
      if (replyCount <= aideInvestigationReplyCount.value) return;
      aideInvestigationReplyCount.value = replyCount;
      return;
    }

    const current = felegramReplyCounts.value[contactId] ?? 0;
    if (replyCount <= current) return;
    felegramReplyCounts.value = {
      ...felegramReplyCounts.value,
      [contactId]: replyCount,
    };

    if (contactId === 'union' || contactId === 'media' || contactId === 'aide') {
      syncDmCompleted();
    }
  }

  function aideReplyCountForUi(): number {
    return aidePhase.value === 'investigation'
      ? aideInvestigationReplyCount.value
      : (felegramReplyCounts.value.aide ?? 0);
  }

  function requestAdvisorAfterPhoneClose() {
    if (
      !phoneStageComplete.value ||
      !billPublished.value ||
      !aideChatCompleted.value ||
      advisorPhase.value !== 'none'
    ) {
      return false;
    }
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
    reopenPending.value = true;
    pushReopenNotice();
    return true;
  }

  function markSettlementStarted() {
    if (!canSettle.value) return false;
    settlementPending.value = true;
    return true;
  }

  /** Dev preview: skip reopen gate and show settlement HUD immediately. */
  function primeSettlementPreview() {
    settlementPending.value = true;
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
    billPublished.value = true;
    aideUnlocked.value = true;
    aideBriefingCompleted.value = true;
    aideNoticeVisible.value = false;
    aideChatCompleted.value = true;
    signedBillIds.value = [];
    feedbackDone.value = false;
    reopenPending.value = false;
    reopenVisible.value = false;
    reopenWatched.value = false;
    settlementPending.value = false;
    pendingAdvisorAfterPhoneEnd.value = false;
    advisorPhase.value = 'arriving';
  }

  function guardReasonForApp(app: PhoneAppId): PortStrikeGuardReason {
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (reopenPending.value && !reopenWatched.value) {
      if (app === 'ftube') return null;
      return 'watch_reopen_first';
    }
    if (advisorActive.value) return 'advisor_not_ready';
    if (app === 'ftube') return null;
    if (!ftubeWatched.value) return 'watch_ftube_first';
    if (app === 'felegram') return null;
    if (!dmCompleted.value) return 'negotiate_first';
    if (app === 'f') return null;
    return null;
  }

  function guardReasonForPublish(): PortStrikeGuardReason {
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (reopenPending.value && !reopenWatched.value) return 'watch_reopen_first';
    if (!phoneStageComplete.value) return 'finish_phone_tasks';
    if (billPublished.value) return 'publish_already_done';
    if (advisorActive.value) return 'advisor_not_ready';
    return null;
  }

  function guardReasonForInbox(): PortStrikeGuardReason {
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (reopenPending.value && !reopenWatched.value) return 'watch_reopen_first';
    if (!ftubeWatched.value) return 'watch_ftube_first';
    if (!dmCompleted.value) return 'negotiate_first';
    if (!tweetPosted.value) return 'finish_phone_tasks';
    if (!billPublished.value) return 'publish_first';
    if (!aideChatCompleted.value) return 'aide_chat_first';
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
      case 'watch_reopen_first':
        return '先看 FTube 上的港口复工现场，再处理其它事务。';
      case 'aide_briefing_first':
        return '先和幕僚把情况聊清楚，再去找工会或媒体。';
      case 'negotiate_first':
        return '先在 Felegram 和幕僚、工会领袖、媒体部聊完，别急着发推或颁布法案。';
      case 'finish_phone_tasks':
        return '先在手机上完成谈判并发推，再颁布法案。';
      case 'publish_first':
        return '先颁布与工会谈妥的港口劳工补偿令，再处理呈递文件。';
      case 'publish_already_done':
        return '港口劳工补偿令已颁布。';
      case 'aide_chat_first':
        return '先打开 Felegram，和幕僚把调查案的事聊完。';
      case 'advisor_not_ready':
        if (advisorPhase.value === 'arriving') {
          return '幕僚正在呈递文件，请稍候。';
        }
        if (advisorPhase.value === 'leaving') {
          return '幕僚正在退场，请稍候。';
        }
        if (advisorActive.value) {
          return '幕僚还在办公室，请先处理文件。';
        }
        if (!billPublished.value) {
          return '关手机后先颁布劳工补偿，幕僚才会再发消息。';
        }
        if (!aideChatCompleted.value) {
          return '先和幕僚聊完，再关手机会呈上调查文件。';
        }
        return '幕僚正在赶来，请稍候。';
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
    reopen: PORT_STRIKE_REOPEN,
    aideNotice: PORT_STRIKE_AIDE_NOTICE,
    advisorCue: PORT_STRIKE_ADVISOR.cue,
    publishCue: PORT_STRIKE_PUBLISH_DRAFT.cue,
    publishDraft: PORT_STRIKE_PUBLISH_DRAFT,
    publishSuccessMessage: PORT_STRIKE_PUBLISH_DRAFT.successMessage,
    crisisVisible,
    crisisDelivered,
    ftubeWatched,
    reopenPending,
    reopenVisible,
    reopenWatched,
    reopenPhoneHighlight,
    aideUnlocked,
    aideBriefingCompleted,
    aidePhase,
    aideNoticeVisible,
    aideChatCompleted,
    aidePhoneHighlight,
    aideInvestigationReplyCount,
    felegramReplyCounts,
    ftubeEpisode,
    dmCompleted,
    tweetPosted,
    hotSearchSeen,
    billPublished,
    canClosePhone,
    canSettle,
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
    publishHighlight,
    deskTodos,
    dismissCrisis,
    dismissReopenNotice,
    dismissAideNotice,
    markFtubeWatched,
    markReopenWatched,
    completeNegotiation,
    completeAideBriefing,
    completeAideChat,
    setFelegramReplyCount,
    aideReplyCountForUi,
    postTweet,
    markHotSearchSeen,
    publishBill,
    pushAideNotice,
    completeIntro,
    primeAdvisorPreview,
    requestAdvisorAfterPhoneClose,
    consumePendingAdvisorAfterPhoneEnd,
    enterAdvisorHold,
    startAdvisorLeave,
    completeAdvisorLeave,
    markSettlementStarted,
    primeSettlementPreview,
    prepareSettlement,
    commitSettlementFeedback,
    beginSettlement,
    signBill,
    guardReasonForApp,
    guardReasonForPublish,
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
