<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameIconButton, GameTitleDivider, GamePanel } from '@/index';

const apiRows = [
  { name: 'icon', desc: '图标名或 URL', type: 'string', defaultValue: '—' },
  { name: 'label', desc: '无障碍名称（aria-label，必填）', type: 'string', defaultValue: '—' },
  { name: 'size', desc: '尺寸', type: "'sm' | 'md' | 'lg'", defaultValue: "'md'" },
  { name: 'disabled', desc: '禁用态', type: 'boolean', defaultValue: 'false' },
];

const dividerApi = [
  { name: 'stretch', desc: '两侧细线延伸铺满宽度；false 时显示完整装饰线素材', type: 'boolean', defaultValue: 'true' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="图标按钮 / 标题分割线"
      english="GameIconButton · GameTitleDivider"
      description="圆形按钮使用 icon-button-base 固定底座；标题分割线使用 title-divider 装饰素材。图标与标题文字均为 DOM。"
    />

    <DocsDemoBlock title="圆形按钮底座">
      <div class="row">
        <GameIconButton icon="play" label="播放" size="sm" />
        <GameIconButton icon="close" label="关闭" />
        <GameIconButton icon="action" label="行动" size="lg" />
        <GameIconButton icon="document" label="文档" />
        <GameIconButton icon="play" label="禁用" disabled />
      </div>
      <template #code>
{{ `<GameIconButton icon="close" label="关闭" />` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="标题分割线">
      <div class="stack">
        <GameTitleDivider />
        <GameTitleDivider :stretch="false" />
      </div>
    </DocsDemoBlock>

    <DocsDemoBlock title="面板标题中的分割线">
      <GamePanel title="民意调查报告" subtitle="总统办公室" size="compact">
        <p class="yp-body">标题下方自动使用装饰分割线。</p>
      </GamePanel>
    </DocsDemoBlock>

    <DocsApiTable title="GameIconButton API" :rows="apiRows" />
    <DocsApiTable title="GameTitleDivider API" :rows="dividerApi" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 560px;
}
</style>
