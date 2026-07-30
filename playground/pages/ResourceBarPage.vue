<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameResourceBar } from '@/index';
import { RESOURCES } from '../main-loop/data';

const apiRows = [
  { name: 'items', desc: '资源条目列表', type: 'GameResourceItem[]', defaultValue: '—' },
  { name: 'items[].id', desc: '唯一键', type: 'string', defaultValue: '—' },
  { name: 'items[].label', desc: '中文指标名', type: 'string', defaultValue: '—' },
  { name: 'items[].value', desc: '展示值', type: 'string | number', defaultValue: '—' },
  { name: 'items[].icon', desc: '可选图标', type: 'string', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="资源栏"
      english="GameResourceBar"
      description="顶部资源区：单层大框，图标与资源从左到右直排，无嵌套小框。"
    />

    <DocsDemoBlock title="主循环顶栏五项">
      <GameResourceBar :items="RESOURCES" />
      <template #code>
{{ `<GameResourceBar :items="RESOURCES" />` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>
