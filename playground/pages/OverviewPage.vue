<script setup lang="ts">
import { ref } from 'vue';
import DocsPageHeader from '../components/DocsPageHeader.vue';
import DocsDemoBlock from '../components/DocsDemoBlock.vue';
import {
  ActionGrid,
  GameButton,
  GameNotice,
  GamePanel,
  GameProgressBar,
  GameResourceBar,
  GameSelect,
  GameSlider,
} from '@/index';

const faction = ref('center');

const resources = [
  { id: 'approval', label: 'APPROVAL', value: '64%', icon: 'chart' },
  { id: 'budget', label: 'BUDGET', value: '¥ 12.4B', icon: 'document' },
  { id: 'stability', label: 'STABILITY', value: '71', icon: 'action' },
];

const actions = [
  { icon: 'document', label: '处理法案', subtitle: 'LEGISLATION' },
  { icon: 'chart', label: '民意调查', subtitle: 'POLLING' },
  { icon: 'action', label: '发布行动', subtitle: 'ACTION' },
  { icon: 'play', label: '推进回合', subtitle: 'ADVANCE' },
];

const selectOptions = [
  { value: 'left', label: '左翼联盟' },
  { value: 'center', label: '中间派' },
  { value: 'right', label: '保守阵营' },
];
</script>

<template>
  <div>
    <DocsPageHeader
      title="总览"
      english="Overview"
      description="Yes President Game UI 是金边暗纹材质组件库。PNG 只负责边框与底纹，文案、图标、状态由 Vue 管理。"
    />

    <DocsDemoBlock
      title="快速上手"
      description="本地包安装后引入组件与样式。"
    >
      <div class="overview-install yp-body">
        <p><code>npm i file:../packages/yes-president-game-ui</code></p>
        <p><code>import { GamePanel, GameFeatureButton } from 'yes-president-game-ui'</code></p>
        <p><code>import 'yes-president-game-ui/style'</code></p>
      </div>
      <template #code>
{{ `import { GamePanel, GameFeatureButton } from 'yes-president-game-ui'
import 'yes-president-game-ui/style'

<GameFeatureButton icon="action" label="发布行动" subtitle="ACTION" />
<GamePanel title="民意调查报告" subtitle="总统办公室">
  <p>正文是 DOM，不是烘焙在 PNG 里。</p>
</GamePanel>` }}
      </template>
    </DocsDemoBlock>

    <DocsDemoBlock title="材质原则" description="三层分离：材质 / 结构 / 状态。">
      <ul class="overview-list yp-body">
        <li><strong>材质层</strong>：九宫格 PNG 边框，放在伪元素装饰层</li>
        <li><strong>结构层</strong>：标题、正文、按钮、图标均为 DOM</li>
        <li><strong>状态层</strong>：hover / pressed / disabled / focus 由 CSS 控制</li>
      </ul>
    </DocsDemoBlock>

    <DocsDemoBlock title="总统台组合预览" description="展示当前已接线的主要材质组件。">
      <div class="overview-stage">
        <GameResourceBar :items="resources" />

        <ActionGrid :items="actions" class="overview-stage__actions" />

        <div class="overview-stage__main">
          <GamePanel title="民意调查报告" subtitle="总统办公室" size="medium">
            <p class="yp-body">经济议题仍是当前选民最关心的问题。支持率在过去两周内小幅回升。</p>
            <GameProgressBar label="公众支持率" :value="64" tone="success" />
            <GameSlider :model-value="58" label="预算分配" />
            <template #footer>
              <GameButton variant="secondary">查看详情</GameButton>
              <GameButton>发布声明</GameButton>
            </template>
          </GamePanel>

          <div class="overview-stage__side">
            <GameSelect v-model="faction" label="FACTION" :options="selectOptions" />
            <GameNotice
              title="内阁简报"
              message="北方边境出现新的外交摩擦，建议优先处理能源法案。"
              tone="warning"
            />
            <div class="overview-stage__buttons">
              <GameButton disabled>已锁定</GameButton>
            </div>
          </div>
        </div>
      </div>
    </DocsDemoBlock>
  </div>
</template>

<style scoped>
.overview-install p {
  margin: 0 0 8px;
}

.overview-install code {
  font-family: Consolas, monospace;
  color: #f0e4c8;
  font-size: 0.88rem;
}

.overview-list {
  margin: 0;
  padding-left: 1.2rem;
  line-height: 1.8;
}

.overview-stage {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.overview-stage__actions {
  width: 100%;
}

.overview-stage__main {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
  align-items: start;
}

.overview-stage__side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.overview-stage__buttons {
  display: flex;
  gap: 12px;
}

@media (max-width: 1100px) {
  .overview-stage__main {
    grid-template-columns: 1fr;
  }
}
</style>
