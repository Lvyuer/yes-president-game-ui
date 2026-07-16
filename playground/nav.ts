export interface DocsNavItem {
  id: string;
  label: string;
  en: string;
  group: 'guide' | 'components' | 'layouts';
}

export const docsNav: DocsNavItem[] = [
  { id: 'overview', label: '总览', en: 'Overview', group: 'guide' },
  { id: 'feature-button', label: '功能按钮', en: 'GameFeatureButton', group: 'components' },
  { id: 'button', label: '按钮', en: 'GameButton', group: 'components' },
  { id: 'icon-button', label: '图标按钮', en: 'GameIconButton', group: 'components' },
  { id: 'panel', label: '面板', en: 'GamePanel', group: 'components' },
  { id: 'progress', label: '进度条', en: 'GameProgressBar', group: 'components' },
  { id: 'slider', label: '滑块', en: 'GameSlider', group: 'components' },
  { id: 'notice', label: '通知', en: 'GameNotice', group: 'components' },
  { id: 'input', label: '输入框', en: 'GameInput', group: 'components' },
  { id: 'select', label: '下拉选择', en: 'GameSelect', group: 'components' },
  { id: 'resource-bar', label: '资源栏', en: 'GameResourceBar', group: 'components' },
  { id: 'action-grid', label: '功能入口区', en: 'ActionGrid', group: 'layouts' },
  { id: 'notice-stack', label: '通知栈', en: 'NoticeStack', group: 'layouts' },
  { id: 'dashboard', label: '主界面壳', en: 'DashboardShell', group: 'layouts' },
];

export const groupLabels: Record<DocsNavItem['group'], string> = {
  guide: '指南',
  components: '组件',
  layouts: '页面语法',
};
