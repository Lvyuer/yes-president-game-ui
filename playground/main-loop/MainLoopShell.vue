<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
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
const stageRef = ref<HTMLElement | null>(null);

/** Design baseline: HUD tokens sized for 1080px-tall 16:9 stage. */
const HUD_REF_HEIGHT_PX = 1080;
const HUD_SCALE_MIN = 0.55;

let stageObserver: ResizeObserver | null = null;

function applyHudScale(heightPx: number) {
  const stage = stageRef.value;
  if (!stage || heightPx <= 0) return;
  const scale = Math.min(1, Math.max(HUD_SCALE_MIN, heightPx / HUD_REF_HEIGHT_PX));
  stage.style.setProperty('--yp-hud-scale', String(Number(scale.toFixed(4))));
}

onMounted(() => {
  const stage = stageRef.value;
  if (!stage || typeof ResizeObserver === 'undefined') {
    applyHudScale(stage?.clientHeight ?? HUD_REF_HEIGHT_PX);
    return;
  }

  stageObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    const h = entry?.contentRect.height ?? stage.clientHeight;
    applyHudScale(h);
  });
  stageObserver.observe(stage);
  applyHudScale(stage.clientHeight);
});

onBeforeUnmount(() => {
  stageObserver?.disconnect();
  stageObserver = null;
});

defineExpose({
  getSceneBackdrop: () => sceneBackdropRef.value,
});
</script>

<template>
  <div class="ml-shell">
    <a class="ml-shell__docs" href="#/overview">← 文档</a>
    <div ref="stageRef" class="ml-shell__stage yp-theme-default">
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
  /* Prefer the real host box (iframe / iWiki preview). Fall back to viewport only when host has no height. */
  min-height: 0;
  max-height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--yp-hud-stage-pad);
  box-sizing: border-box;
  background: #050607;
  position: relative;
  container-type: size;
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
  /* Fit 16:9 inside the shell box — critical inside short iWiki iframes where 100vh is the outer window. */
  width: min(100%, calc(100cqh * 16 / 9));
  height: min(100%, calc(100cqw * 9 / 16));
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: var(--yp-hud-aspect);
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

  /* Default until ResizeObserver writes the real stage-height scale. */
  --yp-hud-scale: 1;

  /*
   * Re-declare scaled tokens HERE (same element as --yp-hud-scale).
   * If only :root uses calc(... * var(--yp-hud-scale)), children inherit the
   * already-resolved px and never shrink when stage scale changes.
   */
  --yp-hud-safe-x: calc(18px * var(--yp-hud-scale));
  --yp-hud-safe-top: calc(14px * var(--yp-hud-scale));
  --yp-hud-safe-bottom: calc(18px * var(--yp-hud-scale));
  --yp-hud-top-gap: calc(12px * var(--yp-hud-scale));
  --yp-hud-top-time-min-w: calc(340px * var(--yp-hud-scale));
  --yp-hud-top-time-max-w: calc(460px * var(--yp-hud-scale));
  --yp-hud-top-time-min-h: calc(168px * var(--yp-hud-scale));
  --yp-hud-dock-max-w: calc(920px * var(--yp-hud-scale));
  --yp-hud-dock-gap: calc(12px * var(--yp-hud-scale));
  --yp-hud-dock-btn-min-h: calc(176px * var(--yp-hud-scale));
  --yp-hud-dock-pad-top: calc(6px * var(--yp-hud-scale));
  --yp-hud-resource-icon: calc(96px * var(--yp-hud-scale));
  --yp-hud-dock-icon: calc(88px * var(--yp-hud-scale));
  --yp-hud-font-resource-label: calc(1.35rem * var(--yp-hud-scale));
  --yp-hud-font-resource-value: calc(2.35rem * var(--yp-hud-scale));
  --yp-hud-font-resource-value-roll: calc(1.95rem * var(--yp-hud-scale));
  --yp-hud-font-term: calc(1.65rem * var(--yp-hud-scale));
  --yp-hud-font-midterm: calc(1rem * var(--yp-hud-scale));
  --yp-hud-font-dock-label: calc(1.35rem * var(--yp-hud-scale));
  --yp-hud-font-dock-sub: calc(0.85rem * var(--yp-hud-scale));
  --yp-hud-dock-btn-pad-y: calc(22px * var(--yp-hud-scale));
  --yp-hud-dock-btn-pad-x: calc(14px * var(--yp-hud-scale));
  --yp-hud-dock-btn-pad-bottom: calc(18px * var(--yp-hud-scale));
  --yp-hud-progress-track-h: calc(8px * var(--yp-hud-scale));

  /* Keep 9-slice frame thickness in proportion with chrome content. */
  --yp-frame-resource-bar-width: calc(22px * var(--yp-hud-scale)) calc(30px * var(--yp-hud-scale));
  --yp-frame-resource-bar-safe: calc(26px * var(--yp-hud-scale));
  --yp-frame-resource-item-width: calc(20px * var(--yp-hud-scale));
  --yp-frame-resource-item-safe: calc(24px * var(--yp-hud-scale));
  --yp-frame-button-width: calc(34px * var(--yp-hud-scale));
  --yp-frame-button-safe: calc(38px * var(--yp-hud-scale));
}

/* Fallback when container queries are unavailable (still better than raw 100vh in embeds). */
@supports not (width: 1cqh) {
  .ml-shell {
    min-height: 100%;
  }

  .ml-shell__stage {
    width: min(100%, calc((100% - 0px) * 16 / 9));
    max-height: 100%;
    height: auto;
  }
}

.ml-shell__hud {
  position: relative;
  flex-shrink: 0;
  padding: var(--yp-hud-safe-top) var(--yp-hud-safe-x) calc(6px * var(--yp-hud-scale));
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
