import type { NationMetric } from './data';
import { NATION_METRICS, RESOURCES } from './data';
import ftubePortStrikeVideo from './assets/video/ftube-port-strike.mp4';
import ftubePortReopenVideo from './assets/video/ftube-port-reopen.mp4';
import {
  formatDelta,
  formatNationValue,
  formatResourceValue,
  parseNumericValue,
} from './metricFormat';

/** FTube crisis field video — replace file at assets/video/ftube-port-strike.mp4 to swap. */
export const PORT_STRIKE_VIDEO_SRC: string = ftubePortStrikeVideo;

/** FTube reopen field video — replace file at assets/video/ftube-port-reopen.mp4 to swap. */
export const PORT_STRIKE_REOPEN_VIDEO_SRC: string = ftubePortReopenVideo;

/** Inbox bills the player must sign during the port-strike showcase. */
export const PORT_STRIKE_BILL_IDS = ['congress-invest'] as const;

/** @deprecated Use PORT_STRIKE_BILL_IDS */
export const PORT_STRIKE_BILL_ID = PORT_STRIKE_BILL_IDS[0];

export const PORT_STRIKE_PUBLISH_DRAFT = {
  directionId: 'economy',
  body:
    '颁布《港口临时劳工补偿与复工保障令》，向罢工工人发放临时补偿并确保港口有序复工。',
  cue: {
    title: '工会等你兑现承诺',
    message: '谈判已谈妥，现在要主动颁布港口劳工补偿政策。',
    subline: '港口临时补偿 · 复工保障',
    cta: '打开发布法案',
  },
  successMessage: '港口劳工补偿令已颁布。留意手机，幕僚会再发消息。',
} as const;

export const PORT_STRIKE_AIDE_NOTICE = {
  id: 'aide-dm',
  title: '幕僚发来消息',
  message: '关于国会调查案，有几句要先跟你说。',
  subline: 'Felegram · 幕僚',
  tone: 'warning' as const,
  noticeTitle: '手机推送',
  cta: '打开消息',
  targetApp: 'felegram' as PhoneAppId,
};

export type DeskTodoId = 'publish-bill' | 'post-tweet';
export type DeskTodoAction = 'publish' | 'phone';

export type DeskTodoDef = {
  id: DeskTodoId;
  title: string;
  detail: string;
  action: DeskTodoAction;
  /** Phone deep-link when action is phone. */
  phoneApp?: PhoneAppId;
};

/** Persistent desk checklist items unlocked by Felegram progress. */
export const PORT_STRIKE_DESK_TODOS: Record<DeskTodoId, DeskTodoDef> = {
  'publish-bill': {
    id: 'publish-bill',
    title: '颁布港口补偿法案',
    detail: '工会谈妥了，一会要兑现补偿令。',
    action: 'publish',
  },
  'post-tweet': {
    id: 'post-tweet',
    title: '去 F 发一条推',
    detail: '媒体部要你安抚民心，先发推再颁布。',
    action: 'phone',
    phoneApp: 'f',
  },
};

export const PORT_STRIKE_ADVISOR = {
  videoStem: 'idle-signing-documents',
  /** 呈递到位后定格，等玩家签完调查法案再从此处续播（含走近主角等后半段） */
  pauseAtSec: 5,
  cue: {
    title: '幕僚呈上待签文件',
    message: '一份紧急法案需要总统签字。',
    subline: '调水门调查',
    cta: '打开处理文件',
  },
} as const;

export type PhoneAppId = 'felegram' | 'greenhood' | 'f' | 'ftube';

export type FtubeEpisode = 'crisis' | 'reopen';

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

export type CrisisImpactHint = {
  id: string;
  label: string;
  direction: 'up' | 'down';
};

/** Direction-only preview chips for the opening crisis card (no exact numbers). */
export function formatCrisisImpactHint(hint: CrisisImpactHint): string {
  const sign = hint.direction === 'down' ? '↓' : '↑';
  return `${sign} ${hint.label}`;
}

export const PORT_STRIKE_CRISIS = {
  id: 'port-strike',
  title: '副总统游艇调水，港口工人罢工',
  message: '旺斯外出「考察」期间擅自抬高航道水位，东部港口已连续封锁第三日。',
  subline: '水利署临时调度 · 货轮排队 18 小时',
  tone: 'danger' as const,
  targetApp: 'ftube' as PhoneAppId,
  impactHints: [
    { id: 'wealth', label: '家族财产', direction: 'down' },
    { id: 'support', label: '支持率', direction: 'down' },
    { id: 'security', label: '安全指数', direction: 'down' },
  ] satisfies CrisisImpactHint[],
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

export const PORT_STRIKE_REOPEN = {
  id: 'port-reopen',
  title: '港口开始复工',
  message: '补偿令与调查案已落地，东部港口闸口逐步恢复通行。',
  subline: '货轮排队缩短 · 工会宣布撤闸',
  tone: 'warning' as const,
  noticeTitle: '现场更新',
  cta: '查看复工',
  targetApp: 'ftube' as PhoneAppId,
};

export const PORT_STRIKE_FTUBE_REOPEN = {
  headline: '港口复工：货轮恢复通行，罢工工人陆续返岗',
  views: '1.8M',
  channel: 'FTube 现场连线',
  facts: [
    '东部港口闸口在劳工补偿令颁布后逐步恢复通行。',
    '工会宣布撤闸，货轮排队时间明显缩短。',
    '媒体镜头转向「政府如何收拾调水门烂摊子」。',
  ],
  videoCaption: '复工第一天',
  placeholderNote: '',
};

export const PORT_STRIKE_NEGOTIATION = {
  unionLeader: '港口工会主席 · 老马',
  openingMessage:
    '总统先生，旺斯那家伙调水去度假，我们通宵加班堵在闸口。先让副总统办公室公开道歉，再谈复工和加班费。',
  options: [
    {
      id: 'compensation',
      label: '承诺补偿与复工保障',
      playerMessage: '水位调度我来查，补偿方案今天颁布。先别堵港口。',
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

export type FelegramContactId = 'union' | 'media' | 'vance' | 'aide';

export type FelegramStickerId = 'for-the-workers' | 'this-is-fine';

export type FelegramReplyPart =
  | string
  | {
      type: 'sticker';
      id: FelegramStickerId;
    };

export type FelegramBeat = {
  /** Scripted presidential line (reference for demo typing; bubble shows real input). */
  player: string;
  /** Contact reply bubble(s) after a short delay. Arrays become separate bubbles. */
  reply: FelegramReplyPart | FelegramReplyPart[];
};

export type AidePhase = 'briefing' | 'investigation';

export type FelegramAideAct = {
  phase: AidePhase;
  advancesCase: boolean;
  outcome: string;
  openingMessages: string[];
  beats: FelegramBeat[];
  epilogue: string;
};

/** 幕僚第一幕：看完现场后的局势简报。 */
export const AIDE_BRIEFING_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '指引：先去找工会领袖谈补偿与法案',
  openingMessages: [
    '总统，FTube 上的现场你看了吧。',
    '旺斯为了游艇让水利署抬水位，港口工人直接罢工了。',
  ],
  beats: [
    {
      player: '这蠢货又给我捅娄子。',
      reply: [
        '不止捅娄子，热搜已经把副总统游艇和港口堵死绑在一起了。',
        '工会那边在等你回话。工人要补偿，还要一项法案把权益写死。',
      ],
    },
    {
      player: '旺斯回头再收拾。先说正事，我该怎么做。',
      reply: [
        '先去 Felegram 找工会领袖谈。',
        '谈妥了再处理舆论，最后再颁布补偿令。',
        '我这边盯着国会那边的动静。',
      ],
    },
  ],
  epilogue: '工会领袖在消息列表里，先把他谈下来。',
};

/** 幕僚第二幕：颁布后的调查案口径。 */
export const AIDE_INVESTIGATION_ACT: FelegramAideAct = {
  phase: 'investigation',
  advancesCase: false,
  outcome: '提示：签调查案时批注「给假数据」· 关手机后幕僚会呈上文件',
  openingMessages: [
    '总统，等会儿我会呈上一份调水门调查案。',
    '国会要求你签字。',
  ],
  beats: [
    {
      player: '知道了。',
      reply: [
        '你签字的时候，批注写「给假数据」就行。',
        '公开调查是给国会看的，数据是给我们自己看的。',
        '你懂的。',
        '🙈🙈🙈',
      ],
    },
  ],
  epilogue: '调查案呈上来你就签，批注别忘了。',
};

export type FelegramContactScript = {
  id: FelegramContactId;
  name: string;
  time: string;
  /**
   * When true, this contact must finish before Felegram unlocks the case
   * (tweet / publish). Multiple required contacts all must complete.
   */
  advancesCase: boolean;
  /** One-line outcome shown as a system note when the script finishes. */
  outcome: string;
  openingMessages: string[];
  /** Ordered demo beats; Enter advances one beat (typed text ignored). */
  beats: FelegramBeat[];
  /** Shown if the player keeps chatting after the script ends. */
  epilogue: string;
};

export type FelegramBubble =
  | { kind: 'text'; text: string }
  | { kind: 'sticker'; id: FelegramStickerId };

export type FelegramReplyResult = {
  player: string;
  /** One or more NPC bubbles for this beat. */
  replies: FelegramBubble[];
  /** True on the final script beat. */
  scriptComplete: boolean;
};

function normalizeFelegramReplies(
  reply: FelegramReplyPart | FelegramReplyPart[],
): FelegramBubble[] {
  const parts = Array.isArray(reply) ? reply : [reply];
  const bubbles: FelegramBubble[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      for (const text of part
        .split(/\n+/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0)) {
        bubbles.push({ kind: 'text', text });
      }
      continue;
    }

    if (part.type === 'sticker') {
      bubbles.push({ kind: 'sticker', id: part.id });
    }
  }

  return bubbles;
}

/** Rebuild chat bubbles from script + saved reply count (survives phone remount). */
export type FelegramHistoryMessage =
  | { role: 'them' | 'me' | 'system'; text: string }
  | { role: 'them'; stickerId: FelegramStickerId };

export function buildFelegramHistory(
  contact: FelegramContactScript,
  replyCount: number,
): FelegramHistoryMessage[] {
  const messages: FelegramHistoryMessage[] = contact.openingMessages.map((text) => ({
    role: 'them',
    text,
  }));

  const safeCount = Math.max(0, Math.min(replyCount, contact.beats.length));
  for (let index = 0; index < safeCount; index += 1) {
    const beat = contact.beats[index]!;
    messages.push({ role: 'me', text: beat.player });
    for (const bubble of normalizeFelegramReplies(beat.reply)) {
      if (bubble.kind === 'sticker') {
        messages.push({ role: 'them', stickerId: bubble.id });
      } else {
        messages.push({ role: 'them', text: bubble.text });
      }
    }
    if (index === contact.beats.length - 1) {
      messages.push({ role: 'system', text: contact.outcome });
    }
  }

  return messages;
}

/**
 * Fixed showcase scripts. Enter advances the next beat;
 * presidential lines are preset (player typing is ignored).
 * List order = guidance order: aide → union (+ vance side) → media.
 */
export const FELEGRAM_CONTACTS: FelegramContactScript[] = [
  {
    id: 'aide',
    name: '幕僚',
    time: '09:29',
    advancesCase: AIDE_BRIEFING_ACT.advancesCase,
    outcome: AIDE_BRIEFING_ACT.outcome,
    openingMessages: AIDE_BRIEFING_ACT.openingMessages,
    beats: AIDE_BRIEFING_ACT.beats,
    epilogue: AIDE_BRIEFING_ACT.epilogue,
  },
  {
    id: 'union',
    name: '工会领袖',
    time: '09:41',
    advancesCase: true,
    outcome: '成交：补偿入私人账户 · 工会恢复部分通行 · 去颁布港口补偿法案',
    openingMessages: [
      '总统先生，我们工会只有一个诉求，该有的补偿得到位，并且需要一项法案保障我们工人的权益。',
    ],
    beats: [
      {
        player: '可以，补偿可以给你们发，法案我也很快就出台，尽快让工人复工吧。',
        reply: [
          '好的，补偿费直接叫财政发到我的账户吧，不劳烦您那边的人了。',
          '还有，劳资委员会下个月换届，工会希望能保持“稳定”。',
          { type: 'sticker', id: 'for-the-workers' },
        ],
      },
      {
        player: '可以发到你的私人账户，但是你要保密……劳工部那边，也会尊重稳定。',
        reply: [
          '行，那我对外就说政府给方案了，工会先恢复部分通行。',
          '👊 😊 🔥感谢总统大人',
        ],
      },
    ],
    epilogue: '我这边等你方案落地。发出去我就继续撤。',
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
    name: '媒体部',
    time: '09:38',
    advancesCase: true,
    outcome: '引导：去 F 发一条推，安抚民心',
    openingMessages: [
      '总统，热搜现在很难看。',
      '你得发条推，安抚一下民心。',
    ],
    beats: [
      {
        player: '知道了，我去发。',
        reply: [
          '别提游艇，也别提旺斯。',
          '就说政府重视工人，港口会尽快复工。',
          '语气真诚一点，真诚到他们暂时不砸东西就行。',
          { type: 'sticker', id: 'this-is-fine' },
        ],
      },
    ],
    epilogue: '推发出去我们再帮你压一压评论区。',
  },
];

export function aideActForPhase(phase: AidePhase): FelegramAideAct {
  return phase === 'investigation' ? AIDE_INVESTIGATION_ACT : AIDE_BRIEFING_ACT;
}

export function resolveAideContact(phase: AidePhase): FelegramContactScript {
  const act = aideActForPhase(phase);
  return {
    id: 'aide',
    name: '幕僚',
    time: '09:29',
    advancesCase: act.advancesCase,
    outcome: act.outcome,
    openingMessages: act.openingMessages,
    beats: act.beats,
    epilogue: act.epilogue,
  };
}

/** Demo mode: ignore typed text; return the next scripted beat. */
export function pickFelegramReply(
  contact: FelegramContactScript,
  _playerText: string,
  replyIndex: number,
): FelegramReplyResult {
  if (replyIndex < 0 || replyIndex >= contact.beats.length) {
    return {
      player: '先这样。',
      replies: [{ kind: 'text', text: contact.epilogue }],
      scriptComplete: false,
    };
  }
  const beat = contact.beats[replyIndex]!;
  const isLast = replyIndex === contact.beats.length - 1;
  return {
    player: beat.player,
    replies: normalizeFelegramReplies(beat.reply),
    scriptComplete: isLast,
  };
}

export const PORT_STRIKE_TWEETS: TweetTemplate[] = [
  {
    id: 'spin',
    label: '安保需要口径',
    content:
      '航道水位调整是出于安保需要，绝不是为了任何私人行程。已颁布港口临时补偿，货运正在恢复。',
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
  body: '颁布补偿令、签署调查案与公开发声已同步落地。工会宣布逐步复工，媒体热度转向「谁该为调水门负责」。',
  deltas: {
    resources: {
      prestige: 2,
      security: -1,
      wealth: 0,
      support: 2,
    },
    nation: {
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
    const amount = item.id === 'support' ? `${sign}${delta}%` : `${sign}${delta}`;
    chips.push({
      id: item.id,
      label: item.label,
      delta,
      formatted: `${amount} ${item.label}`,
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
    const isPercent = metric.key === 'cpi';
    const current = parseNumericValue(metric.value);
    const next = current + delta;
    const nextProgress =
      metric.key === 'cpi'
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
