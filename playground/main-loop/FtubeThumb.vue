<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import thumbPlate from './assets/ftube-thumb-plate.png';

const props = withDefaults(
  defineProps<{
    tag?: string;
    /** Optional tint when using plate fallback */
    tone?: string;
    /** Real preview image (video frame / poster) */
    image?: string;
    /** If set, also try showing a video frame as live preview */
    video?: string;
    compact?: boolean;
  }>(),
  {
    tone: '',
    image: '',
    video: '',
    compact: false,
  },
);

const videoRef = ref<HTMLVideoElement | null>(null);
const showVideoFrame = ref(false);

async function snapVideoFrame() {
  const el = videoRef.value;
  if (!el || !props.video) {
    showVideoFrame.value = false;
    return;
  }
  try {
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    await new Promise<void>((resolve, reject) => {
      if (el.readyState >= 2) {
        resolve();
        return;
      }
      const onOk = () => {
        el.removeEventListener('loadeddata', onOk);
        el.removeEventListener('error', onErr);
        resolve();
      };
      const onErr = () => {
        el.removeEventListener('loadeddata', onOk);
        el.removeEventListener('error', onErr);
        reject(new Error('video load failed'));
      };
      el.addEventListener('loadeddata', onOk);
      el.addEventListener('error', onErr);
      el.load();
    });
    if (el.currentTime < 0.05) {
      el.currentTime = 0.12;
      await new Promise<void>((resolve) => {
        const done = () => {
          el.removeEventListener('seeked', done);
          resolve();
        };
        el.addEventListener('seeked', done);
      });
    }
    showVideoFrame.value = true;
  } catch {
    showVideoFrame.value = false;
  }
}

onMounted(() => {
  if (props.video && !props.image) void snapVideoFrame();
});

watch(
  () => [props.video, props.image] as const,
  ([video, image]) => {
    if (video && !image) void snapVideoFrame();
    else showVideoFrame.value = false;
  },
);
</script>

<template>
  <div
    class="ml-ftube-thumb"
    :class="{ 'is-compact': compact }"
    :style="{ '--ftube-thumb-plate': `url(${thumbPlate})` }"
  >
    <img
      v-if="image"
      class="ml-ftube-thumb__media"
      :src="image"
      alt=""
      draggable="false"
    />
    <video
      v-else-if="video"
      ref="videoRef"
      class="ml-ftube-thumb__media"
      :class="{ 'is-ready': showVideoFrame }"
      :src="video"
      muted
      playsinline
      preload="auto"
    />
    <template v-if="!image && !(video && showVideoFrame)">
      <span class="ml-ftube-thumb__plate" aria-hidden="true" />
      <span
        v-if="tone"
        class="ml-ftube-thumb__tint"
        :style="{ background: tone }"
        aria-hidden="true"
      />
    </template>
    <span v-if="tag" class="ml-ftube-thumb__tag">{{ tag }}</span>
  </div>
</template>

<style scoped>
.ml-ftube-thumb {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
  border-radius: 6px;
  aspect-ratio: 16 / 9;
  height: auto;
  min-height: 0;
  background: #141414;
  isolation: isolate;
}

.ml-ftube-thumb.is-compact {
  border-radius: 4px;
}

.ml-ftube-thumb__media {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  pointer-events: none;
  user-select: none;
  background: #111;
}

video.ml-ftube-thumb__media {
  opacity: 0;
}

video.ml-ftube-thumb__media.is-ready {
  opacity: 1;
}

.ml-ftube-thumb__plate {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: var(--ftube-thumb-plate);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.ml-ftube-thumb__tint {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.28;
  mix-blend-mode: soft-light;
  pointer-events: none;
}

.ml-ftube-thumb__tag {
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
</style>
