<script setup lang="ts">
import { ref } from 'vue';
import type { MainLoopScreen } from '../main-loop/data';
import MainLoopShell from '../main-loop/MainLoopShell.vue';
import MainHud from '../main-loop/MainHud.vue';
import MainScene from '../main-loop/MainScene.vue';
import MainActions from '../main-loop/MainActions.vue';
import PublishScreen from '../main-loop/PublishScreen.vue';
import InboxScreen from '../main-loop/InboxScreen.vue';
import NationScreen from '../main-loop/NationScreen.vue';
import PhoneOverlay from '../main-loop/PhoneOverlay.vue';
import ResultOverlay from '../main-loop/ResultOverlay.vue';

const screen = ref<MainLoopScreen>('main');
const phoneOpen = ref(false);
const resultOpen = ref(false);
const resultTitle = ref('');
const resultBody = ref('');

function goMain() {
  screen.value = 'main';
}

function onAction(id: 'phone' | 'publish' | 'inbox' | 'nation') {
  if (id === 'phone') {
    phoneOpen.value = true;
    return;
  }
  screen.value = id;
}

function showResult(title: string, body: string) {
  resultTitle.value = title;
  resultBody.value = body;
  resultOpen.value = true;
}

function onPublish(payload: { direction: string; body: string }) {
  showResult(
    '法案已签署发布',
    `方向：${payload.direction}\n\n${payload.body}`,
  );
  goMain();
}

function onDecide(payload: { title: string; decision: string }) {
  showResult(payload.decision, `已处理：${payload.title}`);
}

function dismissResult() {
  resultOpen.value = false;
}
</script>

<template>
  <MainLoopShell>
    <template #hud>
      <MainHud />
    </template>

    <MainScene v-show="screen === 'main'" />
    <PublishScreen
      v-if="screen === 'publish'"
      @back="goMain"
      @publish="onPublish"
    />
    <InboxScreen
      v-if="screen === 'inbox'"
      @back="goMain"
      @decide="onDecide"
    />
    <NationScreen v-if="screen === 'nation'" @back="goMain" />

    <template #actions v-if="screen === 'main'">
      <MainActions @action="onAction" />
    </template>

    <template #overlays>
      <PhoneOverlay :open="phoneOpen" @close="phoneOpen = false" />
      <ResultOverlay
        :open="resultOpen"
        :title="resultTitle"
        :body="resultBody"
        @dismiss="dismissResult"
      />
    </template>
  </MainLoopShell>
</template>
