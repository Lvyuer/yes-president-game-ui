<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { GameTitleDivider } from '@/index';
import { docsNav, groupLabels, type DocsNavItem } from './nav';
import OverviewPage from './pages/OverviewPage.vue';
import FeatureButtonPage from './pages/FeatureButtonPage.vue';
import ButtonPage from './pages/ButtonPage.vue';
import IconButtonPage from './pages/IconButtonPage.vue';
import PanelPage from './pages/PanelPage.vue';
import ProgressPage from './pages/ProgressPage.vue';
import NoticePage from './pages/NoticePage.vue';
import InputPage from './pages/InputPage.vue';
import SelectPage from './pages/SelectPage.vue';
import ResourceBarPage from './pages/ResourceBarPage.vue';
import ActionGridPage from './pages/ActionGridPage.vue';
import NoticeStackPage from './pages/NoticeStackPage.vue';
import DashboardPage from './pages/DashboardPage.vue';

const pageMap = {
  overview: OverviewPage,
  'feature-button': FeatureButtonPage,
  button: ButtonPage,
  'icon-button': IconButtonPage,
  panel: PanelPage,
  progress: ProgressPage,
  slider: ProgressPage,
  notice: NoticePage,
  input: InputPage,
  select: SelectPage,
  'resource-bar': ResourceBarPage,
  'action-grid': ActionGridPage,
  'notice-stack': NoticeStackPage,
  dashboard: DashboardPage,
} as const;

type PageId = keyof typeof pageMap;

const currentId = ref<PageId>('overview');

function parseHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, '') || 'overview';
  return (raw in pageMap ? raw : 'overview') as PageId;
}

function syncFromHash() {
  currentId.value = parseHash();
}

function navigate(id: string) {
  if (!(id in pageMap)) return;
  currentId.value = id as PageId;
  window.location.hash = `/${id}`;
}

const currentPage = computed(() => pageMap[currentId.value]);
const currentMeta = computed(() => docsNav.find((item) => item.id === currentId.value));

const groupedNav = computed(() => {
  const groups: DocsNavItem['group'][] = ['guide', 'components', 'layouts'];
  return groups.map((group) => ({
    group,
    label: groupLabels[group],
    items: docsNav.filter((item) => item.group === group),
  }));
});

onMounted(() => {
  syncFromHash();
  window.addEventListener('hashchange', syncFromHash);
});

onUnmounted(() => {
  window.removeEventListener('hashchange', syncFromHash);
});
</script>

<template>
  <div class="docs-shell yp-theme-default">
    <aside class="docs-shell__sidebar">
      <div class="docs-shell__brand">
        <p class="docs-shell__brand-en">YES PRESIDENT</p>
        <h1 class="docs-shell__brand-title">Game UI</h1>
        <p class="docs-shell__brand-sub">组件库文档</p>
        <GameTitleDivider class="docs-shell__brand-rule" />
      </div>

      <nav class="docs-shell__nav" aria-label="组件导航">
        <section v-for="section in groupedNav" :key="section.group" class="docs-shell__group">
          <h2 class="docs-shell__group-title">{{ section.label }}</h2>
          <button
            v-for="item in section.items"
            :key="item.id"
            type="button"
            class="docs-shell__link"
            :class="{ 'is-active': currentId === item.id }"
            @click="navigate(item.id)"
          >
            <span class="docs-shell__link-label">{{ item.label }}</span>
            <span class="docs-shell__link-en">{{ item.en }}</span>
          </button>
        </section>
      </nav>
    </aside>

    <main class="docs-shell__main">
      <div class="docs-shell__crumb" v-if="currentMeta">
        {{ groupLabels[currentMeta.group] }} / {{ currentMeta.label }}
      </div>
      <component :is="currentPage" />
    </main>
  </div>
</template>

<style>
html,
body,
#app {
  margin: 0;
  min-height: 100%;
  background: #050607;
}

.docs-shell {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  color: var(--yp-color-text-main);
}

.docs-shell__sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow: auto;
  border-right: 1px solid rgba(184, 149, 98, 0.28);
  background:
    linear-gradient(180deg, rgba(28, 34, 40, 0.98), rgba(10, 12, 14, 0.98));
}

.docs-shell__brand {
  padding: 28px 22px 20px;
  border-bottom: 1px solid rgba(184, 149, 98, 0.22);
}

.docs-shell__brand-en {
  margin: 0;
  font-family: var(--yp-font-latin);
  font-size: 0.72rem;
  letter-spacing: 0.22em;
  color: var(--yp-color-gold);
}

.docs-shell__brand-title {
  margin: 6px 0 0;
  font-family: var(--yp-font-serif);
  font-size: 1.6rem;
  letter-spacing: 0.08em;
  text-shadow: var(--yp-text-glow);
}

.docs-shell__brand-sub {
  margin: 4px 0 0;
  font-family: var(--yp-font-sans);
  font-size: 0.85rem;
  color: var(--yp-color-text-muted);
}

.docs-shell__brand-rule {
  margin-top: 16px;
  opacity: 0.85;
}

.docs-shell__nav {
  padding: 16px 12px 28px;
}

.docs-shell__group {
  margin-bottom: 18px;
}

.docs-shell__group-title {
  margin: 0 10px 8px;
  font-family: var(--yp-font-latin);
  font-size: 0.7rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(184, 149, 98, 0.72);
}

.docs-shell__link {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  padding: 10px 12px;
  margin-bottom: 4px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.docs-shell__link:hover {
  background: rgba(184, 149, 98, 0.08);
  border-color: rgba(184, 149, 98, 0.18);
}

.docs-shell__link.is-active {
  background: rgba(184, 149, 98, 0.14);
  border-color: rgba(184, 149, 98, 0.4);
}

.docs-shell__link-label {
  font-family: var(--yp-font-serif);
  font-size: 0.95rem;
  color: var(--yp-color-text-main);
  letter-spacing: 0.04em;
}

.docs-shell__link-en {
  font-family: var(--yp-font-latin);
  font-size: 0.68rem;
  letter-spacing: 0.08em;
  color: var(--yp-color-text-muted);
}

.docs-shell__main {
  padding: 28px 36px 64px;
  background:
    radial-gradient(ellipse at 80% 0%, rgba(184, 149, 98, 0.09), transparent 42%),
    radial-gradient(ellipse at 10% 100%, rgba(40, 48, 54, 0.45), transparent 50%),
    #050607;
}

.docs-shell__crumb {
  margin-bottom: 18px;
  font-family: var(--yp-font-sans);
  font-size: 0.82rem;
  color: rgba(216, 209, 194, 0.65);
}

@media (max-width: 960px) {
  .docs-shell {
    grid-template-columns: 1fr;
  }

  .docs-shell__sidebar {
    position: relative;
    height: auto;
    border-right: none;
    border-bottom: 1px solid rgba(184, 149, 98, 0.28);
  }

  .docs-shell__main {
    padding: 20px 16px 48px;
  }
}
</style>
