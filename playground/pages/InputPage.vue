<script setup lang="ts">
import { ref } from 'vue';
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameInput, GameButton } from '@/index';

const name = ref('');
const code = ref('YP-2047');

const apiRows = [
  { name: 'modelValue / v-model', desc: '输入值', type: 'string', defaultValue: "''" },
  { name: 'label', desc: '字段标签', type: 'string', defaultValue: '—' },
  { name: 'placeholder', desc: '占位文案', type: 'string', defaultValue: '—' },
  { name: 'hint', desc: '辅助说明', type: 'string', defaultValue: '—' },
  { name: 'type', desc: '原生 input type', type: 'string', defaultValue: "'text'" },
  { name: 'disabled', desc: '禁用', type: 'boolean', defaultValue: 'false' },
  { name: 'readonly', desc: '只读', type: 'boolean', defaultValue: 'false' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="输入框"
      english="GameInput"
      description="文本输入框。外框使用 input-frame 九宫格；输入控件与占位文案均为 DOM，不烘焙在 PNG 里。"
    />

    <DocsDemoBlock title="基础用法" description="支持 v-model。">
      <div class="stack">
        <GameInput v-model="name" label="PRESIDENT" placeholder="请输入姓名" />
        <GameInput v-model="code" label="CLEARANCE" hint="安全许可编号" />
        <p class="yp-body live">live: {{ name || '—' }} / {{ code }}</p>
      </div>
      <template #code>
{{ `<GameInput v-model="name" label="PRESIDENT" placeholder="请输入姓名" />` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="禁用 / 只读">
      <div class="stack">
        <GameInput model-value="已锁定" label="STATUS" disabled />
        <GameInput model-value="只读档案" label="ARCHIVE" readonly />
      </div>
    </DocsDemoBlock>

    <DocsDemoBlock title="与操作按钮组合">
      <div class="row">
        <GameInput v-model="name" placeholder="签署声明…" />
        <GameButton>确认</GameButton>
      </div>
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

.row {
  display: flex;
  gap: 12px;
  align-items: center;
  max-width: 640px;
}

.row :deep(.yp-input) {
  flex: 1;
  max-width: none;
}

.live {
  margin: 0;
  opacity: 0.8;
}
</style>
