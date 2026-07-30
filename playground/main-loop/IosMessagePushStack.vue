<script setup lang="ts">
import type { MessagePushItem } from './usePortStrikeCase';
import type { FelegramContactId, PhoneAppId } from './casePortStrike';
import aideAvatarSrc from './assets/avatars/aide.png';
import mediaAvatarSrc from './assets/avatars/media.png';
import playerAvatarSrc from './assets/avatars/player.png';
import unionAvatarSrc from './assets/avatars/union.png';
import vanceAvatarSrc from './assets/avatars/vance.png';
import iconF from './assets/app-f.png';
import iconFelegram from './assets/app-felegram.png';
import iconFtube from './assets/app-ftube.png';
import iconGreenhood from './assets/app-greenhood.png';

const props = defineProps<{
  items: MessagePushItem[];
}>();

const emit = defineEmits<{
  open: [id: string];
  dismiss: [id: string];
}>();

const CONTACT_AVATAR_SRC: Record<FelegramContactId, string> = {
  aide: aideAvatarSrc,
  media: mediaAvatarSrc,
  union: unionAvatarSrc,
  vance: vanceAvatarSrc,
};

const APP_ICON_SRC: Record<PhoneAppId, string> = {
  felegram: iconFelegram,
  ftube: iconFtube,
  f: iconF,
  greenhood: iconGreenhood,
};

function contactAvatarSrc(contactId: FelegramContactId): string {
  return CONTACT_AVATAR_SRC[contactId] ?? iconFelegram;
}

function appIconSrc(appId: PhoneAppId): string {
  return APP_ICON_SRC[appId] ?? iconFelegram;
}

function onOpen(id: string) {
  emit('open', id);
}

function onDismiss(event: MouseEvent, id: string) {
  event.stopPropagation();
  emit('dismiss', id);
}
</script>

<template>
  <div
    v-if="props.items.length > 0"
    class="ml-ios-push-stack"
    aria-live="polite"
    aria-label="手机推送"
  >
    <TransitionGroup name="ml-ios-push" tag="div" class="ml-ios-push-stack__list" appear>
      <button
        v-for="item in props.items"
        :key="item.id"
        type="button"
        class="ml-ios-push"
        :class="{ 'is-video': item.kind === 'video' }"
        :aria-label="`打开${item.title}`"
        @click="onOpen(item.id)"
      >
        <span
          class="ml-ios-push__avatar"
          :class="{
            'is-group': item.avatar.kind === 'group',
            'is-app': item.avatar.kind === 'app',
          }"
          aria-hidden="true"
        >
          <template v-if="item.avatar.kind === 'group'">
            <span
              v-for="memberId in item.avatar.memberIds"
              :key="memberId"
              class="ml-ios-push__avatar-cell"
            >
              <img
                class="ml-ios-push__avatar-cell-img"
                :src="contactAvatarSrc(memberId)"
                alt=""
                draggable="false"
              />
            </span>
            <span class="ml-ios-push__avatar-cell">
              <img
                class="ml-ios-push__avatar-cell-img"
                :src="playerAvatarSrc"
                alt=""
                draggable="false"
              />
            </span>
          </template>
          <img
            v-else-if="item.avatar.kind === 'app'"
            class="ml-ios-push__avatar-img ml-ios-push__avatar-img--app"
            :src="appIconSrc(item.avatar.appId)"
            alt=""
            draggable="false"
          />
          <img
            v-else
            class="ml-ios-push__avatar-img"
            :src="contactAvatarSrc(item.avatar.contactId)"
            alt=""
            draggable="false"
          />
        </span>
        <span class="ml-ios-push__copy">
          <span class="ml-ios-push__title">{{ item.title }}</span>
          <span class="ml-ios-push__message">{{ item.message }}</span>
          <span
            v-if="item.kind === 'video' && item.thumbSrc"
            class="ml-ios-push__media"
            aria-hidden="true"
          >
            <img class="ml-ios-push__thumb" :src="item.thumbSrc" alt="" draggable="false" />
            <span v-if="item.thumbTag" class="ml-ios-push__thumb-tag">{{ item.thumbTag }}</span>
          </span>
          <span class="ml-ios-push__subline">{{ item.subline }}</span>
        </span>
        <span
          class="ml-ios-push__close"
          aria-label="关闭通知"
          @click="onDismiss($event, item.id)"
        >
          ×
        </span>
      </button>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.ml-ios-push-stack {
  position: absolute;
  top: calc(var(--yp-hud-safe-top) + var(--yp-hud-top-time-min-h) + 4.75rem);
  right: 2.2%;
  z-index: 45;
  width: min(360px, 34%);
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  box-shadow: none;
  pointer-events: none;
}

.ml-ios-push-stack__list {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.55rem;
  margin: 0;
  padding: 0;
  background: transparent;
  box-shadow: none;
}

.ml-ios-push {
  pointer-events: auto;
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  width: 100%;
  padding: 0.78rem 0.72rem 0.78rem 0.8rem;
  border: 0;
  border-radius: 18px;
  background: rgba(32, 32, 34, 0.94);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.28);
  color: #f5f5f7;
  text-align: left;
  cursor: pointer;
}

.ml-ios-push.is-video {
  background: rgba(18, 18, 20, 0.96);
}

.ml-ios-push__avatar {
  width: 2.45rem;
  height: 2.45rem;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.22);
}

.ml-ios-push__avatar.is-app {
  border-radius: 22%;
  background: #0b0b0b;
}

.ml-ios-push__avatar.is-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 1.5px;
  padding: 2px;
  border-radius: 50%;
  background: #141414;
  overflow: hidden;
}

.ml-ios-push__avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.14);
}

.ml-ios-push__avatar-img--app {
  transform: none;
  object-fit: contain;
  padding: 0.2rem;
}

.ml-ios-push__avatar-cell {
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 50%;
  background: #1a1a1a;
}

.ml-ios-push__avatar-cell-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transform: scale(1.14);
  pointer-events: none;
}

.ml-ios-push__copy {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.18rem;
}

.ml-ios-push__title {
  font-family: var(--yp-font-sans);
  font-size: 0.92rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: rgba(255, 255, 255, 0.95);
}

.ml-ios-push__message {
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
  line-height: 1.4;
  color: rgba(255, 255, 255, 0.8);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ml-ios-push__media {
  position: relative;
  display: block;
  width: 100%;
  margin-top: 0.28rem;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  background: #0f0f0f;
}

.ml-ios-push__thumb {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ml-ios-push__thumb-tag {
  position: absolute;
  left: 6px;
  top: 6px;
  z-index: 2;
  padding: 2px 7px;
  border-radius: 3px;
  background: #dc2626;
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
  line-height: 1.3;
}

.ml-ios-push__subline {
  font-family: var(--yp-font-sans);
  font-size: 0.7rem;
  letter-spacing: 0.03em;
  color: rgba(255, 255, 255, 0.5);
}

.ml-ios-push__close {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-size: 1.1rem;
  line-height: 1;
  color: rgba(255, 255, 255, 0.5);
}

.ml-ios-push__close:hover {
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.08);
}

.ml-ios-push-enter-active,
.ml-ios-push-appear-active {
  transition:
    transform 0.42s cubic-bezier(0.22, 1.12, 0.36, 1),
    opacity 0.32s ease;
}

.ml-ios-push-leave-active {
  transition:
    transform 0.28s cubic-bezier(0.4, 0, 0.68, 0.2),
    opacity 0.22s ease;
}

.ml-ios-push-enter-from,
.ml-ios-push-appear-from {
  opacity: 0;
  transform: translateX(115%) scale(0.9);
}

.ml-ios-push-leave-to {
  opacity: 0;
  transform: translateX(115%) scale(0.94);
}

.ml-ios-push-move {
  transition: transform 0.3s ease;
}
</style>
