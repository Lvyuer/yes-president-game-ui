export type MainLoopScreen = 'main' | 'publish' | 'inbox' | 'nation';

export const DIRECTIONS = [
  {
    id: 'democracy',
    label: '民主与选举制度',
    desc: '立法机构组成、选区划分、选举程序与政党规则',
  },
  {
    id: 'economy',
    label: '经济与财税管理',
    desc: '预算、税收、财政结构与产业调控',
  },
  {
    id: 'culture',
    label: '文化与社会福利',
    desc: '教育、医疗、宗教自由与社会保障',
  },
  {
    id: 'defense',
    label: '国防与安全',
    desc: '武装力量、国防政策、应急管理与边境安全',
  },
  {
    id: 'diplomacy',
    label: '外交与贸易',
    desc: '主权、对外关系、关税与国际组织',
  },
] as const;

export type InboxItem = {
  id: string;
  title: string;
  source: string;
  deadline: string;
  urgency: 'urgent' | 'crisis' | 'normal';
  urgencyLabel: string;
  direction: string;
  summary: string;
  status: 'pending' | 'done';
};

export const INBOX_ITEMS: InboxItem[] = [
  {
    id: 'congress-invest',
    title: '国会要求调查调水门',
    source: '自然资源委员会',
    deadline: '3月9日',
    urgency: 'crisis',
    urgencyLabel: '红色优先级',
    direction: '民生与秩序',
    summary: '要求成立独立委员会调查封锁通往调水门事件，并公开水位调查记录。',
    status: 'pending',
  },
];

export type NationMetric = {
  key: string;
  label: string;
  value: string;
  delta: string;
  group: string;
  groupEn: string;
  description: string;
  defaultView: 'domestic' | 'network' | 'trend';
  summary: [string, string, string];
  trend: number[];
  progress: number;
};

export const NATION_GROUP_ORDER = ['治理绩效', '国家能力'] as const;

export const NATION_METRICS: NationMetric[] = [
  {
    key: 'stability',
    label: '通胀稳定',
    value: '42',
    delta: '▼ 3 / 期',
    group: '治理绩效',
    groupEn: 'GOVERNANCE',
    description: '物价与社会成本压力是否处于可控区间。',
    defaultView: 'domestic',
    summary: ['食品与能源领涨', '范围：+2', '观察中'],
    trend: [55, 53, 50, 51, 47, 45, 42],
    progress: 42,
  },
  {
    key: 'cpi',
    label: 'CPI（年化）',
    value: '3.9%',
    delta: '▲ 2 / 期',
    group: '治理绩效',
    groupEn: 'GOVERNANCE',
    description: '居民对通胀与生活成本变化的直接体感。',
    defaultView: 'trend',
    summary: ['连续 4 期上升', '范围：+1', '预警'],
    trend: [31, 34, 38, 43, 49, 55, 61],
    progress: 39,
  },
  {
    key: 'economy',
    label: '经济水平',
    value: '58',
    delta: '▲ 2 / 期',
    group: '国家能力',
    groupEn: 'NATIONAL POWER',
    description: '增长、就业、产业投资与市场活力。',
    defaultView: 'domestic',
    summary: ['沿海工业带复苏', '范围：+3', '稳定'],
    trend: [42, 46, 48, 51, 53, 55, 58],
    progress: 58,
  },
  {
    key: 'culture',
    label: '文化影响',
    value: '52',
    delta: '▲ 1 / 期',
    group: '国家能力',
    groupEn: 'NATIONAL POWER',
    description: '分众国文化叙事在国内外的传播与认同。',
    defaultView: 'network',
    summary: ['西方盟友传播增强', '范围：+1', '推进中'],
    trend: [41, 43, 45, 46, 49, 51, 52],
    progress: 52,
  },
  {
    key: 'military',
    label: '军事势态',
    value: '61',
    delta: '▲ 1 / 期',
    group: '国家能力',
    groupEn: 'NATIONAL POWER',
    description: '战备、基地、边境与安全合作的整体态势。',
    defaultView: 'network',
    summary: ['东方边境压力上升', '范围：持平', '戒备'],
    trend: [58, 59, 60, 62, 61, 61, 61],
    progress: 61,
  },
  {
    key: 'diplomacy',
    label: '外交影响',
    value: '48',
    delta: '▲ 1 / 期',
    group: '国家能力',
    groupEn: 'NATIONAL POWER',
    description: '盟友、条约、贸易伙伴与国际组织关系。',
    defaultView: 'network',
    summary: ['东方关系继续恶化', '范围：-1', '僵持'],
    trend: [55, 54, 53, 52, 50, 49, 48],
    progress: 48,
  },
];

export const APP_MOCKUPS = {
  felegram: { title: 'Felegram', desc: '私聊 · 家族群 · 加密通讯' },
  greenhood: { title: 'Greenhood', desc: '股市交易 · K 线 · 家族资产' },
  f: { title: 'F', desc: '总统发帖 · 热搜 · 舆论' },
  ftube: { title: 'FTube', desc: '危机 Feed · 现场视频' },
} as const;

export const CRISIS_NOTICES = [
  {
    title: '港口罢工升级',
    message: '东部港口连续封锁第三日，补给线承压。',
    tone: 'danger' as const,
  },
  {
    title: '调水门舆论',
    message: '国会听证会排期逼近，媒体追问水位调度。',
    tone: 'warning' as const,
  },
  {
    title: '边境雷达老化',
    message: '国防部提交追加预算申请，待总统批示。',
    tone: 'info' as const,
  },
];

export const TERM_META = {
  termLabel: '第 2 任期 · 第 24 周',
  midtermLabel: '距离下次中期选举还有 16 周',
  midtermProgress: 48,
};

export const RESOURCES = [
  { id: 'prestige', label: '个人威望', value: '67', icon: 'prestige' },
  { id: 'security', label: '安全指数', value: '54', icon: 'security' },
  { id: 'wealth', label: '家族财产', value: '¥ 2.4B', icon: 'wealth' },
  { id: 'support', label: '支持率', value: '44%', icon: 'support' },
];

export const MAIN_ACTIONS = [
  { icon: 'phone', label: '手机', subtitle: 'PHONE', action: 'phone' as const },
  { icon: 'document', label: '发布法案', subtitle: 'CREATE BILL', action: 'publish' as const },
  { icon: 'gavel', label: '处理文件', subtitle: 'PROCESS FILES', action: 'inbox' as const },
  { icon: 'nation', label: '国家数据', subtitle: 'NATIONAL DATA', action: 'nation' as const },
];
