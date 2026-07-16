<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameButton } from '@/index';

const apiRows = [
  { name: 'variant', desc: '视觉变体', type: "'primary' | 'secondary' | 'danger' | 'success'", defaultValue: "'primary'" },
  { name: 'disabled', desc: '禁用态', type: 'boolean', defaultValue: 'false' },
  { name: 'default slot', desc: '按钮文案', type: 'slot', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="按钮"
      english="GameButton"
      description="普通操作按钮。Primary / Disabled 使用矮按钮框材质；文案为 DOM。"
    />

    <DocsDemoBlock title="变体" description="primary / secondary / danger / success">
      <div class="row">
        <GameButton>确认</GameButton>
        <GameButton variant="secondary">取消</GameButton>
        <GameButton variant="danger">否决</GameButton>
        <GameButton variant="success">通过</GameButton>
      </div>
      <template #code>
{{ `<GameButton>确认</GameButton>
<GameButton variant="secondary">取消</GameButton>
<GameButton variant="danger">否决</GameButton>
<GameButton variant="success">通过</GameButton>` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="禁用">
      <GameButton disabled>不可用</GameButton>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
</style>
