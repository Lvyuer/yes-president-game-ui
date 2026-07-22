<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import {
  AIDE_BRIEFING_ACT,
  FELEGRAM_CONTACTS,
  buildFelegramHistory,
  pickFelegramReply,
  resolveAideContact,
  type AidePhase,
  type FelegramBubble,
  type FelegramContactId,
  type FelegramContactScript,
  type FelegramHistoryMessage,
  type FelegramStickerId,
  type NegotiationOption,
} from './casePortStrike';
import chatBase from './assets/felegram-chat-ui-base.png';
import stickerForTheWorkers from './assets/sticker-for-the-workers.png';
import stickerThisIsFine from './assets/sticker-this-is-fine.png';
import { killPhoneMotion, playPop, playPush } from './phoneMotion';

const props = withDefaults(
  defineProps<{
    locked: boolean;
    completed: boolean;
    /** When false, the aide contact stays hidden from the list. */
    aideUnlocked?: boolean;
    aideBriefingCompleted?: boolean;
    aidePhase?: AidePhase;
    /** Persisted reply progress from the case store (survives phone remounts). */
    replyCounts?: Partial<Record<FelegramContactId, number>>;
    /** Investigation-act reply progress (separate from briefing). */
    aideInvestigationReplyCount?: number;
    guardMessage?: string;
  }>(),
  {
    aideUnlocked: false,
    aideBriefingCompleted: false,
    aidePhase: 'briefing',
    replyCounts: () => ({}),
    aideInvestigationReplyCount: 0,
  },
);

const emit = defineEmits<{
  complete: [option: NegotiationOption];
  aideComplete: [phase: AidePhase];
  progress: [payload: { contactId: FelegramContactId; replyCount: number }];
}>();

type View = 'contacts' | 'chat';
type ChatRole = 'them' | 'me' | 'system';

type ChatMessage = {
  id: string;
  role: ChatRole;
  text?: string;
  stickerSrc?: string;
};

const STICKER_SRC: Record<FelegramStickerId, string> = {
  'for-the-workers': stickerForTheWorkers,
  'this-is-fine': stickerThisIsFine,
};

type ThreadState = {
  messages: ChatMessage[];
  replyCount: number;
  waiting: boolean;
};

const view = ref<View>('contacts');
const showContactsLayer = ref(true);
const showChatLayer = ref(false);
const navLocked = ref(false);
const activeContactId = ref<FelegramContactId | null>(null);
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

function savedReplyCount(contactId: FelegramContactId): number {
  if (contactId === 'aide' && props.aidePhase === 'investigation') {
    return props.aideInvestigationReplyCount ?? 0;
  }
  return props.replyCounts?.[contactId] ?? 0;
}

function historyToMessages(history: FelegramHistoryMessage[]): ChatMessage[] {
  return history.map((entry) => {
    if ('stickerId' in entry) {
      return {
        id: nextId('hist'),
        role: 'them' as const,
        stickerSrc: STICKER_SRC[entry.stickerId],
      };
    }
    return {
      id: nextId('hist'),
      role: entry.role,
      text: entry.text,
    };
  });
}

function buildContactScript(contactId: FelegramContactId): FelegramContactScript {
  if (contactId === 'aide') {
    return resolveAideContact(props.aidePhase);
  }
  return FELEGRAM_CONTACTS.find((item) => item.id === contactId)!;
}

function hydrateThread(contactId: FelegramContactId): ThreadState {
  const script = buildContactScript(contactId);
  const replyCount = savedReplyCount(contactId);
  return {
    messages: historyToMessages(buildFelegramHistory(script, replyCount)),
    replyCount,
    waiting: false,
  };
}

const threads = reactive<Record<FelegramContactId, ThreadState>>(
  Object.fromEntries(
    FELEGRAM_CONTACTS.map((contact) => [contact.id, hydrateThread(contact.id)]),
  ) as Record<FelegramContactId, ThreadState>,
);

const activeContact = computed(() =>
  activeContactId.value ? buildContactScript(activeContactId.value) : null,
);

const activeThread = computed(() =>
  activeContactId.value ? threads[activeContactId.value] : null,
);

const visibleContacts = computed(() =>
  FELEGRAM_CONTACTS.filter(
    (contact) => contact.id !== 'aide' || Boolean(props.aideUnlocked),
  ),
);

const contactChatLocked = computed(() => {
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
    Boolean(activeContact.value) &&
    Boolean(activeThread.value) &&
    !activeThread.value!.waiting &&
    draft.value.trim().length > 0,
);

function isBriefingContactDone(contactId: FelegramContactId): boolean {
  if (contactId === 'aide') {
    return (
      props.aideBriefingCompleted ||
      Math.max(threads.aide.replyCount, props.replyCounts?.aide ?? 0) >=
        AIDE_BRIEFING_ACT.beats.length
    );
  }
  const contact = FELEGRAM_CONTACTS.find((item) => item.id === contactId)!;
  const count = Math.max(threads[contactId].replyCount, savedReplyCount(contactId));
  return count >= contact.beats.length;
}

/** Progressive unlock: aide → union/vance → media. */
function isContactAvailable(contactId: FelegramContactId): boolean {
  if (contactId === 'aide') return Boolean(props.aideUnlocked);
  if (contactId === 'union' || contactId === 'vance') {
    return Boolean(props.aideBriefingCompleted);
  }
  if (contactId === 'media') {
    return Boolean(props.aideBriefingCompleted) && isBriefingContactDone('union');
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
  const next = hydrateThread('aide');
  threads.aide.messages = next.messages;
  threads.aide.replyCount = next.replyCount;
  threads.aide.waiting = false;
}

watch(
  () => props.aidePhase,
  (phase) => {
    if (phase === aideThreadPhase) return;
    resetAideThreadForPhase(phase);
  },
);

async function openChat(contact: FelegramContactScript) {
  if (props.locked || navLocked.value) return;
  navLocked.value = true;
  clearReplyTimer();
  typing.value = false;
  activeContactId.value = contact.id;
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
    if (activeContactId.value) {
      threads[activeContactId.value].waiting = false;
    }
    showContactsLayer.value = true;
    await nextTick();
    await playPop(chatRef.value, contactsRef.value);
    activeContactId.value = null;
    view.value = 'contacts';
    showChatLayer.value = false;
    navLocked.value = false;
    return true;
  }
  return false;
}

defineExpose({ goBack });

function resolveCaseOption(player: string, reply: string): NegotiationOption {
  return {
    id: 'demo-personal',
    label: '个人好处演示线',
    playerMessage: player,
    unionReply: reply,
    tone: 'personal',
  };
}

async function sendMessage() {
  if (!canSend.value || !activeContact.value || !activeThread.value) return;

  const contact = activeContact.value;
  const thread = activeThread.value;
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
    text,
  });
  thread.waiting = true;
  await nextTick();
  scrollThread();

  clearReplyTimer();
  typing.value = true;
  await nextTick();
  scrollThread();

  const firstDelayMs = 1100 + Math.floor(Math.random() * 900);
  replyTimer = setTimeout(() => {
    void deliverNpcReplies(contact, thread, player, replies, scriptComplete);
  }, firstDelayMs);
}

async function deliverNpcReplies(
  contact: FelegramContactScript,
  thread: ThreadState,
  player: string,
  replies: FelegramBubble[],
  scriptComplete: boolean,
) {
  replyTimer = null;

  for (let index = 0; index < replies.length; index += 1) {
    const bubble = replies[index]!;
    typing.value = false;
    thread.messages.push(toThreadMessage(bubble));
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
  emit('progress', { contactId: contact.id, replyCount: thread.replyCount });

  if (scriptComplete) {
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: contact.outcome,
    });
  }

  if (scriptComplete && contact.id === 'aide') {
    emit('aideComplete', props.aidePhase);
  }

  if (
    scriptComplete &&
    (contact.id === 'union' || contact.id === 'media' || contact.id === 'aide') &&
    allRequiredContactsDone() &&
    !caseEmitted.value &&
    !props.completed
  ) {
    caseEmitted.value = true;
    thread.messages.push({
      id: nextId('sys'),
      role: 'system',
      text: '可发推，随后去发布补偿法案',
    });
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

function toThreadMessage(bubble: FelegramBubble): ChatMessage {
  if (bubble.kind === 'sticker') {
    return {
      id: nextId('them'),
      role: 'them',
      stickerSrc: STICKER_SRC[bubble.id],
    };
  }

  return {
    id: nextId('them'),
    role: 'them',
    text: bubble.text,
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
          v-for="contact in visibleContacts"
          :key="contact.id"
          type="button"
          class="ml-felegram__row"
          @click="openChat(contact)"
        >
          <span class="ml-felegram__avatar" aria-hidden="true">
            <span class="ml-felegram__avatar-head" />
            <span class="ml-felegram__avatar-body" />
            <span
              v-if="isContactPending(contact)"
              class="ml-felegram__row-badge"
              aria-label="未回复完"
            />
          </span>
          <span class="ml-felegram__row-name">{{ contact.name }}</span>
          <span class="ml-felegram__row-time">{{ contact.time }}</span>
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
      v-show="showChatLayer && activeContact && activeThread"
      ref="chatRef"
      class="ml-felegram__layer ml-felegram__chat"
    >
      <img class="ml-felegram__base" :src="chatBase" alt="" draggable="false" />

      <button
        type="button"
        class="ml-felegram__back-hit"
        aria-label="返回消息列表"
        @click="goBack"
      />

      <div v-if="activeContact" class="ml-felegram__peer">
        <span class="ml-felegram__peer-dot" aria-hidden="true" />
        <h2 class="ml-felegram__peer-name">{{ activeContact.name }}</h2>
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
              v-for="message in activeThread.messages"
              :key="message.id"
              class="ml-felegram__bubble"
              :class="{
                'yp-framed yp-framed--chat-bubble ml-felegram__bubble--in':
                  message.role === 'them' && !message.stickerSrc,
                'yp-framed yp-framed--chat-bubble-out ml-felegram__bubble--out':
                  message.role === 'me',
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
                class="yp-framed__content ml-felegram__bubble-inner"
              >
                {{ message.text }}
              </div>
              <p v-else class="ml-felegram__status">{{ message.text }}</p>
            </div>
          </TransitionGroup>

          <div v-if="typing" class="ml-felegram__typing" aria-live="polite">
            <span /><span /><span />
          </div>
        </div>

        <div class="ml-felegram__composer">
          <textarea
            v-model="draft"
            class="ml-felegram__input"
            rows="1"
            :placeholder="activeThread.waiting ? '对方正在输入…' : '输入内容后回车发送…'"
            :disabled="activeThread.waiting"
            aria-label="输入消息，回车发送"
            @keydown="onInputKeydown"
          />
        </div>
      </template>
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

.ml-felegram__peer {
  position: absolute;
  left: 18%;
  right: 18%;
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
}

.ml-felegram__peer-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #00e6b0;
  box-shadow: 0 0 6px rgba(0, 230, 176, 0.65);
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
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  column-gap: 12px;
  width: 100%;
  min-height: 76px;
  margin: 0;
  padding: 0 18px 0 14px;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.16);
  background: #000;
  box-sizing: border-box;
  cursor: pointer;
  text-align: left;
  color: #f2f2f2;
}

.ml-felegram__row:hover,
.ml-felegram__row:focus-visible {
  background: #111;
  outline: none;
}

.ml-felegram__avatar {
  position: relative;
  width: 48px;
  height: 48px;
  justify-self: center;
  border: 1.5px solid rgba(242, 242, 242, 0.9);
  border-radius: 50%;
  box-sizing: border-box;
}

.ml-felegram__avatar-head {
  position: absolute;
  left: 50%;
  top: 22%;
  width: 14px;
  height: 14px;
  border: 1.5px solid rgba(242, 242, 242, 0.9);
  border-radius: 50%;
  transform: translateX(-50%);
  box-sizing: border-box;
}

.ml-felegram__avatar-body {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 24px;
  height: 14px;
  border: 1.5px solid rgba(242, 242, 242, 0.9);
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
  transform: translateX(-50%);
  box-sizing: border-box;
}

.ml-felegram__row-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #ff3b30;
  box-shadow: 0 0 0 2px #000;
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

.ml-felegram__row-time {
  font-family: var(--yp-font-sans);
  font-size: 0.75rem;
  letter-spacing: 0.02em;
  color: rgba(242, 242, 242, 0.55);
  white-space: nowrap;
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
  padding: 8px 4px 12px;
}

.ml-felegram__thread-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ml-felegram__bubble {
  max-width: 88%;
  min-height: 44px;
  background: transparent;
  border-radius: var(--yp-frame-chat-bubble-radius);
  font-size: 0.82rem;
  line-height: 1.5;
}

.ml-felegram__bubble-inner {
  padding: var(--yp-frame-chat-bubble-safe) calc(var(--yp-frame-chat-bubble-safe) + 4px);
}

.ml-felegram__bubble--in {
  align-self: flex-start;
}

.ml-felegram__bubble--out {
  align-self: flex-end;
}

.ml-felegram__bubble--system {
  align-self: center;
  min-height: 0;
  max-width: 100%;
}

.ml-felegram__bubble--sticker {
  align-self: flex-start;
  min-height: 0;
  max-width: 46%;
  background: transparent;
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

.ml-felegram__typing {
  align-self: flex-start;
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

/* Sit inside the chrome input slot between mic and emoji. */
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
