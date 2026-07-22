<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameFeatureButton } from '@/index';

const apiRows = [
  { name: 'icon', desc: '图标名（action/document/chart/play/close）或图片 URL', type: 'string', defaultValue: '—' },
  { name: 'label', desc: '中文主标题（必填）', type: 'string', defaultValue: '—' },
  { name: 'subtitle', desc: '英文副标题，字距拉开', type: 'string', defaultValue: '—' },
  { name: 'disabled', desc: '禁用态', type: 'boolean', defaultValue: 'false' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="功能按钮"
      english="GameFeatureButton"
      description="大功能入口按钮。外框使用深色金边 button-frame 九宫格；图标、中文、英文均为 DOM。适合 ActionGrid，禁止硬缩成小文本按钮。"
    />

    <DocsDemoBlock title="基础用法" description="图标在上，中文在中，英文在下。">
      <div class="row">
        <GameFeatureButton icon="action" label="发布行动" subtitle="ACTION" />
        <GameFeatureButton icon="document" label="处理文件" subtitle="LEGISLATION" />
        <GameFeatureButton icon="chart" label="民意调查" subtitle="POLLING" />
      </div>
      <template #code>
{{ `<GameFeatureButton
  icon="action"
  label="发布行动"
  subtitle="ACTION"
/>` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="尺寸应力" description="大 / 中 / 窄宽，验证九宫格角饰不变形。">
      <div class="row">
        <div class="wide">
          <GameFeatureButton icon="play" label="推进回合" subtitle="ADVANCE" />
        </div>
        <GameFeatureButton icon="action" label="标准尺寸" subtitle="STANDARD" />
        <div class="narrow">
          <GameFeatureButton icon="chart" label="窄宽测试" subtitle="NARROW" />
        </div>
      </div>
    </DocsDemoBlock>

    <DocsDemoBlock title="禁用态">
      <GameFeatureButton icon="document" label="已锁定" subtitle="LOCKED" disabled />
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
}

.wide :deep(.yp-feature-button) {
  min-width: 360px;
  min-height: 180px;
}

.narrow {
  width: 220px;
}
</style>
