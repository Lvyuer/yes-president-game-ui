<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import type SceneBackdrop from './SceneBackdrop.vue';
import type { SceneVideoClip } from './sceneVideos';
import type { SceneAlignView } from './sceneAlignDebug';

const props = defineProps<{
  backdrop: InstanceType<typeof SceneBackdrop> | null;
}>();

const clip = ref<SceneVideoClip>('phone-start');
const view = ref<SceneAlignView>('blend');
const blend = ref(50);
const time = ref(0);
const duration = ref(0);
const videoInfo = ref('—');

const clips: { id: SceneVideoClip; label: string }[] = [
  { id: 'idle', label: 'idle' },
  { id: 'phone-start', label: 'phone-start' },
  { id: 'phone-end', label: 'phone-end' },
  { id: 'intro-intruder', label: 'intro-intruder' },
  { id: 'advisor-signing', label: 'advisor-signing' },
];

const debugState = computed(() => ({
  view: view.value,
  blend: blend.value / 100,
}));

watch(debugState, (state) => {
  props.backdrop?.setDebugState(state);
});

watch(clip, (next) => {
  void props.backdrop?.loadDebugClip(next, { time: 0, pause: true });
});

async function refreshMeta() {
  const video = props.backdrop?.getActiveVideo();
  if (!video) {
    duration.value = 0;
    time.value = 0;
    videoInfo.value = '无视频（缺文件或未解码）';
    return;
  }

  duration.value = Number.isFinite(video.duration) ? video.duration : 0;
  time.value = video.currentTime;
  videoInfo.value = `${video.videoWidth}×${video.videoHeight} · t=${video.currentTime.toFixed(2)}s`;
}

function seek(next: number) {
  props.backdrop?.seekTo(next);
  time.value = next;
  void refreshMeta();
}

function stepFrame(delta: number) {
  const video = props.backdrop?.getActiveVideo();
  if (!video || !video.videoWidth) return;
  const fps = 30;
  seek(Math.max(0, Math.min(duration.value || 0, video.currentTime + delta / fps)));
}

function togglePlay() {
  const video = props.backdrop?.getActiveVideo();
  if (!video) return;
  if (video.paused) void video.play();
  else video.pause();
}

let tick = 0;
onMounted(() => {
  props.backdrop?.setDebugState(debugState.value);
  void props.backdrop?.loadDebugClip(clip.value, { time: 0, pause: true });
  tick = window.setInterval(() => {
    void refreshMeta();
  }, 200);
});

onUnmounted(() => {
  window.clearInterval(tick);
  props.backdrop?.clearDebugMode();
});
</script>

<template>
  <aside class="scene-align-debug" aria-label="场景对齐调试">
    <p class="scene-align-debug__title">场景对齐调试</p>
    <p class="scene-align-debug__hint">
      50% 叠加时边缘无重影 = 首帧对齐。合格：≤1px 抖动；需重做：明显位移/缩放。
    </p>

    <label class="scene-align-debug__field">
      <span>片段</span>
      <select v-model="clip">
        <option v-for="item in clips" :key="item.id" :value="item.id">
          {{ item.label }}
        </option>
      </select>
    </label>

    <div class="scene-align-debug__views">
      <button
        type="button"
        :class="{ active: view === 'video' }"
        @click="view = 'video'"
      >
        仅视频
      </button>
      <button
        type="button"
        :class="{ active: view === 'blend' }"
        @click="view = 'blend'"
      >
        叠加
      </button>
      <button
        type="button"
        :class="{ active: view === 'poster' }"
        @click="view = 'poster'"
      >
        仅静图
      </button>
    </div>

    <label v-if="view === 'blend'" class="scene-align-debug__field">
      <span>静图透明度 {{ blend }}%</span>
      <input v-model.number="blend" type="range" min="0" max="100" step="1" />
    </label>

    <label class="scene-align-debug__field">
      <span>时间 {{ time.toFixed(2) }}s / {{ duration.toFixed(2) }}s</span>
      <input
        :value="time"
        type="range"
        min="0"
        :max="duration || 0"
        step="0.01"
        :disabled="!duration"
        @input="seek(Number(($event.target as HTMLInputElement).value))"
      />
    </label>

    <div class="scene-align-debug__actions">
      <button type="button" @click="seek(0)">首帧</button>
      <button type="button" @click="seek(Math.max(0, duration - 0.04))">尾帧</button>
      <button type="button" @click="stepFrame(-1)">← 1帧</button>
      <button type="button" @click="stepFrame(1)">1帧 →</button>
      <button type="button" @click="togglePlay">播放/暂停</button>
    </div>

    <p class="scene-align-debug__meta">{{ videoInfo }}</p>

    <ol class="scene-align-debug__steps">
      <li><strong>phone-start</strong>：首帧 0s，叠加 50%，查办公桌/地毯边缘。</li>
      <li><strong>phone-end</strong>：尾帧，叠加 50%，应回到 IDLE 静图。</li>
      <li><strong>idle</strong>：循环首尾与静图对比（若有 idle 视频）。</li>
    </ol>
  </aside>
</template>

<style scoped>
.scene-align-debug {
  position: fixed;
  right: 12px;
  bottom: 12px;
  z-index: 100;
  width: min(360px, calc(100vw - 24px));
  padding: 12px 14px;
  border: 1px solid rgba(184, 149, 98, 0.45);
  border-radius: 8px;
  background: rgba(8, 10, 12, 0.92);
  color: #e8dcc4;
  font-family: var(--yp-font-sans, system-ui, sans-serif);
  font-size: 0.78rem;
  line-height: 1.45;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  pointer-events: auto;
}

.scene-align-debug__title {
  margin: 0 0 6px;
  font-weight: 700;
  color: #d4c08a;
}

.scene-align-debug__hint {
  margin: 0 0 10px;
  color: rgba(232, 220, 196, 0.75);
}

.scene-align-debug__field {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.scene-align-debug__field span {
  color: rgba(232, 220, 196, 0.85);
}

.scene-align-debug select,
.scene-align-debug input[type='range'] {
  width: 100%;
}

.scene-align-debug__views {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
}

.scene-align-debug__views button,
.scene-align-debug__actions button {
  border: 1px solid rgba(184, 149, 98, 0.35);
  border-radius: 4px;
  background: rgba(184, 149, 98, 0.12);
  color: #e8dcc4;
  padding: 4px 8px;
  font-size: 0.74rem;
  cursor: pointer;
}

.scene-align-debug__views button.active {
  background: rgba(184, 149, 98, 0.32);
  border-color: rgba(212, 192, 138, 0.65);
}

.scene-align-debug__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.scene-align-debug__meta {
  margin: 0 0 8px;
  font-family: ui-monospace, monospace;
  font-size: 0.72rem;
  color: #9fd4a0;
}

.scene-align-debug__steps {
  margin: 0;
  padding-left: 1.1rem;
  color: rgba(232, 220, 196, 0.8);
}
</style>
