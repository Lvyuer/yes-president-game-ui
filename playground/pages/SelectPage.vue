<script setup lang="ts">
import { ref } from 'vue';
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GameSelect } from '@/index';

const party = ref('center');
const empty = ref('');

const options = [
  { value: 'left', label: '左翼联盟' },
  { value: 'center', label: '中间派' },
  { value: 'right', label: '保守阵营' },
  { value: 'independent', label: '无党派', disabled: true },
];

const apiRows = [
  { name: 'modelValue / v-model', desc: '当前选中值', type: 'string', defaultValue: "''" },
  { name: 'options', desc: '选项列表', type: 'GameSelectOption[]', defaultValue: '—' },
  { name: 'label', desc: '字段标签', type: 'string', defaultValue: '—' },
  { name: 'placeholder', desc: '未选中时展示文案', type: 'string', defaultValue: "'请选择'" },
  { name: 'disabled', desc: '禁用', type: 'boolean', defaultValue: 'false' },
  { name: 'change', desc: '选中变化事件', type: '(value: string) => void', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="下拉选择"
      english="GameSelect"
      description="下拉选择框。外框使用 select-frame 九宫格；右侧箭头烘焙在框体右区，九切右侧切片加宽以免拉伸变形。选项列表与选中文案均为 DOM。"
    />

    <DocsDemoBlock title="基础用法" description="点击展开，支持键盘方向键与 Esc。">
      <div class="stack">
        <GameSelect v-model="party" label="FACTION" :options="options" />
        <p class="yp-body">当前值：{{ party }}</p>
      </div>
      <template #code>
{{ `<GameSelect
  v-model="party"
  label="FACTION"
  :options="[
    { value: 'left', label: '左翼联盟' },
    { value: 'center', label: '中间派' },
  ]"
/>` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="占位与禁用">
      <div class="stack">
        <GameSelect v-model="empty" placeholder="选择政策方向…" :options="options" />
        <GameSelect model-value="center" label="LOCKED" :options="options" disabled />
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
  max-width: 420px;
}
</style>
