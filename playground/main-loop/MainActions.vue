<script setup lang="ts">
import briefingIcon from './assets/briefing-icon.png';
import phoneIcon from './assets/dock-phone.png';
import publishIcon from './assets/dock-publish.png';
import inboxIcon from './assets/dock-inbox.png';
import nationIcon from './assets/dock-nation.png';

type DockActionId = 'phone' | 'publish' | 'inbox' | 'nation';

const DOCK_ACTIONS: {
  id: DockActionId;
  label: string;
  subtitle: string;
  icon: string;
}[] = [
  { id: 'phone', label: '手机', subtitle: 'PHONE', icon: phoneIcon },
  { id: 'publish', label: '发布法案', subtitle: 'CREATE BILL', icon: publishIcon },
  { id: 'inbox', label: '处理文件', subtitle: 'PROCESS FILES', icon: inboxIcon },
  { id: 'nation', label: '国家数据', subtitle: 'NATIONAL DATA', icon: nationIcon },
];

const props = defineProps<{
  highlightAction?: DockActionId;
  /** 周循环自由行动：显示翻阅入口「本周要情」 */
  showDossier?: boolean;
  /** 议题板 NEW 数量角标 */
  dossierNewCount?: number;
}>();

const emit = defineEmits<{
  action: [id: DockActionId];
  openDossier: [];
}>();
</script>

<template>
  <div
    class="ml-actions-wrap"
    :class="{
      'has-dossier': props.showDossier,
    }"
  >
    <div class="ml-actions-row">
      <div v-if="props.showDossier" class="ml-prop-slot">
        <button
          type="button"
          class="ml-prop-btn"
          aria-label="本周要情，BRIEFING"
          @click="emit('openDossier')"
        >
          <img class="ml-prop-btn__art" :src="briefingIcon" alt="" />
          <span class="ml-prop-btn__label">本周要情</span>
          <span class="ml-prop-btn__sub">BRIEFING</span>
        </button>
        <span
          v-if="(props.dossierNewCount ?? 0) > 0"
          class="ml-prop-badge"
          aria-hidden="true"
        >
          {{ props.dossierNewCount }}
        </span>
      </div>

      <div v-if="props.showDossier" class="ml-prop-sep" aria-hidden="true" />

      <div
        v-for="item in DOCK_ACTIONS"
        :key="item.id"
        class="ml-prop-slot"
        :class="{ 'is-highlight': props.highlightAction === item.id }"
      >
        <button
          type="button"
          class="ml-prop-btn"
          :aria-label="`${item.label}，${item.subtitle}`"
          @click="emit('action', item.id)"
        >
          <img class="ml-prop-btn__art" :src="item.icon" alt="" />
          <span class="ml-prop-btn__label">{{ item.label }}</span>
          <span class="ml-prop-btn__sub">{{ item.subtitle }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-actions-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

.ml-actions-row {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: calc(8px * var(--yp-hud-scale, 1));
  width: min(1240px, 97%);
}

.ml-actions-wrap:not(.has-dossier) .ml-actions-row {
  width: min(1020px, 94%);
}

.ml-prop-slot {
  position: relative;
  flex: 1 1 0;
  min-width: 0;
  max-width: 200px;
  align-self: stretch;
}

.ml-prop-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  width: 100%;
  height: 100%;
  min-height: calc(var(--yp-hud-dock-btn-min-h) * 1.12);
  margin: 0;
  padding: 2px 4px 6px;
  border: 0;
  background: transparent;
  color: var(--yp-color-text-main);
  cursor: pointer;
  transition: transform 0.18s ease;
}

.ml-prop-btn:hover {
  transform: translateY(-4px);
}

.ml-prop-btn:hover .ml-prop-btn__art {
  filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.45))
    drop-shadow(0 0 10px rgba(215, 188, 126, 0.28));
}

.ml-prop-btn__art {
  display: block;
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: calc(var(--yp-hud-dock-btn-min-h) * 1.12);
  object-fit: contain;
  filter: drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4));
  transition: filter 0.18s ease;
  pointer-events: none;
  user-select: none;
}

.ml-prop-btn__label {
  font-family: var(--yp-font-serif);
  font-size: var(--yp-hud-font-dock-label);
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.15;
  color: var(--yp-color-text-main);
  text-shadow: var(--yp-text-glow);
  white-space: nowrap;
}

.ml-prop-btn__sub {
  font-family: var(--yp-font-latin);
  font-size: var(--yp-hud-font-dock-sub);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--yp-color-gold-bright);
  opacity: 0.9;
  white-space: nowrap;
}

.ml-prop-badge {
  position: absolute;
  top: 4px;
  right: 12%;
  z-index: 2;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  border: 1px solid rgba(232, 180, 96, 0.55);
  background: rgba(168, 72, 56, 0.82);
  font-family: var(--yp-font-latin);
  font-size: 0.68rem;
  line-height: 16px;
  text-align: center;
  color: #f6e2b8;
  pointer-events: none;
}

.ml-prop-sep {
  flex: 0 0 2px;
  align-self: stretch;
  margin: calc(10px * var(--yp-hud-scale, 1)) 4px;
  border-radius: 1px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(215, 188, 126, 0.35) 12%,
    rgba(232, 210, 150, 0.85) 50%,
    rgba(215, 188, 126, 0.35) 88%,
    transparent 100%
  );
  box-shadow: 0 0 8px rgba(184, 149, 98, 0.28);
}

.ml-prop-slot.is-highlight {
  z-index: 3;
}

.ml-prop-slot.is-highlight .ml-prop-btn {
  animation: ml-dock-bounce 1.05s cubic-bezier(0.34, 1.4, 0.64, 1) infinite;
  will-change: transform;
}

/* drop-shadow 跟 PNG 透明边缘走，描在手机/道具轮廓上，而不是外接方框 */
.ml-prop-slot.is-highlight .ml-prop-btn__art {
  filter:
    drop-shadow(0 0 0.75px rgba(246, 226, 184, 1))
    drop-shadow(0 0 1.5px rgba(232, 205, 140, 1))
    drop-shadow(0 0 4px rgba(232, 205, 140, 0.95))
    drop-shadow(0 0 10px rgba(215, 188, 126, 0.65))
    drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4));
  animation: ml-dock-art-glow 1.05s ease-in-out infinite;
}

@keyframes ml-dock-bounce {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  18% {
    transform: translateY(-16px) scale(1.06);
  }
  32% {
    transform: translateY(-3px) scale(1.02);
  }
  48% {
    transform: translateY(-12px) scale(1.05);
  }
  62% {
    transform: translateY(0) scale(1);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@keyframes ml-dock-art-glow {
  0%,
  100% {
    filter:
      drop-shadow(0 0 0.75px rgba(246, 226, 184, 0.85))
      drop-shadow(0 0 1.5px rgba(232, 205, 140, 0.9))
      drop-shadow(0 0 4px rgba(232, 205, 140, 0.7))
      drop-shadow(0 0 10px rgba(215, 188, 126, 0.4))
      drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4));
  }
  50% {
    filter:
      drop-shadow(0 0 1px rgba(246, 226, 184, 1))
      drop-shadow(0 0 2px rgba(232, 205, 140, 1))
      drop-shadow(0 0 6px rgba(232, 205, 140, 1))
      drop-shadow(0 0 14px rgba(215, 188, 126, 0.85))
      drop-shadow(0 8px 14px rgba(0, 0, 0, 0.4));
  }
}

@media (prefers-reduced-motion: reduce) {
  .ml-prop-btn,
  .ml-prop-btn__art {
    transition: none;
  }

  .ml-prop-slot.is-highlight .ml-prop-btn,
  .ml-prop-slot.is-highlight .ml-prop-btn__art {
    animation: none;
  }
}

@media (max-width: 900px) {
  .ml-actions-row {
    flex-wrap: wrap;
    width: min(420px, 92%);
  }

  .ml-prop-slot {
    flex: 1 1 calc(50% - 8px);
    max-width: none;
  }

  .ml-prop-sep {
    display: none;
  }
}
</style>
