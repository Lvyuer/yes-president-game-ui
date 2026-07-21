<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import gsap from 'gsap';
import fBase from './assets/f-ui-base.png';
import { prefersReducedMotion } from './phoneMotion';

const props = defineProps<{
  locked: boolean;
  posted: boolean;
  guardMessage?: string;
}>();

const emit = defineEmits<{
  post: [content: string];
}>();

const customContent = ref('');
const uploading = ref(false);
const uploadProgress = ref(0);
const uploadLabel = ref('Posting');

const draft = computed(() => customContent.value.trim());

let uploadTween: gsap.core.Tween | null = null;

function clearUploadTween() {
  uploadTween?.kill();
  uploadTween = null;
}

async function publish() {
  if (props.locked || props.posted || uploading.value) return;
  if (!draft.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  uploadLabel.value = 'Posting';

  const content = draft.value;
  const duration = prefersReducedMotion() ? 0.28 : 1.1;

  await new Promise<void>((resolve) => {
    clearUploadTween();
    uploadTween = gsap.to(uploadProgress, {
      value: 100,
      duration,
      ease: prefersReducedMotion() ? 'none' : 'power1.out',
      onUpdate: () => {
        const p = uploadProgress.value;
        if (p < 55) uploadLabel.value = 'Posting';
        else if (p < 92) uploadLabel.value = 'Almost done';
        else uploadLabel.value = 'Posted';
      },
      onComplete: () => resolve(),
    });
  });

  clearUploadTween();
  emit('post', content);
}

onBeforeUnmount(() => {
  clearUploadTween();
});
</script>

<template>
  <div class="ml-fsocial">
    <img class="ml-fsocial__base" :src="fBase" alt="" draggable="false" />

    <div v-if="props.locked" class="ml-fsocial__guard">
      <p>{{ props.guardMessage }}</p>
    </div>

    <template v-else>
      <textarea
        v-model="customContent"
        class="ml-fsocial__editor"
        placeholder="说说你的看法…"
        rows="4"
        :disabled="uploading"
      />

      <button
        type="button"
        class="ml-fsocial__post-hit"
        aria-label="发布 Post"
        :disabled="!draft || uploading"
        @click="publish"
      />

      <div v-if="uploading" class="ml-fsocial__upload" role="status" aria-live="polite">
        <div class="ml-fsocial__upload-line" :style="{ width: `${uploadProgress}%` }" />
        <div class="ml-fsocial__upload-status">
          <span class="ml-fsocial__upload-dot" aria-hidden="true" />
          <span class="ml-fsocial__upload-label">{{ uploadLabel }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.ml-fsocial {
  position: absolute;
  inset: 0;
  overflow: hidden;
  color: #e7e9ea;
}

.ml-fsocial__base {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

.ml-fsocial__guard {
  position: absolute;
  inset: 18% 8% 35%;
  z-index: 5;
  display: grid;
  place-items: center;
  padding: 16px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.82);
  border: 1px solid rgba(47, 51, 54, 0.95);
  text-align: center;
  font-size: 0.88rem;
  line-height: 1.55;
  color: #8b98a5;
}

.ml-fsocial__editor {
  position: absolute;
  left: 14%;
  top: 9.8%;
  width: 78%;
  height: 9.2%;
  z-index: 2;
  box-sizing: border-box;
  padding: 4px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #e7e9ea;
  font-family: var(--yp-font-sans);
  font-size: 0.78rem;
  line-height: 1.45;
  resize: none;
}

.ml-fsocial__editor:disabled {
  opacity: 0.45;
}

.ml-fsocial__editor::placeholder {
  color: #71767b;
}

.ml-fsocial__editor:focus {
  outline: none;
}

.ml-fsocial__post-hit {
  position: absolute;
  left: 81.2%;
  top: 20.2%;
  width: 11.3%;
  height: 3.1%;
  z-index: 3;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: transparent;
  cursor: pointer;
}

.ml-fsocial__post-hit:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.06);
}

.ml-fsocial__post-hit:disabled {
  cursor: default;
}

/* X-like posting: thin top progress + quiet status, no neon card */
.ml-fsocial__upload {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: all;
  background: rgba(0, 0, 0, 0.28);
}

.ml-fsocial__upload-line {
  position: absolute;
  left: 0;
  top: 0;
  height: 2px;
  width: 0;
  background: #1d9bf0;
}

.ml-fsocial__upload-status {
  position: absolute;
  left: 50%;
  top: 11.5%;
  transform: translateX(-50%);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 999px;
  background: #000;
  border: 1px solid #2f3336;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
}

.ml-fsocial__upload-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1.5px solid #2f3336;
  border-top-color: #1d9bf0;
  animation: ml-fsocial-spin 0.75s linear infinite;
}

.ml-fsocial__upload-label {
  font-family: var(--yp-font-latin);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  color: #e7e9ea;
}

@keyframes ml-fsocial-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ml-fsocial__upload-dot {
    animation: none;
    border-top-color: #71767b;
  }
}
</style>
