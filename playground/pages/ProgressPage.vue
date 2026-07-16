<script setup lang="ts">
import { ref } from 'vue';
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameProgressBar, GameButton, GameSlider } from '@/index';

const value = ref(42);
const slider = ref(64);

const progressApi = [
  { name: 'value', desc: '当前值（必填）', type: 'number', defaultValue: '—' },
  { name: 'max', desc: '最大值', type: 'number', defaultValue: '100' },
  { name: 'label', desc: '左侧标签', type: 'string', defaultValue: '—' },
  { name: 'tone', desc: '语义色', type: "'success' | 'warning' | 'danger' | 'neutral'", defaultValue: "'neutral'" },
  { name: 'showThumb', desc: '是否显示滑块按钮', type: 'boolean', defaultValue: 'true' },
];

const sliderApi = [
  { name: 'modelValue / v-model', desc: '当前值', type: 'number', defaultValue: '0' },
  { name: 'min / max / step', desc: '范围与步进', type: 'number', defaultValue: '0 / 100 / 1' },
  { name: 'label', desc: '标签', type: 'string', defaultValue: '—' },
  { name: 'disabled', desc: '禁用', type: 'boolean', defaultValue: 'false' },
  { name: 'showValue', desc: '显示数值', type: 'boolean', defaultValue: 'true' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="进度条 / 滑块"
      english="GameProgressBar · GameSlider"
      description="轨道使用 progress-track 九宫格，滑块按钮使用固定尺寸 progress-thumb。填充宽度由 DOM/CSS 控制。GameSlider 支持拖拽与键盘调节。"
    />

    <DocsDemoBlock title="进度条语义色">
      <div class="stack">
        <GameProgressBar label="支持率" :value="72" tone="success" />
        <GameProgressBar label="法案进度" :value="42" tone="warning" />
        <GameProgressBar label="危机指数" :value="81" tone="danger" />
        <GameProgressBar label="无滑块" :value="55" tone="neutral" :show-thumb="false" />
      </div>
      <template #code>
{{ `<GameProgressBar label="支持率" :value="72" tone="success" />` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="进度更新">
      <div class="stack">
        <GameProgressBar label="可调进度" :value="value" tone="warning" />
        <div class="row">
          <GameButton variant="secondary" @click="value = Math.max(0, value - 10)">-10</GameButton>
          <GameButton @click="value = Math.min(100, value + 10)">+10</GameButton>
        </div>
      </div>
    </DocsDemoBlock>

    <DocsDemoBlock title="交互滑块 GameSlider" description="拖拽轨道或滑块，也可用方向键。">
      <div class="stack">
        <GameSlider v-model="slider" label="BUDGET SHARE" />
        <GameSlider :model-value="30" label="LOCKED" disabled />
      </div>
      <template #code>
{{ `<GameSlider v-model="slider" label="BUDGET SHARE" />` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable title="GameProgressBar API" :rows="progressApi" />
    <DocsApiTable title="GameSlider API" :rows="sliderApi" />
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
}

.row {
  display: flex;
  gap: 12px;
}
</style>
