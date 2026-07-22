<script setup lang="ts">
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import DocsApiTable from '../components/DocsApiTable.vue';
import {
  DashboardShell,
  GamePanel,
  GameProgressBar,
  GameButton,
  GameIconButton,
} from '@/index';

const resources = [
  { id: 'approval', label: 'APPROVAL', value: '64%', icon: 'chart' },
  { id: 'budget', label: 'BUDGET', value: '¥ 12.4B', icon: 'document' },
  { id: 'stability', label: 'STABILITY', value: '71', icon: 'action' },
];

const actions = [
  { icon: 'document', label: '处理文件', subtitle: 'LEGISLATION' },
  { icon: 'chart', label: '民意调查', subtitle: 'POLLING' },
  { icon: 'action', label: '发布行动', subtitle: 'ACTION' },
  { icon: 'play', label: '推进回合', subtitle: 'ADVANCE' },
];

const notices = [
  { title: '内阁简报', message: '经济议题仍是当前选民最关心的问题。', tone: 'info' as const },
  { title: '边境紧张', message: '北方边境出现新的外交摩擦。', tone: 'warning' as const },
];

const apiRows = [
  { name: 'resources', desc: '顶部资源栏数据', type: 'GameResourceItem[]', defaultValue: '—' },
  { name: 'actions', desc: '功能入口数据', type: 'ActionGridItem[]', defaultValue: '—' },
  { name: 'notices', desc: '右侧通知数据', type: 'NoticeStackItem[]', defaultValue: '—' },
  { name: 'default', desc: '核心信息面板区', type: 'slot', defaultValue: '—' },
  { name: 'footer', desc: '底部操作区', type: 'slot', defaultValue: '—' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="主界面壳"
      english="DashboardShell"
      description="总统主界面页面语法：顶部资源栏、四个主功能入口、核心信息面板、右侧通知区、底部快捷操作。"
    />

    <DocsDemoBlock title="完整组合" description="不要套用通用后台管理布局。">
      <div class="shell-wrap">
        <DashboardShell :resources="resources" :actions="actions" :notices="notices">
          <GamePanel title="顾问建议" subtitle="ADVISOR" size="large">
            <p class="yp-body">建议优先处理能源法案，以稳定中期选举前的民意基础。</p>
            <GameProgressBar label="法案进度" :value="42" tone="warning" />
          </GamePanel>
          <template #footer>
            <GameIconButton icon="close" label="关闭" />
            <GameButton>确认决策</GameButton>
          </template>
        </DashboardShell>
      </div>
      <template #code>
{{ `<DashboardShell :resources="resources" :actions="actions" :notices="notices">
  <GamePanel title="顾问建议" subtitle="ADVISOR">
    <p>建议优先处理能源法案。</p>
    <GameProgressBar :value="42" label="法案进度" />
  </GamePanel>
  <template #footer>
    <GameButton>确认决策</GameButton>
  </template>
</DashboardShell>` }}
      </template>
    </DocsDemoBlock>

    <DocsApiTable :rows="apiRows" />
  </div>
</template>

<style scoped>
.shell-wrap {
  margin: -8px;
  border: 1px solid rgba(184, 149, 98, 0.2);
  overflow: auto;
  max-height: 80vh;
}

.shell-wrap :deep(.yp-dashboard-shell) {
  min-height: auto;
  padding: 16px;
}
</style>
