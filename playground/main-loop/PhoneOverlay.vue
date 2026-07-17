<script setup lang="ts">
import { ref } from 'vue';
import { GameButton, GamePanel } from '@/index';
import { APP_MOCKUPS } from './data';

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeApp = ref<keyof typeof APP_MOCKUPS | null>(null);

function openApp(id: keyof typeof APP_MOCKUPS) {
  activeApp.value = id;
}

function backHome() {
  activeApp.value = null;
}

function close() {
  activeApp.value = null;
  emit('close');
}
</script>

<template>
  <div v-if="props.open" class="ml-phone" role="dialog" aria-label="总统手机">
    <button type="button" class="ml-phone__backdrop" aria-label="关闭" @click="close" />
    <div class="ml-phone__device">
      <GamePanel title="总统手机" subtitle="SECURE LINE" size="compact">
        <div class="ml-phone__status">
          <span>08:15</span>
          <span>▮▮▮ WiFi 88%</span>
        </div>

        <div v-if="!activeApp" class="ml-phone__apps">
          <button
            v-for="(app, id) in APP_MOCKUPS"
            :key="id"
            type="button"
            class="ml-phone__app"
            @click="openApp(id)"
          >
            <span class="ml-phone__icon">{{ app.title.slice(0, 1) }}</span>
            <span>{{ app.title }}</span>
          </button>
        </div>

        <div v-else class="ml-phone__app-view">
          <GameButton variant="secondary" @click="backHome">返回</GameButton>
          <h3>{{ APP_MOCKUPS[activeApp].title }}</h3>
          <p>{{ APP_MOCKUPS[activeApp].desc }}</p>
          <p class="ml-phone__note">MVP：App 内部为静态占位，不可交互</p>
        </div>

        <template #footer>
          <GameButton variant="secondary" @click="close">关闭</GameButton>
        </template>
      </GamePanel>
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

.ml-phone__backdrop {
  position: absolute;
  inset: 0;
  border: 0;
  background: rgba(0, 0, 0, 0.62);
  cursor: pointer;
}

.ml-phone__device {
  position: relative;
  width: min(420px, 90%);
  z-index: 1;
}

.ml-phone__status {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-family: var(--yp-font-latin);
  font-size: 0.85rem;
  color: var(--yp-color-text-muted);
}

.ml-phone__apps {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ml-phone__app {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 12px;
  border: 1px solid rgba(184, 149, 98, 0.28);
  border-radius: 12px;
  background: rgba(12, 14, 16, 0.65);
  color: var(--yp-color-text-main);
  cursor: pointer;
}

.ml-phone__icon {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(184, 149, 98, 0.18);
  color: var(--yp-color-gold-bright);
  font-family: var(--yp-font-latin);
}

.ml-phone__app-view h3 {
  margin: 16px 0 8px;
  font-family: var(--yp-font-serif);
  font-size: 1.25rem;
}

.ml-phone__app-view p {
  margin: 0;
  font-size: 1.05rem;
  color: var(--yp-color-text-muted);
  line-height: 1.65;
}

.ml-phone__note {
  margin-top: 14px !important;
  font-size: 0.9rem;
  color: rgba(216, 209, 194, 0.45) !important;
}
</style>
