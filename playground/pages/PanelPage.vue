<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import { GamePanel, GameProgressBar, GameButton } from '@/index';

const apiRows = [
  { name: 'title', desc: '面板标题', type: 'string', defaultValue: '—' },
  { name: 'subtitle', desc: '英文副标题', type: 'string', defaultValue: '—' },
  { name: 'size', desc: '尺寸预设', type: "'large' | 'medium' | 'compact' | 'notice'", defaultValue: "'medium'" },
  { name: 'framed', desc: '是否使用九宫格材质框', type: 'boolean', defaultValue: 'true' },
  { name: 'header', desc: '自定义头部', type: 'slot', defaultValue: '—' },
  { name: 'default', desc: '正文内容', type: 'slot', defaultValue: '—' },
  { name: 'footer', desc: '底部操作区', type: 'slot', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="面板"
      english="GamePanel"
      description="通用面板容器。外框使用暗纹金边 panel-frame 九宫格；标题装饰线为独立元素。支持无标题面板。"
    />

    <DocsDemoBlock title="基础用法" description="标题、正文、底部按钮均为 DOM。">
      <GamePanel title="民意调查报告" subtitle="总统办公室" size="medium">
        <p class="yp-body">经济议题仍是当前选民最关心的问题。支持率在过去两周内小幅回升。</p>
        <GameProgressBar label="公众支持率" :value="64" tone="success" />
        <template #footer>
          <GameButton variant="secondary">查看详情</GameButton>
          <GameButton>发布声明</GameButton>
        </template>
      </GamePanel>
      <template #code>
{{ `<GamePanel title="民意调查报告" subtitle="总统办公室">
  <p>经济议题仍是当前选民最关心的问题。</p>
  <GameProgressBar :value="64" label="支持率" />
  <template #footer>
    <GameButton>发布声明</GameButton>
  </template>
</GamePanel>` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="尺寸" description="large / medium / compact">
      <div class="sizes">
        <GamePanel title="紧凑" subtitle="COMPACT" size="compact">
          <p class="yp-body">适合侧栏摘要。</p>
        </GamePanel>
        <GamePanel title="中等" subtitle="MEDIUM" size="medium">
          <p class="yp-body">顾问报告、民调卡片。</p>
        </GamePanel>
      </div>
    </DocsDemoBlock>

    <DocsDemoBlock title="无标题面板">
      <GamePanel size="compact">
        <p class="yp-body">无 title 时不渲染头部与装饰线，适合纯内容容器。</p>
      </GamePanel>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.sizes {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 900px) {
  .sizes {
    grid-template-columns: 1fr;
  }
}
</style>
