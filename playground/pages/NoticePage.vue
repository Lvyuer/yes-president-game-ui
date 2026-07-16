<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameNotice } from '@/index';

const apiRows = [
  { name: 'title', desc: '通知标题（必填）', type: 'string', defaultValue: '—' },
  { name: 'message', desc: '通知正文', type: 'string', defaultValue: '—' },
  { name: 'tone', desc: '语义色', type: "'info' | 'warning' | 'danger' | 'success'", defaultValue: "'info'" },
  { name: 'default', desc: '额外内容', type: 'slot', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="通知"
      english="GameNotice"
      description="事件提示与警告条。使用专用 notice-frame 九宫格；标题与正文必须是 DOM，不要整条做成静态 PNG。"
    />

    <DocsDemoBlock title="语义 tone">
      <div class="stack">
        <GameNotice title="内阁简报" message="经济议题仍是当前选民最关心的问题。" tone="info" />
        <GameNotice title="边境紧张" message="北方边境出现新的外交摩擦。" tone="warning" />
        <GameNotice title="法案通过" message="《能源改革法案》已获得国会批准。" tone="success" />
        <GameNotice title="紧急事态" message="首都出现大规模抗议活动。" tone="danger" />
      </div>
      <template #code>
{{ `<GameNotice
  title="内阁简报"
  message="经济议题仍是当前选民最关心的问题。"
  tone="info"
/>` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 520px;
}
</style>
