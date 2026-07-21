<script setup lang="ts">
import { ref } from 'vue';
import SceneBackdrop from './SceneBackdrop.vue';
import type { SceneBackdropMode } from './sceneVideos';

withDefaults(
  defineProps<{
    title?: string;
    sceneMode?: SceneBackdropMode;
    ambientEnabled?: boolean;
    advisorPauseAtSec?: number;
  }>(),
  { ambientEnabled: false },
);

const emit = defineEmits<{
  sceneClipEnded: [];
  sceneClipPaused: [];
}>();

const sceneBackdropRef = ref<InstanceType<typeof SceneBackdrop> | null>(null);

defineExpose({
  getSceneBackdrop: () => sceneBackdropRef.value,
});
</script>

<template>
  <div class="ml-shell">
    <a class="ml-shell__docs" href="#/overview">← 文档</a>
    <div class="ml-shell__stage yp-theme-default">
      <SceneBackdrop
        ref="sceneBackdropRef"
        :mode="sceneMode ?? 'idle'"
        :ambient-enabled="ambientEnabled"
        :advisor-pause-at-sec="advisorPauseAtSec"
        @clip-ended="emit('sceneClipEnded')"
        @clip-paused="emit('sceneClipPaused')"
      />
      <header v-if="title || $slots.hud" class="ml-shell__hud">
        <slot name="hud" />
      </header>
      <div class="ml-shell__body">
        <slot />
      </div>
      <footer v-if="$slots.actions" class="ml-shell__actions">
        <slot name="actions" />
      </footer>
      <slot name="overlays" />
    </div>
  </div>
</template>

<style scoped>
.ml-shell {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--yp-hud-stage-pad);
  box-sizing: border-box;
  background: #050607;
  position: relative;
}

.ml-shell__docs {
  position: absolute;
  top: 12px;
  left: 16px;
  z-index: 2;
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
  color: rgba(216, 209, 194, 0.55);
  text-decoration: none;
}

.ml-shell__docs:hover {
  color: var(--yp-color-gold-bright);
}

.ml-shell__stage {
  position: relative;
  width: min(100%, calc((100vh - (2 * var(--yp-hud-stage-pad))) * 16 / 9));
  aspect-ratio: var(--yp-hud-aspect);
  max-height: calc(100vh - (2 * var(--yp-hud-stage-pad)));
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #0a0c0e;
  border: 1px solid rgba(184, 149, 98, 0.28);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
  --yp-color-text-main: #f2e8d4;
  --yp-color-text-muted: #c9b994;
  --yp-color-gold: #b89a62;
  --yp-color-gold-bright: #d4c08a;
  --yp-text-glow: 0 1px 2px rgba(0, 0, 0, 0.75);
  font-family: var(--yp-font-serif);
  color: var(--yp-color-text-main);
}

.ml-shell__hud {
  position: relative;
  flex-shrink: 0;
  padding: var(--yp-hud-safe-top) var(--yp-hud-safe-x) 6px;
  background: var(--yp-hud-top-fade);
  z-index: 2;
}

.ml-shell__body {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.ml-shell__actions {
  position: relative;
  flex-shrink: 0;
  padding: var(--yp-hud-dock-pad-top) var(--yp-hud-safe-x) var(--yp-hud-safe-bottom);
  background: var(--yp-hud-dock-fade);
  z-index: 2;
  display: flex;
  justify-content: center;
  overflow: visible;
}
</style>
