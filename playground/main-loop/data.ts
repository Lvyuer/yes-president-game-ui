export type MainLoopScreen = 'main' | 'publish' | 'inbox' | 'nation';

export const DIRECTIONS = [
  { id: 'livelihood', label: '民生与秩序', desc: '公共服务、治安、罢工与社会运转' },
  { id: 'economy', label: '经济与产业', desc: '就业、投资、贸易保护与基础设施' },
  { id: 'culture', label: '文化与认同', desc: '教育传媒、国家叙事与社会共识' },
  { id: 'defense', label: '国防与安全', desc: '军费、战备、边境与军工体系' },
  { id: 'diplomacy', label: '外交与贸易', desc: '盟友、条约、关税与国际组织' },
] as const;

export type InboxItem = {
  id: string;
  title: string;
  source: string;
  urgency: 'urgent' | 'crisis' | 'normal';
  urgencyLabel: string;
  direction: string;
  summary: string;
  status: 'pending' | 'done';
};

export const INBOX_ITEMS: InboxItem[] = [
  {
    id: 'port-comp',
    title: '港口临时补偿申请',
    source: '工会领袖',
    urgency: 'urgent',
    urgencyLabel: '紧急',
    direction: '民生与秩序',
    summary: '罢工工人要求临时补偿与复工保障，否则将继续封锁港口。',
    status: 'pending',
  },
  {
    id: 'congress-invest',
    title: '国会要求调查调水门',
    source: '国会委员会',
    urgency: 'crisis',
    urgencyLabel: '红色危机',
    direction: '民生与秩序',
    summary: '要求成立独立委员会调查副总统游艇调水门事件，并公开水位调度记录。',
    status: 'pending',
  },
  {
    id: 'military-budget',
    title: '军方请求追加边境预算',
    source: '国防部',
    urgency: 'normal',
    urgencyLabel: '普通',
    direction: '国防与安全',
    summary: '边境雷达老化，请求追加本财年军费 120 亿用于战备升级。',
    status: 'pending',
  },
];

export type NationMetric = {
  key: string;
  label: string;
  value: string;
  delta: string;
  group: string;
  description: string;
  defaultView: 'domestic' | 'network' | 'trend';
  summary: [string, string, string];
  trend: number[];
  progress: number;
};

export const NATION_METRICS: NationMetric[] = [
  {
    key: 'support',
    label: '支持率',
    value: '44%',
    delta: '-2.1 / 周',
    group: '治理底盘',
    description: '选民是否仍愿意让你继续执政。',
    defaultView: 'domestic',
    summary: ['摇摆州持续流失', '港口州 -4', '国内稳定'],
    trend: [46, 48, 43, 47, 45, 46, 44],
    progress: 44,
  },
  {
    key: 'stability',
    label: '国内稳定',
    value: '42',
    delta: '-3 / 周',
    group: '治理底盘',
    description: '罢工、港口、治安与社会秩序的综合状态。',
    defaultView: 'domestic',
    summary: ['港口危机仍在扩大', '2 个红色点位', '支持率'],
    trend: [55, 53, 50, 51, 47, 45, 42],
    progress: 42,
  },
  {
    key: 'cpi',
    label: 'CPI（物价）',
    value: '3.9%',
    delta: '+0.2 / 周',
    group: '治理底盘',
    description: '居民对通胀与生活成本变化的直接体感。',
    defaultView: 'trend',
    summary: ['食品与能源领涨', '连续 4 周上升', '经济景气'],
    trend: [31, 34, 38, 43, 49, 55, 61],
    progress: 39,
  },
  {
    key: 'economy',
    label: '经济景气',
    value: '58',
    delta: '+2 / 周',
    group: '路线实力',
    description: '增长、就业、产业投资与市场活力。',
    defaultView: 'domestic',
    summary: ['沿海工业带复苏', '基建投资 +8%', 'CPI'],
    trend: [42, 46, 48, 51, 53, 55, 58],
    progress: 58,
  },
  {
    key: 'culture',
    label: '文化影响',
    value: '52',
    delta: '+1 / 周',
    group: '路线实力',
    description: '分众国文化叙事在国内外的传播与认同。',
    defaultView: 'network',
    summary: ['西方盟友传播增强', '2 个新文化市场', '个人威望'],
    trend: [41, 43, 45, 46, 49, 51, 52],
    progress: 52,
  },
  {
    key: 'military',
    label: '军事态势',
    value: '61',
    delta: '持平',
    group: '路线实力',
    description: '战备、基地、边境与安全合作的整体态势。',
    defaultView: 'network',
    summary: ['东方边境压力上升', '北方合作稳定', '安全指数'],
    trend: [58, 59, 60, 62, 61, 61, 61],
    progress: 61,
  },
  {
    key: 'diplomacy',
    label: '外交态势',
    value: '48',
    delta: '-1 / 周',
    group: '路线实力',
    description: '盟友、条约、贸易伙伴与国际组织关系。',
    defaultView: 'network',
    summary: ['东方关系继续恶化', '海湾贸易谈判停滞', '经济景气'],
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
  { id: 'loyalty', label: '派系忠诚', value: '71', icon: 'loyalty' },
];

export const MAIN_ACTIONS = [
  { icon: 'phone', label: '手机', subtitle: 'PHONE', action: 'phone' as const },
  { icon: 'document', label: '发布法案', subtitle: 'CREATE BILL', action: 'publish' as const },
  { icon: 'gavel', label: '处理法案', subtitle: 'PROCESS BILL', action: 'inbox' as const },
  { icon: 'nation', label: '国家数据', subtitle: 'NATIONAL DATA', action: 'nation' as const },
];
