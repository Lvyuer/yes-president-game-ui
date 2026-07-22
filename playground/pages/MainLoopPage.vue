<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import type { MainLoopScreen } from '../main-loop/data';
import type { SceneBackdropMode } from '../main-loop/sceneVideos';
import type { PhoneAppId, DeskTodoId, AidePhase } from '../main-loop/casePortStrike';
import MainLoopShell from '../main-loop/MainLoopShell.vue';
import MainHud from '../main-loop/MainHud.vue';
import MainScene from '../main-loop/MainScene.vue';
import MainActions from '../main-loop/MainActions.vue';
import PublishScreen from '../main-loop/PublishScreen.vue';
import InboxScreen from '../main-loop/InboxScreen.vue';
import NationScreen from '../main-loop/NationScreen.vue';
import PhoneOverlay from '../main-loop/PhoneOverlay.vue';
import CrisisNotice from '../main-loop/CrisisNotice.vue';
import CrisisImpactOverlay from '../main-loop/CrisisImpactOverlay.vue';
import AdvisorBillsNotice from '../main-loop/AdvisorBillsNotice.vue';
import TaskBoard from '../main-loop/TaskBoard.vue';
import SettlementOverlay from '../main-loop/SettlementOverlay.vue';
import SceneAlignDebug from '../main-loop/SceneAlignDebug.vue';
import type { ResourceRollState } from '../main-loop/MainHud.vue';
import type { SettlementPresentation } from '../main-loop/casePortStrike';
import { isAdvisorPreviewEnabled, isSceneAlignDebugEnabled, isSettlementPreviewEnabled } from '../main-loop/sceneAlignDebug';
import { usePortStrikeCase } from '../main-loop/usePortStrikeCase';
import {
  dimScene,
  fadeChrome,
  killScreenTransition,
  playEnter,
  playLeave,
  prepChromeForFadeIn,
} from '../main-loop/screenMotion';

type SecondaryScreen = Exclude<MainLoopScreen, 'main'>;

const portCase = usePortStrikeCase();

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
const advisorCueVisible = ref(false);
const publishCueVisible = ref(false);
const settlementOpen = ref(false);
const settlementPresentation = ref<SettlementPresentation | null>(null);
const resourceRoll = ref<ResourceRollState | null>(null);
const actionNotice = ref('');

let settlementCardTimer: ReturnType<typeof setTimeout> | null = null;
let resourceRollClearTimer: ReturnType<typeof setTimeout> | null = null;

const showDock = computed(
  () =>
    screen.value === 'main' &&
    !phoneOpen.value &&
    !phoneInputLocked.value &&
    portCase.introComplete.value,
);

const showHudSlot = computed(() => screen.value === 'main');

const inboxHighlightIds = computed(() => {
  if (!portCase.inboxHighlight.value) return undefined;
  return portCase.billIds.filter((id) => !portCase.signedBillIds.value.includes(id));
});

const dockHighlightAction = computed(() => {
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
    const reason = portCase.guardReasonForInbox();
    if (reason) {
      showActionNotice(portCase.guardMessage(reason));
      return;
    }
    advisorCueVisible.value = false;
  }

  if (id === 'publish') {
    const reason = portCase.guardReasonForPublish();
    if (reason) {
      showActionNotice(portCase.guardMessage(reason));
      return;
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

    if (leaving === 'publish' && portCase.publishHighlight.value) {
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
  if (portCase.advisorActive.value) {
    showActionNotice(portCase.guardMessage('advisor_not_ready'));
    return;
  }

  initialPhoneApp.value = app;
  phoneOpen.value = true;
  sceneMode.value = 'phone-start';
}

function closePhone() {
  if (!portCase.canClosePhone.value) {
    showActionNotice('先看看热搜，再退出手机。');
    return;
  }
  phoneOpen.value = false;
  initialPhoneApp.value = null;
  sceneMode.value = 'phone-end';
  phoneInputLocked.value = true;
}

function onCloseBlocked() {
  showActionNotice('先看看热搜，再退出手机。');
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

  const roll = resourceRoll.value;
  if (!roll) return;

  // 点确定后才开始顶栏收尾
  resourceRoll.value = {
    ...roll,
    outroToken: Date.now(),
  };

  resourceRollClearTimer = window.setTimeout(() => {
    resourceRoll.value = null;
    resourceRollClearTimer = null;
  }, roll.outroMs + 80);
}

function onSceneClipEnded() {
  if (sceneMode.value === 'phone-start') {
    sceneMode.value = 'phone-hold';
    return;
  }

  if (sceneMode.value === 'phone-end') {
    sceneMode.value = 'idle';
    phoneInputLocked.value = false;
    if (portCase.canSettle.value) {
      startSettlementPresentation();
      return;
    }
    if (startAdvisorArrival()) {
      return;
    }
    if (portCase.publishHighlight.value) {
      publishCueVisible.value = true;
    }
    return;
  }

  if (sceneMode.value === 'publish-end') {
    sceneMode.value = 'idle';
    phoneInputLocked.value = false;
    portCase.pushAideNotice();
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

  if (
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

function onReopenOpen() {
  openPhone(portCase.reopen.targetApp);
}

function onAideNoticeOpen() {
  openPhone(portCase.aideNotice.targetApp);
}

function onAdvisorCueOpen() {
  void openSecondary('inbox');
}

function onPublishCueOpen() {
  void openSecondary('publish');
}

function startAdvisorArrival(): boolean {
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
  if (phase === 'briefing') {
    portCase.completeAideBriefing();
    return;
  }
  portCase.completeAideChat();
}

function onFelegramProgress(payload: {
  contactId: 'union' | 'media' | 'vance' | 'aide';
  replyCount: number;
}) {
  portCase.setFelegramReplyCount(payload.contactId, payload.replyCount);
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

  openPhone(item.phoneApp ?? 'f');
}

function onTweetPosted() {
  portCase.postTweet();
}

function onHotSearchSeen() {
  portCase.markHotSearchSeen();
}

function guardForApp(app: PhoneAppId): string | null {
  const reason = portCase.guardReasonForApp(app);
  return reason ? portCase.guardMessage(reason) : null;
}

function inboxItemGuard(id: string): string | null {
  if (!portCase.isBillCaseRelevant(id)) return null;
  const reason = portCase.guardReasonForInbox();
  return reason ? portCase.guardMessage(reason) : null;
}

async function onPublish(_payload: { direction: string; body: string }) {
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
  const isCaseBill = portCase.isBillCaseRelevant(payload.id);
  const isSign = payload.decision.startsWith('签署');

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
    phoneInputLocked.value = false;
    portCase.completeIntro();
    portCase.primeSettlementPreview();
    playSettlementPresentation();
    return;
  }

  if (isAdvisorPreviewEnabled()) {
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
    phoneInputLocked.value = false;
    portCase.completeIntro();
    portCase.markFtubeWatched();
    initialPhoneApp.value = 'felegram';
    phoneOpen.value = true;
    sceneMode.value = 'phone-hold';
    return;
  }

  phoneInputLocked.value = false;
  portCase.completeIntro();
});

onBeforeUnmount(() => {
  clearSettlementTimers();
  killScreenTransition();
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
          :resources="resourceRoll?.from ?? portCase.resources.value"
          :resource-roll="resourceRoll"
          :feedback-pending="portCase.awaitingFeedback.value"
          :pending-label="portCase.pendingLabel"
        />
      </div>
    </template>

    <MainScene ref="mainSceneRef" v-show="screen === 'main'" class="ml-chrome">
      <CrisisNotice
        :visible="portCase.reopenVisible.value"
        :title="portCase.reopen.title"
        :message="portCase.reopen.message"
        :subline="portCase.reopen.subline"
        :notice-title="portCase.reopen.noticeTitle"
        :cta="portCase.reopen.cta"
        :tone="portCase.reopen.tone"
        aria-label="复工现场更新"
        @open="onReopenOpen"
        @dismiss="portCase.dismissReopenNotice()"
      />
      <CrisisNotice
        :visible="portCase.aideNoticeVisible.value"
        :title="portCase.aideNotice.title"
        :message="portCase.aideNotice.message"
        :subline="portCase.aideNotice.subline"
        :notice-title="portCase.aideNotice.noticeTitle"
        :cta="portCase.aideNotice.cta"
        :tone="portCase.aideNotice.tone"
        aria-label="幕僚消息推送"
        @open="onAideNoticeOpen"
        @dismiss="portCase.dismissAideNotice()"
      />
      <AdvisorBillsNotice
        :visible="publishCueVisible"
        :title="portCase.publishCue.title"
        :message="portCase.publishCue.message"
        :subline="portCase.publishCue.subline"
        :cta="portCase.publishCue.cta"
        @open="onPublishCueOpen"
      />
      <AdvisorBillsNotice
        :visible="advisorCueVisible"
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
      :showcase-direction-id="portCase.publishDraft.directionId"
      :showcase-body="portCase.publishDraft.body"
      @back="goMain"
      @publish="onPublish"
    />
    <InboxScreen
      v-if="screen === 'inbox'"
      ref="inboxScreenRef"
      :highlight-bill-ids="inboxHighlightIds"
      :signed-bill-ids="portCase.signedBillIds.value"
      :item-guard="inboxItemGuard"
      @back="goMain"
      @decide="onDecide"
    />
    <NationScreen
      v-if="screen === 'nation'"
      ref="nationScreenRef"
      :metrics="portCase.nationMetrics.value"
      :feedback-pending="portCase.awaitingFeedback.value"
      @back="goMain"
    />

    <template v-if="showDock" #actions>
      <div ref="dockChromeRef" class="ml-chrome ml-chrome--fill ml-chrome--dock">
        <MainActions :highlight-action="dockHighlightAction" @action="onAction" />
      </div>
    </template>

    <template #overlays>
      <CrisisImpactOverlay
        :open="portCase.crisisVisible.value && portCase.introComplete.value"
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
        :app-badges="portCase.appBadges.value"
        :ftube-episode="portCase.ftubeEpisode.value"
        :ftube-watched="portCase.ftubeWatched.value"
        :reopen-watched="portCase.reopenWatched.value"
        :dm-completed="portCase.dmCompleted.value"
        :aide-unlocked="portCase.aideUnlocked.value"
        :aide-briefing-completed="portCase.aideBriefingCompleted.value"
        :aide-phase="portCase.aidePhase.value"
        :felegram-reply-counts="portCase.felegramReplyCounts.value"
        :aide-investigation-reply-count="portCase.aideInvestigationReplyCount.value"
        :tweet-posted="portCase.tweetPosted.value"
        :can-close="portCase.canClosePhone.value"
        :guard-for-app="guardForApp"
        @close="closePhone"
        @close-blocked="onCloseBlocked"
        @ftube-watched="onFtubeWatched"
        @reopen-watched="onReopenWatched"
        @negotiation-complete="onNegotiationComplete"
        @aide-complete="onAideComplete"
        @felegram-progress="onFelegramProgress"
        @tweet-posted="onTweetPosted"
        @hot-search-seen="onHotSearchSeen"
      />
      <TaskBoard
        v-if="screen === 'main'"
        :items="portCase.deskTodos.value"
        @select="onDeskTodoSelect"
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
