import type {
  AgendaBoard,
  AgendaItem,
  AgendaRuntime,
  BriefFocusCallout,
  CampaignFlags,
  CampaignState,
  DirectiveQuality,
  DirectiveRecord,
  MetricChange,
  MetricDelta,
  MetricLedgerRow,
  MetricTone,
  SettlementEntry,
  SettlementTone,
  SettleWeekResult,
  WeekBrief,
  WeekEventEntry,
  WeekMetricsSnapshot,
} from './weekLoopTypes';
import {
  formatDynastyWealth,
  LEAK_PROFIT_THRESHOLD_USD,
  parseDynastyWealth,
} from './greenhoodMarket';

export const CAMPAIGN_START_WEEK = 1;
export const CAMPAIGN_END_WEEK = 3;
export const PORT_EMERGENCY_WEEK = 2;

export type SettleWeekInputs = {
  /** 本周 Greenhood 已实现盈亏（美元），结束本周时写入家族资产 */
  marketRealizedUsd?: number;
  /** 本周是否按媒体部要求在 F 发了调水门表态帖（通常 W2） */
  scandalPostDone?: boolean;
};

const AGENDA_IDS = {
  port: 'port-strike',
  yacht: 'vp-yacht-water',
} as const;

function cloneAgenda(item: AgendaRuntime): AgendaRuntime {
  return { ...item };
}

function toAgendaItem(runtime: AgendaRuntime): AgendaItem {
  const { status: _status, ...item } = runtime;
  return { ...item };
}

function parsePercent(value: string): number {
  return parseFloat(value.replace('%', ''));
}

function parseNumber(value: string): number {
  return parseFloat(value.replace(/[^\d.-]/g, ''));
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatIndex(value: number): string {
  return `${Math.round(value)}`;
}

function formatGdp(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatCpi(value: number): string {
  return `${value.toFixed(1)}%`;
}

function deltaDir(from: number, to: number): 'up' | 'down' | 'flat' {
  if (to > from + 0.05) return 'up';
  if (to < from - 0.05) return 'down';
  return 'flat';
}

const HIGHER_IS_BETTER: Record<string, boolean> = {
  民众支持率: true,
  总统威望度: true,
  个人安全值: true,
  治安指数: true,
  家族资产: true,
  'GDP 增速': true,
  CPI: false,
  失业率: false,
  文化影响: true,
  军事态势: true,
  外交态势: true,
};

function metricTone(label: string, direction: 'up' | 'down' | 'flat'): MetricTone {
  if (direction === 'flat') return 'neutral';
  const higherIsBetter = HIGHER_IS_BETTER[label] ?? true;
  if (higherIsBetter) return direction === 'up' ? 'good' : 'bad';
  return direction === 'up' ? 'bad' : 'good';
}

function formatSignedDelta(delta: number, suffix = ''): string {
  if (Math.abs(delta) < 0.05) return '持平';
  const sign = delta > 0 ? '+' : '';
  if (suffix === '%' && Math.abs(delta - Math.round(delta)) < 0.05) {
    return `${sign}${Math.round(delta)}%`;
  }
  if (suffix === '%') {
    return `${sign}${delta.toFixed(1)}%`;
  }
  if (Math.abs(delta - Math.round(delta)) < 0.05) {
    return `${sign}${Math.round(delta)}`;
  }
  return `${sign}${delta.toFixed(1)}`;
}

function makeMetricChange(
  label: string,
  fromStr: string,
  toStr: string,
  fromNum: number,
  toNum: number,
): MetricChange {
  const direction = deltaDir(fromNum, toNum);
  const delta = toNum - fromNum;
  let deltaText = '持平';
  if (label === '民众支持率') deltaText = formatSignedDelta(delta, '%');
  else if (label === 'GDP 增速' || label === 'CPI' || label === '失业率') {
    deltaText = formatSignedDelta(delta, '%');
  } else if (label === '家族资产') {
    deltaText = fromStr === toStr ? '持平' : `${fromStr} → ${toStr}`;
  } else {
    deltaText = formatSignedDelta(delta);
  }
  return {
    label,
    from: fromStr,
    to: toStr,
    direction,
    deltaText,
    tone: metricTone(label, direction),
  };
}

function buildMetricLedger(
  before: WeekMetricsSnapshot,
  after: WeekMetricsSnapshot,
  settlements: SettlementEntry[],
): MetricLedgerRow[] {
  const deltas = buildMetricDeltas(before, after);
  const all = [...deltas.situation, ...deltas.nation];

  return all.map((row) => {
    const sources = settlements
      .filter((entry) => entry.changes.some((change) => change.label === row.label))
      .map((entry) => `${entry.title}（${entry.verdict}）`);
    const matchingChange = settlements
      .flatMap((entry) => entry.changes)
      .find((change) => change.label === row.label);
    const unchanged = row.direction === 'flat';
    return {
      label: row.label,
      from: row.from,
      to: row.to,
      direction: row.direction,
      deltaText: matchingChange?.deltaText ?? (unchanged ? '持平' : '—'),
      tone: matchingChange?.tone ?? metricTone(row.label, row.direction),
      sources,
      unchanged,
    };
  });
}

function buildMetricDeltas(
  before: WeekMetricsSnapshot,
  after: WeekMetricsSnapshot,
): { situation: MetricDelta[]; nation: MetricDelta[] } {
  const situation: MetricDelta[] = [
    {
      label: '民众支持率',
      from: before.primary.support,
      to: after.primary.support,
      direction: deltaDir(parsePercent(before.primary.support), parsePercent(after.primary.support)),
    },
    {
      label: '总统威望度',
      from: before.primary.prestige,
      to: after.primary.prestige,
      direction: deltaDir(parseNumber(before.primary.prestige), parseNumber(after.primary.prestige)),
    },
    {
      label: '个人安全值',
      from: before.primary.personalSafety,
      to: after.primary.personalSafety,
      direction: deltaDir(
        parseNumber(before.primary.personalSafety),
        parseNumber(after.primary.personalSafety),
      ),
    },
    {
      label: '治安指数',
      from: before.primary.publicOrder,
      to: after.primary.publicOrder,
      direction: deltaDir(
        parseNumber(before.primary.publicOrder),
        parseNumber(after.primary.publicOrder),
      ),
    },
    {
      label: '家族资产',
      from: before.primary.dynastyWealth,
      to: after.primary.dynastyWealth,
      direction: 'flat',
    },
  ];

  const nation: MetricDelta[] = [
    {
      label: 'GDP 增速',
      from: before.nation.gdp,
      to: after.nation.gdp,
      direction: deltaDir(parseNumber(before.nation.gdp), parseNumber(after.nation.gdp)),
    },
    {
      label: 'CPI',
      from: before.nation.cpi,
      to: after.nation.cpi,
      direction: deltaDir(parseNumber(before.nation.cpi), parseNumber(after.nation.cpi)),
    },
    {
      label: '失业率',
      from: before.nation.unemployment,
      to: after.nation.unemployment,
      direction: deltaDir(
        parseNumber(before.nation.unemployment),
        parseNumber(after.nation.unemployment),
      ),
    },
    {
      label: '文化影响',
      from: before.nation.culture,
      to: after.nation.culture,
      direction: deltaDir(parseNumber(before.nation.culture), parseNumber(after.nation.culture)),
    },
    {
      label: '军事态势',
      from: before.nation.military,
      to: after.nation.military,
      direction: deltaDir(parseNumber(before.nation.military), parseNumber(after.nation.military)),
    },
    {
      label: '外交态势',
      from: before.nation.diplomacy,
      to: after.nation.diplomacy,
      direction: deltaDir(
        parseNumber(before.nation.diplomacy),
        parseNumber(after.nation.diplomacy),
      ),
    },
  ];

  return { situation, nation };
}

function buildYachtAgenda(): AgendaRuntime {
  return {
    id: AGENDA_IDS.yacht,
    title: '副总统游艇调水',
    whyOnDesk:
      '昨夜录音冲上热搜第一：副总统疑似承认让水利部门抬高河道水位，方便游艇出航。自家党内吵成一团，国会反对派扬言要开听证会。',
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
    kind: 'standard',
    status: 'open',
  };
}

function createPortEmergencyAgenda(): AgendaRuntime {
  return {
    id: AGENDA_IDS.port,
    title: '港口罢工',
    kind: 'emergency',
    whyOnDesk:
      '调水门余波引爆东海岸码头：工会封闸，货轮滞留锚地，冷链告急。突发事件窗口只开本周。',
    weeksRemaining: 1,
    weeksTotal: 1,
    expiryConsequences: ['治安指数 ↓', '民众支持率 ↓', 'GDP 增速 ↓', '失业率 ↑'],
    resolveConsequences: ['治安指数 ↑', '民众支持率 ↑', 'GDP 增速 ↑', '失业率 ↓'],
    affectedMetrics: ['治安指数', '民众支持率', 'GDP 增速', '失业率'],
    stakeholders: ['码头工会', '港口州长'],
    formalDirectiveThisWeek: false,
    isNew: true,
    status: 'open',
  };
}

function buildInitialAgendas(): AgendaRuntime[] {
  return [buildYachtAgenda()];
}

function buildInitialMetrics(): WeekMetricsSnapshot {
  return {
    primary: {
      support: '45%',
      prestige: '51',
      personalSafety: '62',
      publicOrder: '52',
      dynastyWealth: '$2.4B',
    },
    nation: {
      gdp: '1.6%',
      cpi: '3.9%',
      unemployment: '5.0%',
      culture: '48',
      military: '55',
      diplomacy: '50',
    },
  };
}

export function createInitialCampaignState(): CampaignState {
  return {
    weekNumber: CAMPAIGN_START_WEEK,
    electionCountdownWeeks: 11,
    agendas: buildInitialAgendas(),
    metrics: buildInitialMetrics(),
    directivesThisWeek: [],
    flags: {},
    campaignEnded: false,
  };
}

export function hasOpenPortAgenda(state: CampaignState): boolean {
  return state.agendas.some(
    (item) => item.id === AGENDA_IDS.port && item.status === 'open',
  );
}

export function isPortEmergencyWeek(state: CampaignState): boolean {
  return (
    state.weekNumber === PORT_EMERGENCY_WEEK &&
    hasOpenPortAgenda(state) &&
    state.agendas.some((item) => item.id === AGENDA_IDS.port && item.kind === 'emergency')
  );
}

export function hasYachtFileReady(state: CampaignState): boolean {
  return !!state.flags.yachtFileReady && !state.flags.yachtHearingStarted;
}

export function hasYachtDraftOrdered(state: CampaignState): boolean {
  return (
    !!state.flags.yachtDraftOrdered ||
    state.directivesThisWeek.some(
      (entry) =>
        entry.agendaId === AGENDA_IDS.yacht && entry.quality === 'advance_not_clear',
    )
  );
}

function hasDirective(state: CampaignState, agendaId: string): DirectiveRecord | undefined {
  return state.directivesThisWeek.find((entry) => entry.agendaId === agendaId);
}

function applyPenalty(
  metrics: WeekMetricsSnapshot,
  penalty: 'light' | 'medium' | 'heavy',
): { metrics: WeekMetricsSnapshot; changes: MetricChange[] } {
  const support = parsePercent(metrics.primary.support);
  const prestige = parseNumber(metrics.primary.prestige);
  const safety = parseNumber(metrics.primary.personalSafety);
  const order = parseNumber(metrics.primary.publicOrder);
  const gdp = parseNumber(metrics.nation.gdp);
  const cpi = parseNumber(metrics.nation.cpi);
  const unemployment = parseNumber(metrics.nation.unemployment);

  const factor = penalty === 'light' ? 1 : penalty === 'medium' ? 2 : 3;
  const safetyDrop = penalty === 'heavy' ? 2 : 1;

  const nextSupport = support - factor;
  const nextPrestige = prestige - factor;
  const nextSafety = safety - safetyDrop;
  const nextOrder = order - factor * 2;
  const nextGdp = gdp - 0.1 * factor;
  const nextCpi = cpi + 0.1 * factor;
  const nextUnemployment = unemployment + 0.1 * factor;

  const next: WeekMetricsSnapshot = {
    primary: {
      ...metrics.primary,
      support: formatPercent(nextSupport),
      prestige: formatIndex(nextPrestige),
      personalSafety: formatIndex(nextSafety),
      publicOrder: formatIndex(nextOrder),
    },
    nation: {
      ...metrics.nation,
      gdp: formatGdp(nextGdp),
      cpi: formatCpi(nextCpi),
      unemployment: `${nextUnemployment.toFixed(1)}%`,
    },
  };

  const changes: MetricChange[] = [
    makeMetricChange('民众支持率', metrics.primary.support, next.primary.support, support, nextSupport),
    makeMetricChange('总统威望度', metrics.primary.prestige, next.primary.prestige, prestige, nextPrestige),
    makeMetricChange(
      '个人安全值',
      metrics.primary.personalSafety,
      next.primary.personalSafety,
      safety,
      nextSafety,
    ),
    makeMetricChange('治安指数', metrics.primary.publicOrder, next.primary.publicOrder, order, nextOrder),
    makeMetricChange('GDP 增速', metrics.nation.gdp, next.nation.gdp, gdp, nextGdp),
    makeMetricChange('CPI', metrics.nation.cpi, next.nation.cpi, cpi, nextCpi),
    makeMetricChange(
      '失业率',
      metrics.nation.unemployment,
      next.nation.unemployment,
      unemployment,
      nextUnemployment,
    ),
  ].filter((change) => change.direction !== 'flat');

  return { metrics: next, changes };
}

function applyBonus(
  metrics: WeekMetricsSnapshot,
): { metrics: WeekMetricsSnapshot; changes: MetricChange[] } {
  const support = parsePercent(metrics.primary.support);
  const order = parseNumber(metrics.primary.publicOrder);
  const nextSupport = support + 1;
  const nextOrder = order + 2;

  const next: WeekMetricsSnapshot = {
    ...metrics,
    primary: {
      ...metrics.primary,
      support: formatPercent(nextSupport),
      publicOrder: formatIndex(nextOrder),
    },
  };

  const changes: MetricChange[] = [
    makeMetricChange('民众支持率', metrics.primary.support, next.primary.support, support, nextSupport),
    makeMetricChange('治安指数', metrics.primary.publicOrder, next.primary.publicOrder, order, nextOrder),
  ];

  return { metrics: next, changes };
}

/** F 调水门表态：轻量舆论反馈（不替代听证令）。 */
function applyScandalPostSettlement(
  metrics: WeekMetricsSnapshot,
  posted: boolean,
): { metrics: WeekMetricsSnapshot; changes: MetricChange[] } {
  const support = parsePercent(metrics.primary.support);
  const prestige = parseNumber(metrics.primary.prestige);

  if (posted) {
    const nextSupport = support + 1;
    const nextPrestige = prestige + 1;
    const next: WeekMetricsSnapshot = {
      ...metrics,
      primary: {
        ...metrics.primary,
        support: formatPercent(nextSupport),
        prestige: formatIndex(nextPrestige),
      },
    };
    return {
      metrics: next,
      changes: [
        makeMetricChange(
          '民众支持率',
          metrics.primary.support,
          next.primary.support,
          support,
          nextSupport,
        ),
        makeMetricChange(
          '总统威望度',
          metrics.primary.prestige,
          next.primary.prestige,
          prestige,
          nextPrestige,
        ),
      ],
    };
  }

  const nextSupport = support - 1;
  const nextPrestige = prestige - 1;
  const next: WeekMetricsSnapshot = {
    ...metrics,
    primary: {
      ...metrics.primary,
      support: formatPercent(nextSupport),
      prestige: formatIndex(nextPrestige),
    },
  };
  return {
    metrics: next,
    changes: [
      makeMetricChange(
        '民众支持率',
        metrics.primary.support,
        next.primary.support,
        support,
        nextSupport,
      ),
      makeMetricChange(
        '总统威望度',
        metrics.primary.prestige,
        next.primary.prestige,
        prestige,
        nextPrestige,
      ),
    ],
  };
}

function applyMarketSettlement(
  metrics: WeekMetricsSnapshot,
  realizedUsd: number,
): { metrics: WeekMetricsSnapshot; leaked: boolean; changes: MetricChange[] } {
  if (!realizedUsd) {
    return { metrics, leaked: false, changes: [] };
  }

  const currentWealth = parseDynastyWealth(metrics.primary.dynastyWealth);
  const nextWealth = currentWealth + realizedUsd;
  const wealthFrom = metrics.primary.dynastyWealth;
  const wealthTo = formatDynastyWealth(nextWealth);

  let next: WeekMetricsSnapshot = {
    ...metrics,
    primary: {
      ...metrics.primary,
      dynastyWealth: wealthTo,
    },
  };

  const changes: MetricChange[] = [
    makeMetricChange('家族资产', wealthFrom, wealthTo, currentWealth, nextWealth),
  ];

  const leaked = realizedUsd > LEAK_PROFIT_THRESHOLD_USD;
  if (leaked) {
    const prestige = parseNumber(next.primary.prestige);
    const support = parsePercent(next.primary.support);
    const nextPrestige = prestige - 3;
    const nextSupport = support - 2;
    next = {
      ...next,
      primary: {
        ...next.primary,
        prestige: formatIndex(nextPrestige),
        support: formatPercent(nextSupport),
      },
    };
    changes.push(
      makeMetricChange('总统威望度', metrics.primary.prestige, next.primary.prestige, prestige, nextPrestige),
      makeMetricChange('民众支持率', metrics.primary.support, next.primary.support, support, nextSupport),
    );
  }

  return { metrics: next, leaked, changes };
}

function electionReminder(week: number, support: string): string {
  const remaining = Math.max(1, stateElectionWeeks(week));
  if (week === 1) {
    return `距大选还有 ${remaining} 周。调水门录音已上热搜第一；本周先找幕僚定听证令口径，公开表态留给下周媒体部。`;
  }
  if (week === 2) {
    return `距大选还有 ${remaining} 周。东海岸港口突发罢工压上桌——先找工会领袖谈；调水门也该找媒体部发公开表态了。`;
  }
  return `距大选还有 ${remaining} 周。三周切片收尾：可听幕僚复盘港口回声。当前支持率 ${support}。`;
}

function stateElectionWeeks(week: number): number {
  return Math.max(1, 12 - week);
}

function resolveAgendaActionHint(
  item: AgendaRuntime,
  flags: CampaignFlags,
  directives: DirectiveRecord[],
): string | undefined {
  if (item.id === AGENDA_IDS.port && item.kind === 'emergency') {
    if (item.formalDirectiveThisWeek) return undefined;
    return '本周必须在「发布法案」颁布港口临时补偿令。';
  }

  if (item.id === AGENDA_IDS.yacht) {
    if (flags.yachtHearingStarted || item.formalDirectiveThisWeek) return undefined;
    if (flags.yachtFileReady) {
      return '到「处理文件」签署《副总统配合国会听证令》。';
    }
    const drafted =
      flags.yachtDraftOrdered ||
      directives.some(
        (entry) =>
          entry.agendaId === AGENDA_IDS.yacht && entry.quality === 'advance_not_clear',
      );
    if (!drafted) {
      return '先通过手机联系幕僚，表态是否接国会送来的听证令。';
    }
  }

  return undefined;
}

function buildFocusCallouts(state: CampaignState): BriefFocusCallout[] {
  const callouts: BriefFocusCallout[] = [];
  const port = state.agendas.find((item) => item.id === AGENDA_IDS.port);
  const yacht = state.agendas.find((item) => item.id === AGENDA_IDS.yacht);
  const yachtDrafted =
    !!state.flags.yachtDraftOrdered ||
    state.directivesThisWeek.some(
      (entry) =>
        entry.agendaId === AGENDA_IDS.yacht && entry.quality === 'advance_not_clear',
    );

  if (port?.status === 'open' && port.kind === 'emergency' && !port.formalDirectiveThisWeek) {
    callouts.push({
      id: 'port-compensation',
      label: '港口罢工 · 《港口临时补偿令》',
      kind: 'bill',
      summary:
        '东海岸主要集装箱港因调水门余波突然停工：闸口被封，货轮堵在锚地，冷链和民生供应告急。',
      action:
        '先打开 Felegram 找工会领袖谈开闸条件；谈妥后到「发布法案」颁布《港口临时补偿令》。本周必须落地。',
      consequence:
        '签了：封锁会松动，下周能看到复工和补偿到账。不签：治安和支持率会重挫，港口危机按失守收场。',
    });
  }

  if (state.flags.yachtFileReady && !state.flags.yachtHearingStarted) {
    if (!yacht?.formalDirectiveThisWeek) {
      callouts.push({
        id: 'yacht-hearing-file',
        label: '调水门 · 《副总统配合国会听证令》',
        kind: 'document',
        summary:
          '国会要求签署的《副总统配合国会听证令》已送到办公桌。反对派仍在指责圆厅包庇副总统。',
        action: '到「处理文件」签署该听证令，交给国会相关委员会安排听证日程。',
        consequence:
          '签了：听证开始排期，外界会说圆厅终于有动作。不签：会被说成圆厅装听不见，剩余处理时间继续减少。',
      });
    }
  } else if (
    yacht?.status === 'open' &&
    !state.flags.yachtHearingStarted &&
    !yachtDrafted &&
    !yacht.formalDirectiveThisWeek
  ) {
    callouts.push({
      id: 'yacht-aide-draft',
      label: '调水门 · 国会听证令',
      kind: 'channel',
      summary:
        '流传出一段副总统游艇录音：他疑似让水利部门抬高河道水位，方便游艇出航。国会反对派要求你签署《副总统配合国会听证令》；正式文本还在核稿，本周送不到签批台。',
      action:
        '打开手机 Felegram，向幕僚表态是否接令；可顺手找副总统旺斯压他闭嘴。媒体部与 F 公开表态安排在下周。',
      consequence:
        '答应了：下周桌上会有待签文件，本周算有回应。不表态：剩余处理时间少一周，外界会说你在包庇副总统。',
    });
  }

  if (state.flags.yachtHearingStarted && yacht?.status === 'open') {
    const isDemoFinale = state.weekNumber >= CAMPAIGN_END_WEEK;
    callouts.push({
      id: 'yacht-hearing-ongoing',
      label: '调水门 · 听证排期中',
      kind: 'document',
      summary: '配合听证令已生效，国会相关委员会开始安排听证日程；丑闻还没了结。',
      action: isDemoFinale
        ? '本周没有新的必签文件。结束本周后会先看结算简报，再收束本局。'
        : '本周没有新的必签文件；可继续留意媒体部和党内反应。',
      consequence: isDemoFinale
        ? '听证还没开庭，调水门不会就此了结；本局停在「程序已启动、丑闻未结」。'
        : '听证真正开庭前，支持率仍可能承压；已经启动程序后，拖延不再被写成装听不见，但丑闻还在。',
    });
  }

  if (
    state.weekNumber === PORT_EMERGENCY_WEEK &&
    yacht?.status === 'open' &&
    !state.flags.yachtHearingStarted
  ) {
    callouts.push({
      id: 'yacht-media-post',
      label: '调水门 · F 公开表态',
      kind: 'channel',
      summary:
        '听证令已在签批台，但公众仍觉得圆厅装聋。媒体部本周上线，催你发一条切割/冷处理。',
      action:
        '打开 Felegram 联系媒体部对齐口径，再到 F 用一键稿发帖。发帖不算签署听证令。',
      consequence:
        '发了：舆论从「完全沉默」改成「至少开过口」。不发：热搜继续按护短叙事加码，与港口危机抢同一新闻周期。',
    });
  }

  if (state.weekNumber === CAMPAIGN_START_WEEK && !yachtDrafted) {
    callouts.push({
      id: 'greenhood-chip',
      label: '芯片政策传闻 · TECH',
      kind: 'channel',
      summary:
        '内阁在讨论芯片补贴和算力采购是否松绑；TECH 盘前波动，记者称相关政策窗口可能很快收紧。',
      action: '可选：打开手机进家族群听通气，再到 Greenhood 查看 TECH 行情。',
      consequence:
        '若趁这个窗口大赚，结算时媒体可能甩「内幕交易」质疑，拖累威望和支持率。',
    });
  }

  if (state.flags.portEchoPending) {
    callouts.push({
      id: 'port-echo',
      label: '港口疏通 · 补偿令执行中',
      kind: 'document',
      summary:
        '上周《港口临时补偿令》已生效：首批补偿到账，码头分批复工，闸口纠察线在撤。',
      action:
        '先听幕僚复盘上周执行情况；再点右上角 FTube 视频推送看复工现场。本周没有新的港口必签文件。',
      consequence: '急性封锁已压住，但供应链还没完全恢复。',
    });
  }

  return callouts;
}

function buildOpeningBrief(state: CampaignState): WeekBrief {
  const eventDetails: WeekEventEntry[] = [
    {
      headline: '副总统游艇调水录音上热搜',
      paragraphs: [
        '昨夜，一段据称录自副总统私人游艇的音频在社交平台 F 与三家晚间新闻同时炸开。录音里，副总统疑似承认让水利部门抬高河道水位，好让游艇顺利出航，并笑称「反正纳税人不会查水位标尺」。',
        '话题标签一小时内冲到热搜第一。亲媒标题写「录音真伪待鉴」，反对派与独立台则直接称「圆厅二号人物动用公共工程开游艇」。党内党团会上，切割派、护短派和「等总统先开口」派当场吵翻。',
        '本周圆厅的第一刀不是发帖，而是定调：国会反对派催签的《副总统配合国会听证令》还在核稿——接不接，得先跟幕僚说清楚；必要时再压副总统旺斯闭嘴。公开切割留给下周媒体部上线后再做。',
      ],
    },
    {
      headline: '记者会追问切割；反对派放风听证',
      paragraphs: [
        '今早例行记者会上，提问连珠：总统是否事先知情？会否要求副总统暂避公务？支不支持国会听证？发言人连答三次「正在核实材料」，直播评论区已在刷「拖延」。',
        '国会反对派领袖傍晚对镜头放风：将推动《副总统配合国会听证令》相关动议，并点名「圆厅若一周内无正式回应，就按护短叙事打」。所谓正式回应，指的是经幕僚接令与后续签署，不是先上 F 吵架。',
      ],
    },
    {
      headline: '内阁内部讨论芯片补贴与算力采购',
      paragraphs: [
        '同日，圆厅经济班子仍在闭门讨论芯片补贴加码，以及联邦算力采购能否本周松绑。盘前 TECH 等科技股出现异常波动，两名匿名记者放风「政策窗口可能收紧」。',
        '家族群里已有人在讨论怎么吃这个窗口：先建仓、再放风、再落袋。任何「放风前建仓」的传闻，都会被反对派写成「总统家族趁乱捞钱」。',
      ],
    },
  ];

  return {
    week: state.weekNumber,
    electionCountdownWeeks: state.electionCountdownWeeks,
    electionReminder: electionReminder(state.weekNumber, state.metrics.primary.support),
    eventDetails,
    thisWeekEvents: eventDetails.map((entry) => entry.headline),
    focusCallouts: buildFocusCallouts(state),
  };
}

function buildAgendaBoard(state: CampaignState): AgendaBoard {
  const openItems = state.agendas
    .filter((item) => item.status === 'open')
    .map((item) => {
      const base = toAgendaItem(item);
      const actionHint = resolveAgendaActionHint(
        item,
        state.flags,
        state.directivesThisWeek,
      );
      const directive = state.directivesThisWeek.find((entry) => entry.agendaId === item.id);
      let thisWeekDirectiveLabel: string | undefined;
      if (directive?.quality === 'advance_not_clear') {
        thisWeekDirectiveLabel = '已答应接令，结束本周后下周送到签批台';
      } else if (directive || item.formalDirectiveThisWeek) {
        thisWeekDirectiveLabel = '已签署，结束本周后生效';
      }
      return {
        ...base,
        ...(actionHint ? { actionHint } : {}),
        ...(thisWeekDirectiveLabel ? { thisWeekDirectiveLabel } : {}),
      };
    });
  return {
    week: state.weekNumber,
    electionCountdownWeeks: state.electionCountdownWeeks,
    metaLine: `${openItems.length} 件在办 · 距大选还有 ${state.electionCountdownWeeks} 周`,
    items: openItems,
  };
}

export function buildWeekViewFromCampaign(state: CampaignState): {
  brief: WeekBrief;
  agenda: AgendaBoard;
  metrics: WeekMetricsSnapshot;
} {
  if (state.weekNumber === CAMPAIGN_START_WEEK && state.directivesThisWeek.length === 0) {
    return {
      brief: buildOpeningBrief(state),
      agenda: buildAgendaBoard(state),
      metrics: state.metrics,
    };
  }

  const eventDetails = buildThisWeekEventDetails(state);

  const brief: WeekBrief = {
    week: state.weekNumber,
    electionCountdownWeeks: state.electionCountdownWeeks,
    electionReminder: electionReminder(state.weekNumber, state.metrics.primary.support),
    eventDetails,
    thisWeekEvents: eventDetails.map((entry) => entry.headline),
    focusCallouts: buildFocusCallouts(state),
  };

  return {
    brief,
    agenda: buildAgendaBoard(state),
    metrics: state.metrics,
  };
}

function buildThisWeekEventDetails(state: CampaignState): WeekEventEntry[] {
  const events: WeekEventEntry[] = [];
  const port = state.agendas.find((item) => item.id === AGENDA_IDS.port);
  const yacht = state.agendas.find((item) => item.id === AGENDA_IDS.yacht);

  if (state.flags.portEchoPending) {
    events.push({
      headline: '港口补偿令落地：首批到账，分批复工',
      paragraphs: [
        '上周生效的《港口临时补偿令》开始执行：第一批补偿款打入指定账户，码头宣布分批复工，货场外围的封锁线昨夜起陆续撤除。',
        'FTube 与晚间新闻已开始播出复工第一天的现场画面：闸口纠察线在撤、首批工人返岗。锚地仍有积压货轮排队进港，冷链延误与短途运价高企尚未退烧——急性封锁已松动，疏港仍需时间。',
        '本周可先听幕僚复盘执行进度，再去 FTube 看复工连线；没有新的港口必签文件。',
      ],
    });
  } else if (port?.status === 'open' && port.kind === 'emergency') {
    events.push({
      headline: '东海岸港口突发罢工',
      kind: 'emergency',
      paragraphs: [
        '调水门爆开后的次日清晨，东海岸一座主要集装箱港宣布停工。闸口被纠察线封死，十余艘货轮滞留锚地；冷藏箱与汽车零部件最先告急，超市货架照片开始在 F 上流传。',
        '港口州长深夜连线圆厅，称「本周内若没有可执行的临时补偿令，街头与码头会一起失控」。要开闸，得先跟工会领袖谈清楚条件；谈妥后再颁布临时补偿令。',
        '这事本周必须压住。拖过本周，港口会从还能谈变成已经失控，治安和民生代价会直接记进本周结算。幕僚也会在 Felegram 里催你动手。',
      ],
    });
    events.push({
      headline: '媒体部上线：调水门该发公开表态了',
      paragraphs: [
        '上周圆厅已通过幕僚接住国会听证令，待签文件本周送到「处理文件」。但公众侧仍觉得总统装聋：录音还在热搜，F 上没有总统账号的切割/冷处理。',
        '媒体部本周正式上线，催你先对齐口径，再发一条短硬帖。发帖稳舆论，签令走程序——两边都要，发帖不能代替签署。',
      ],
    });
  }

  if (state.flags.yachtFileReady && !state.flags.yachtHearingStarted) {
    events.push({
      headline: '国会听证令送到签批台',
      paragraphs: [
        '《副总统配合国会听证令》已送到「处理文件」。这是国会反对派要求你签署的正式文本；上周你经幕僚渠道答应接令后，法务与办公厅完成核稿，本周才送到签批台。',
        '签署后，副总统旺斯办公室须配合调查日程与听证排期。亲媒会说「圆厅终于有动作」；反对派则会放话「签了也只是开始，听证会上见」。',
        '签完不等于丑闻了结——只是从「圆厅装听不见」变成「听证程序已启动」。',
      ],
    });
  } else if (state.flags.yachtHearingStarted) {
    events.push({
      headline: '国会启动调水门听证排期',
      paragraphs: [
        state.flags.yachtMediaPosted
          ? '配合听证令生效后，国会相关委员会本周开始安排听证日程。上周总统账号那条切割帖仍被亲媒反复引用；反对派则咬住「发帖不等于配合」，催听证材料。副总统旺斯办公室声明愿配合程序。'
          : '配合听证令生效后，国会相关委员会本周开始安排听证日程。副总统旺斯办公室声明「愿澄清误会、配合程序」；反对派领袖称「这是圆厅的拖延剧本，听证材料我们自己备」。',
        '晚间新闻的问题已经换了：不再问总统会不会表态，而问听证首日会不会爆出新录音、新账本。调水门还没了结，首都支持率在听证开庭前仍可能承压。',
      ],
    });
  } else if (yacht?.status === 'open') {
    const remaining = yacht.weeksRemaining;
    events.push({
      headline: '调水门热搜未退，国会仍在施压',
      paragraphs: [
        '游艇调水录音仍在 F 热搜前列。亲媒推「剪辑拼接」与「特勤安保需要」说辞，反对派每日更新「水位标尺对比图」，点名河道抬升时段与游艇出航重叠。自家党内有人主张撇清、有人主张护着，吵成一团。',
        remaining != null
          ? `国会那份听证令仍在催签。这件丑闻还在总统桌上，公开期限大约还剩 ${remaining} 周；每多拖一周，外界就越容易说你在包庇副总统旺斯。`
          : '国会那份听证令仍在催签。这件丑闻还在总统桌上；每多拖一周，外界就越容易说你在包庇副总统旺斯。',
      ],
    });
  }

  if (events.length === 0) {
    events.push({
      headline: '首都本周无新的突发事件',
      paragraphs: [
        '没有新的爆炸性录音或码头停工冲上热搜。选举倒计时照常走；桌上尚未了结的议题仍在消耗期限与政治资本。',
      ],
    });
  }

  return events;
}

function settlementLine(entry: SettlementEntry): string {
  return `${entry.title} — ${entry.verdict}。${entry.detail}`;
}

type AgendaVerdict = {
  id: string;
  title: string;
  verdict: string;
  tone: SettlementTone;
  cause: string;
  detail: string;
  unchangedNote?: string;
  line: string;
  cleared: boolean;
  deadlineReduced: boolean;
  expired: boolean;
};

function settlePortEmergency(directive?: DirectiveRecord): AgendaVerdict {
  if (directive) {
    const detail =
      '上周颁布的《港口临时补偿令》已进入执行。码头工会同意撤除闸口纠察、组织分批复工，急性封锁开始松动。首批补偿到账与货轮疏通的现场画面，本周会出现在晚间新闻和 FTube。这件突发已从总统桌上拿下。';
    return {
      id: AGENDA_IDS.port,
      title: '港口罢工',
      verdict: '危机已压住',
      tone: 'good',
      cause: '上周你在发布法案颁布了《港口临时补偿令》',
      detail,
      unchangedNote:
        '原先预告的治安下滑与支持率重挫上周未发生——补偿令赶在港口失控前落地。',
      line: `港口罢工 — 危机已压住。${detail}`,
      cleared: true,
      deadlineReduced: false,
      expired: false,
    };
  }

  const detail =
    '上周没有签署港口临时补偿令。闸口纠察线未撤，锚地货轮继续积压，港口州长与工会公开指责圆厅「见死不救」。突发事件窗口已关闭，港口议题从桌上消失；留下的是街头失控与支持率重挫的账单。';
  return {
    id: AGENDA_IDS.port,
    title: '港口罢工',
    verdict: '危机失控',
    tone: 'bad',
    cause: '上周没有签署港口临时补偿令',
    detail,
    line: `港口罢工 — 上周几乎没管。${detail}`,
    cleared: false,
    deadlineReduced: false,
    expired: true,
  };
}

function settleYacht(agenda: AgendaRuntime, directive?: DirectiveRecord): AgendaVerdict {
  if (directive?.quality === 'basic') {
    const remaining = agenda.weeksRemaining ?? 3;
    const detail = `上周你签署了《副总统配合国会听证令》。国会相关委员会将据此排期；副总统办公室被迫转入「配合调查」姿态。丑闻并未结案，议题仍挂在桌上（还剩 ${remaining} 周），但首都新闻已从「圆厅装聋」改成「程序启动」。`;
    return {
      id: AGENDA_IDS.yacht,
      title: '副总统游艇调水',
      verdict: '有进展',
      tone: 'warn',
      cause: '上周你在处理文件签署了《副总统配合国会听证令》',
      detail,
      unchangedNote: '原先预告的支持率下滑上周未发生——正式听证程序已启动。',
      line: `副总统游艇调水 — 有进展。${detail}`,
      cleared: false,
      deadlineReduced: false,
      expired: false,
    };
  }

  if (directive?.quality === 'advance_not_clear') {
    const remaining = agenda.weeksRemaining ?? 3;
    const detail = `上周你经幕僚渠道答应接国会要求签署的《副总统配合国会听证令》。当时正式文本仍在核稿；待签件本周已送到「处理文件」。调水门仍在热搜，议题还在（还剩 ${remaining} 周）；「完全没回应」的空窗已被打断。`;
    return {
      id: AGENDA_IDS.yacht,
      title: '副总统游艇调水',
      verdict: '有推进',
      tone: 'warn',
      cause: '上周你经 Felegram 向幕僚表态接国会听证令',
      detail,
      unchangedNote:
        '原先预告的支持率下滑上周未发生——你已答应接令，待签文件本周送到签批台。',
      line: `副总统游艇调水 — 有推进。${detail}`,
      cleared: false,
      deadlineReduced: false,
      expired: false,
    };
  }

  const remaining = (agenda.weeksRemaining ?? 1) - 1;
  if (remaining <= 0) {
    const detail =
      '上周仍未对调水门作出任何正式回应，议题公开期限耗尽。反对派将「总统包庇副总统」写成固定标题；国会调查加码，威望与个人安全再受打击，丑闻以最坏方式落地。';
    return {
      id: AGENDA_IDS.yacht,
      title: '副总统游艇调水',
      verdict: '期限耗尽',
      tone: 'bad',
      cause: '上周没有下达任何正式指令，议题期限已耗尽',
      detail,
      line: `副总统游艇调水 — 期限耗尽。${detail}`,
      cleared: false,
      deadlineReduced: true,
      expired: true,
    };
  }

  const detail = `上周没有就国会听证令表态接令，也没有签署任何相关文件。录音继续霸占热搜，党内继续争吵。议题还在，公开期限还剩 ${remaining} 周。`;
  return {
    id: AGENDA_IDS.yacht,
    title: '副总统游艇调水',
    verdict: '未处理',
    tone: 'bad',
    cause: '上周没有就国会听证令表态接令',
    detail,
    line: `副总统游艇调水 — 几乎没管。${detail}`,
    cleared: false,
    deadlineReduced: true,
    expired: false,
  };
}

export function settleWeek(
  state: CampaignState,
  inputs: SettleWeekInputs = {},
): SettleWeekResult {
  const hadPortEchoPending = !!state.flags.portEchoPending;
  const beforeMetrics = {
    ...state.metrics,
    primary: { ...state.metrics.primary },
    nation: { ...state.metrics.nation },
  };
  let metrics = {
    ...state.metrics,
    primary: { ...state.metrics.primary },
    nation: { ...state.metrics.nation },
  };
  const flags: CampaignFlags = { ...state.flags };
  const settlements: SettlementEntry[] = [];
  const lastWeekResults: string[] = [];
  const nextAgendas: AgendaRuntime[] = [];

  for (const agenda of state.agendas) {
    if (agenda.status === 'cleared') continue;

    const directive = hasDirective(state, agenda.id);
    let verdict: AgendaVerdict;

    if (agenda.id === AGENDA_IDS.port) {
      verdict = settlePortEmergency(directive);
      if (verdict.cleared) {
        flags.portEchoPending = true;
        flags.portEmergencyActive = false;
        const bonus = applyBonus(metrics);
        metrics = bonus.metrics;
        settlements.push({
          id: verdict.id,
          title: verdict.title,
          verdict: verdict.verdict,
          tone: verdict.tone,
          cause: verdict.cause,
          detail: verdict.detail,
          changes: bonus.changes,
          unchangedNote: verdict.unchangedNote,
        });
      } else {
        const penalty = applyPenalty(metrics, 'heavy');
        metrics = penalty.metrics;
        settlements.push({
          id: verdict.id,
          title: verdict.title,
          verdict: verdict.verdict,
          tone: verdict.tone,
          cause: verdict.cause,
          detail: verdict.detail,
          changes: penalty.changes,
        });
      }
      lastWeekResults.push(verdict.line);
    } else if (agenda.id === AGENDA_IDS.yacht) {
      verdict = settleYacht(agenda, directive);
      const entryChanges: MetricChange[] = [];

      if (directive?.quality === 'basic') {
        flags.yachtHearingStarted = true;
        flags.yachtFileReady = false;
      } else if (directive?.quality === 'advance_not_clear') {
        flags.yachtDraftOrdered = true;
        flags.yachtFileReady = true;
      }

      if (verdict.expired) {
        const penalty = applyPenalty(metrics, 'heavy');
        metrics = penalty.metrics;
        entryChanges.push(...penalty.changes);
      } else if (!directive) {
        const penalty = applyPenalty(metrics, 'medium');
        metrics = penalty.metrics;
        entryChanges.push(...penalty.changes);
      }

      settlements.push({
        id: verdict.id,
        title: verdict.title,
        verdict: verdict.verdict,
        tone: verdict.tone,
        cause: verdict.cause,
        detail: verdict.detail,
        changes: entryChanges,
        unchangedNote: verdict.unchangedNote,
      });
      lastWeekResults.push(verdict.line);
    } else {
      verdict = {
        id: agenda.id,
        title: agenda.title,
        verdict: '未处理',
        tone: 'neutral',
        cause: '上周无相关正式指令',
        detail: '无结算规则（stub）。',
        line: `${agenda.title} — 无结算规则（stub）。`,
        cleared: false,
        deadlineReduced: false,
        expired: false,
      };
      settlements.push({
        id: verdict.id,
        title: verdict.title,
        verdict: verdict.verdict,
        tone: verdict.tone,
        cause: verdict.cause,
        detail: verdict.detail,
        changes: [],
      });
      lastWeekResults.push(verdict.line);
    }

    if (verdict.cleared) continue;
    if (agenda.kind === 'emergency') continue;

    const next = cloneAgenda(agenda);
    next.formalDirectiveThisWeek = false;
    next.isNew = false;
    next.lastWeekResult = `${verdict.title} — ${verdict.verdict}`;

    if (verdict.deadlineReduced && next.weeksRemaining !== null) {
      next.weeksRemaining = Math.max(0, (next.weeksRemaining ?? 1) - 1);
    }

    nextAgendas.push(next);
  }

  // W2：媒体部催的 F 调水门表态进入上周结算（发帖 ≠ 签听证令）
  if (state.weekNumber === PORT_EMERGENCY_WEEK) {
    const posted = !!inputs.scandalPostDone;
    const postResult = applyScandalPostSettlement(metrics, posted);
    metrics = postResult.metrics;
    const fPostEntry: SettlementEntry = posted
      ? {
          id: 'yacht-f-post',
          title: '调水门 · F 公开表态',
          verdict: '已发帖',
          tone: 'good',
          cause: '上周按媒体部口径在 F 发了切割/冷处理帖',
          detail:
            '总统账号发帖后，亲媒跟进转载，「圆厅完全装聋」的标题退了一档；反对派改打「空话表态、没签令」。发帖不替代听证令签署，但舆论从「零开口」变成「至少开过口」。',
          changes: postResult.changes,
        }
      : {
          id: 'yacht-f-post',
          title: '调水门 · F 公开表态',
          verdict: '未发帖',
          tone: 'warn',
          cause: '上周媒体部催了公开表态，总统账号未发',
          detail:
            'F 上「圆厅装聋」标签继续占热搜；调水门与港口危机抢同一新闻周期，护短叙事加码。',
          changes: postResult.changes,
        };
    settlements.push(fPostEntry);
    lastWeekResults.push(settlementLine(fPostEntry));
    flags.yachtMediaPosted = posted;
  }

  const nextWeek = state.weekNumber + 1;

  if (state.weekNumber === 1 && nextWeek === PORT_EMERGENCY_WEEK) {
    flags.portStrikeDueNextWeek = true;
    flags.portEmergencyActive = true;
    nextAgendas.push(createPortEmergencyAgenda());
  }

  if (hadPortEchoPending) {
    const echoEntry: SettlementEntry = {
      id: 'port-echo',
      title: '港口罢工',
      verdict: '复工推进',
      tone: 'good',
      cause: '上周签署的港口临时补偿令继续执行',
      detail:
        '第一批补偿款打入工会账户，码头分批复工，闸口纠察线昨夜起撤除；锚地货轮仍在疏通，短途运价尚未回落。复工现场已出现在新闻与 FTube，急性封锁已松动。',
      changes: [],
    };
    settlements.unshift(echoEntry);
    lastWeekResults.unshift(settlementLine(echoEntry));
    flags.portEchoPending = false;
  }

  const marketRealizedUsd = inputs.marketRealizedUsd ?? 0;
  const marketSettlement = applyMarketSettlement(metrics, marketRealizedUsd);
  metrics = marketSettlement.metrics;
  if (marketRealizedUsd !== 0) {
    const sign = marketRealizedUsd > 0 ? '+' : '';
    const wealthDetail = `上周已实现盈亏 ${sign}$${Math.abs(marketRealizedUsd).toLocaleString('en-US')}；家族资产已入账。`;
    const greenhoodEntry: SettlementEntry = {
      id: 'greenhood',
      title: 'Greenhood · TECH',
      verdict: marketRealizedUsd > 0 ? '入账' : '亏损',
      tone: marketSettlement.leaked ? 'bad' : marketRealizedUsd > 0 ? 'good' : 'warn',
      cause: '上周在 Greenhood 完成的 TECH 交易已写入家族资产',
      detail: marketSettlement.leaked
        ? `${wealthDetail} 盈利过高，媒体追问芯片政策放风前抄底 TECH；总统威望与民众支持率受损。`
        : wealthDetail,
      changes: marketSettlement.changes,
    };
    settlements.push(greenhoodEntry);
    lastWeekResults.push(settlementLine(greenhoodEntry));
  }

  const electionCountdownWeeks = Math.max(1, state.electionCountdownWeeks - 1);
  const campaignEnded = nextWeek > CAMPAIGN_END_WEEK;

  const nextState: CampaignState = {
    weekNumber: nextWeek,
    electionCountdownWeeks,
    agendas: nextAgendas,
    metrics,
    directivesThisWeek: [],
    flags,
    campaignEnded,
  };

  const deltas = buildMetricDeltas(beforeMetrics, metrics);
  const eventDetails = campaignEnded
    ? [
        {
          headline: '三周演示收束',
          paragraphs: [
            '本局演示周次已结束。上周结算已记入账本；调水门若已进入听证排期，丑闻仍挂在桌上但不再以「本周必处突发」砸上新一周。',
            '关闭本页简报后，将进入本局收束画面。完整任期与大选倒计时不在本演示范围内。',
          ],
        },
      ]
    : buildThisWeekEventDetails(nextState);
  if (!campaignEnded && marketSettlement.leaked) {
    eventDetails.unshift({
      headline: '调查记者指控家族抢跑 TECH',
      paragraphs: [
        '调查记者发文称：总统家族账户在芯片政策放风前建仓 TECH，账面盈利远超同期指数。反对派要求证监会与国会金融委员会同步立案。',
        '亲媒称「正常投资」，独立台则把调水门与「抄底丑闻」做成同一晚间专题。首都舆论把两条线绑在一起打，总统威望与支持率已在本周账面上受损。',
      ],
    });
  }

  const metricLedger = buildMetricLedger(beforeMetrics, metrics, settlements);

  const brief: WeekBrief = {
    week: campaignEnded ? state.weekNumber : nextWeek,
    electionCountdownWeeks,
    lastWeekResults,
    settlements,
    situationChanges: deltas.situation,
    nationChanges: deltas.nation,
    metricLedger,
    electionReminder: electionReminder(
      campaignEnded ? state.weekNumber : nextWeek,
      metrics.primary.support,
    ),
    eventDetails,
    thisWeekEvents: eventDetails.map((entry) => entry.headline),
    focusCallouts: campaignEnded
      ? [
          {
            id: 'campaign-finale',
            label: '本局收束',
            kind: 'document',
            summary: '本周结算已记入；调水门若已进听证排期，仍未开庭了结。',
            action: '关闭简报后查看本局收束。可再开一局重跑前三周。',
            consequence: '听证庭审与完整任期不在本局范围内。',
          },
        ]
      : buildFocusCallouts(nextState),
  };

  return {
    state: nextState,
    brief,
    agenda: buildAgendaBoard(nextState),
    metrics,
    campaignEnded,
  };
}

export function addDirective(
  state: CampaignState,
  agendaId: string,
  quality: DirectiveQuality,
  label: string,
): CampaignState {
  const filtered = state.directivesThisWeek.filter((entry) => entry.agendaId !== agendaId);
  return {
    ...state,
    directivesThisWeek: [...filtered, { agendaId, quality, label }],
    agendas: state.agendas.map((item) =>
      item.id === agendaId ? { ...item, formalDirectiveThisWeek: true } : item,
    ),
  };
}

export function resetCampaign(): CampaignState {
  return createInitialCampaignState();
}
