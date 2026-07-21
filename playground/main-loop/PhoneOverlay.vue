<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { APP_MOCKUPS } from './data';
import type { NegotiationOption } from './casePortStrike';
import type { PhoneAppId } from './casePortStrike';
import FtubeScreen from './FtubeScreen.vue';
import FelegramChat from './FelegramChat.vue';
import FSocialPost from './FSocialPost.vue';
import FHotSearch from './FHotSearch.vue';
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
  playPush,
  playShake,
} from './phoneMotion';
import gsap from 'gsap';

type FAppView = 'compose' | 'hotsearch';

const props = defineProps<{
  open: boolean;
  initialApp?: PhoneAppId | null;
  appBadges?: Partial<Record<PhoneAppId, boolean>>;
  ftubeWatched?: boolean;
  dmCompleted?: boolean;
  tweetPosted?: boolean;
  canClose?: boolean;
  guardForApp?: (app: PhoneAppId) => string | null;
}>();

const emit = defineEmits<{
  close: [];
  closeBlocked: [];
  ftubeWatched: [];
  negotiationComplete: [option: NegotiationOption];
  tweetPosted: [content: string];
  hotSearchSeen: [];
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
const fView = ref<FAppView>('compose');
const showHomeLayer = ref(true);
const showAppLayer = ref(false);

const rootRef = ref<HTMLElement | null>(null);
const backdropRef = ref<HTMLButtonElement | null>(null);
const deviceRef = ref<HTMLElement | null>(null);
const homeRef = ref<HTMLElement | null>(null);
const appRef = ref<HTMLElement | null>(null);
const fComposeRef = ref<HTMLElement | null>(null);
const fHotsearchRef = ref<HTMLElement | null>(null);
const felegramRef = ref<{ goBack: () => Promise<boolean> } | null>(null);
const ftubeRef = ref<{ goBack: () => Promise<boolean> } | null>(null);

const isImmersiveApp = computed(() => activeApp.value !== null);
const bottomActionLabel = computed(() => (activeApp.value ? '返回' : '关闭'));

const showFCompose = ref(true);
const showFHotsearch = ref(false);

function syncFView() {
  const target = props.tweetPosted ? 'hotsearch' : 'compose';
  fView.value = target;
  showFCompose.value = target === 'compose';
  showFHotsearch.value = target === 'hotsearch';
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
      syncFView();
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
  fView.value = 'compose';
  showHomeLayer.value = true;
  showAppLayer.value = false;
  showFCompose.value = true;
  showFHotsearch.value = false;
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
  if (id === 'f') syncFView();
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

async function transitionFToHotsearch() {
  if (fView.value === 'hotsearch' && showFHotsearch.value) return;

  fView.value = 'hotsearch';
  showFHotsearch.value = true;
  await nextTick();

  if (fComposeRef.value && fHotsearchRef.value) {
    await playPush(fComposeRef.value, fHotsearchRef.value);
  }
  showFCompose.value = false;
}

async function onTweetPost(content: string) {
  emit('tweetPosted', content);
  await runNav(() => transitionFToHotsearch());
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
            :watched="Boolean(props.ftubeWatched)"
            :interactive="!phoneBooting"
            :guard-message="guardMessage('ftube')"
            @watched="emit('ftubeWatched')"
          />

          <FelegramChat
            v-else-if="activeApp === 'felegram'"
            ref="felegramRef"
            :locked="Boolean(guardMessage('felegram'))"
            :completed="Boolean(props.dmCompleted)"
            :guard-message="guardMessage('felegram')"
            @complete="emit('negotiationComplete', $event)"
          />

          <div v-else-if="activeApp === 'f'" class="ml-phone__stack">
            <div
              v-show="showFCompose"
              ref="fComposeRef"
              class="ml-phone__stack-layer"
            >
              <FSocialPost
                :locked="Boolean(guardMessage('f'))"
                :posted="Boolean(props.tweetPosted)"
                :guard-message="guardMessage('f')"
                @post="onTweetPost"
              />
            </div>
            <div
              v-show="showFHotsearch"
              ref="fHotsearchRef"
              class="ml-phone__stack-layer"
            >
              <FHotSearch @seen="onHotSearchSeen" />
            </div>
          </div>

          <div v-else-if="activeApp" class="ml-phone__placeholder">
            <div class="ml-phone__app-view-head">
              <img
                class="ml-phone__app-view-icon"
                :src="APP_ICONS[activeApp]"
                :alt="APP_MOCKUPS[activeApp].title"
                draggable="false"
              />
              <h3>{{ APP_MOCKUPS[activeApp].title }}</h3>
            </div>
            <p>{{ APP_MOCKUPS[activeApp].desc }}</p>
            <p class="ml-phone__note">本案例未涉及此 App</p>
          </div>
        </div>
      </div>

      <button type="button" class="ml-phone__close" @click="onBottomClick">
        {{ bottomActionLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.ml-phone {
  position: absolute;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
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

.ml-phone__device {
  position: relative;
  width: min(540px, 90vw, calc(92vh * 9 / 16));
  aspect-ratio: 9 / 16;
  z-index: 1;
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
  bottom: -44px;
  transform: translateX(-50%);
  z-index: 5;
  padding: 8px 18px;
  border: 1px solid rgba(184, 149, 98, 0.45);
  border-radius: 999px;
  background: rgba(12, 14, 16, 0.88);
  color: var(--yp-color-text-main);
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  cursor: pointer;
}

.ml-phone__close:hover {
  border-color: rgba(184, 149, 98, 0.75);
}
</style>
