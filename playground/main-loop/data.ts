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
  {
    id: 'port-compensation',
    title: '港口临时补偿与复工令',
    source: '劳工部 · 港口州长联署',
    deadline: '本周内',
    urgency: 'crisis',
    urgencyLabel: '红色优先级',
    direction: '民生与秩序',
    summary: '码头工会要求本周颁布临时补偿令，否则扩大封锁。签署后结束本周，急性封锁才会松动。',
    status: 'pending',
  },
  {
    id: 'vp-yacht-hearing',
    title: '副总统配合国会听证令',
    source: '国会反对派',
    deadline: '本周内',
    urgency: 'urgent',
    urgencyLabel: '高优先级',
    direction: '舆论与党内',
    summary: '国会要求总统签署该令，督促副总统配合听证。仅发帖不算正式回应。',
    status: 'pending',
  },
  {
    id: 'north-subsidy-renewal',
    title: '北方本季能源补贴照发令',
    source: '北方州议会',
    deadline: '无硬性期限',
    urgency: 'normal',
    urgencyLabel: '常规',
    direction: '经济与财税',
    summary: '续签本季补贴可暂时稳住北方，但不改长期依赖结构。议题仍会继续挂着。',
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

export const NATION_GROUP_ORDER = ['宏观经济', '路线实力'] as const;

export const NATION_METRICS: NationMetric[] = [
  {
    key: 'gdp',
    label: 'GDP 增速',
    value: '+1.8%',
    delta: '▼ 0.2 / 期',
    group: '宏观经济',
    groupEn: 'MACRO ECONOMY',
    description: '国家经济增长、就业与产业活力的综合结果；经济奇迹路线主看此项。',
    defaultView: 'trend',
    summary: ['港口停摆拖累出口', '范围：-0.2', '承压'],
    trend: [2.4, 2.2, 2.1, 2.0, 1.9, 1.85, 1.8],
    progress: 68,
  },
  {
    key: 'cpi',
    label: 'CPI（年化）',
    value: '3.9%',
    delta: '▲ 0.1 / 期',
    group: '宏观经济',
    groupEn: 'MACRO ECONOMY',
    description: '居民对通胀与生活成本变化的直接体感。',
    defaultView: 'trend',
    summary: ['连续 4 期上升', '范围：+0.1', '预警'],
    trend: [3.1, 3.4, 3.6, 3.7, 3.8, 3.85, 3.9],
    progress: 39,
  },
  {
    key: 'unemployment',
    label: '失业率',
    value: '4.8%',
    delta: '▲ 0.2 / 期',
    group: '宏观经济',
    groupEn: 'MACRO ECONOMY',
    description: '劳动市场压力；罢工、港口停摆与产业政策会快速反映在此项。',
    defaultView: 'domestic',
    summary: ['东部港口相关行业', '范围：+0.2', '抬头'],
    trend: [4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8],
    progress: 48,
  },
  {
    key: 'culture',
    label: '文化影响',
    value: '52',
    delta: '▲ 1 / 期',
    group: '路线实力',
    groupEn: 'ROUTE POWER',
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
    group: '路线实力',
    groupEn: 'ROUTE POWER',
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
    group: '路线实力',
    groupEn: 'ROUTE POWER',
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
  f: { title: 'F', desc: '总统发帖 · F 热榜 · 舆论' },
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

/** 顶栏一级指标 ID（权威命名见 docs/game-design/systems/数值分层.md） */
export const PRIMARY_RESOURCE_IDS = [
  'support',
  'prestige',
  'personal_safety',
  'public_order',
  'dynasty_wealth',
] as const;

export type PrimaryResourceId = (typeof PRIMARY_RESOURCE_IDS)[number];

export const RESOURCES: {
  id: PrimaryResourceId;
  label: string;
  value: string;
  icon: string;
}[] = [
  { id: 'support', label: '民众支持率', value: '44%', icon: 'support' },
  { id: 'prestige', label: '总统威望度', value: '67', icon: 'prestige' },
  { id: 'personal_safety', label: '个人安全值', value: '54', icon: 'security' },
  { id: 'public_order', label: '治安指数', value: '66', icon: 'nation' },
  { id: 'dynasty_wealth', label: '家族资产', value: '¥ 2.4B', icon: 'wealth' },
];

export const MAIN_ACTIONS = [
  { icon: 'phone', label: '手机', subtitle: 'PHONE', action: 'phone' as const },
  { icon: 'document', label: '发布法案', subtitle: 'CREATE BILL', action: 'publish' as const },
  { icon: 'gavel', label: '处理文件', subtitle: 'PROCESS FILES', action: 'inbox' as const },
  { icon: 'nation', label: '国家数据', subtitle: 'NATIONAL DATA', action: 'nation' as const },
];
