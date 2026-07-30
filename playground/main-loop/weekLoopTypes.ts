/** 周循环阶段（playground） */
export type WeekPhase = 'brief' | 'agenda' | 'free' | 'settling' | 'campaign_end';

export type MetricDelta = {
  label: string;
  from: string;
  to: string;
  direction: 'up' | 'down' | 'flat';
};

export type MetricTone = 'good' | 'bad' | 'neutral';

export type MetricChange = MetricDelta & {
  deltaText: string;
  tone: MetricTone;
};

export type SettlementTone = 'good' | 'warn' | 'bad' | 'neutral';

export type SettlementEntry = {
  id: string;
  title: string;
  verdict: string;
  tone: SettlementTone;
  cause: string;
  detail: string;
  changes: MetricChange[];
  unchangedNote?: string;
};

export type MetricLedgerRow = MetricChange & {
  sources: string[];
  unchanged: boolean;
};

export type WeekEventEntry = {
  headline: string;
  /** 正文段落（按段渲染）；讲清人物、经过、利害，不含操作提示 */
  paragraphs: string[];
  /** 突发事件：本周突然砸上桌，与常规周报事件区分 */
  kind?: 'emergency' | 'standard';
};

/** 简报扫读用：本周重点总结（事情 / 操作 / 后果） */
export type BriefFocusCallout = {
  id: string;
  /** 短标题，如文件名或事件核 */
  label: string;
  /** 落点类型：签署=处理文件；法案=颁布；手机=Felegram/Greenhood 等 */
  kind: 'document' | 'channel' | 'bill';
  /** 1. 事情概括 */
  summary: string;
  /** 2. 相关操作描述（含落点） */
  action: string;
  /** 3. 后果简述 */
  consequence: string;
};

export type WeekBrief = {
  week: number;
  electionCountdownWeeks: number;
  /** 第一周或无上周数据时省略 */
  lastWeekResults?: string[];
  /** 结构化上周结算（简报第 1 页） */
  settlements?: SettlementEntry[];
  situationChanges?: MetricDelta[];
  nationChanges?: MetricDelta[];
  /** 数值变动总表（简报第 2 页） */
  metricLedger?: MetricLedgerRow[];
  electionReminder: string;
  thisWeekEvents: string[];
  /** 结构化本周事件（简报第 3 页） */
  eventDetails?: WeekEventEntry[];
  /** 本周交互焦点（事件页顶部扫读条） */
  focusCallouts?: BriefFocusCallout[];
};

export type AgendaKind = 'emergency' | 'standard';

export type AgendaItem = {
  id: string;
  title: string;
  whyOnDesk: string;
  lastWeekResult?: string;
  weeksRemaining: number | null;
  weeksTotal: number | null;
  /** 未处理时的指标损害预告（分行列出升降） */
  expiryConsequences?: string[];
  /** 处理好时的指标收益预告（分行列出升降） */
  resolveConsequences?: string[];
  affectedMetrics: string[];
  stakeholders: string[];
  formalDirectiveThisWeek: boolean;
  isNew: boolean;
  /** 突发事件：本周必处，结束本周后窗口关闭 */
  kind?: AgendaKind;
  /** 本周建议行动（显示在议题板，不进简报） */
  actionHint?: string;
  /** 本周指令栏文案（起草 vs 签署） */
  thisWeekDirectiveLabel?: string;
};

export type AgendaBoard = {
  week: number;
  electionCountdownWeeks: number;
  metaLine: string;
  items: AgendaItem[];
};

export type PrimaryMetricSnapshot = {
  support: string;
  prestige: string;
  personalSafety: string;
  publicOrder: string;
  dynastyWealth: string;
};

export type NationMetricSnapshot = {
  gdp: string;
  cpi: string;
  unemployment: string;
  culture: string;
  military: string;
  diplomacy: string;
};

export type WeekMetricsSnapshot = {
  primary: PrimaryMetricSnapshot;
  nation: NationMetricSnapshot;
};

export type DirectiveQuality = 'basic' | 'advance_not_clear';

export type DirectiveRecord = {
  agendaId: string;
  quality: DirectiveQuality;
  label: string;
};

export type AgendaRuntimeStatus = 'open' | 'cleared';

export type AgendaRuntime = AgendaItem & {
  status: AgendaRuntimeStatus;
};

export type CampaignFlags = {
  portStrikeDueNextWeek?: boolean;
  portEmergencyActive?: boolean;
  portEchoPending?: boolean;
  /** W1 已向幕僚表态接国会听证令（文件下周送到） */
  yachtDraftOrdered?: boolean;
  /** 听证令已送到处理文件（通常 W2） */
  yachtFileReady?: boolean;
  yachtHearingStarted?: boolean;
  /** W2 已按媒体部要求发过调水门 F 表态帖 */
  yachtMediaPosted?: boolean;
};

export type CampaignState = {
  weekNumber: number;
  electionCountdownWeeks: number;
  agendas: AgendaRuntime[];
  metrics: WeekMetricsSnapshot;
  directivesThisWeek: DirectiveRecord[];
  flags: CampaignFlags;
  campaignEnded: boolean;
};

export type SettleWeekResult = {
  state: CampaignState;
  brief: WeekBrief;
  agenda: AgendaBoard;
  metrics: WeekMetricsSnapshot;
  campaignEnded: boolean;
};
