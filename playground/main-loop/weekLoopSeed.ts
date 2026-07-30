import type { AgendaBoard, AgendaItem, WeekBrief, WeekMetricsSnapshot } from './weekLoopTypes';

export const INITIAL_WEEK = 4;

const W4_PRIMARY: WeekMetricsSnapshot = {
  primary: {
    support: '46%',
    prestige: '51',
    personalSafety: '62',
    publicOrder: '47',
    dynastyWealth: '$2.4B',
  },
  nation: {
    gdp: '1.5%',
    cpi: '4.0%',
    unemployment: '5.1%',
    culture: '48',
    military: '55',
    diplomacy: '50',
  },
};

const W5_PRIMARY: WeekMetricsSnapshot = {
  primary: {
    support: '45%',
    prestige: '50',
    personalSafety: '60',
    publicOrder: '45',
    dynastyWealth: '$2.4B',
  },
  nation: {
    gdp: '1.4%',
    cpi: '4.1%',
    unemployment: '5.2%',
    culture: '48',
    military: '55',
    diplomacy: '50',
  },
};

function cloneAgendaItems(items: AgendaItem[]): AgendaItem[] {
  return items.map((item) => ({ ...item }));
}

function buildW4Agenda(): AgendaItem[] {
  return [
    {
      id: 'port-strike',
      title: '港口罢工',
      whyOnDesk: '货轮积压，工会要补偿；补偿令已签，街头仍堵。',
      lastWeekResult: '已签署补偿令，工会开始组织复工。',
      weeksRemaining: 2,
      weeksTotal: 3,
      expiryConsequences: ['治安指数 ↓', '民众支持率 ↓', 'GDP 增速 ↓', '失业率 ↑'],
      resolveConsequences: ['治安指数 ↑', '民众支持率 ↑', 'GDP 增速 ↑', '失业率 ↓'],
      affectedMetrics: ['治安指数', '民众支持率', 'GDP 增速', '失业率'],
      stakeholders: ['码头工会', '港口州长'],
      formalDirectiveThisWeek: false,
      isNew: false,
    },
    {
      id: 'north-energy-subsidy',
      title: '北方能源补贴',
      whyOnDesk: '财政支出压力上升，州议会点名催问。',
      lastWeekResult: '几乎没管，州议会抱怨升温。',
      weeksRemaining: null,
      weeksTotal: null,
      affectedMetrics: ['民众支持率', 'CPI', 'GDP 增速'],
      stakeholders: ['北方州议会', '能源企业'],
      formalDirectiveThisWeek: false,
      isNew: false,
    },
    {
      id: 'vp-yacht-water',
      title: '副总统游艇调水',
      whyOnDesk: '录音上热搜，党内互甩锅；国会开始放风要听证。',
      weeksRemaining: 3,
      weeksTotal: 3,
      expiryConsequences: [
        '民众支持率 ↓',
        '总统威望度 ↓',
        '个人安全值 ↓',
      ],
      resolveConsequences: [
        '民众支持率 ↑',
        '总统威望度 ↑',
        '个人安全值 ↑',
      ],
      affectedMetrics: ['民众支持率', '总统威望度', '个人安全值'],
      stakeholders: ['副总统办公室', '国会反对派', '亲媒'],
      formalDirectiveThisWeek: false,
      isNew: true,
    },
  ];
}

const WEEK_BRIEFS: Record<number, WeekBrief> = {
  1: {
    week: 1,
    electionCountdownWeeks: 12,
    electionReminder: '距大选还有 12 周。开局选情尚可，但舆论机器不会给你太多缓冲。',
    thisWeekEvents: [
      '首都：新内阁宣誓，媒体盯着你第一场记者会。',
      '东部：港口工会放风可能停工，供应链开始紧张。',
    ],
  },
  4: {
    week: 4,
    electionCountdownWeeks: 6,
    lastWeekResults: [
      '港口罢工 — 有进展。上周你签署了港口临时补偿令；令已开始执行，工会组织复工，货轮仍在疏通。议题仍挂在桌上，还剩期限。',
      '北方能源补贴 — 几乎没管。上周无相关正式指令；州议会抱怨升温，议题仍挂在桌上。',
    ],
    situationChanges: [
      { label: '民众支持率', from: '44%', to: '46%', direction: 'up' },
      { label: '总统威望度', from: '51', to: '51', direction: 'flat' },
      { label: '个人安全值', from: '62', to: '62', direction: 'flat' },
      { label: '治安指数', from: '42', to: '47', direction: 'up' },
      { label: '家族资产', from: '$2.4B', to: '$2.4B', direction: 'flat' },
    ],
    nationChanges: [
      { label: 'GDP 增速', from: '1.8%', to: '1.5%', direction: 'down' },
      { label: 'CPI', from: '3.8%', to: '4.0%', direction: 'down' },
      { label: '失业率', from: '5.1%', to: '5.1%', direction: 'flat' },
      { label: '文化影响', from: '48', to: '48', direction: 'flat' },
      { label: '军事态势', from: '55', to: '55', direction: 'flat' },
      { label: '外交态势', from: '50', to: '50', direction: 'flat' },
    ],
    electionReminder:
      '距大选还有 6 周。当前选情一般：支持率 46%，离站稳连任还差一口气；港口与北方若再出岔子，盘面会继续收紧。',
    thisWeekEvents: [
      '港口：补偿令在执行，街头还堵着；工会盯着钱什么时候到账。',
      '北方：能源补贴依赖继续加深，财政窟窿开始被媒体点名。',
      '首都：副总统游艇调水录音被放出，热搜第一，党内开始互甩锅。',
    ],
  },
  5: {
    week: 5,
    electionCountdownWeeks: 5,
    lastWeekResults: [
      '港口罢工 — 有进展。补偿令继续执行，街头疏通仍慢；期限还剩 1 周。',
      '北方能源补贴 — 几乎没管。州议会再次点名，议题仍挂着。',
      '副总统游艇调水 — 几乎没管。录音仍在热搜，国会听证风声更紧。',
    ],
    situationChanges: [
      { label: '民众支持率', from: '46%', to: '45%', direction: 'down' },
      { label: '总统威望度', from: '51', to: '50', direction: 'down' },
      { label: '个人安全值', from: '62', to: '60', direction: 'down' },
      { label: '治安指数', from: '47', to: '45', direction: 'down' },
      { label: '家族资产', from: '$2.4B', to: '$2.4B', direction: 'flat' },
    ],
    nationChanges: [
      { label: 'GDP 增速', from: '1.5%', to: '1.4%', direction: 'down' },
      { label: 'CPI', from: '4.0%', to: '4.1%', direction: 'down' },
    ],
    electionReminder:
      '距大选还有 5 周。选情转弱：支持率 45%，游艇丑闻若再发酵，连任盘面会继续收紧。',
    thisWeekEvents: [
      '首都：国会反对派提交听证动议草案，媒体追问你是否护短副总统。',
      '港口：工会宣布若本周补偿不到位将扩大封锁范围。',
    ],
  },
};

const WEEK_AGENDAS: Record<number, () => AgendaItem[]> = {
  4: buildW4Agenda,
  5: () => {
    const items = buildW4Agenda();
    const port = items.find((item) => item.id === 'port-strike');
    if (port) {
      port.weeksRemaining = 1;
      port.formalDirectiveThisWeek = false;
      port.isNew = false;
      port.lastWeekResult = '补偿令继续执行，街头疏通仍慢。';
    }
    const north = items.find((item) => item.id === 'north-energy-subsidy');
    if (north) {
      north.lastWeekResult = '州议会再次点名，仍无正式指令。';
      north.formalDirectiveThisWeek = false;
      north.isNew = false;
    }
    const yacht = items.find((item) => item.id === 'vp-yacht-water');
    if (yacht) {
      yacht.weeksRemaining = 2;
      yacht.isNew = false;
      yacht.lastWeekResult = '录音仍在热搜，国会听证风声更紧。';
      yacht.formalDirectiveThisWeek = false;
    }
    return items;
  },
};

const WEEK_METRICS: Record<number, WeekMetricsSnapshot> = {
  4: W4_PRIMARY,
  5: W5_PRIMARY,
};

export function getWeekBrief(week: number): WeekBrief {
  const brief = WEEK_BRIEFS[week];
  if (brief) return { ...brief, thisWeekEvents: [...brief.thisWeekEvents] };
  return {
    week,
    electionCountdownWeeks: Math.max(1, 12 - week),
    lastWeekResults: ['上周无记录（stub）。'],
    electionReminder: `第 ${week} 周。`,
    thisWeekEvents: ['本周暂无新事（stub）。'],
  };
}

export function getAgendaBoard(week: number): AgendaBoard {
  const factory = WEEK_AGENDAS[week] ?? buildW4Agenda;
  const items = cloneAgendaItems(factory());
  const electionCountdownWeeks =
    WEEK_BRIEFS[week]?.electionCountdownWeeks ?? Math.max(1, 12 - week);

  return {
    week,
    electionCountdownWeeks,
    metaLine: `${items.length} 件在办 · 距大选还有 ${electionCountdownWeeks} 周`,
    items,
  };
}

export function getWeekMetrics(week: number): WeekMetricsSnapshot {
  return WEEK_METRICS[week] ?? W4_PRIMARY;
}
