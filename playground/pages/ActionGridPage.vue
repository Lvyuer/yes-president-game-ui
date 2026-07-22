<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { ActionGrid } from '@/index';

const items = [
  { icon: 'document', label: '处理文件', subtitle: 'LEGISLATION' },
  { icon: 'chart', label: '民意调查', subtitle: 'POLLING' },
  { icon: 'action', label: '发布行动', subtitle: 'ACTION' },
  { icon: 'play', label: '推进回合', subtitle: 'ADVANCE' },
];

const apiRows = [
  { name: 'items', desc: '功能入口列表', type: 'ActionGridItem[]', defaultValue: '—' },
  { name: 'action', desc: '点击时抛出索引', type: '(index: number) => void', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="功能入口区"
      english="ActionGrid"
      description="主功能入口区页面语法。使用 GameFeatureButton 网格，不要套用后台卡片样式。"
    />

    <DocsDemoBlock title="四宫格入口">
      <ActionGrid :items="items" />
      <template #code>
{{ `<ActionGrid :items="[
  { icon: 'document', label: '处理文件', subtitle: 'LEGISLATION' },
  { icon: 'chart', label: '民意调查', subtitle: 'POLLING' },
  { icon: 'action', label: '发布行动', subtitle: 'ACTION' },
  { icon: 'play', label: '推进回合', subtitle: 'ADVANCE' },
]" />` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>
