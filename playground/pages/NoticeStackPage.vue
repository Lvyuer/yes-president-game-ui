<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { NoticeStack } from '@/index';

const items = [
  { title: '内阁简报', message: '经济议题仍是当前选民最关心的问题。', tone: 'info' as const },
  { title: '边境紧张', message: '北方边境出现新的外交摩擦。', tone: 'warning' as const },
  { title: '法案通过', message: '《能源改革法案》已获得国会批准。', tone: 'success' as const },
];

const apiRows = [
  { name: 'items', desc: '通知列表', type: 'NoticeStackItem[]', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="通知栈"
      english="NoticeStack"
      description="右侧通知 / 警告 / 事件提示区。支持 info | warning | danger | success。"
    />

    <DocsDemoBlock title="基础用法">
      <div class="wrap">
        <NoticeStack :items="items" />
      </div>
      <template #code>
{{ `<NoticeStack :items="[
  { title: '内阁简报', message: '...', tone: 'info' },
  { title: '边境紧张', message: '...', tone: 'warning' },
]" />` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.wrap {
  max-width: 420px;
}
</style>
