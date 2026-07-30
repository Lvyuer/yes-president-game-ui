import { computed, ref, shallowRef } from 'vue';
import {
  AIDE_BRIEFING_ACT,
  AIDE_INVESTIGATION_ACT,
  AIDE_WEEKLOOP_PORT_ECHO_ACT,
  AIDE_YACHT_WEEK1_ACT,
  applyNationDeltas,
  applyResourceDeltas,
  buildFeedbackBody,
  buildSettlementPresentation,
  cloneInitialNationMetrics,
  cloneInitialResources,
  createFelegramThreadFromScript,
  createInitialFamilyGroupState,
  createInitialFelegramThreads,
  buildFamilyGroupSnapshot,
  FAMILY_GROUP,
  FAMILY_GROUP_INVITABLE_IDS,
  FELEGRAM_CONTACTS,
  felegramContactDisplayName,
  felegramPreviewText,
  felegramUnreadCount,
  felegramThreadIdFor,
  formatFelegramClock,
  PORT_STRIKE_AIDE_NOTICE,
  PORT_STRIKE_ADVISOR,
  PORT_STRIKE_BILL_IDS,
  PORT_STRIKE_CRISIS,
  PORT_STRIKE_DESK_TODOS,
  PORT_STRIKE_FEEDBACK,
  PORT_STRIKE_PUBLISH_DRAFT,
  FTUBE_PORT_REOPEN_PUSH_ID,
  PORT_STRIKE_REOPEN,
  resolveAideContact,
  SETTLEMENT_PRESENTATION,
  YACHT_WEEK2_MEDIA_CONTACT,
  type AidePhase,
  type DeskTodoAction,
  type DeskTodoId,
  type FelegramAideAct,
  type FelegramContactId,
  type FelegramFamilyGroupState,
  type FelegramStoredMessage,
  type FelegramThreadId,
  type FelegramThreadSnapshot,
  type FtubeEpisode,
  type NationMetricSnapshot,
  type PhoneAppId,
  type ResourceSnapshot,
  type SettlementPresentation,
} from './casePortStrike';
import { playCrisisNoticeSound } from './playCrisisNoticeSound';

/**
 * Test bypass: skip progression gates on phone apps / publish / inbox / close.
 * Set to true only for free-roam debugging; false for the normal demo flow.
 */
export const DISABLE_PORT_STRIKE_FLOW_LOCKS = false;

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
  action: DeskTodoAction;
  phoneApp?: PhoneAppId;
};

export type FamilyEchoMessage = {
  role?: 'system';
  senderId?: FelegramContactId;
  text: string;
};

export type MessagePushItem = {
  id: string;
  title: string;
  message: string;
  subline: string;
  app: PhoneAppId;
  kind?: 'message' | 'video';
  threadId?: FelegramThreadId;
  /** DM 用联系人头像；家族群用群拼接头像；App 推送用应用图标 */
  avatar:
    | { kind: 'contact'; contactId: FelegramContactId }
    | { kind: 'group'; memberIds: FelegramContactId[] }
    | { kind: 'app'; appId: PhoneAppId };
  thumbSrc?: string;
  thumbTag?: string;
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
  /** 仅港口案例「颁布后调查案」链路；周循环颁布补偿令不置 true */
  const aideInvestigationReady = ref(false);
  /** W2 港口/媒体待办开关；进 W3 reset 后关掉，避免旧待办复活 */
  const crisisDeskActive = ref(true);
  const hearingDeskUnlocked = ref(false);
  const hearingDeskDone = ref(false);
  const unionTalkUnlocked = ref(false);
  const aideUnlocked = ref(DISABLE_PORT_STRIKE_FLOW_LOCKS);
  const aideBriefingCompleted = ref(false);
  const aideNoticeVisible = ref(false);
  const aideChatCompleted = ref(false);
  const felegramThreads = ref(createInitialFelegramThreads());
  const familyGroup = ref<FelegramFamilyGroupState>(createInitialFamilyGroupState());
  /** 开局家族群已有芯片讨论，视为已通气；不需先聊幕僚。 */
  const familyTechTipRaised = ref(true);

  const felegramReplyCounts = computed<Record<FelegramContactId, number>>(() => ({
    union: felegramThreads.value.union.replyCount,
    media: felegramThreads.value.media.replyCount,
    vance: felegramThreads.value.vance.replyCount,
    aide: felegramThreads.value.aide.replyCount,
  }));
  const aideInvestigationReplyCount = computed(
    () => felegramThreads.value['aide-investigation'].replyCount,
  );
  const signedBillIds = ref<string[]>([]);
  const advisorPhase = ref<AdvisorPhase>('none');
  const pendingAdvisorAfterPhoneEnd = ref(false);
  const introComplete = ref(DISABLE_PORT_STRIKE_FLOW_LOCKS);
  const feedbackDone = ref(false);
  const reopenPending = ref(false);
  const reopenWatched = ref(false);
  const settlementPending = ref(false);
  const messagePushVisible = ref<MessagePushItem[]>([]);
  const messagePushPending = ref<MessagePushItem[]>([]);
  const messagePushPushedThreads = ref<Set<string>>(new Set());
  const activeFelegramThread = ref<FelegramThreadId | null>(null);
  let messagePushSeq = 0;
  let messagePushStaggerTimer: ReturnType<typeof setTimeout> | null = null;

  /** 右侧堆叠上限，避免占满右半屏 */
  const MESSAGE_PUSH_MAX_VISIBLE = 4;
  /** 多条入队时，逐条滑入的间隔（需大于进场动画，才看得出错峰） */
  const MESSAGE_PUSH_STAGGER_MS = 720;

  const resources = shallowRef<ResourceSnapshot[]>(cloneInitialResources());
  const nationMetrics = shallowRef<NationMetricSnapshot[]>(cloneInitialNationMetrics());

  const phoneStageComplete = computed(() => dmCompleted.value && tweetPosted.value);

  const canClosePhone = computed(
    () => DISABLE_PORT_STRIKE_FLOW_LOCKS || !tweetPosted.value || hotSearchSeen.value,
  );
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
    aideInvestigationReady.value && aideBriefingCompleted.value
      ? 'investigation'
      : 'briefing',
  );

  const reopenPhoneHighlight = computed(
    () => reopenPending.value && !reopenWatched.value,
  );

  const aidePhoneHighlight = computed(
    () =>
      aideNoticeVisible.value ||
      (aideUnlocked.value && !aideBriefingCompleted.value && !reopenPending.value) ||
      (aideInvestigationReady.value &&
        billPublished.value &&
        !aideChatCompleted.value &&
        !reopenPending.value),
  );

  const unionDone = computed(
    () => (felegramReplyCounts.value.union ?? 0) >= contactBeatCount('union'),
  );
  const mediaDone = computed(
    () => (felegramReplyCounts.value.media ?? 0) >= contactBeatCount('media'),
  );

  const deskTodos = computed<DeskTodoView[]>(() => {
    const items: DeskTodoView[] = [];
    if (reopenPending.value && !reopenWatched.value) {
      const def = PORT_STRIKE_DESK_TODOS['watch-reopen'];
      items.push({
        id: def.id,
        title: def.title,
        detail: def.detail,
        done: false,
        action: def.action,
        phoneApp: def.phoneApp,
      });
    }
    if (hearingDeskUnlocked.value) {
      const def = PORT_STRIKE_DESK_TODOS['sign-hearing'];
      items.push({
        id: def.id,
        title: def.title,
        detail: def.detail,
        done: hearingDeskDone.value,
        action: def.action,
        phoneApp: def.phoneApp,
      });
    }
    if (!crisisDeskActive.value) return items;

    if (unionTalkUnlocked.value) {
      const def = PORT_STRIKE_DESK_TODOS['talk-union'];
      items.push({
        id: def.id,
        title: def.title,
        detail: def.detail,
        done: unionDone.value,
        action: def.action,
        phoneApp: def.phoneApp,
      });
    }
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

  function buildReopenVideoPush(): Omit<MessagePushItem, 'id'> {
    return {
      kind: 'video',
      title: PORT_STRIKE_REOPEN.title,
      message: PORT_STRIKE_REOPEN.message,
      subline: PORT_STRIKE_REOPEN.subline,
      app: PORT_STRIKE_REOPEN.targetApp,
      avatar: { kind: 'app', appId: 'ftube' },
      thumbSrc: PORT_STRIKE_REOPEN.thumb,
      thumbTag: PORT_STRIKE_REOPEN.thumbTag,
    };
  }

  function pushReopenNotice() {
    if (!reopenPending.value || reopenWatched.value) return;
    enqueueMessagePush(
      { id: FTUBE_PORT_REOPEN_PUSH_ID, ...buildReopenVideoPush() },
      { skipThreadDedupe: true },
    );
  }

  /** 周循环 W3：港口回声周打开 FTube 复工现场。 */
  function enablePortReopenEcho() {
    if (reopenWatched.value) return false;
    reopenPending.value = true;
    pushReopenNotice();
    return true;
  }

  function dismissReopenNotice() {
    dismissMessagePush(FTUBE_PORT_REOPEN_PUSH_ID);
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
    dismissMessagePush(FTUBE_PORT_REOPEN_PUSH_ID);
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

  function postTweet(options?: { bypassDmGate?: boolean }) {
    if (tweetPosted.value) return false;
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS || options?.bypassDmGate) {
      tweetPosted.value = true;
      return true;
    }
    if (!dmCompleted.value) return false;
    tweetPosted.value = true;
    return true;
  }

  function markHotSearchSeen() {
    if (hotSearchSeen.value) return false;
    hotSearchSeen.value = true;
    return true;
  }

  function publishBill() {
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS) {
      if (billPublished.value) return false;
      billPublished.value = true;
      aideInvestigationReady.value = true;
      commitFelegramThread(
        'aide-investigation',
        createFelegramThreadFromScript(resolveAideContact('investigation'), 0, {
          updatedAtMs: Date.now(),
        }),
      );
      return true;
    }
    if (!phoneStageComplete.value || billPublished.value) return false;
    if (advisorPhase.value !== 'none') return false;
    billPublished.value = true;
    aideInvestigationReady.value = true;
    commitFelegramThread(
      'aide-investigation',
      createFelegramThreadFromScript(resolveAideContact('investigation'), 0, {
        updatedAtMs: Date.now(),
      }),
    );
    return true;
  }

  /** 周循环：颁布补偿令后勾选待办，不触发案例调查案链路。 */
  function markBillPublishedForDesk() {
    billPublished.value = true;
  }

  function unlockHearingDeskTodo() {
    hearingDeskUnlocked.value = true;
  }

  function unlockUnionTalkTodo() {
    unionTalkUnlocked.value = true;
  }

  /** 周循环进入港口危机周时打开 W2 桌面待办。 */
  function enableCrisisDeskTodos() {
    crisisDeskActive.value = true;
  }

  function markHearingDeskDone() {
    hearingDeskDone.value = true;
  }

  function pushAideNotice() {
    if (!aideInvestigationReady.value || aideChatCompleted.value) return;
    aideNoticeVisible.value = true;
    enqueueMessagePush({
      id: PORT_STRIKE_AIDE_NOTICE.id,
      title: PORT_STRIKE_AIDE_NOTICE.title,
      message: PORT_STRIKE_AIDE_NOTICE.message,
      subline: PORT_STRIKE_AIDE_NOTICE.subline,
      threadId: 'aide-investigation',
      app: PORT_STRIKE_AIDE_NOTICE.targetApp,
      avatar: { kind: 'contact', contactId: 'aide' },
    });
  }

  function dismissAideNotice() {
    aideNoticeVisible.value = false;
  }

  function completeAideBriefing(options?: {
    force?: boolean;
    /** 周循环脚本；传入后按该 act 收尾，避免被默认港口简报覆盖 */
    act?: FelegramAideAct;
  }) {
    const force = options?.force === true;
    const act = options?.act;
    const targetBeats =
      act?.beats.length ??
      (force ? AIDE_YACHT_WEEK1_ACT.beats.length : AIDE_BRIEFING_ACT.beats.length);

    if (DISABLE_PORT_STRIKE_FLOW_LOCKS || force) {
      aideBriefingCompleted.value = true;
      aideUnlocked.value = true;
      finalizeAideBriefingThread(act, targetBeats);
      syncDmCompleted();
      return true;
    }
    if (!aideUnlocked.value || aideBriefingCompleted.value) return false;
    aideBriefingCompleted.value = true;
    finalizeAideBriefingThread(act, targetBeats);
    syncDmCompleted();
    return true;
  }

  function finalizeAideBriefingThread(act: FelegramAideAct | undefined, targetBeats: number) {
    const current = felegramThreads.value.aide;
    // 玩家刚聊完：保留现网对话，勿用错误脚本重建
    if (act && current.replyCount >= Math.min(targetBeats, act.beats.length) && current.messages.length > 0) {
      const lastId = current.messages[current.messages.length - 1]?.id ?? current.lastReadMessageId;
      commitFelegramThread('aide', {
        ...current,
        replyCount: Math.max(current.replyCount, targetBeats),
        lastReadMessageId: lastId,
      });
      return;
    }
    if (act) {
      commitFelegramThread(
        'aide',
        createFelegramThreadFromScript(resolveAideContact('briefing', act), targetBeats, {
          markRead: true,
          updatedAtMs: Date.now(),
        }),
      );
      return;
    }
    setFelegramReplyCount('aide', targetBeats);
  }

  /** Seed Felegram aide thread with W1 yacht draft script. */
  function primeYachtWeek1Aide() {
    aideUnlocked.value = true;
    aideBriefingCompleted.value = false;
    const aideContact = resolveAideContact('briefing', AIDE_YACHT_WEEK1_ACT);
    const now = Date.now();
    felegramThreads.value = {
      ...felegramThreads.value,
      aide: createFelegramThreadFromScript(aideContact, 0, {
        updatedAtMs: now,
      }),
    };
  }

  /** W2：媒体部上线，催调水门 F 表态。 */
  function primeYachtWeek2Media() {
    felegramThreads.value = {
      ...felegramThreads.value,
      media: createFelegramThreadFromScript(YACHT_WEEK2_MEDIA_CONTACT, 0, {
        updatedAtMs: Date.now(),
      }),
    };
  }

  /** W2：幕僚切到港口周脚本，并重置 briefing 完成态以便再谈。 */
  function primeYachtWeek2Aide(act: FelegramAideAct) {
    crisisDeskActive.value = true;
    aideUnlocked.value = true;
    aideBriefingCompleted.value = false;
    const aideContact = resolveAideContact('briefing', act);
    felegramThreads.value = {
      ...felegramThreads.value,
      aide: createFelegramThreadFromScript(aideContact, 0, {
        updatedAtMs: Date.now(),
      }),
    };
  }

  /** W3：港口回声复盘脚本；复工视频推送由进入 free 时一并入队。 */
  function primeYachtWeek3Aide(act: FelegramAideAct = AIDE_WEEKLOOP_PORT_ECHO_ACT) {
    aideUnlocked.value = true;
    aideBriefingCompleted.value = false;
    const aideContact = resolveAideContact('briefing', act);
    felegramThreads.value = {
      ...felegramThreads.value,
      aide: createFelegramThreadFromScript(aideContact, 0, {
        updatedAtMs: Date.now(),
      }),
    };
  }

  function completeAideChat() {
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS) {
      aideChatCompleted.value = true;
      aideNoticeVisible.value = false;
      setFelegramReplyCount('aide', AIDE_INVESTIGATION_ACT.beats.length);
      return true;
    }
    if (!billPublished.value || aideChatCompleted.value) return false;
    aideChatCompleted.value = true;
    aideNoticeVisible.value = false;
    setFelegramReplyCount('aide', AIDE_INVESTIGATION_ACT.beats.length);
    return true;
  }

  function threadScript(threadId: FelegramThreadId) {
    if (threadId === 'aide-investigation') {
      return resolveAideContact('investigation');
    }
    if (threadId === 'aide') {
      return resolveAideContact('briefing');
    }
    if (threadId === 'family') {
      return null;
    }
    return FELEGRAM_CONTACTS.find((item) => item.id === threadId)!;
  }

  function commitFelegramThread(
    threadId: FelegramThreadId,
    snapshot: FelegramThreadSnapshot,
  ) {
    const current = felegramThreads.value[threadId];
    // Ignore stale/regressive snapshots (e.g. remount race), but always allow
    // same-progress updates such as mark-read.
    if (snapshot.replyCount < current.replyCount) return;
    if (
      snapshot.replyCount === current.replyCount &&
      snapshot.messages.length < current.messages.length
    ) {
      return;
    }

    felegramThreads.value = {
      ...felegramThreads.value,
      [threadId]: snapshot,
    };

    if (
      threadId === 'union' ||
      threadId === 'media' ||
      threadId === 'aide'
    ) {
      syncDmCompleted();
    }
  }

  function setFelegramReplyCount(contactId: FelegramContactId, replyCount: number) {
    const threadId = felegramThreadIdFor(contactId, aidePhase.value);
    const current = felegramThreads.value[threadId];
    if (replyCount <= current.replyCount) return;

    const script = threadScript(threadId);
    if (!script) return;

    commitFelegramThread(
      threadId,
      createFelegramThreadFromScript(script, replyCount, {
        markRead: true,
        updatedAtMs: Date.now(),
      }),
    );
  }

  /** 确保家族群可见（开局已在群内；不再注入「邀请入群」）。 */
  function joinFamilyGroup(): boolean {
    if (familyGroup.value.joined) return false;
    familyGroup.value = {
      joined: true,
      memberIds: [...FAMILY_GROUP.memberIds],
    };
    const existing = felegramThreads.value.family;
    if (!existing || existing.messages.length === 0) {
      felegramThreads.value = {
        ...felegramThreads.value,
        family: buildFamilyGroupSnapshot(),
      };
    }
    return true;
  }

  /** Returns newly added contact ids (demo: only invitable pool). */
  function inviteFamilyMembers(contactIds: FelegramContactId[]): FelegramContactId[] {
    if (!familyGroup.value.joined) return [];
    const added = contactIds.filter(
      (id) =>
        FAMILY_GROUP_INVITABLE_IDS.includes(id) &&
        !familyGroup.value.memberIds.includes(id),
    );
    if (added.length === 0) return [];
    familyGroup.value = {
      ...familyGroup.value,
      memberIds: [...familyGroup.value.memberIds, ...added],
    };
    return added;
  }

  function clearMessagePushTimers() {
    if (messagePushStaggerTimer) {
      clearTimeout(messagePushStaggerTimer);
      messagePushStaggerTimer = null;
    }
  }

  function dismissMessagePush(id: string) {
    messagePushVisible.value = messagePushVisible.value.filter((item) => item.id !== id);
    scheduleMessagePushProcess(0);
  }

  function dismissMessagePushesForThread(threadId: FelegramThreadId) {
    const beforeVisible = messagePushVisible.value.length;
    const beforePending = messagePushPending.value.length;
    messagePushVisible.value = messagePushVisible.value.filter(
      (item) => item.threadId !== threadId,
    );
    messagePushPending.value = messagePushPending.value.filter(
      (item) => item.threadId !== threadId,
    );
    if (
      messagePushVisible.value.length !== beforeVisible ||
      messagePushPending.value.length !== beforePending
    ) {
      scheduleMessagePushProcess(0);
    }
  }

  function clearMessagePushQueue() {
    clearMessagePushTimers();
    messagePushVisible.value = [];
    messagePushPending.value = [];
  }

  function setActiveFelegramThread(threadId: FelegramThreadId | null) {
    activeFelegramThread.value = threadId;
    if (threadId) {
      // 手动进聊天即视为已读，右侧对应推送收起
      dismissMessagePushesForThread(threadId);
    }
  }

  function resetMessagePushThreadFlags() {
    messagePushPushedThreads.value = new Set();
  }

  function buildThreadPushItem(
    threadId: FelegramThreadId,
    thread: FelegramThreadSnapshot,
  ): Omit<MessagePushItem, 'id'> {
    const lastMessage = [...thread.messages]
      .reverse()
      .find((item) => item.role === 'them' || item.role === 'system');
    const message = felegramPreviewText(lastMessage);

    if (threadId === 'family') {
      return {
        kind: 'message',
        title: FAMILY_GROUP.title,
        message,
        subline: 'Felegram · 家族群',
        threadId,
        app: 'felegram',
        avatar: {
          kind: 'group',
          memberIds: familyGroup.value.memberIds.slice(0, 3),
        },
      };
    }

    if (threadId === 'aide-investigation') {
      return {
        kind: 'message',
        title: '幕僚发来消息',
        message,
        subline: 'Felegram · 幕僚',
        threadId,
        app: 'felegram',
        avatar: { kind: 'contact', contactId: 'aide' },
      };
    }

    const contactName = felegramContactDisplayName(threadId as FelegramContactId);
    return {
      kind: 'message',
      title: `${contactName}发来消息`,
      message,
      subline: `Felegram · ${contactName}`,
      threadId,
      app: 'felegram',
      avatar: { kind: 'contact', contactId: threadId as FelegramContactId },
    };
  }

  function showNextMessagePush() {
    if (messagePushVisible.value.length >= MESSAGE_PUSH_MAX_VISIBLE) return;
    if (messagePushPending.value.length === 0) return;

    const next = messagePushPending.value.shift();
    if (!next) return;

    if (next.threadId && activeFelegramThread.value === next.threadId) {
      showNextMessagePush();
      return;
    }

    messagePushVisible.value = [...messagePushVisible.value, next];
    playCrisisNoticeSound();

    if (
      messagePushPending.value.length > 0 &&
      messagePushVisible.value.length < MESSAGE_PUSH_MAX_VISIBLE
    ) {
      scheduleMessagePushProcess(MESSAGE_PUSH_STAGGER_MS);
    }
  }

  function scheduleMessagePushProcess(delayMs: number) {
    if (messagePushStaggerTimer) return;
    messagePushStaggerTimer = setTimeout(() => {
      messagePushStaggerTimer = null;
      showNextMessagePush();
    }, delayMs);
  }

  function enqueueMessagePush(
    item: Omit<MessagePushItem, 'id'> & { id?: string },
    options?: { skipThreadDedupe?: boolean },
  ) {
    if (item.threadId && activeFelegramThread.value === item.threadId) return;

    const id = item.id ?? `msg-push-${Date.now()}-${++messagePushSeq}`;
    const push: MessagePushItem = { kind: 'message', ...item, id };

    if (!options?.skipThreadDedupe && item.threadId) {
      const threadKey = item.threadId;
      if (messagePushPushedThreads.value.has(threadKey)) return;
      messagePushPushedThreads.value.add(threadKey);
    }

    const alreadyQueued = [...messagePushPending.value, ...messagePushVisible.value].some(
      (entry) =>
        entry.id === push.id ||
        (!options?.skipThreadDedupe &&
          item.threadId &&
          entry.threadId === push.threadId),
    );
    if (alreadyQueued) return;

    messagePushPending.value.push(push);

    // 已有可见条时错峰；首条可立即出，后续入队不会同步连弹
    const delay =
      messagePushVisible.value.length === 0 && !messagePushStaggerTimer
        ? 0
        : MESSAGE_PUSH_STAGGER_MS;
    scheduleMessagePushProcess(delay);
  }

  function enqueueUnreadFelegramPushes(hiddenContactIds: FelegramContactId[] = []) {
    // 不扫 aide-investigation：那是港口案调查线，开局未解锁却有预置未读
    const threadOrder: FelegramThreadId[] = ['aide', 'family', 'vance', 'union', 'media'];

    for (const threadId of threadOrder) {
      if (
        threadId !== 'family' &&
        hiddenContactIds.includes(threadId as FelegramContactId)
      ) {
        continue;
      }
      if (threadId === 'family' && !familyGroup.value.joined) continue;

      const thread = felegramThreads.value[threadId];
      if (!thread || felegramUnreadCount(thread) === 0) continue;

      enqueueMessagePush(buildThreadPushItem(threadId, thread));
    }
  }

  function buildFamilyPushPreview(parts: FamilyEchoMessage[]): { title: string; message: string } {
    const firstNpc = parts.find((part) => part.role !== 'system' && part.senderId);
    if (firstNpc?.senderId) {
      const sender = felegramContactDisplayName(firstNpc.senderId);
      return {
        title: FAMILY_GROUP.title,
        message: `${sender}: ${firstNpc.text}`,
      };
    }
    const system = parts.find((part) => part.role === 'system');
    return {
      title: FAMILY_GROUP.title,
      message: system?.text ?? '家族群有新消息',
    };
  }

  function pushFamilyMessageNotice(parts: FamilyEchoMessage[]) {
    const preview = buildFamilyPushPreview(parts);
    enqueueMessagePush(
      {
        title: preview.title,
        message: preview.message,
        subline: 'Felegram · 家族群',
        threadId: 'family',
        app: 'felegram',
        avatar: {
          kind: 'group',
          memberIds: familyGroup.value.memberIds.slice(0, 3),
        },
      },
      { skipThreadDedupe: true },
    );
  }

  const familyEchoDelayTimers: ReturnType<typeof setTimeout>[] = [];

  function clearFamilyEchoDelayTimers() {
    for (const timer of familyEchoDelayTimers) {
      clearTimeout(timer);
    }
    familyEchoDelayTimers.length = 0;
  }

  function commitFamilyMessages(parts: FamilyEchoMessage[]): boolean {
    if (!familyGroup.value.joined) return false;
    const thread = felegramThreads.value.family;
    if (!thread || parts.length === 0) return false;

    const now = Date.now();
    let seq = 0;
    const appended: FelegramStoredMessage[] = parts.map((part) => {
      seq += 1;
      const id = `family-echo-${now}-${seq}`;
      if (part.role === 'system' || !part.senderId) {
        return { id, role: 'system', text: part.text };
      }
      return { id, role: 'them', senderId: part.senderId, text: part.text };
    });

    felegramThreads.value = {
      ...felegramThreads.value,
      family: {
        ...thread,
        messages: [...thread.messages, ...appended],
        updatedAtMs: now,
        updatedAtLabel: formatFelegramClock(new Date(now)),
      },
    };
    pushFamilyMessageNotice(parts);
    return true;
  }

  /**
   * 写入家族群并推送。delayMs 用于买卖/发帖后的“等人反应”延迟，更符合直觉。
   */
  function appendFamilyMessages(
    parts: FamilyEchoMessage[],
    options?: { delayMs?: number },
  ): boolean {
    if (!familyGroup.value.joined) return false;
    const thread = felegramThreads.value.family;
    if (!thread || parts.length === 0) return false;

    const delayMs = options?.delayMs ?? 0;
    if (delayMs <= 0) {
      return commitFamilyMessages(parts);
    }

    const timer = setTimeout(() => {
      const idx = familyEchoDelayTimers.indexOf(timer);
      if (idx >= 0) familyEchoDelayTimers.splice(idx, 1);
      commitFamilyMessages(parts);
    }, delayMs);
    familyEchoDelayTimers.push(timer);
    return true;
  }

  /**
   * 兼容旧调用：开局讨论已在群里，此处仅确保 flag，不再追加重复通气。
   */
  function raiseFamilyTechTip(): boolean {
    if (familyTechTipRaised.value) return false;
    familyTechTipRaised.value = true;
    return true;
  }

  function aideReplyCountForUi(): number {
    return aidePhase.value === 'investigation'
      ? aideInvestigationReplyCount.value
      : felegramReplyCounts.value.aide;
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
    if (!DISABLE_PORT_STRIKE_FLOW_LOCKS && advisorPhase.value !== 'hold') return false;
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
    reopenWatched.value = false;
    settlementPending.value = false;
    pendingAdvisorAfterPhoneEnd.value = false;
    advisorPhase.value = 'arriving';
  }

  function guardReasonForApp(app: PhoneAppId): PortStrikeGuardReason {
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS) return null;
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
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS) return null;
    if (!introComplete.value) return 'intro_playing';
    if (feedbackDone.value) return 'case_complete';
    if (reopenPending.value && !reopenWatched.value) return 'watch_reopen_first';
    if (!phoneStageComplete.value) return 'finish_phone_tasks';
    if (billPublished.value) return 'publish_already_done';
    if (advisorActive.value) return 'advisor_not_ready';
    return null;
  }

  function guardReasonForInbox(): PortStrikeGuardReason {
    if (DISABLE_PORT_STRIKE_FLOW_LOCKS) return null;
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
        return '先在 Felegram 和幕僚、工会领袖、媒体部聊完，别急着发帖或颁布法案。';
      case 'finish_phone_tasks':
        return '先在手机上完成谈判并发帖，再颁布法案。';
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

  /** Reset crisis intro state when restarting the W1–W3 week-loop campaign. */
  function resetWeekLoopCase() {
    crisisVisible.value = false;
    crisisDelivered.value = false;
    introComplete.value = DISABLE_PORT_STRIKE_FLOW_LOCKS;
    ftubeWatched.value = false;
    dmCompleted.value = false;
    tweetPosted.value = false;
    hotSearchSeen.value = false;
    billPublished.value = false;
    aideInvestigationReady.value = false;
    crisisDeskActive.value = false;
    hearingDeskUnlocked.value = false;
    hearingDeskDone.value = false;
    unionTalkUnlocked.value = false;
    aideNoticeVisible.value = false;
    aideChatCompleted.value = false;
    reopenPending.value = false;
    reopenWatched.value = false;
    settlementPending.value = false;
    pendingAdvisorAfterPhoneEnd.value = false;
    advisorPhase.value = 'none';
    feedbackDone.value = false;
    clearMessagePushQueue();
    clearFamilyEchoDelayTimers();
    resetMessagePushThreadFlags();
    activeFelegramThread.value = null;
  }

  /** 重开战役时：家族群回到芯片讨论开场（未读），TECH 教学可再走。 */
  function resetFamilyTechNarrative() {
    familyTechTipRaised.value = true;
    familyGroup.value = createInitialFamilyGroupState();
    felegramThreads.value = {
      ...felegramThreads.value,
      family: buildFamilyGroupSnapshot(new Date(), { markRead: false }),
    };
    clearMessagePushQueue();
    clearFamilyEchoDelayTimers();
    resetMessagePushThreadFlags();
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
    felegramThreads,
    familyGroup,
    familyTechTipRaised,
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
    enablePortReopenEcho,
    markFtubeWatched,
    markReopenWatched,
    completeNegotiation,
    completeAideBriefing,
    primeYachtWeek1Aide,
    primeYachtWeek2Aide,
    primeYachtWeek2Media,
    primeYachtWeek3Aide,
    completeAideChat,
    setFelegramReplyCount,
    commitFelegramThread,
    joinFamilyGroup,
    raiseFamilyTechTip,
    inviteFamilyMembers,
    appendFamilyMessages,
    messagePushVisible,
    enqueueMessagePush,
    enqueueUnreadFelegramPushes,
    dismissMessagePush,
    setActiveFelegramThread,
    resetMessagePushThreadFlags,
    aideReplyCountForUi,
    postTweet,
    markHotSearchSeen,
    publishBill,
    markBillPublishedForDesk,
    unlockHearingDeskTodo,
    unlockUnionTalkTodo,
    enableCrisisDeskTodos,
    markHearingDeskDone,
    pushAideNotice,
    completeIntro,
    resetWeekLoopCase,
    resetFamilyTechNarrative,
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
