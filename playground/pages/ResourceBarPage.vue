<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameResourceBar } from '@/index';

const items = [
  { id: 'approval', label: 'APPROVAL', value: '64%', icon: 'chart' },
  { id: 'budget', label: 'BUDGET', value: '¥ 12.4B', icon: 'document' },
  { id: 'stability', label: 'STABILITY', value: '71', icon: 'action' },
];

const apiRows = [
  { name: 'items', desc: '资源条目列表', type: 'GameResourceItem[]', defaultValue: '—' },
  { name: 'items[].id', desc: '唯一键', type: 'string', defaultValue: '—' },
  { name: 'items[].label', desc: '英文标签', type: 'string', defaultValue: '—' },
  { name: 'items[].value', desc: '展示值', type: 'string | number', defaultValue: '—' },
  { name: 'items[].icon', desc: '可选图标', type: 'string', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="资源栏"
      english="GameResourceBar"
      description="顶部资源区。使用 panel-frame 窄条形态，标签与数值为 DOM。"
    />

    <DocsDemoBlock title="基础用法">
      <GameResourceBar :items="items" />
      <template #code>
{{ `<GameResourceBar :items="[
  { id: 'approval', label: 'APPROVAL', value: '64%', icon: 'chart' },
  { id: 'budget', label: 'BUDGET', value: '¥ 12.4B', icon: 'document' },
]" />` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>
