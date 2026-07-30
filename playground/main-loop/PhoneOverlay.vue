<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { APP_MOCKUPS } from './data';
import type {
  NegotiationOption,
  FtubeEpisode,
  AidePhase,
  PhoneAppId,
  FelegramContactId,
  FelegramFamilyGroupState,
  FelegramGroupId,
  FelegramThreadId,
  FelegramThreadSnapshot,
} from './casePortStrike';
import FtubeScreen from './FtubeScreen.vue';
import FelegramChat from './FelegramChat.vue';
import FApp from './FApp.vue';
import GreenhoodScreen from './GreenhoodScreen.vue';
import type { GreenhoodStore } from './useGreenhood';
import type { GreenhoodSymbolId } from './greenhoodMarket';
import phoneBase from './assets/phone-ui-base.png';
import iconFelegram from './assets/app-felegram.png';
import iconGreenhood from './assets/app-greenhood.png';
import iconF from './assets/app-f.png';
import iconFtube from './assets/app-ftube.png';
import {
  clearMotionProps,
  killPhoneMotion,
  playBackToHome,
  playFade,
  playIconTap,
  playLaunchApp,
  playPhoneClose,
  playPhoneOpen,
  playShake,
} from './phoneMotion';
import gsap from 'gsap';

const props = defineProps<{
  open: boolean;
  initialApp?: PhoneAppId | null;
  appBadges?: Partial<Record<PhoneAppId, boolean>>;
  ftubeWatched?: boolean;
  ftubeEpisode?: FtubeEpisode;
  reopenWatched?: boolean;
  dmCompleted?: boolean;
  aideUnlocked?: boolean;
  aideBriefingCompleted?: boolean;
  aidePhase?: AidePhase;
  felegramThreads?: Record<FelegramThreadId, FelegramThreadSnapshot>;
  familyGroup?: FelegramFamilyGroupState;
  familyTechTipRaised?: boolean;
  tweetPosted?: boolean;
  canClose?: boolean;
  guardForApp?: (app: PhoneAppId) => string | null;
  hiddenContactIds?: FelegramContactId[];
  contactOutcomeOverrides?: Partial<Record<FelegramContactId, string>>;
  aideActOverride?: import('./casePortStrike').FelegramAideAct | null;
  contactScriptOverrides?: Partial<
    Record<FelegramContactId, import('./casePortStrike').FelegramContactScript>
  >;
  greenhoodStore?: GreenhoodStore;
  chipPostAvailable?: boolean;
  chipPosted?: boolean;
  /** 调水门等脚本帖一键填写 */
  autofillPostText?: string;
  initialFelegramThread?: FelegramThreadId | null;
}>();

const emit = defineEmits<{
  close: [];
  closeBlocked: [];
  ftubeWatched: [];
  reopenWatched: [];
  negotiationComplete: [option: NegotiationOption];
  aideComplete: [phase: AidePhase];
  felegramThreadUpdate: [
    payload: { threadId: FelegramThreadId; snapshot: FelegramThreadSnapshot },
  ];
  inviteFamilyMembers: [contactIds: FelegramContactId[]];
  groupBeat: [payload: { groupId: FelegramGroupId; beatIndex: number }];
  greenhoodBuy: [symbolId: GreenhoodSymbolId];
  greenhoodSell: [symbolId: GreenhoodSymbolId];
  greenhoodRefresh: [symbolId: GreenhoodSymbolId];
  tweetPosted: [content: string];
  chipPost: [content: string];
  familyOpen: [];
  hotSearchSeen: [];
  felegramThreadFocus: [threadId: FelegramThreadId | null];
  felegramThreadNavigated: [];
}>();

const APP_ICONS: Record<PhoneAppId, string> = {
  felegram: iconFelegram,
  greenhood: iconGreenhood,
  f: iconF,
  ftube: iconFtube,
};

const visible = ref(false);
const navLocked = ref(false);
/** True while phone overlay is mounting / playing open intro — blocks deep-link races. */
const phoneBooting = ref(false);
const activeApp = ref<PhoneAppId | null>(null);
const showHomeLayer = ref(true);
const showAppLayer = ref(false);

const rootRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLButtonElement | null>(null);
const deviceRef = ref<HTMLElement | null>(null);
const homeRef = ref<HTMLElement | null>(null);
const appRef = ref<HTMLElement | null>(null);
const felegramRef = ref<{
  goBack: () => Promise<boolean>;
  openFamilyGroup: () => Promise<void>;
  openThread: (threadId: FelegramThreadId) => Promise<void>;
  isFamilyChatOpen: () => boolean;
  isThreadOpen: (threadId: FelegramThreadId) => boolean;
} | null>(null);
const ftubeRef = ref<{ goBack: () => Promise<boolean> } | null>(null);

const isImmersiveApp = computed(() => activeApp.value !== null);
const bottomActionLabel = computed(() => (activeApp.value ? '返回' : '关闭'));

async function navigateFelegramThread(threadId: FelegramThreadId) {
  if (activeApp.value !== 'felegram') {
    await openApp('felegram');
  }
  await nextTick();
  await felegramRef.value?.openThread(threadId);
  emit('felegramThreadNavigated');
}

watch(
  () => [props.open, props.initialFelegramThread, phoneBooting.value] as const,
  async ([isOpen, threadId, booting]) => {
    if (!isOpen || booting || !threadId) return;
    await runNav(() => navigateFelegramThread(threadId));
  },
);

function onFtubeWatched() {
  if (props.ftubeEpisode === 'reopen') {
    emit('reopenWatched');
  } else {
    emit('ftubeWatched');
  }
}

async function runNav<T>(fn: () => Promise<T>): Promise<T | undefined> {
  if (navLocked.value) return undefined;
  navLocked.value = true;
  try {
    return await fn();
  } finally {
    navLocked.value = false;
  }
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      phoneBooting.value = true;
      visible.value = true;

      const deepLink = props.initialApp ?? null;
      activeApp.value = deepLink;
      showHomeLayer.value = deepLink === null;
      showAppLayer.value = deepLink !== null;

      try {
        await nextTick();
        await playPhoneOpen(backdropRef.value, deviceRef.value);

        // Crisis / deep-link opens an app immediately. Ensure the app layer is visible —
        // a racing playLaunchApp can be killed by playPhoneOpen and leave opacity at 0 (black screen).
        if (deepLink && appRef.value) {
          clearMotionProps(appRef.value);
          gsap.set(appRef.value, { opacity: 1, clearProps: 'transform' });
        }
      } finally {
        phoneBooting.value = false;
      }
      return;
    }

    if (visible.value && !navLocked.value) {
      visible.value = false;
      phoneBooting.value = false;
      resetPhoneState();
    }
  },
  { immediate: true },
);

watch(
  () => props.initialApp,
  (app) => {
    if (phoneBooting.value || navLocked.value) return;
    if (props.open && app && activeApp.value !== app) {
      void runNav(() => openApp(app));
    }
  },
);

function resetPhoneState() {
  activeApp.value = null;
  showHomeLayer.value = true;
  showAppLayer.value = false;
}

onBeforeUnmount(() => {
  killPhoneMotion();
});

function iconOriginFromEvent(event: MouseEvent): { xPercent: number; yPercent: number } | undefined {
  const target = event.currentTarget as HTMLElement | null;
  const device = deviceRef.value;
  if (!target || !device) return undefined;

  const icon = target.querySelector('.ml-phone__icon-wrap');
  if (!icon) return undefined;

  const iconRect = icon.getBoundingClientRect();
  const deviceRect = device.getBoundingClientRect();
  return {
    xPercent: ((iconRect.left + iconRect.width / 2 - deviceRect.left) / deviceRect.width) * 100,
    yPercent: ((iconRect.top + iconRect.height / 2 - deviceRect.top) / deviceRect.height) * 100,
  };
}

async function openApp(id: PhoneAppId, event?: MouseEvent) {
  if (activeApp.value === id) return;

  const origin = event ? iconOriginFromEvent(event) : undefined;

  if (event) {
    const icon = (event.currentTarget as HTMLElement)?.querySelector('.ml-phone__icon');
    if (icon instanceof HTMLElement) {
      await playIconTap(icon);
    }
  }

  activeApp.value = id;
  showAppLayer.value = true;
  // Hide desktop before zoom so icons never appear to shrink underneath.
  showHomeLayer.value = false;

  await nextTick();
  await playLaunchApp(homeRef.value, appRef.value, origin);
}

async function backHome() {
  if (!activeApp.value) return;

  // Exit app first while still immersive, then restore home chrome size, then fade icons in.
  await playBackToHome(null, appRef.value);

  showAppLayer.value = false;
  activeApp.value = null;
  showHomeLayer.value = true;
  await nextTick();

  if (homeRef.value) {
    homeRef.value.style.transform = '';
    homeRef.value.style.opacity = '0';
    await playFade([homeRef.value], 1);
  }
}

async function tryClose() {
  if (props.canClose === false) {
    emit('closeBlocked');
    await playShake(deviceRef.value);
    return;
  }

  await playPhoneClose(backdropRef.value, deviceRef.value);
  resetPhoneState();
  visible.value = false;
  emit('close');
}

function close() {
  if (navLocked.value) return;
  void runNav(tryClose);
}

async function onBottomAction() {
  if (!activeApp.value) {
    await tryClose();
    return;
  }

  if (activeApp.value === 'felegram' && (await felegramRef.value?.goBack())) {
    return;
  }

  if (activeApp.value === 'ftube' && (await ftubeRef.value?.goBack())) {
    return;
  }

  await backHome();
}

function onTweetPost(content: string) {
  emit('tweetPosted', content);
}

function onChipPost(content: string) {
  emit('chipPost', content);
}

function onHotSearchSeen() {
  emit('hotSearchSeen');
}

function guardMessage(app: PhoneAppId): string | undefined {
  return props.guardForApp?.(app) ?? undefined;
}

function onAppClick(id: PhoneAppId, event: MouseEvent) {
  void runNav(() => openApp(id, event));
}

function onBottomClick() {
  void runNav(onBottomAction);
}
</script>

<template>
  <div
    v-if="visible"
    ref="rootRef"
    class="ml-phone"
    :class="{ 'is-nav-locked': navLocked, 'is-booting': phoneBooting }"
    role="dialog"
    aria-label="总统手机"
  >
    <button
      ref="backdropRef"
      type="button"
      class="ml-phone__backdrop"
      aria-label="关闭"
      @click="close"
    />

    <div class="ml-phone__frame">
      <div
        ref="deviceRef"
        class="ml-phone__device"
        :class="{ 'is-immersive-app': isImmersiveApp }"
      >
        <img
          v-show="!isImmersiveApp"
          class="ml-phone__base"
          :src="phoneBase"
          alt=""
          draggable="false"
        />

        <div class="ml-phone__screen">
          <div
            v-show="showHomeLayer"
            ref="homeRef"
            class="ml-phone__layer ml-phone__apps"
          >
            <button
              v-for="(app, id) in APP_MOCKUPS"
              :key="id"
              type="button"
              class="ml-phone__app"
              @click="onAppClick(id as PhoneAppId, $event)"
            >
              <span class="ml-phone__icon-wrap">
                <img
                  class="ml-phone__icon"
                  :src="APP_ICONS[id as PhoneAppId]"
                  :alt="app.title"
                  draggable="false"
                />
                <span
                  v-if="props.appBadges?.[id as PhoneAppId]"
                  class="ml-phone__badge"
                  aria-hidden="true"
                />
              </span>
              <span class="ml-phone__label">{{ app.title }}</span>
            </button>
          </div>

          <div
            v-show="showAppLayer"
            ref="appRef"
            class="ml-phone__layer ml-phone__app-view is-immersive"
          >
            <FtubeScreen
              v-if="activeApp === 'ftube'"
              ref="ftubeRef"
              :locked="Boolean(guardMessage('ftube'))"
              :episode="props.ftubeEpisode ?? 'crisis'"
              :ftube-watched="Boolean(props.ftubeWatched)"
              :reopen-watched="Boolean(props.reopenWatched)"
              :interactive="!phoneBooting"
              :guard-message="guardMessage('ftube')"
              @watched="onFtubeWatched"
            />

            <FelegramChat
              v-show="activeApp === 'felegram'"
              ref="felegramRef"
              :locked="Boolean(guardMessage('felegram'))"
              :completed="Boolean(props.dmCompleted)"
              :aide-unlocked="Boolean(props.aideUnlocked)"
              :aide-briefing-completed="Boolean(props.aideBriefingCompleted)"
              :aide-phase="props.aidePhase ?? 'briefing'"
              :threads="props.felegramThreads"
              :family-group="props.familyGroup"
              :family-tech-tip-raised="Boolean(props.familyTechTipRaised)"
              :guard-message="guardMessage('felegram')"
              :hidden-contact-ids="props.hiddenContactIds"
              :contact-outcome-overrides="props.contactOutcomeOverrides"
              :aide-act-override="props.aideActOverride"
              :contact-script-overrides="props.contactScriptOverrides"
              @complete="emit('negotiationComplete', $event)"
              @aide-complete="emit('aideComplete', $event)"
              @thread-update="emit('felegramThreadUpdate', $event)"
              @invite-family-members="emit('inviteFamilyMembers', $event)"
              @group-beat="emit('groupBeat', $event)"
              @family-open="emit('familyOpen')"
              @thread-focus="emit('felegramThreadFocus', $event)"
            />

            <FApp
              v-if="activeApp === 'f'"
              :locked="Boolean(guardMessage('f'))"
              :posted="Boolean(props.tweetPosted)"
              :chip-post-available="Boolean(props.chipPostAvailable)"
              :chip-posted="Boolean(props.chipPosted)"
              :autofill-post-text="props.autofillPostText"
              :guard-message="guardMessage('f')"
              @post="onTweetPost"
              @chip-post="onChipPost"
              @hot-search-seen="onHotSearchSeen"
            />

            <GreenhoodScreen
              v-if="activeApp === 'greenhood' && props.greenhoodStore"
              :store="props.greenhoodStore"
              :locked="Boolean(guardMessage('greenhood'))"
              :guard-message="guardMessage('greenhood') ?? undefined"
              @buy="emit('greenhoodBuy', $event)"
              @sell="emit('greenhoodSell', $event)"
              @refresh="emit('greenhoodRefresh', $event)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pinned to overlay bottom (not below the phone) so stage overflow cannot clip it. -->
    <button type="button" class="ml-phone__close" @click="onBottomClick">
      {{ bottomActionLabel }}
    </button>
  </div>
</template>

<style scoped>
.ml-phone {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  /* Top: clear HUD. Bottom: reserved strip for the pinned 返回/关闭 control. */
  padding:
    calc(var(--yp-hud-safe-top) + var(--yp-hud-top-time-min-h) + 8px)
    12px
    56px
    12px;
}

.ml-phone.is-nav-locked .ml-phone__screen,
.ml-phone.is-booting .ml-phone__screen {
  pointer-events: none;
}

.ml-phone__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.62);
  cursor: pointer;
}

.ml-phone__frame {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.ml-phone__device {
  position: relative;
  /* Fit inside the padded frame; never spill into the bottom control strip. */
  width: min(420px, 100%);
  max-height: 100%;
  aspect-ratio: 9 / 16;
  height: auto;
  flex: 0 1 auto;
  filter: drop-shadow(0 18px 40px rgba(0, 0, 0, 0.55));
  will-change: transform, opacity;
}

.ml-phone__device.is-immersive-app {
  background: #000;
  border-radius: 36px;
}

.ml-phone__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  border-radius: 36px;
}

.ml-phone__screen {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 9.5%;
  bottom: 10%;
  z-index: 1;
  overflow: hidden;
}

.ml-phone__device.is-immersive-app .ml-phone__screen {
  inset: 0;
  border-radius: 36px;
}

.ml-phone__layer {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}

.ml-phone__apps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 28px 18px;
  padding: 28px 12px 0;
  justify-items: center;
}

.ml-phone__app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
  max-width: 148px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #f2f2f2;
  cursor: pointer;
}

.ml-phone__app:hover .ml-phone__icon,
.ml-phone__app:focus-visible .ml-phone__icon {
  transform: scale(1.06);
}

.ml-phone__icon-wrap {
  position: relative;
  display: inline-flex;
}

.ml-phone__icon {
  width: 92px;
  height: 92px;
  object-fit: contain;
  border-radius: 22px;
  transition: transform 0.15s ease;
  will-change: transform;
}

.ml-phone__badge {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #d75c5c;
  border: 2px solid rgba(12, 14, 16, 0.95);
  box-shadow: 0 0 8px rgba(215, 92, 92, 0.65);
}

.ml-phone__label {
  font-family: var(--yp-font-latin);
  font-size: 0.92rem;
  letter-spacing: 0.02em;
  text-align: center;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.85);
}

.ml-phone__app-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
  padding: 10px 6px;
  color: #f2f2f2;
}

.ml-phone__app-view.is-immersive {
  padding: 0;
  gap: 0;
}

.ml-phone__stack {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.ml-phone__stack-layer {
  position: absolute;
  inset: 0;
  will-change: transform, opacity;
}

.ml-phone__placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18% 8% 12%;
  box-sizing: border-box;
  background: #0a0a0a;
}

.ml-phone__app-view-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.ml-phone__app-view-icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  border-radius: 10px;
}

.ml-phone__app-view-head h3,
.ml-phone__placeholder h3 {
  margin: 0;
  font-family: var(--yp-font-serif);
  font-size: 1.2rem;
}

.ml-phone__placeholder p {
  margin: 0;
  font-size: 0.98rem;
  color: rgba(242, 242, 242, 0.72);
  line-height: 1.6;
}

.ml-phone__note {
  margin-top: auto !important;
  font-size: 0.85rem;
  color: rgba(242, 242, 242, 0.4) !important;
}

.ml-phone__close {
  position: absolute;
  left: 50%;
  bottom: 10px;
  transform: translateX(-50%);
  z-index: 40;
  flex: none;
  padding: 8px 22px;
  border: 1px solid rgba(184, 149, 98, 0.65);
  border-radius: 999px;
  background: rgba(12, 14, 16, 0.96);
  color: var(--yp-color-text-main);
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  letter-spacing: 0.08em;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.55);
  pointer-events: auto;
}

.ml-phone__close:hover {
  border-color: rgba(184, 149, 98, 0.75);
}
</style>
