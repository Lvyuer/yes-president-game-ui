<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import {
  AIDE_BRIEFING_ACT,
  FAMILY_GROUP,
  FAMILY_GROUP_INVITABLE_IDS,
  FELEGRAM_CONTACTS,
  FELEGRAM_GROUPS,
  FELEGRAM_INBOX_PRIORITY,
  createInitialFamilyGroupState,
  createInitialFelegramThreads,
  felegramContactDisplayName,
  felegramPreviewText,
  felegramThreadIdFor,
  felegramUnreadCount,
  formatFelegramClock,
  markFelegramThreadRead,
  pickFelegramGroupReply,
  pickFelegramReply,
  resolveAideContact,
  type AidePhase,
  type FelegramAideAct,
  type FelegramBubble,
  type FelegramContactId,
  type FelegramContactScript,
  type FelegramFamilyGroupState,
  type FelegramGroupId,
  type FelegramGroupReplyPart,
  type FelegramGroupScript,
  type FelegramStoredMessage,
  type FelegramStickerId,
  type FelegramThreadId,
  type FelegramThreadSnapshot,
  type NegotiationOption,
} from './casePortStrike';
import chatBase from './assets/felegram-chat-ui-base.png';
import aideAvatarSrc from './assets/avatars/aide.png';
import mediaAvatarSrc from './assets/avatars/media.png';
import playerAvatarSrc from './assets/avatars/player.png';
import unionAvatarSrc from './assets/avatars/union.png';
import vanceAvatarSrc from './assets/avatars/vance.png';
import stickerForTheWorkers from './assets/sticker-for-the-workers.png';
import stickerThisIsFine from './assets/sticker-this-is-fine.png';
import { killPhoneMotion, playPop, playPush } from './phoneMotion';

const CONTACT_AVATAR_SRC: Partial<Record<FelegramContactId, string>> = {
  aide: aideAvatarSrc,
  union: unionAvatarSrc,
  vance: vanceAvatarSrc,
  media: mediaAvatarSrc,
};

const props = withDefaults(
  defineProps<{
    locked: boolean;
    completed: boolean;
    /** When false, the aide contact stays hidden from the list. */
    aideUnlocked?: boolean;
    aideBriefingCompleted?: boolean;
    aidePhase?: AidePhase;
    /** Persisted threads from the case store (survives phone remounts). */
    threads?: Record<FelegramThreadId, FelegramThreadSnapshot>;
    familyGroup?: FelegramFamilyGroupState;
    /** 芯片/TECH 通气是否已写入家族群；未通气前不可跟进拍戏。 */
    familyTechTipRaised?: boolean;
    guardMessage?: string;
    hiddenContactIds?: FelegramContactId[];
    contactOutcomeOverrides?: Partial<Record<FelegramContactId, string>>;
    /** Week-loop W1: use yacht draft aide script instead of port briefing. */
    aideActOverride?: FelegramAideAct | null;
    contactScriptOverrides?: Partial<Record<FelegramContactId, FelegramContactScript>>;
  }>(),
  {
    aideUnlocked: false,
    aideBriefingCompleted: false,
    aidePhase: 'briefing',
    threads: () => createInitialFelegramThreads(),
    familyGroup: () => createInitialFamilyGroupState(),
    familyTechTipRaised: false,
  },
);

const emit = defineEmits<{
  complete: [option: NegotiationOption];
  aideComplete: [phase: AidePhase];
  threadUpdate: [
    payload: { threadId: FelegramThreadId; snapshot: FelegramThreadSnapshot },
  ];
  inviteFamilyMembers: [contactIds: FelegramContactId[]];
  groupBeat: [payload: { groupId: FelegramGroupId; beatIndex: number }];
  familyOpen: [];
  threadFocus: [threadId: FelegramThreadId | null];
}>();

type View = 'contacts' | 'chat';
type ChatRole = 'them' | 'me' | 'system';
type SessionKey = FelegramContactId | FelegramGroupId;

type ActiveSession =
  | { kind: 'dm'; id: FelegramContactId }
  | { kind: 'group'; id: FelegramGroupId };

type ChatMessage = {
  id: string;
  role: ChatRole;
  text?: string;
  stickerId?: FelegramStickerId;
  stickerSrc?: string;
  senderId?: FelegramContactId;
  senderName?: string;
};

const STICKER_SRC: Record<FelegramStickerId, string> = {
  'for-the-workers': stickerForTheWorkers,
  'this-is-fine': stickerThisIsFine,
};

type ThreadState = {
  messages: ChatMessage[];
  replyCount: number;
  lastReadMessageId: string | null;
  updatedAtLabel: string;
  updatedAtMs: number;
  waiting: boolean;
};

const view = ref<View>('contacts');
const showContactsLayer = ref(true);
const showChatLayer = ref(false);
const navLocked = ref(false);
const activeSession = ref<ActiveSession | null>(null);
const draft = ref('');
const threadRef = ref<HTMLElement | null>(null);
const typing = ref(false);
const contactsRef = ref<HTMLElement | null>(null);
const chatRef = ref<HTMLElement | null>(null);
const caseEmitted = ref(Boolean(props.completed));

let replyTimer: ReturnType<typeof setTimeout> | null = null;
let msgSeq = 0;
let aideThreadPhase: AidePhase = props.aidePhase;

function nextId(prefix: string): string {
  msgSeq += 1;
  return `${prefix}-${msgSeq}`;
}

function threadIdFor(contactId: FelegramContactId): FelegramThreadId {
  return felegramThreadIdFor(contactId, props.aidePhase);
}

function sessionThreadId(session: ActiveSession): FelegramThreadId {
  return session.kind === 'group' ? session.id : threadIdFor(session.id);
}

function sessionKey(session: ActiveSession): SessionKey {
  return session.id;
}

function storedToChat(message: FelegramStoredMessage): ChatMessage {
  if (message.stickerId) {
    return {
      id: message.id,
      role: 'them',
      stickerId: message.stickerId,
      stickerSrc: STICKER_SRC[message.stickerId],
      senderId: message.senderId,
      senderName: message.senderId
        ? felegramContactDisplayName(message.senderId)
        : undefined,
    };
  }
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    senderId: message.senderId,
    senderName: message.senderId
      ? felegramContactDisplayName(message.senderId)
      : undefined,
  };
}

function chatToStored(message: ChatMessage): FelegramStoredMessage {
  if (message.stickerId) {
    return {
      id: message.id,
      role: 'them',
      stickerId: message.stickerId,
      senderId: message.senderId,
    };
  }
  return {
    id: message.id,
    role: message.role,
    text: message.text,
    senderId: message.senderId,
  };
}

function snapshotToLocal(snapshot: FelegramThreadSnapshot): ThreadState {
  return {
    messages: snapshot.messages.map(storedToChat),
    replyCount: snapshot.replyCount,
    lastReadMessageId: snapshot.lastReadMessageId,
    updatedAtLabel: snapshot.updatedAtLabel,
    updatedAtMs: snapshot.updatedAtMs,
    waiting: false,
  };
}

function localToSnapshot(thread: ThreadState): FelegramThreadSnapshot {
  return {
    messages: thread.messages.map(chatToStored),
    replyCount: thread.replyCount,
    lastReadMessageId: thread.lastReadMessageId,
    updatedAtLabel: thread.updatedAtLabel,
    updatedAtMs: thread.updatedAtMs,
  };
}

function hydrateSession(key: SessionKey): ThreadState {
  const threadId: FelegramThreadId =
    key === 'family' ? 'family' : threadIdFor(key);
  const snapshot = props.threads[threadId];
  if (snapshot) return snapshotToLocal(snapshot);
  return {
    messages: [],
    replyCount: 0,
    lastReadMessageId: null,
    updatedAtLabel: '',
    updatedAtMs: 0,
    waiting: false,
  };
}

function buildContactScript(contactId: FelegramContactId): FelegramContactScript {
  const override = props.contactScriptOverrides?.[contactId];
  if (override) return override;
  if (contactId === 'aide') {
    return resolveAideContact(props.aidePhase, props.aideActOverride ?? undefined);
  }
  return FELEGRAM_CONTACTS.find((item) => item.id === contactId)!;
}

function buildGroupScript(groupId: FelegramGroupId): FelegramGroupScript {
  return FELEGRAM_GROUPS.find((item) => item.id === groupId) ?? FAMILY_GROUP;
}

const sessionKeys: SessionKey[] = [
  ...FELEGRAM_GROUPS.map((group) => group.id),
  ...FELEGRAM_CONTACTS.map((contact) => contact.id),
];

const threads = reactive<Record<SessionKey, ThreadState>>(
  Object.fromEntries(
    sessionKeys.map((key) => [key, hydrateSession(key)]),
  ) as Record<SessionKey, ThreadState>,
);

function commitSession(session: ActiveSession) {
  const thread = threads[sessionKey(session)];
  emit('threadUpdate', {
    threadId: sessionThreadId(session),
    snapshot: localToSnapshot(thread),
  });
}

function syncSessionFromProps(key: SessionKey) {
  if (threads[key]?.waiting) return;
  const next = hydrateSession(key);
  threads[key].messages = next.messages;
  threads[key].replyCount = next.replyCount;
  threads[key].lastReadMessageId = next.lastReadMessageId;
  threads[key].updatedAtLabel = next.updatedAtLabel;
  threads[key].updatedAtMs = next.updatedAtMs;
}

const activeContact = computed(() =>
  activeSession.value?.kind === 'dm'
    ? buildContactScript(activeSession.value.id)
    : null,
);

const activeGroup = computed(() =>
  activeSession.value?.kind === 'group'
    ? buildGroupScript(activeSession.value.id)
    : null,
);

const activeThread = computed(() =>
  activeSession.value ? threads[sessionKey(activeSession.value)] : null,
);

const activePeerTitle = computed(() => {
  if (activeGroup.value) return activeGroup.value.title;
  return activeContact.value?.name ?? '';
});

const activePeerSubtitle = computed(() => {
  if (!activeGroup.value) return null;
  const count = familyMemberIds.value.length + 1;
  return `${count} 人 · ${activeGroup.value.subtitle}`;
});

const familyMemberIds = computed(() => props.familyGroup.memberIds);

const familyJoined = computed(() => props.familyGroup.joined);

const showAddMemberButton = computed(
  () =>
    activeSession.value?.kind === 'group' &&
    activeSession.value.id === 'family' &&
    familyJoined.value &&
    !props.locked,
);

const invitePanelOpen = ref(false);
const inviteDraft = ref<FelegramContactId[]>([]);

type InviteCandidate = {
  id: FelegramContactId;
  name: string;
  inGroup: boolean;
  invitable: boolean;
};

const inviteCandidates = computed<InviteCandidate[]>(() => {
  const members = new Set(familyMemberIds.value);
  return FELEGRAM_CONTACTS.map((contact) => ({
    id: contact.id,
    name: contact.name,
    inGroup: members.has(contact.id),
    invitable: FAMILY_GROUP_INVITABLE_IDS.includes(contact.id),
  }));
});

const canConfirmInvite = computed(() =>
  inviteDraft.value.some(
    (id) =>
      FAMILY_GROUP_INVITABLE_IDS.includes(id) &&
      !familyMemberIds.value.includes(id),
  ),
);

const visibleContacts = computed(() =>
  FELEGRAM_CONTACTS.filter((contact) => {
    if (props.hiddenContactIds?.includes(contact.id)) return false;
    if (contact.id === 'aide' && !props.aideUnlocked) return false;
    return true;
  }),
);

function contactOutcomeText(contact: FelegramContactScript): string {
  return props.contactOutcomeOverrides?.[contact.id] ?? contact.outcome;
}

type InboxRow = {
  key: SessionKey;
  kind: 'dm' | 'group';
  name: string;
  preview: string;
  time: string;
  unread: number;
  pending: boolean;
  memberCount?: number;
  memberIds?: FelegramContactId[];
  contact?: FelegramContactScript;
  group?: FelegramGroupScript;
};

const inboxRows = computed<InboxRow[]>(() => {
  const groupRows: InboxRow[] = FELEGRAM_GROUPS.filter(
    (group) => group.id !== 'family' || familyJoined.value,
  ).map((group) => {
    const thread = threads[group.id];
    const last = thread.messages[thread.messages.length - 1];
    const memberIds =
      group.id === 'family' ? familyMemberIds.value : group.memberIds;
    return {
      key: group.id,
      kind: 'group' as const,
      name: group.title,
      preview: felegramPreviewText(last ? chatToStored(last) : undefined),
      time: thread.updatedAtLabel || group.time,
      unread: felegramUnreadCount(localToSnapshot(thread)),
      pending: isGroupPending(group),
      memberCount: memberIds.length + 1,
      memberIds,
      group,
    };
  });

  const dmRows: InboxRow[] = visibleContacts.value.map((contact) => {
    const thread = threads[contact.id];
    const last = thread.messages[thread.messages.length - 1];
    return {
      key: contact.id,
      kind: 'dm' as const,
      name: contact.name,
      preview: felegramPreviewText(last ? chatToStored(last) : undefined),
      time: thread.updatedAtLabel || contact.time,
      unread: felegramUnreadCount(localToSnapshot(thread)),
      pending: isContactPending(contact),
      contact,
    };
  });

  return [...groupRows, ...dmRows].sort((a, b) => {
    const priorityA = FELEGRAM_INBOX_PRIORITY[a.key] ?? 0;
    const priorityB = FELEGRAM_INBOX_PRIORITY[b.key] ?? 0;
    if (priorityA !== priorityB) return priorityB - priorityA;
    if (a.pending !== b.pending) return a.pending ? -1 : 1;
    const unreadA = a.unread > 0;
    const unreadB = b.unread > 0;
    if (unreadA !== unreadB) return unreadA ? -1 : 1;
    return threads[b.key].updatedAtMs - threads[a.key].updatedAtMs;
  });
});

const contactChatLocked = computed(() => {
  if (activeSession.value?.kind === 'group') return false;
  if (!activeContact.value) return false;
  return !isContactAvailable(activeContact.value.id);
});

const contactLockMessage = computed(() => {
  const id = activeContact.value?.id;
  if (id === 'media') {
    if (!props.aideBriefingCompleted) {
      return '先和幕僚把情况聊清楚，再来找他们。';
    }
    return '先和工会领袖把补偿谈妥，再来找媒体部。';
  }
  if (id === 'union' || id === 'vance') {
    return '先和幕僚把情况聊清楚，再来找他们。';
  }
  return '先完成当前指引的对话。';
});

const canSend = computed(
  () =>
    !props.locked &&
    !contactChatLocked.value &&
    Boolean(activeSession.value) &&
    Boolean(activeThread.value) &&
    !activeThread.value!.waiting &&
    draft.value.trim().length > 0,
);

function savedReplyCount(contactId: FelegramContactId): number {
  return props.threads[threadIdFor(contactId)]?.replyCount ?? 0;
}

function aideBriefingBeatCount(): number {
  return props.aideActOverride?.beats.length ?? AIDE_BRIEFING_ACT.beats.length;
}

function isBriefingContactDone(contactId: FelegramContactId): boolean {
  if (contactId === 'aide') {
    return (
      props.aideBriefingCompleted ||
      Math.max(threads.aide.replyCount, props.threads.aide?.replyCount ?? 0) >=
        aideBriefingBeatCount()
    );
  }
  const contact = FELEGRAM_CONTACTS.find((item) => item.id === contactId)!;
  const count = Math.max(threads[contactId].replyCount, savedReplyCount(contactId));
  return count >= contact.beats.length;
}

/** Progressive unlock: aide → union/vance → media. Hidden union skips union gate. */
function isContactAvailable(contactId: FelegramContactId): boolean {
  if (contactId === 'aide') return Boolean(props.aideUnlocked);
  if (contactId === 'union' || contactId === 'vance') {
    return Boolean(props.aideBriefingCompleted);
  }
  if (contactId === 'media') {
    const needUnion = !props.hiddenContactIds?.includes('union');
    return (
      Boolean(props.aideBriefingCompleted) &&
      (!needUnion || isBriefingContactDone('union'))
    );
  }
  return true;
}

function isContactScriptDone(contact: FelegramContactScript): boolean {
  if (contact.id === 'aide' && props.aidePhase === 'briefing') {
    return isBriefingContactDone('aide');
  }
  const count = Math.max(threads[contact.id].replyCount, savedReplyCount(contact.id));
  return count >= contact.beats.length;
}

function isContactPending(contact: FelegramContactScript): boolean {
  if (!isContactAvailable(contact.id)) return false;

  if (contact.id === 'aide') {
    if (props.aidePhase === 'investigation') {
      return !isContactScriptDone(resolveAideContact('investigation'));
    }
    if (props.aideBriefingCompleted) return false;
    return !isBriefingContactDone('aide');
  }

  return !isContactScriptDone(contact);
}

function isGroupPending(group: FelegramGroupScript): boolean {
  const count = Math.max(
    threads[group.id].replyCount,
    props.threads[group.id]?.replyCount ?? 0,
  );
  return count < group.beats.length;
}

function allRequiredContactsDone(): boolean {
  return (
    isBriefingContactDone('aide') &&
    isBriefingContactDone('union') &&
    isBriefingContactDone('media')
  );
}

function clearReplyTimer() {
  if (replyTimer !== null) {
    clearTimeout(replyTimer);
    replyTimer = null;
  }
}

function resetAideThreadForPhase(phase: AidePhase) {
  clearReplyTimer();
  typing.value = false;
  aideThreadPhase = phase;
  const next = hydrateSession('aide');
  threads.aide.messages = next.messages;
  threads.aide.replyCount = next.replyCount;
  threads.aide.lastReadMessageId = next.lastReadMessageId;
  threads.aide.updatedAtLabel = next.updatedAtLabel;
  threads.aide.updatedAtMs = next.updatedAtMs;
  threads.aide.waiting = false;
}

watch(
  () => props.aidePhase,
  (phase) => {
    if (phase === aideThreadPhase) return;
    resetAideThreadForPhase(phase);
  },
);

watch(
  () => props.threads,
  () => {
    for (const key of sessionKeys) {
      syncSessionFromProps(key);
    }
  },
  { deep: true },
);

async function openInboxRow(row: InboxRow) {
  if (row.kind === 'group' && row.group) {
    await openGroup(row.group);
    return;
  }
  if (row.contact) {
    await openChat(row.contact);
  }
}

async function openGroup(group: FelegramGroupScript) {
  if (props.locked || navLocked.value) return;
  navLocked.value = true;
  clearReplyTimer();
  typing.value = false;
  const session: ActiveSession = { kind: 'group', id: group.id };
  activeSession.value = session;

  const marked = markFelegramThreadRead(localToSnapshot(threads[group.id]));
  threads[group.id].lastReadMessageId = marked.lastReadMessageId;
  commitSession(session);
  if (group.id === 'family') emit('familyOpen');
  emit('threadFocus', group.id);

  view.value = 'chat';
  showChatLayer.value = true;
  await nextTick();
  await playPush(contactsRef.value, chatRef.value);
  showContactsLayer.value = false;
  navLocked.value = false;
  scrollThread();
}

async function openChat(contact: FelegramContactScript) {
  if (props.locked || navLocked.value) return;
  navLocked.value = true;
  clearReplyTimer();
  typing.value = false;
  const session: ActiveSession = { kind: 'dm', id: contact.id };
  activeSession.value = session;

  const marked = markFelegramThreadRead(localToSnapshot(threads[contact.id]));
  threads[contact.id].lastReadMessageId = marked.lastReadMessageId;
  commitSession(session);
  emit('threadFocus', felegramThreadIdFor(contact.id, props.aidePhase));

  view.value = 'chat';
  showChatLayer.value = true;
  await nextTick();
  await playPush(contactsRef.value, chatRef.value);
  showContactsLayer.value = false;
  navLocked.value = false;
  scrollThread();
}

/** Parent bottom "返回": chat → contacts (consumed), contacts → leave app. */
async function goBack(): Promise<boolean> {
  if (view.value === 'chat') {
    if (navLocked.value) return true;
    navLocked.value = true;
    clearReplyTimer();
    typing.value = false;
    if (activeSession.value) {
      const session = activeSession.value;
      const key = sessionKey(session);
      threads[key].waiting = false;
      const marked = markFelegramThreadRead(localToSnapshot(threads[key]));
      threads[key].lastReadMessageId = marked.lastReadMessageId;
      commitSession(session);
    }
    showContactsLayer.value = true;
    await nextTick();
    await playPop(chatRef.value, contactsRef.value);
    activeSession.value = null;
    view.value = 'contacts';
    showChatLayer.value = false;
    emit('threadFocus', null);
    navLocked.value = false;
    return true;
  }
  return false;
}

async function openFamilyGroup() {
  const group = FELEGRAM_GROUPS.find((item) => item.id === 'family');
  if (!group) return;
  if (isThreadOpen('family')) {
    scrollThread();
    return;
  }
  await openGroup(group);
}

async function openThread(threadId: FelegramThreadId) {
  if (threadId === 'family') {
    await openFamilyGroup();
    return;
  }
  if (isThreadOpen(threadId)) {
    scrollThread();
    return;
  }
  const contact = FELEGRAM_CONTACTS.find((item) => item.id === threadId);
  if (contact) {
    await openChat(buildContactScript(contact.id));
    return;
  }
  if (threadId === 'aide-investigation') {
    await openChat(buildContactScript('aide'));
  }
}

function isFamilyChatOpen() {
  return isThreadOpen('family');
}

function isThreadOpen(threadId: FelegramThreadId) {
  if (view.value !== 'chat' || !activeSession.value) return false;
  if (threadId === 'family') {
    return activeSession.value.kind === 'group' && activeSession.value.id === 'family';
  }
  if (threadId === 'aide-investigation') {
    return (
      activeSession.value.kind === 'dm' &&
      activeSession.value.id === 'aide' &&
      props.aidePhase === 'investigation'
    );
  }
  return activeSession.value.kind === 'dm' && activeSession.value.id === threadId;
}

defineExpose({ goBack, openFamilyGroup, openThread, isFamilyChatOpen, isThreadOpen });

function resolveCaseOption(player: string, reply: string): NegotiationOption {
  return {
    id: 'demo-personal',
    label: '个人好处演示线',
    playerMessage: player,
    unionReply: reply,
    tone: 'personal',
  };
}

function touchThread(thread: ThreadState) {
  const now = new Date();
  thread.updatedAtMs = now.getTime();
  thread.updatedAtLabel = formatFelegramClock(now);
}

async function sendMessage() {
  if (!canSend.value || !activeSession.value || !activeThread.value) return;

  if (activeSession.value.kind === 'group') {
    await sendGroupMessage();
    return;
  }

  await sendDmMessage();
}

async function sendDmMessage() {
  if (!activeContact.value || !activeThread.value || !activeSession.value) return;

  const contact = activeContact.value;
  const thread = activeThread.value;
  const session = activeSession.value;
  const text = draft.value.trim();
  draft.value = '';

  const { player, replies, scriptComplete } = pickFelegramReply(
    contact,
    text,
    thread.replyCount,
  );

  thread.messages.push({
    id: nextId('me'),
    role: 'me',
    text: player,
  });
  touchThread(thread);
  thread.waiting = true;
  commitSession(session);
  await nextTick();
  scrollThread();

  clearReplyTimer();
  typing.value = true;
  await nextTick();
  scrollThread();

  const firstDelayMs = 1100 + Math.floor(Math.random() * 900);
  replyTimer = setTimeout(() => {
    void deliverNpcReplies(contact, thread, session, player, replies, scriptComplete);
  }, firstDelayMs);
}

async function sendGroupMessage() {
  if (!activeGroup.value || !activeThread.value || !activeSession.value) return;

  const group = activeGroup.value;
  const thread = activeThread.value;
  const session = activeSession.value;
  const text = draft.value.trim();
  draft.value = '';

  const { player, replies, scriptComplete } = pickFelegramGroupReply(
    group,
    text,
    thread.replyCount,
  );

  thread.messages.push({
    id: nextId('me'),
    role: 'me',
    text: player,
  });
  touchThread(thread);
  thread.waiting = true;
  commitSession(session);
  await nextTick();
  scrollThread();

  clearReplyTimer();
  typing.value = true;
  await nextTick();
  scrollThread();

  const firstDelayMs = 900 + Math.floor(Math.random() * 700);
  replyTimer = setTimeout(() => {
    void deliverGroupReplies(group, thread, session, replies, scriptComplete);
  }, firstDelayMs);
}

async function deliverNpcReplies(
  contact: FelegramContactScript,
  thread: ThreadState,
  session: ActiveSession,
  player: string,
  replies: FelegramBubble[],
  scriptComplete: boolean,
) {
  replyTimer = null;

  for (let index = 0; index < replies.length; index += 1) {
    const bubble = replies[index]!;
    typing.value = false;
    thread.messages.push(toThreadMessage(bubble));
    touchThread(thread);
    await nextTick();
    scrollThread();

    const hasMore = index < replies.length - 1;
    if (!hasMore) break;

    typing.value = true;
    await nextTick();
    scrollThread();
    await waitMs(650 + Math.floor(Math.random() * 550));
  }

  thread.replyCount += 1;

  if (scriptComplete) {
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: contactOutcomeText(contact),
    });
  }

  if (activeSession.value && sessionKey(activeSession.value) === sessionKey(session)) {
    thread.lastReadMessageId =
      thread.messages[thread.messages.length - 1]?.id ?? thread.lastReadMessageId;
  }

  commitSession(session);

  if (scriptComplete && contact.id === 'aide') {
    emit('aideComplete', props.aidePhase);
  }

  if (
    scriptComplete &&
    (contact.id === 'union' || contact.id === 'media' || contact.id === 'aide') &&
    allRequiredContactsDone() &&
    !caseEmitted.value &&
    !props.completed &&
    // 周循环幕僚脚本自带 outcome 指引，不再叠港口案「发帖/颁布」收尾
    !(contact.id === 'aide' && props.aideActOverride)
  ) {
    caseEmitted.value = true;
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: '可发帖，随后去发布补偿法案',
    });
    if (activeSession.value && sessionKey(activeSession.value) === sessionKey(session)) {
      thread.lastReadMessageId =
        thread.messages[thread.messages.length - 1]?.id ?? thread.lastReadMessageId;
    }
    commitSession(session);
    const summary = replies
      .map((item) => (item.kind === 'text' ? item.text : '[表情包]'))
      .join('\n');
    emit('complete', resolveCaseOption(player, summary));
  }

  typing.value = false;
  thread.waiting = false;
  await nextTick();
  scrollThread();
}

async function deliverGroupReplies(
  group: FelegramGroupScript,
  thread: ThreadState,
  session: ActiveSession,
  replies: FelegramGroupReplyPart[],
  scriptComplete: boolean,
) {
  replyTimer = null;
  const beatIndex = thread.replyCount;

  for (let index = 0; index < replies.length; index += 1) {
    const bubble = replies[index]!;
    typing.value = false;
    thread.messages.push(toGroupThreadMessage(bubble));
    touchThread(thread);
    await nextTick();
    scrollThread();

    const hasMore = index < replies.length - 1;
    if (!hasMore) break;

    typing.value = true;
    await nextTick();
    scrollThread();
    await waitMs(500 + Math.floor(Math.random() * 450));
  }

  thread.replyCount += 1;

  if (scriptComplete) {
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: group.outcome,
    });
  }

  emit('groupBeat', { groupId: group.id, beatIndex });

  if (activeSession.value && sessionKey(activeSession.value) === sessionKey(session)) {
    thread.lastReadMessageId =
      thread.messages[thread.messages.length - 1]?.id ?? thread.lastReadMessageId;
  }

  commitSession(session);
  typing.value = false;
  thread.waiting = false;
  await nextTick();
  scrollThread();
}

function toThreadMessage(bubble: FelegramBubble): ChatMessage {
  if (bubble.kind === 'sticker') {
    return {
      id: nextId('them'),
      role: 'them',
      stickerId: bubble.id,
      stickerSrc: STICKER_SRC[bubble.id],
    };
  }

  return {
    id: nextId('them'),
    role: 'them',
    text: bubble.text,
  };
}

function toGroupThreadMessage(part: FelegramGroupReplyPart): ChatMessage {
  if ('senderId' in part) {
    if ('stickerId' in part) {
      return {
        id: nextId('them'),
        role: 'them',
        senderId: part.senderId,
        senderName: felegramContactDisplayName(part.senderId),
        stickerId: part.stickerId,
        stickerSrc: STICKER_SRC[part.stickerId],
      };
    }
    return {
      id: nextId('them'),
      role: 'them',
      senderId: part.senderId,
      senderName: felegramContactDisplayName(part.senderId),
      text: part.text,
    };
  }
  return {
    id: nextId('sys'),
    role: 'system',
    text: part.text,
  };
}

function waitMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    replyTimer = setTimeout(() => {
      replyTimer = null;
      resolve();
    }, ms);
  });
}

function onInputKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    void sendMessage();
  }
}

function scrollThread() {
  const el = threadRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
}

function unreadLabel(count: number): string {
  if (count > 99) return '99+';
  return String(count);
}

type AvatarPlace = {
  initial: string;
  tone: 'aide' | 'union' | 'vance' | 'media' | 'player' | 'group' | 'unknown';
  src?: string;
};

const PLAYER_AVATAR: AvatarPlace = {
  initial: '总',
  tone: 'player',
  src: playerAvatarSrc,
};

function avatarForContact(contactId: FelegramContactId): AvatarPlace {
  const src = CONTACT_AVATAR_SRC[contactId];
  const base =
    contactId === 'aide'
      ? ({ initial: '幕', tone: 'aide' } as const)
      : contactId === 'union'
        ? ({ initial: '工', tone: 'union' } as const)
        : contactId === 'vance'
          ? ({ initial: '旺', tone: 'vance' } as const)
          : contactId === 'media'
            ? ({ initial: '媒', tone: 'media' } as const)
            : ({ initial: '?', tone: 'unknown' } as const);
  return src ? { ...base, src } : { ...base };
}

function avatarForInboxRow(row: InboxRow): AvatarPlace {
  if (row.kind === 'group') return { initial: '族', tone: 'group' };
  return avatarForContact(row.contact!.id);
}

function groupAvatarMemberIds(row: InboxRow): FelegramContactId[] {
  const ids = row.memberIds ?? row.group?.memberIds ?? [];
  return ids.slice(0, 3);
}

function openInvitePanel() {
  if (!showAddMemberButton.value) return;
  inviteDraft.value = [];
  invitePanelOpen.value = true;
}

function closeInvitePanel() {
  invitePanelOpen.value = false;
  inviteDraft.value = [];
}

function toggleInviteCandidate(candidate: InviteCandidate) {
  if (candidate.inGroup || !candidate.invitable) return;
  if (inviteDraft.value.includes(candidate.id)) {
    inviteDraft.value = inviteDraft.value.filter((id) => id !== candidate.id);
    return;
  }
  inviteDraft.value = [...inviteDraft.value, candidate.id];
}

async function confirmInvite() {
  if (!canConfirmInvite.value || !activeThread.value) return;
  const selected = [...inviteDraft.value];
  emit('inviteFamilyMembers', selected);
  closeInvitePanel();

  const thread = threads.family;
  const session: ActiveSession = { kind: 'group', id: 'family' };
  for (const id of selected) {
    if (!FAMILY_GROUP_INVITABLE_IDS.includes(id)) continue;
    const name = felegramContactDisplayName(id);
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: `你邀请 ${name} 加入了群聊`,
    });
    touchThread(thread);
    await nextTick();
    scrollThread();
    await waitMs(400);
    thread.messages.push({
      id: nextId('them'),
      role: 'them',
      senderId: id,
      senderName: name,
      text: '到了。',
    });
    touchThread(thread);
    await nextTick();
    scrollThread();
  }
  if (activeSession.value?.kind === 'group') {
    thread.lastReadMessageId =
      thread.messages[thread.messages.length - 1]?.id ?? thread.lastReadMessageId;
  }
  commitSession(session);
}

function avatarForMessage(message: ChatMessage): AvatarPlace | null {
  if (message.role === 'system') return null;
  if (message.role === 'me') return PLAYER_AVATAR;
  if (message.senderId) return avatarForContact(message.senderId);
  if (activeContact.value) return avatarForContact(activeContact.value.id);
  return { initial: '?', tone: 'unknown' };
}

type ThreadMessageView = ChatMessage & { avatar: AvatarPlace | null };

const threadMessages = computed<ThreadMessageView[]>(() => {
  if (!activeThread.value) return [];
  return activeThread.value.messages.map((message) => ({
    ...message,
    avatar: avatarForMessage(message),
  }));
});

const typingAvatar = computed<AvatarPlace>(() => {
  if (activeGroup.value) return { initial: '…', tone: 'group' };
  if (activeContact.value) return avatarForContact(activeContact.value.id);
  return { initial: '?', tone: 'unknown' };
});

onBeforeUnmount(() => {
  clearReplyTimer();
  killPhoneMotion();
});
</script>

<template>
  <div class="ml-felegram" :class="[`is-${view}`, { 'is-nav-locked': navLocked }]">
    <div
      v-show="showContactsLayer"
      ref="contactsRef"
      class="ml-felegram__layer ml-felegram__contacts"
    >
      <header class="ml-felegram__contacts-head">
        <span class="ml-felegram__contacts-menu" aria-hidden="true" />
        <h1 class="ml-felegram__contacts-title">
          消息
          <span class="ml-felegram__contacts-dot" aria-hidden="true" />
        </h1>
        <span class="ml-felegram__contacts-add" aria-hidden="true">+</span>
      </header>

      <div class="ml-felegram__contacts-search" aria-hidden="true">
        <span class="ml-felegram__contacts-search-icon" />
        <span>搜索</span>
      </div>

      <div v-if="props.locked" class="ml-felegram__guard">
        <p>{{ props.guardMessage }}</p>
      </div>

      <div v-else class="ml-felegram__list" aria-label="消息列表">
        <button
          v-for="row in inboxRows"
          :key="row.key"
          type="button"
          class="ml-felegram__row"
          :class="{ 'is-pending': row.pending, 'is-group': row.kind === 'group' }"
          @click="openInboxRow(row)"
        >
          <span class="ml-felegram__avatar-wrap">
            <span
              class="ml-felegram__avatar"
              :class="[
                `ml-felegram__avatar--${avatarForInboxRow(row).tone}`,
                {
                  'ml-felegram__avatar--group': row.kind === 'group',
                  'has-photo': row.kind !== 'group' && Boolean(avatarForInboxRow(row).src),
                },
              ]"
              aria-hidden="true"
            >
            <template v-if="row.kind === 'group'">
              <span
                v-for="memberId in groupAvatarMemberIds(row)"
                :key="memberId"
                class="ml-felegram__avatar-cell"
                :class="[
                  `ml-felegram__avatar-cell--${avatarForContact(memberId).tone}`,
                  { 'has-photo': Boolean(avatarForContact(memberId).src) },
                ]"
              >
                <img
                  v-if="avatarForContact(memberId).src"
                  class="ml-felegram__avatar-cell-img"
                  :src="avatarForContact(memberId).src"
                  alt=""
                  draggable="false"
                />
                <template v-else>{{ avatarForContact(memberId).initial }}</template>
              </span>
              <span
                class="ml-felegram__avatar-cell ml-felegram__avatar-cell--player"
                :class="{ 'has-photo': Boolean(PLAYER_AVATAR.src) }"
              >
                <img
                  v-if="PLAYER_AVATAR.src"
                  class="ml-felegram__avatar-cell-img"
                  :src="PLAYER_AVATAR.src"
                  alt=""
                  draggable="false"
                />
                <template v-else>{{ PLAYER_AVATAR.initial }}</template>
              </span>
            </template>
              <img
                v-else-if="avatarForInboxRow(row).src"
                class="ml-felegram__avatar-img"
                :src="avatarForInboxRow(row).src"
                alt=""
                draggable="false"
              />
              <span v-else class="ml-felegram__avatar-initial">
                {{ avatarForInboxRow(row).initial }}
              </span>
            </span>
            <span
              v-if="row.unread > 0"
              class="ml-felegram__row-badge ml-felegram__row-badge--count"
              :aria-label="`${row.unread} 条未读`"
            >
              {{ unreadLabel(row.unread) }}
            </span>
            <span
              v-else-if="row.pending"
              class="ml-felegram__row-badge"
              aria-label="待回复"
            />
          </span>
          <span class="ml-felegram__row-main">
            <span class="ml-felegram__row-top">
              <span class="ml-felegram__row-name">
                {{ row.name }}
                <span v-if="row.memberCount" class="ml-felegram__row-count">
                  ({{ row.memberCount }})
                </span>
              </span>
              <span class="ml-felegram__row-time">{{ row.time }}</span>
            </span>
            <span class="ml-felegram__row-preview">{{ row.preview }}</span>
          </span>
        </button>
      </div>

      <nav class="ml-felegram__contacts-nav" aria-hidden="true">
        <span class="is-active" />
        <span />
        <span />
        <span />
      </nav>
    </div>

    <div
      v-show="showChatLayer && activeSession && activeThread"
      ref="chatRef"
      class="ml-felegram__layer ml-felegram__chat"
      :class="{ 'is-group-chat': Boolean(activeGroup) }"
    >
      <img class="ml-felegram__base" :src="chatBase" alt="" draggable="false" />

      <button
        type="button"
        class="ml-felegram__back-hit"
        aria-label="返回消息列表"
        @click="goBack"
      />

      <button
        v-if="showAddMemberButton"
        type="button"
        class="ml-felegram__more-hit"
        aria-label="添加成员"
        @click="openInvitePanel"
      />

      <div v-if="activeSession" class="ml-felegram__peer">
        <span
          class="ml-felegram__peer-dot"
          :class="{ 'is-group': Boolean(activeGroup) }"
          aria-hidden="true"
        />
        <div class="ml-felegram__peer-copy">
          <h2 class="ml-felegram__peer-name">{{ activePeerTitle }}</h2>
          <p v-if="activePeerSubtitle" class="ml-felegram__peer-sub">
            {{ activePeerSubtitle }}
          </p>
        </div>
      </div>

      <div v-if="props.locked" class="ml-felegram__guard">
        <p>{{ props.guardMessage }}</p>
      </div>

      <div v-else-if="contactChatLocked" class="ml-felegram__guard">
        <p>{{ contactLockMessage }}</p>
      </div>

      <template v-else-if="activeThread">
        <div ref="threadRef" class="ml-felegram__thread">
          <TransitionGroup name="ml-bubble" tag="div" class="ml-felegram__thread-list">
            <div
              v-for="message in threadMessages"
              :key="message.id"
              class="ml-felegram__msg"
              :class="{
                'ml-felegram__msg--in': message.role === 'them',
                'ml-felegram__msg--out': message.role === 'me',
                'ml-felegram__msg--system': message.role === 'system',
                'ml-felegram__msg--named': Boolean(message.senderName),
              }"
            >
              <span
                v-if="message.avatar"
                class="ml-felegram__face"
                :class="[
                  `ml-felegram__face--${message.avatar.tone}`,
                  { 'has-photo': Boolean(message.avatar.src) },
                ]"
                aria-hidden="true"
              >
                <img
                  v-if="message.avatar.src"
                  class="ml-felegram__face-img"
                  :src="message.avatar.src"
                  alt=""
                  draggable="false"
                />
                <template v-else>{{ message.avatar.initial }}</template>
              </span>

              <div class="ml-felegram__msg-body">
                <span
                  v-if="message.senderName && message.role === 'them'"
                  class="ml-felegram__sender"
                >
                  {{ message.senderName }}
                </span>
                <div
                  class="ml-felegram__bubble"
                  :class="{
                    'ml-felegram__bubble--in':
                      message.role === 'them' && !message.stickerSrc,
                    'ml-felegram__bubble--out': message.role === 'me',
                    'ml-felegram__bubble--system': message.role === 'system',
                    'ml-felegram__bubble--sticker': Boolean(message.stickerSrc),
                  }"
                >
                  <img
                    v-if="message.stickerSrc"
                    class="ml-felegram__sticker"
                    :src="message.stickerSrc"
                    alt="表情包"
                    draggable="false"
                  />
                  <div
                    v-else-if="message.role !== 'system'"
                    class="ml-felegram__bubble-inner"
                  >
                    {{ message.text }}
                  </div>
                  <p v-else class="ml-felegram__status">{{ message.text }}</p>
                </div>
              </div>
            </div>
          </TransitionGroup>

          <div v-if="typing" class="ml-felegram__typing-row" aria-live="polite">
            <span
              class="ml-felegram__face"
              :class="[
                `ml-felegram__face--${typingAvatar.tone}`,
                { 'has-photo': Boolean(typingAvatar.src) },
              ]"
              aria-hidden="true"
            >
              <img
                v-if="typingAvatar.src"
                class="ml-felegram__face-img"
                :src="typingAvatar.src"
                alt=""
                draggable="false"
              />
              <template v-else>{{ typingAvatar.initial }}</template>
            </span>
            <div class="ml-felegram__typing">
              <span /><span /><span />
            </div>
          </div>
        </div>

        <div class="ml-felegram__composer">
          <textarea
            v-model="draft"
            class="ml-felegram__input"
            rows="1"
            :placeholder="
              activeThread.waiting
                ? '对方正在输入…'
                : activeGroup
                  ? '发到家族群，回车发送…'
                  : '输入内容后回车发送…'
            "
            :disabled="activeThread.waiting"
            aria-label="输入消息，回车发送"
            @keydown="onInputKeydown"
          />
        </div>
      </template>

      <div
        v-if="invitePanelOpen"
        class="ml-felegram__invite"
        role="dialog"
        aria-label="添加群成员"
      >
        <div class="ml-felegram__invite-card">
          <header class="ml-felegram__invite-head">
            <h3>添加成员</h3>
            <button type="button" @click="closeInvitePanel">关闭</button>
          </header>
          <ul class="ml-felegram__invite-list">
            <li v-for="candidate in inviteCandidates" :key="candidate.id">
              <button
                type="button"
                class="ml-felegram__invite-row"
                :class="{
                  'is-selected': inviteDraft.includes(candidate.id),
                  'is-disabled': candidate.inGroup || !candidate.invitable,
                }"
                :disabled="candidate.inGroup || !candidate.invitable"
                @click="toggleInviteCandidate(candidate)"
              >
                <span
                  class="ml-felegram__face"
                  :class="[
                    `ml-felegram__face--${avatarForContact(candidate.id).tone}`,
                    { 'has-photo': Boolean(avatarForContact(candidate.id).src) },
                  ]"
                >
                  <img
                    v-if="avatarForContact(candidate.id).src"
                    class="ml-felegram__face-img"
                    :src="avatarForContact(candidate.id).src"
                    alt=""
                    draggable="false"
                  />
                  <template v-else>{{ avatarForContact(candidate.id).initial }}</template>
                </span>
                <span class="ml-felegram__invite-name">{{ candidate.name }}</span>
                <span class="ml-felegram__invite-state">
                  {{
                    candidate.inGroup
                      ? '已在群'
                      : candidate.invitable
                        ? inviteDraft.includes(candidate.id)
                          ? '已选'
                          : '可邀请'
                        : '暂不可邀'
                  }}
                </span>
              </button>
            </li>
          </ul>
          <button
            type="button"
            class="ml-felegram__invite-confirm"
            :disabled="!canConfirmInvite"
            @click="confirmInvite"
          >
            确认邀请
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-felegram {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #f2f2f2;
}

.ml-felegram.is-nav-locked {
  pointer-events: none;
}

.ml-felegram__layer {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}

.ml-felegram__chat {
  z-index: 2;
}

/* Invisible hit over baked-in back chevron (no extra icon). */
.ml-felegram__back-hit {
  position: absolute;
  left: 1.5%;
  top: 3.2%;
  width: 12%;
  height: 5.8%;
  z-index: 6;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.ml-felegram__back-hit:hover,
.ml-felegram__back-hit:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

/* Invisible hit over baked-in top-right ⋯ (no extra icon). */
.ml-felegram__more-hit {
  position: absolute;
  right: 1.5%;
  top: 3.2%;
  width: 12%;
  height: 5.8%;
  z-index: 6;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
}

.ml-felegram__more-hit:hover,
.ml-felegram__more-hit:focus-visible {
  background: rgba(255, 255, 255, 0.06);
  outline: none;
}

.ml-felegram__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

/* Cover baked-in "SECURE CHAT LOG" with the live contact / group title. */
.ml-felegram__peer {
  position: absolute;
  left: 14%;
  right: 14%;
  top: 5.8%;
  height: 3.6%;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: #000;
  pointer-events: none;
  overflow: visible;
}

.ml-felegram__chat.is-group-chat .ml-felegram__peer {
  height: 5.2%;
  top: 5.2%;
}

.ml-felegram__peer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e6b0;
  box-shadow: 0 0 6px rgba(0, 230, 176, 0.65);
}

.ml-felegram__peer-dot.is-group {
  border-radius: 1px;
  background: #f2f2f2;
  box-shadow: none;
}

.ml-felegram__peer-copy {
  min-width: 0;
  max-width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.ml-felegram__peer-name {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 0.92rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: #f2f2f2;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.ml-felegram__peer-sub {
  margin: 0;
  font-family: var(--yp-font-sans);
  font-size: 0.58rem;
  letter-spacing: 0.08em;
  color: rgba(242, 242, 242, 0.5);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.ml-felegram__guard {
  position: absolute;
  inset: 22% 8% 28%;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.82);
  border: 1px dashed rgba(184, 149, 98, 0.4);
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.55;
  color: rgba(215, 188, 126, 0.95);
}

/*
 * Contacts view is pure CSS — no base PNG — so baked-in avatars can never duplicate.
 */
.ml-felegram__contacts {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  background: #000;
  color: #f2f2f2;
}

.ml-felegram__contacts-head {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  min-height: 52px;
  padding: 14px 12px 6px;
}

.ml-felegram__contacts-menu {
  width: 22px;
  height: 14px;
  margin-left: 8px;
  background: linear-gradient(
    #f2f2f2 0 2px,
    transparent 2px 6px,
    #f2f2f2 6px 8px,
    transparent 8px 12px,
    #f2f2f2 12px 14px
  );
}

.ml-felegram__contacts-title {
  margin: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-family: var(--yp-font-sans);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}

.ml-felegram__contacts-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #00e6b0;
  box-shadow: 0 0 6px rgba(0, 230, 176, 0.7);
}

.ml-felegram__contacts-add {
  justify-self: end;
  margin-right: 6px;
  width: 28px;
  height: 28px;
  border: 1.5px solid rgba(242, 242, 242, 0.85);
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 1.1rem;
  line-height: 1;
  color: #f2f2f2;
}

.ml-felegram__contacts-search {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 8px 14px 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: #1a1a1a;
  color: rgba(242, 242, 242, 0.45);
  font-size: 0.92rem;
}

.ml-felegram__contacts-search-icon {
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(242, 242, 242, 0.45);
  border-radius: 50%;
  position: relative;
  flex: 0 0 auto;
}

.ml-felegram__contacts-search-icon::after {
  content: '';
  position: absolute;
  right: -4px;
  bottom: -3px;
  width: 7px;
  height: 1.5px;
  background: rgba(242, 242, 242, 0.45);
  transform: rotate(40deg);
  transform-origin: left center;
}

.ml-felegram__list {
  min-height: 0;
  overflow: auto;
  background: #000;
}

.ml-felegram__row {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  align-items: center;
  column-gap: 12px;
  width: 100%;
  min-height: 76px;
  margin: 0;
  padding: 10px 18px 10px 14px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  background: #000;
  box-sizing: border-box;
  cursor: pointer;
  text-align: left;
  color: #f2f2f2;
}

.ml-felegram__row.is-pending {
  background: #0a0a0a;
}

.ml-felegram__row:hover,
.ml-felegram__row:focus-visible {
  background: #111;
  outline: none;
}

.ml-felegram__avatar-wrap {
  position: relative;
  width: 48px;
  height: 48px;
  justify-self: center;
  flex: 0 0 auto;
}

.ml-felegram__avatar {
  width: 48px;
  height: 48px;
  border: 1.5px solid rgba(242, 242, 242, 0.55);
  border-radius: 50%;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: #2a2a2a;
}

.ml-felegram__avatar.has-photo {
  border-color: rgba(242, 242, 242, 0.35);
  background: #1a1a1a;
}

.ml-felegram__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.ml-felegram__avatar--aide {
  background: #3d5a4c;
}
.ml-felegram__avatar--union {
  background: #5a4632;
}
.ml-felegram__avatar--vance {
  background: #3a4a5c;
}
.ml-felegram__avatar--media {
  background: #5a3d4a;
}
.ml-felegram__avatar--player {
  background: #4a3f2a;
}
.ml-felegram__avatar--group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 2px;
  padding: 3px;
  border-radius: 12px;
  background: #141414;
}
.ml-felegram__avatar--unknown {
  background: #333;
}

.ml-felegram__avatar-initial {
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #f2f2f2;
  line-height: 1;
}

.ml-felegram__avatar-cell {
  display: grid;
  place-items: center;
  border-radius: 3px;
  box-sizing: border-box;
  font-family: var(--yp-font-sans);
  font-size: 0.55rem;
  font-weight: 600;
  color: #f2f2f2;
  line-height: 1;
  background: #333;
  overflow: hidden;
}

.ml-felegram__avatar-cell.has-photo {
  padding: 0;
  border-radius: 50%;
  background: transparent;
}

.ml-felegram__avatar-cell-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
  border-radius: 50%;
}

.ml-felegram__avatar-cell--aide {
  background: #3d5a4c;
}
.ml-felegram__avatar-cell--union {
  background: #5a4632;
}
.ml-felegram__avatar-cell--vance {
  background: #3a4a5c;
}
.ml-felegram__avatar-cell--media {
  background: #5a3d4a;
}
.ml-felegram__avatar-cell--player {
  background: #4a3f2a;
}

.ml-felegram__row-badge {
  position: absolute;
  top: -3px;
  right: -3px;
  z-index: 2;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff3b30;
  box-shadow: 0 0 0 2px #000;
  pointer-events: none;
}

.ml-felegram__row-badge--count {
  top: -5px;
  right: -5px;
  width: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--yp-font-sans);
  font-size: 0.62rem;
  font-weight: 600;
  line-height: 1;
  color: #fff;
  box-sizing: border-box;
  border-radius: 999px;
}

.ml-felegram__row-main {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 4px;
}

.ml-felegram__row-top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
}

.ml-felegram__row-name {
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: #f2f2f2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-felegram__row-count {
  margin-left: 4px;
  font-size: 0.78rem;
  font-weight: 400;
  letter-spacing: 0.02em;
  color: rgba(242, 242, 242, 0.45);
}

.ml-felegram__row-time {
  flex: 0 0 auto;
  font-family: var(--yp-font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: rgba(242, 242, 242, 0.55);
  white-space: nowrap;
}

.ml-felegram__row-preview {
  font-family: var(--yp-font-sans);
  font-size: 0.78rem;
  line-height: 1.35;
  letter-spacing: 0.02em;
  color: rgba(242, 242, 242, 0.52);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ml-felegram__contacts-nav {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: end;
  justify-items: center;
  min-height: 64px;
  padding: 10px 18px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.ml-felegram__contacts-nav > span {
  width: 22px;
  height: 22px;
  border: 1.5px solid rgba(242, 242, 242, 0.75);
  border-radius: 6px;
  opacity: 0.55;
}

.ml-felegram__contacts-nav > span.is-active {
  opacity: 1;
  border-radius: 50%;
  box-shadow: 0 10px 0 -7px #f2f2f2;
}

.ml-felegram__thread {
  position: absolute;
  left: 4%;
  right: 4%;
  top: 10.5%;
  bottom: 14%;
  z-index: 2;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 6px 12px 4px;
}

.ml-felegram__thread-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ml-felegram__msg {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.ml-felegram__msg--named {
  align-items: flex-start;
}

.ml-felegram__msg--named .ml-felegram__face {
  margin-top: 16px;
}

.ml-felegram__msg--in {
  justify-content: flex-start;
}

.ml-felegram__msg--out {
  /* row-reverse puts avatar on the right; flex-start packs toward the right edge */
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.ml-felegram__msg--system {
  justify-content: center;
}

.ml-felegram__msg-body {
  display: flex;
  min-width: 0;
  max-width: calc(88% - 36px);
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.ml-felegram__msg--out .ml-felegram__msg-body {
  align-items: flex-end;
}

.ml-felegram__msg--system .ml-felegram__msg-body {
  max-width: 100%;
  align-items: center;
}

.ml-felegram__face {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-family: var(--yp-font-sans);
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #f2f2f2;
  line-height: 1;
  border: 1px solid rgba(242, 242, 242, 0.35);
  box-sizing: border-box;
  background: #2a2a2a;
  overflow: hidden;
}

.ml-felegram__face.has-photo {
  background: #1a1a1a;
}

.ml-felegram__face-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.ml-felegram__face--aide {
  background: #3d5a4c;
}
.ml-felegram__face--union {
  background: #5a4632;
}
.ml-felegram__face--vance {
  background: #3a4a5c;
}
.ml-felegram__face--media {
  background: #5a3d4a;
}
.ml-felegram__face--player {
  background: #4a3f2a;
}
.ml-felegram__face--group {
  background: #2f3540;
}
.ml-felegram__face--unknown {
  background: #333;
}

.ml-felegram__bubble {
  max-width: 100%;
  min-height: 44px;
  background: transparent;
  border-radius: var(--yp-frame-chat-bubble-radius);
  font-size: 0.82rem;
  line-height: 1.5;
}

.ml-felegram__sender {
  margin: 0;
  padding: 0 2px;
  font-family: var(--yp-font-sans);
  font-size: 0.68rem;
  letter-spacing: 0.04em;
  line-height: 1.2;
  color: rgba(242, 242, 242, 0.55);
}

.ml-felegram__bubble-inner {
  padding: var(--yp-frame-chat-bubble-safe) calc(var(--yp-frame-chat-bubble-safe) + 4px);
}

/*
 * Solid CSS fill instead of border-image nine-slice:
 * stretched chat-bubble PNGs show vertical seams at slice junctions.
 * Colors sampled from 聊天框.png / 聊天框-出站.png center fill.
 */
.ml-felegram__bubble--in {
  background: #1f2023;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04);
}

.ml-felegram__bubble--out {
  background: #1a433e;
  box-shadow: inset 0 0 0 1px rgba(125, 255, 208, 0.08);
}

.ml-felegram__bubble--system {
  align-self: center;
  min-height: 0;
  max-width: 100%;
  background: transparent;
  box-shadow: none;
}

.ml-felegram__bubble--sticker {
  min-height: 0;
  max-width: 46%;
  background: transparent;
  box-shadow: none;
}

.ml-felegram__sticker {
  display: block;
  width: 100%;
  height: auto;
  border-radius: 12px;
  user-select: none;
  pointer-events: none;
}

.ml-felegram__status {
  margin: 0;
  font-size: 0.78rem;
  color: rgba(125, 255, 208, 0.95);
  text-align: center;
}

.ml-felegram__typing-row {
  align-self: stretch;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  justify-content: flex-start;
}

.ml-felegram__typing {
  display: inline-flex;
  gap: 5px;
  padding: 10px 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
}

.ml-felegram__typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(242, 242, 242, 0.65);
  animation: ml-typing 1.1s ease-in-out infinite;
}

.ml-felegram__typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.ml-felegram__typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes ml-typing {
  0%,
  80%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }
  40% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

.ml-bubble-enter-active {
  transition:
    opacity 0.28s ease,
    transform 0.32s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-bubble-leave-active {
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
}

.ml-bubble-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.96);
}

.ml-bubble-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.ml-felegram__composer {
  position: absolute;
  left: 16.4%;
  right: 25.6%;
  top: 93.55%;
  bottom: 2.55%;
  z-index: 3;
  display: flex;
  align-items: center;
}

.ml-felegram__invite {
  position: absolute;
  inset: 0;
  z-index: 8;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(0, 0, 0, 0.72);
}

.ml-felegram__invite-card {
  width: min(100%, 320px);
  max-height: 78%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(242, 242, 242, 0.22);
  border-radius: 14px;
  background: #0d0d0d;
  box-sizing: border-box;
}

.ml-felegram__invite-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.ml-felegram__invite-head h3 {
  margin: 0;
  font-family: var(--yp-font-sans);
  font-size: 0.95rem;
  font-weight: 600;
  letter-spacing: 0.06em;
}

.ml-felegram__invite-head button {
  color: rgba(242, 242, 242, 0.7);
  font-size: 0.78rem;
  cursor: pointer;
}

.ml-felegram__invite-list {
  margin: 0;
  padding: 0;
  list-style: none;
  overflow: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ml-felegram__invite-row {
  width: 100%;
  display: grid;
  grid-template-columns: 28px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid rgba(242, 242, 242, 0.14);
  border-radius: 10px;
  background: #141414;
  color: #f2f2f2;
  text-align: left;
  cursor: pointer;
}

.ml-felegram__invite-row.is-selected {
  border-color: rgba(0, 230, 176, 0.55);
  background: #10241f;
}

.ml-felegram__invite-row.is-disabled {
  opacity: 0.45;
  cursor: default;
}

.ml-felegram__invite-name {
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
}

.ml-felegram__invite-state {
  font-family: var(--yp-font-sans);
  font-size: 0.68rem;
  color: rgba(242, 242, 242, 0.5);
}

.ml-felegram__invite-confirm {
  height: 38px;
  border: 0;
  border-radius: 10px;
  background: #1a433e;
  color: #f2f2f2;
  font-family: var(--yp-font-sans);
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  cursor: pointer;
}

.ml-felegram__invite-confirm:disabled {
  opacity: 0.4;
  cursor: default;
}

.ml-felegram__input {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 4px 12px 0;
  border: 0;
  border-radius: 8px;
  background: #000;
  color: #f2f2f2;
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
  line-height: 1.3;
  resize: none;
  overflow: hidden;
}

.ml-felegram__input:focus {
  outline: none;
}

.ml-felegram__input:disabled {
  opacity: 0.65;
}

.ml-felegram__input::placeholder {
  color: rgba(242, 242, 242, 0.4);
}
</style>
