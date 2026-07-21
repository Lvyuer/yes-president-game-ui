import type { NationMetric } from './data';
import { NATION_METRICS, RESOURCES } from './data';
import ftubePortStrikeVideo from './assets/video/ftube-port-strike.mp4';
import {
  formatDelta,
  formatNationValue,
  formatResourceValue,
  parseNumericValue,
} from './metricFormat';

/** FTube crisis field video — replace file at assets/video/ftube-port-strike.mp4 to swap. */
export const PORT_STRIKE_VIDEO_SRC: string = ftubePortStrikeVideo;

export const PORT_STRIKE_BILL_IDS = ['port-comp', 'congress-invest'] as const;

/** @deprecated Use PORT_STRIKE_BILL_IDS */
export const PORT_STRIKE_BILL_ID = PORT_STRIKE_BILL_IDS[0];

export const PORT_STRIKE_ADVISOR = {
  videoStem: 'idle-signing-documents',
  /** 呈递到位后定格，等玩家签完两份法案再从此处续播（含走近主角等后半段） */
  pauseAtSec: 5,
  cue: {
    title: '幕僚呈上待签文件',
    message: '两份紧急法案需要总统签字。',
    subline: '港口补偿 · 调水门调查',
    cta: '打开处理法案',
  },
} as const;

/** Opening beat before the port-strike crisis push. */
export const PORT_STRIKE_INTRO = {
  videoStem: 'idle-homeless-intruder',
  delayMs: 2000,
} as const;

export type PhoneAppId = 'felegram' | 'greenhood' | 'f' | 'ftube';

export type NegotiationOption = {
  id: string;
  label: string;
  playerMessage: string;
  unionReply: string;
  tone: 'compensation' | 'personal' | 'scapegoat';
};

export type TweetTemplate = {
  id: string;
  label: string;
  content: string;
};

export type MetricDelta = {
  key: string;
  delta: number;
  /** For percent metrics like support/cpi */
  isPercent?: boolean;
  label: string;
};

export const PORT_STRIKE_CRISIS = {
  id: 'port-strike',
  title: '副总统游艇调水，港口工人罢工',
  message: '旺斯外出「考察」期间擅自抬高航道水位，东部港口已连续封锁第三日。',
  subline: '水利署临时调度 · 货轮排队 18 小时',
  tone: 'danger' as const,
  targetApp: 'ftube' as PhoneAppId,
};

export const PORT_STRIKE_FTUBE = {
  headline: '调水门：副总统游艇行程引爆港口罢工',
  views: '2.4M',
  channel: 'FTube 危机现场',
  facts: [
    '副总统家庭游艇行程期间，水利署临时抬高航道水位。',
    '货轮排队 18 小时，工人通宵加班仍无法复工。',
    '工会要求道歉、加班补偿与复工保障，否则继续封锁港口。',
  ],
  videoCaption: '公权调水？货运停摆',
  placeholderNote: '正式现场视频待接入，当前为新闻速览模拟播放。',
};

export const PORT_STRIKE_NEGOTIATION = {
  unionLeader: '港口工会主席 · 老马',
  openingMessage:
    '总统先生，旺斯那家伙调水去度假，我们通宵加班堵在闸口。先让副总统办公室公开道歉，再谈复工和加班费。',
  options: [
    {
      id: 'compensation',
      label: '承诺补偿与复工保障',
      playerMessage: '水位调度我来查，补偿方案今天签。先别堵港口。',
      unionReply: '文件得今晚到我桌上。工人可散，闸口我来控。',
      tone: 'compensation',
    },
    {
      id: 'personal',
      label: '私下许诺个人好处',
      playerMessage: '你的选区明年有个联邦项目名额，补偿我来批。别让媒体看见咱俩聊这个。',
      unionReply: '……行。但公开口径得说得过去，别让我难做。',
      tone: 'personal',
    },
    {
      id: 'scapegoat',
      label: '让副总统办公室背锅',
      playerMessage: '调水门责任归副总统办公室，你们要的道歉我让他们发。旺斯那边我来收拾。',
      unionReply: '终于有人肯卖旺斯了。道歉稿今晚必须出，加班费一分不能少。',
      tone: 'scapegoat',
    },
  ] satisfies NegotiationOption[],
};

export type FelegramContactId = 'union' | 'vance' | 'media';

export type FelegramBeat = {
  /** Scripted presidential line shown when the player hits Enter. */
  player: string;
  /** Contact reply after a short delay. */
  reply: string;
};

export type FelegramContactScript = {
  id: FelegramContactId;
  name: string;
  time: string;
  /** When true, completing the final script beat advances the port-strike case. */
  advancesCase: boolean;
  /** One-line outcome shown as a system note when the script finishes. */
  outcome: string;
  openingMessages: string[];
  /** Ordered demo beats; Enter advances one beat (typed text ignored). */
  beats: FelegramBeat[];
  /** Shown if the player keeps chatting after the script ends. */
  epilogue: string;
};

export type FelegramReplyResult = {
  player: string;
  reply: string;
  /** True on the final script beat. */
  scriptComplete: boolean;
  /** True only on union's final beat — unlocks tweet / port-comp. */
  completesCase: boolean;
};

/**
 * Fixed showcase scripts. Enter advances the next beat;
 * presidential lines are preset (player typing is ignored).
 */
export const FELEGRAM_CONTACTS: FelegramContactScript[] = [
  {
    id: 'union',
    name: '工会领袖',
    time: '09:41',
    advancesCase: true,
    outcome: '成交：私下给好处 · 工会撤闸 · 去签港口补偿法案',
    openingMessages: [
      '总统，港口已经堵三天了。工人要补偿，我这边也得有个交代。',
      '公开怎么说都行，私下你得给我点实际的。',
    ],
    beats: [
      {
        player: '你直接说，要什么。',
        reply: '明年那个联邦物流枢纽，放我选区。',
      },
      {
        player: '可以。还有吗？',
        reply: '复工后的劳务承包，我的人先进场。另外公开层面，你得签一份港口补偿法案，给我个台阶。',
      },
      {
        player: '行，我去签。公开就说这是给工人的。',
        reply: '可以。你签完，我今晚让人撤。',
      },
      {
        player: '别把私下条件说出去。',
        reply: '放心。我对外只说政府重视工人诉求。',
      },
    ],
    epilogue: '我这边等你签字。签完我就撤。',
  },
  {
    id: 'vance',
    name: '副总统旺斯',
    time: '09:35',
    advancesCase: false,
    outcome: '结果：旺斯闭嘴 · 水利署背锅 · 副总统配合调查',
    openingMessages: [
      '哥，热搜别信。水位是水利署调的，不是我调的。',
      '我只是刚好在船上。',
    ],
    beats: [
      {
        player: '你当我是sb吗？',
        reply: '……我不是那个意思。但这总比直接承认是为了游艇调水强。',
      },
      {
        player: '你现在人设比水位还难调度。工人阶级的儿子，开游艇开到热搜第一。',
        reply: '哥，别这么说。我书里可不是这么写的。',
      },
      {
        player: '书里写的是沙发，现实开的是船。你倒是挺会换场景。',
        reply: '……这梗能不能放过我一次。',
      },
      {
        player: '还有你那个镜头。睫毛比政策显眼，评论区比国会还热闹。',
        reply: '造型团队的锅。我本人只想低调。',
      },
      {
        player: '低调？你先闭嘴。今晚别发声，别接受采访。对外水利署背锅，你配合调查。',
        reply: '行。我闭嘴。台阶留给我就行。',
      },
    ],
    epilogue: '我不说了。你那边给我留个口径。',
  },
  {
    id: 'media',
    name: '媒体主编',
    time: '09:29',
    advancesCase: false,
    outcome: '结果：媒体定调 · 游艇问题被压下去 · 舆论转向复工补偿',
    openingMessages: [
      '总统，热搜已经爆了。游艇、调水、罢工都挂在一起。',
      '你给我一句口径，我这边好排头版。',
    ],
    beats: [
      {
        player: '别写游艇。写航道安保调度。',
        reply: '明白，把私人行程拿掉。',
      },
      {
        player: '第二段写政府启动调查，再写港口补偿。',
        reply: '可以。重点放复工和补偿。',
      },
      {
        player: '热搜往工人补偿和港口复工带。',
        reply: '我让编辑压一下“副总统开船”那几个词。',
      },
      {
        player: '外媒那边呢？',
        reply: '挡不住，但国内版我们能先定调。',
      },
      {
        player: '今晚就按这个发。',
        reply: '好，标题我改成“政府推动港口复工”。',
      },
    ],
    epilogue: '口径我先锁了，有变化你再说。',
  },
];

/** Demo mode: ignore typed text; return the next scripted beat. */
export function pickFelegramReply(
  contact: FelegramContactScript,
  _playerText: string,
  replyIndex: number,
): FelegramReplyResult {
  if (replyIndex < 0 || replyIndex >= contact.beats.length) {
    return {
      player: '先这样。',
      reply: contact.epilogue,
      scriptComplete: false,
      completesCase: false,
    };
  }
  const beat = contact.beats[replyIndex]!;
  const isLast = replyIndex === contact.beats.length - 1;
  return {
    player: beat.player,
    reply: beat.reply,
    scriptComplete: isLast,
    completesCase: contact.advancesCase && isLast,
  };
}

export const PORT_STRIKE_TWEETS: TweetTemplate[] = [
  {
    id: 'spin',
    label: '安保需要口径',
    content:
      '航道水位调整是出于安保需要，绝不是为了任何私人行程。已签署港口临时补偿，货运正在恢复。',
  },
  {
    id: 'tough',
    label: '强硬表态',
    content:
      '港口必须复工。政府已启动调查，副总统办公室将承担应有责任。分众国货运不能停摆。',
  },
];

export const PORT_STRIKE_FEEDBACK = {
  delayMs: 4000,
  pendingLabel: '统计尚未回传…',
  title: '蝴蝶效应 · 港口复工',
  body: '补偿法案与公开发声已同步落地。工会宣布逐步复工，媒体热度转向「谁该为调水门负责」。',
  deltas: {
    resources: {
      prestige: 2,
      security: -1,
      wealth: 0,
      loyalty: -5,
    },
    nation: {
      support: 2,
      stability: 5,
      cpi: 0.1,
      economy: 1,
      culture: 0,
      military: 0,
      diplomacy: -1,
    },
  } as const,
  summaryLines: [
    '国内稳定 42 → 47',
    '支持率 44% → 46%',
    'CPI 3.9% → 4.0%',
    '派系忠诚 71 → 66',
    '副总统办公室承担公开道歉',
  ] satisfies string[],
};

export const SETTLEMENT_PRESENTATION = {
  /** 数字滚动时长（单项） */
  rollDurationMs: 2000,
  /** 资源项错开启动 */
  rollStaggerMs: 280,
  /** 结算卡弹出后再启动顶栏（0 = 与卡片同时） */
  cardDelayMs: 0,
  /** 入场：旧值 / 箭头展开 */
  rollIntroMs: 700,
  /** 旧值/箭头收起（由玩家点「知道了」后触发） */
  rollOutroMs: 800,
} as const;

export type ResourceDeltaChip = {
  id: string;
  label: string;
  delta: number;
  formatted: string;
  direction: 'up' | 'down' | 'flat';
};

export type SettlementPresentation = {
  title: string;
  headline: string;
  summary: string;
  resourceFrom: ResourceSnapshot[];
  resourceTo: ResourceSnapshot[];
  resourceChips: ResourceDeltaChip[];
};

export type ResourceSnapshot = {
  id: string;
  label: string;
  value: string;
  icon: string;
};

export type NationMetricSnapshot = NationMetric;

export function cloneInitialResources(): ResourceSnapshot[] {
  return RESOURCES.map((item) => ({ ...item }));
}

export function cloneInitialNationMetrics(): NationMetricSnapshot[] {
  return NATION_METRICS.map((item) => ({
    ...item,
    trend: [...item.trend],
    summary: [...item.summary] as [string, string, string],
  }));
}

export function buildResourceDeltaChips(
  resources: ResourceSnapshot[],
  deltas: Record<string, number>,
): ResourceDeltaChip[] {
  const chips: ResourceDeltaChip[] = [];
  for (const item of resources) {
    const delta = deltas[item.id];
    if (delta === undefined || delta === 0) continue;
    const sign = delta > 0 ? '+' : '';
    chips.push({
      id: item.id,
      label: item.label,
      delta,
      formatted: `${sign}${delta} ${item.label}`,
      direction: delta > 0 ? 'up' : 'down',
    });
  }
  return chips;
}

export function buildSettlementPresentation(
  resources: ResourceSnapshot[],
): SettlementPresentation {
  const resourceFrom = resources.map((item) => ({ ...item }));
  const resourceTo = applyResourceDeltas(resourceFrom, PORT_STRIKE_FEEDBACK.deltas.resources);
  const [titleHeadline, titleTail] = PORT_STRIKE_FEEDBACK.title.split(' · ');

  return {
    title: PORT_STRIKE_FEEDBACK.title,
    headline: titleTail ?? titleHeadline,
    summary: PORT_STRIKE_FEEDBACK.body,
    resourceFrom,
    resourceTo,
    resourceChips: buildResourceDeltaChips(resourceFrom, PORT_STRIKE_FEEDBACK.deltas.resources),
  };
}

export function applyResourceDeltas(
  resources: ResourceSnapshot[],
  deltas: Record<string, number>,
): ResourceSnapshot[] {
  return resources.map((item) => {
    const delta = deltas[item.id];
    if (delta === undefined || delta === 0) return { ...item };
    const current = parseNumericValue(item.value);
    const next = item.id === 'wealth' ? current + delta * 1e8 : current + delta;
    return {
      ...item,
      value: formatResourceValue(item.id, next),
    };
  });
}

export function applyNationDeltas(
  metrics: NationMetricSnapshot[],
  deltas: Record<string, number>,
): NationMetricSnapshot[] {
  return metrics.map((metric) => {
    const delta = deltas[metric.key];
    if (delta === undefined || delta === 0) return { ...metric };
    const isPercent = metric.key === 'support' || metric.key === 'cpi';
    const current = parseNumericValue(metric.value);
    const next = current + delta;
    const nextProgress =
      metric.key === 'support' || metric.key === 'cpi'
        ? Math.round(next)
        : Math.min(100, Math.max(0, Math.round(next)));
    const nextTrend = [...metric.trend.slice(1), nextProgress];
    return {
      ...metric,
      value: formatNationValue(metric.key, next),
      delta: formatDelta(delta, isPercent),
      progress: nextProgress,
      trend: nextTrend,
      summary: [
        delta > 0 ? '危机缓和，舆情回落' : metric.summary[0],
        `范围：${delta > 0 ? '+' : ''}${delta}`,
        delta > 0 ? '复工中' : metric.summary[2],
      ] as [string, string, string],
    };
  });
}

export function buildFeedbackBody(): string {
  return `${PORT_STRIKE_FEEDBACK.body}\n\n${PORT_STRIKE_FEEDBACK.summaryLines.map((line) => `· ${line}`).join('\n')}`;
}
