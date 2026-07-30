import type { NationMetric } from './data';
import { NATION_METRICS, RESOURCES } from './data';
import ftubePortStrikeVideo from './assets/video/ftube-port-strike.mp4';
import ftubePortReopenVideo from './assets/video/ftube-port-reopen.mp4';
import portReopenThumb from './assets/ftube-port-reopen-thumb.png';
import {
  formatDelta,
  formatNationValue,
  formatResourceValue,
  nationMetricProgress,
  nationMetricUsesPercent,
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

/** 周循环第 1 周：调水门幕僚推送 */
export const YACHT_WEEK1_AIDE_NOTICE = {
  id: 'yacht-aide-dm',
  title: '幕僚发来消息',
  message: '调水门录音上热搜了。先和我对一下是否接听证令；媒体部和发帖下周再说。',
  subline: 'Felegram · 幕僚',
  tone: 'warning' as const,
  noticeTitle: '手机推送',
  cta: '打开消息',
  targetApp: 'felegram' as PhoneAppId,
};

/** 周循环第 3 周：港口回声幕僚复盘推送 */
export const YACHT_WEEK3_AIDE_NOTICE = {
  id: 'port-echo-aide-dm',
  title: '幕僚发来消息',
  message: '补偿令落地了。码头在复工，先和我对一下；FTube 也推了现场视频。',
  subline: 'Felegram · 幕僚',
  tone: 'warning' as const,
  noticeTitle: '手机推送',
  cta: '打开消息',
  targetApp: 'felegram' as PhoneAppId,
};

export type DeskTodoId =
  | 'publish-bill'
  | 'post-tweet'
  | 'sign-hearing'
  | 'talk-union'
  | 'watch-reopen';
export type DeskTodoAction = 'publish' | 'phone' | 'inbox';

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
  'talk-union': {
    id: 'talk-union',
    title: '找工会领袖谈',
    detail: '幕僚提醒：码头要开闸，先谈条件。',
    action: 'phone',
    phoneApp: 'felegram',
  },
  'publish-bill': {
    id: 'publish-bill',
    title: '颁布港口补偿法案',
    detail: '工会谈妥了，一会要兑现补偿令。',
    action: 'publish',
  },
  'post-tweet': {
    id: 'post-tweet',
    title: '去 F 发帖',
    detail: '媒体部要你先稳住 F，再颁布。',
    action: 'phone',
    phoneApp: 'f',
  },
  'sign-hearing': {
    id: 'sign-hearing',
    title: '签署国会听证令',
    detail: '幕僚提醒：待签件已在「处理文件」。',
    action: 'inbox',
  },
  'watch-reopen': {
    id: 'watch-reopen',
    title: '查看港口复工现场',
    detail: '锁屏有 FTube 视频推送，点开看复工连线。',
    action: 'phone',
    phoneApp: 'ftube',
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
  title: '东海岸港口突发罢工',
  message: '调水门余波引爆码头：工会封闸，货轮滞留锚地。本周窗口必须压住，否则治安与民生一起崩。',
  subline: '劳工补偿拖延 · 冷链告急',
  tone: 'danger' as const,
  targetApp: 'ftube' as PhoneAppId,
  impactHints: [
    { id: 'public_order', label: '治安指数', direction: 'down' },
    { id: 'support', label: '民众支持率', direction: 'down' },
    { id: 'prestige', label: '总统威望度', direction: 'down' },
  ] satisfies CrisisImpactHint[],
};

export const PORT_STRIKE_FTUBE = {
  headline: '调水门余波：东海岸码头突发封闸',
  views: '2.4M',
  channel: 'FTube 突发事件现场',
  facts: [
    '调水门发酵后，码头工会以劳工补偿拖延为由封锁闸口。',
    '货轮滞留锚地，冷链与汽车零部件最先告急。',
    '工会要求书面补偿与复工保障；本周若不落地，封锁可能扩大。',
  ],
  videoCaption: '闸口封锁 · 货轮停摆',
  placeholderNote: '正式现场视频待接入，当前为新闻速览模拟播放。',
};

/** 锁屏推送栈中的 FTube 复工视频推送 id */
export const FTUBE_PORT_REOPEN_PUSH_ID = 'ftube-port-reopen';

export const PORT_STRIKE_REOPEN = {
  id: 'port-reopen',
  pushId: FTUBE_PORT_REOPEN_PUSH_ID,
  title: 'FTube',
  message: '港口开始复工：闸口恢复通行',
  subline: '刚刚 · 现场视频',
  thumbTag: '现场',
  thumb: portReopenThumb,
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
    '总统，第三天了。闸口还关着。车没动。先把加班费写进文件，再谈复工。',
  options: [
    {
      id: 'compensation',
      label: '承诺补偿与复工保障',
      playerMessage: '水位调度我来查，补偿方案今天颁布。先别堵港口。',
      unionReply: '文件今晚到我桌上。有纸面东西，我就开几条车道。',
      tone: 'compensation',
    },
    {
      id: 'personal',
      label: '私下许诺个人好处',
      playerMessage: '你的选区明年有个联邦项目名额，补偿我来批。别让媒体看见咱俩聊这个。',
      unionReply: '……行。公开口径给我留干净点。我还得回去面对他们。',
      tone: 'personal',
    },
    {
      id: 'scapegoat',
      label: '让副总统办公室背锅',
      playerMessage: '调水门责任归副总统办公室，你们要的道歉我让他们发。旺斯那边我来收拾。',
      unionReply: '好。旺斯道歉，工人拿钱。少一项，闸口继续关。',
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
  /** Scripted presidential line shown in the player bubble (typed input is ignored). */
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

/** 幕僚第一幕：看完现场后的局势简报（叮嘱腔 · 多「您」）。 */
export const AIDE_BRIEFING_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '指引：先去找工会领袖谈补偿与法案',
  openingMessages: [
    '总统，视频我看了。别发帖。',
    'F 已经炸了。先找工会领袖谈补偿，再和媒体部对齐口径，最后签行政令。',
    '口径没定之前，别自己开口。',
  ],
  beats: [
    {
      player: '这蠢货又给我捅娄子。',
      reply: [
        '对，他搞砸了。',
        '但骂他不会让货动起来。工会要工资支票，也要书面保障。先跟他们谈。',
      ],
    },
    {
      player: '旺斯回头再收拾他。现在——先动谁？',
      reply: [
        '先去谈工会，拿到他们愿意复工的承诺。',
        '国会和媒体这边我来压。您别先开口。',
      ],
    },
  ],
  epilogue: '工会领袖在联系人里。谈完回来找我。别上 F 发帖。',
};

/** 周循环第 1 周：调水门先定调（国会要求签署的听证令，下周才送到签批台）。 */
export const AIDE_YACHT_WEEK1_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '收到。国会那份配合听证令，我让办公厅下周送到您桌上。',
  openingMessages: [
    '总统，录音上热搜了。自家党内吵成一团。',
    '国会反对派要逼您签《副总统配合国会听证令》。正式文本还在走核稿，本周送不到签批台。您先定调：接，还是先拖？',
  ],
  beats: [
    {
      player: '接。让他们下周把待签件送到我桌上，我再签。',
      reply: [
        '明白。我去催法务和办公厅核稿。',
        '本周先找旺斯压一压，别让他再对外乱说。媒体部和 F 表态下周再说——先把令接住。',
        '待签文件最快下周才送到「处理文件」。空口不算签字。',
      ],
    },
    {
      player: '行。这周先把听证令接住。',
      reply: [
        '收到。文件下周送到。',
        '旺斯在联系人里。媒体部下周才上线，别急着发帖。',
      ],
    },
  ],
  epilogue: '听证令下周送到签批台。媒体口径下周再对。',
};

/** 周循环港口周：幕僚指引（无听证令文件）。只催谈工会，不剧透补偿令。 */
export const AIDE_WEEKLOOP_PORT_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '指引：去找工会领袖谈开闸条件',
  openingMessages: [
    '总统，码头封了。别先上 F 吵架。',
    '先去找工会领袖谈，看看他们要什么才能开闸。',
  ],
  beats: [
    {
      player: '收到。',
      reply: ['行。工会在联系人里，谈完再说。'],
    },
  ],
  epilogue: '待办已写上。工会在联系人里。',
};

/** 周循环港口周：桌上已有听证令。催签听证令 + 谈工会，不剧透补偿令。 */
export const AIDE_WEEKLOOP_PORT_WITH_HEARING_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '指引：处理文件签听证令 · 去找工会领袖谈',
  openingMessages: [
    '总统，码头封了。别先上 F 吵架。',
    '两件事：处理文件里躺着上周答应接的听证令——你得去签；另外去找工会领袖谈，看看他们要什么才能开闸。',
  ],
  beats: [
    {
      player: '收到。',
      reply: ['行。顺序你定，两件都得本周办完。'],
    },
  ],
  epilogue: '待办已写上。听证令走处理文件；工会在联系人里。',
};

/** 周循环第 3 周：港口回声复盘；复工视频已在锁屏推送，聊完只提醒去看。 */
export const AIDE_WEEKLOOP_PORT_ECHO_ACT: FelegramAideAct = {
  phase: 'briefing',
  advancesCase: true,
  outcome: '指引：点右上角 FTube 视频推送，看港口复工现场',
  openingMessages: [
    '总统，上周那份补偿令落地了。首批到账，闸口纠察线在撤。',
    '锁屏上 FTube 推了复工现场，抽空点开看一眼。',
  ],
  beats: [
    {
      player: '收到。',
      reply: ['行。看完再说。'],
    },
  ],
  epilogue: '复工视频还在右上角推送里，点开就能看。',
};

/** 幕僚第二幕：颁布后的调查案口径（叮嘱腔 · 多「您」）。 */
export const AIDE_INVESTIGATION_ACT: FelegramAideAct = {
  phase: 'investigation',
  advancesCase: false,
  outcome: '提示：签调查案时批注「给假数据」· 关手机后幕僚会呈上文件',
  openingMessages: [
    '总统，文件马上到。',
    '签名处批注“假数据”就行。就这三个字，别多写。',
  ],
  beats: [
    {
      player: '行。就三个字，假数据。',
      reply: [
        '对外那份给国会看。',
        '真那份您自己留着。',
        '别截图，别转发，尤其别发给旺斯。',
        '🙈',
      ],
    },
  ],
  epilogue: '文件到了就签。今晚谁来敲门，都说我不让您见人。',
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

/** Persisted bubble — stickerId only (URL mapped at render time). */
export type FelegramStoredMessage = {
  id: string;
  role: 'them' | 'me' | 'system';
  text?: string;
  stickerId?: FelegramStickerId;
  /** Group chats: who sent a `them` bubble. */
  senderId?: FelegramContactId;
};

export type FelegramThreadSnapshot = {
  messages: FelegramStoredMessage[];
  replyCount: number;
  lastReadMessageId: string | null;
  updatedAtLabel: string;
  updatedAtMs: number;
};

export type FelegramGroupId = 'family';

/** Aide investigation is a separate thread so briefing history is not wiped. */
export type FelegramThreadId =
  | FelegramContactId
  | 'aide-investigation'
  | FelegramGroupId;

export type FelegramGroupReplyPart =
  | { senderId: FelegramContactId; text: string }
  | { senderId: FelegramContactId; stickerId: FelegramStickerId }
  | { role: 'system'; text: string };

export type FelegramGroupOpening =
  | { role: 'system'; text: string }
  | { role: 'them'; senderId: FelegramContactId; text: string }
  | { role: 'them'; senderId: FelegramContactId; stickerId: FelegramStickerId };

export type FelegramGroupBeat = {
  player: string;
  replies: FelegramGroupReplyPart[];
};

export type FelegramGroupScript = {
  id: FelegramGroupId;
  title: string;
  subtitle: string;
  time: string;
  /** Contacts in the group (player is always included implicitly). */
  memberIds: FelegramContactId[];
  openingMessages: FelegramGroupOpening[];
  beats: FelegramGroupBeat[];
  outcome: string;
  epilogue: string;
};

export function felegramThreadIdFor(
  contactId: FelegramContactId,
  aidePhase: AidePhase = 'briefing',
): FelegramThreadId {
  if (contactId === 'aide' && aidePhase === 'investigation') {
    return 'aide-investigation';
  }
  return contactId;
}

export function isFelegramGroupId(id: string): id is FelegramGroupId {
  return id === 'family';
}

export function felegramContactDisplayName(contactId: FelegramContactId): string {
  if (contactId === 'aide') return '幕僚';
  if (contactId === 'union') return '工会领袖';
  if (contactId === 'vance') return '副总统旺斯';
  if (contactId === 'media') return '媒体部';
  return contactId;
}

/** 简报扫读高亮：与 Felegram 联系人/群聊标题完全同名（长名优先匹配） */
export function felegramBriefMarkNames(): string[] {
  const names = [
    ...FELEGRAM_CONTACTS.map((contact) => contact.name),
    FAMILY_GROUP.title,
  ];
  return [...new Set(names)].sort((a, b) => b.length - a.length);
}

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

function historyEntryToStored(
  entry: FelegramHistoryMessage,
  id: string,
): FelegramStoredMessage {
  if ('stickerId' in entry) {
    return { id, role: 'them', stickerId: entry.stickerId };
  }
  return { id, role: entry.role, text: entry.text };
}

function groupOpeningToStored(
  entry: FelegramGroupOpening,
  id: string,
): FelegramStoredMessage {
  if (entry.role === 'system') {
    return { id, role: 'system', text: entry.text };
  }
  if ('stickerId' in entry) {
    return {
      id,
      role: 'them',
      senderId: entry.senderId,
      stickerId: entry.stickerId,
    };
  }
  return {
    id,
    role: 'them',
    senderId: entry.senderId,
    text: entry.text,
  };
}

function groupReplyToStored(
  entry: FelegramGroupReplyPart,
  id: string,
): FelegramStoredMessage {
  if ('senderId' in entry) {
    if ('stickerId' in entry) {
      return {
        id,
        role: 'them',
        senderId: entry.senderId,
        stickerId: entry.stickerId,
      };
    }
    return {
      id,
      role: 'them',
      senderId: entry.senderId,
      text: entry.text,
    };
  }
  return { id, role: 'system', text: entry.text };
}

export function buildFelegramGroupHistory(
  group: FelegramGroupScript,
  replyCount: number,
): FelegramStoredMessage[] {
  const messages = group.openingMessages.map((entry, index) =>
    groupOpeningToStored(entry, `seed-${group.id}-${index}`),
  );

  const safeCount = Math.max(0, Math.min(replyCount, group.beats.length));
  let seq = messages.length;
  for (let index = 0; index < safeCount; index += 1) {
    const beat = group.beats[index]!;
    messages.push({
      id: `seed-${group.id}-${seq}`,
      role: 'me',
      text: beat.player,
    });
    seq += 1;
    for (const reply of beat.replies) {
      messages.push(groupReplyToStored(reply, `seed-${group.id}-${seq}`));
      seq += 1;
    }
    if (index === group.beats.length - 1) {
      messages.push({
        id: `seed-${group.id}-${seq}`,
        role: 'system',
        text: group.outcome,
      });
      seq += 1;
    }
  }

  return messages;
}

export function formatFelegramClock(date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function createFelegramThreadFromScript(
  contact: FelegramContactScript,
  replyCount = 0,
  options?: { markRead?: boolean; updatedAtMs?: number },
): FelegramThreadSnapshot {
  const history = buildFelegramHistory(contact, replyCount);
  const messages = history.map((entry, index) =>
    historyEntryToStored(entry, `seed-${contact.id}-${index}`),
  );
  const lastId = messages[messages.length - 1]?.id ?? null;
  return {
    messages,
    replyCount: Math.max(0, Math.min(replyCount, contact.beats.length)),
    lastReadMessageId: options?.markRead ? lastId : null,
    updatedAtLabel: contact.time,
    updatedAtMs: options?.updatedAtMs ?? 0,
  };
}

export function createFelegramGroupThreadFromScript(
  group: FelegramGroupScript,
  replyCount = 0,
  options?: { markRead?: boolean; updatedAtMs?: number },
): FelegramThreadSnapshot {
  const messages = buildFelegramGroupHistory(group, replyCount);
  const lastId = messages[messages.length - 1]?.id ?? null;
  return {
    messages,
    replyCount: Math.max(0, Math.min(replyCount, group.beats.length)),
    lastReadMessageId: options?.markRead ? lastId : null,
    updatedAtLabel: group.time,
    updatedAtMs: options?.updatedAtMs ?? 0,
  };
}

export function felegramPreviewText(
  message: FelegramStoredMessage | undefined,
): string {
  if (!message) return '暂无消息';
  if (message.stickerId) {
    const sticker = '[表情包]';
    if (message.senderId) {
      return `${felegramContactDisplayName(message.senderId)}: ${sticker}`;
    }
    return sticker;
  }
  const text = message.text?.trim();
  if (!text) return '暂无消息';
  if (message.role === 'them' && message.senderId) {
    return `${felegramContactDisplayName(message.senderId)}: ${text}`;
  }
  return text;
}

export function felegramUnreadCount(thread: FelegramThreadSnapshot): number {
  if (thread.messages.length === 0) return 0;
  if (thread.lastReadMessageId == null) {
    return thread.messages.filter((item) => item.role === 'them').length;
  }
  const readIndex = thread.messages.findIndex(
    (item) => item.id === thread.lastReadMessageId,
  );
  const unread = readIndex < 0 ? thread.messages : thread.messages.slice(readIndex + 1);
  return unread.filter((item) => item.role === 'them').length;
}

export function markFelegramThreadRead(
  thread: FelegramThreadSnapshot,
): FelegramThreadSnapshot {
  const lastId = thread.messages[thread.messages.length - 1]?.id ?? null;
  if (lastId === thread.lastReadMessageId) return thread;
  return {
    ...thread,
    lastReadMessageId: lastId,
  };
}

/** 家族群：开局即在；NPC 私下向总统通气。 */
export const FAMILY_GROUP: FelegramGroupScript = {
  id: 'family',
  title: '家族群',
  subtitle: 'FAMILY GROUP · ENCRYPTED',
  time: '09:20',
  memberIds: ['aide', 'vance'],
  openingMessages: [
    {
      role: 'them',
      senderId: 'vance',
      text: '@总统 内阁在闭门谈芯片补贴，联邦算力采购也想松绑。消息还没公开，TECH 盘前已经动了。',
    },
    {
      role: 'them',
      senderId: 'aide',
      text: '政策落地前有一小段空窗。跟听证令不是一回事，想碰再碰。',
    },
    {
      role: 'them',
      senderId: 'vance',
      text: '@总统 先去 Greenhood 买 TECH 建仓，再上 F 发一条「算力松绑」的风。发完行情才会猛拉，拉起来就卖掉。',
    },
    {
      role: 'them',
      senderId: 'aide',
      text: '放风前建仓能吃涨，捂太久会回吐。别先发帖再买，外面也别留记录。',
    },
    {
      role: 'them',
      senderId: 'vance',
      text: '@总统 跟不跟？',
    },
  ],
  beats: [
    {
      player: '跟。我先去买 TECH。',
      replies: [
        { senderId: 'aide', text: '对。先建仓，再去 F 放风。' },
        { senderId: 'vance', text: '买完回来，别倒着来。' },
      ],
    },
  ],
  outcome: '指引：离开群聊 → 打开 Greenhood → 买入 TECH',
  epilogue: '指引还在：先去 Greenhood 买 TECH，再上 F 放风。',
};

/** Contacts the player can invite into the family group (demo). */
export const FAMILY_GROUP_INVITABLE_IDS: FelegramContactId[] = ['media'];

export type FelegramFamilyGroupState = {
  joined: boolean;
  memberIds: FelegramContactId[];
};

/** 总统开局就在家族群里，不是今天才被拉进来。 */
export function createInitialFamilyGroupState(): FelegramFamilyGroupState {
  return {
    joined: true,
    memberIds: [...FAMILY_GROUP.memberIds],
  };
}

/** 日常家族群快照。markRead=false 时未读亮起，便于玩家感知 NPC 讨论。 */
export function buildFamilyGroupSnapshot(
  now = new Date(),
  options?: { markRead?: boolean },
): FelegramThreadSnapshot {
  return createFelegramGroupThreadFromScript(FAMILY_GROUP, 0, {
    markRead: options?.markRead ?? false,
    updatedAtMs: now.getTime(),
  });
}

/** @deprecated 使用 buildFamilyGroupSnapshot；保留别名以免旧引用报错。 */
export function buildFamilyGroupJoinSnapshot(
  now = new Date(),
): FelegramThreadSnapshot {
  return buildFamilyGroupSnapshot(now);
}

export const FELEGRAM_GROUPS: FelegramGroupScript[] = [FAMILY_GROUP];

/** 收件箱固定顺序（越大越靠前）：幕僚始终最前，其次家族群 / 工会 / 旺斯 / 媒体。 */
export const FELEGRAM_INBOX_PRIORITY: Record<string, number> = {
  aide: 100,
  family: 90,
  union: 80,
  vance: 60,
  media: 50,
};

export type FelegramGroupReplyResult = {
  player: string;
  replies: FelegramGroupReplyPart[];
  scriptComplete: boolean;
};

export function pickFelegramGroupReply(
  group: FelegramGroupScript,
  _playerText: string,
  replyIndex: number,
): FelegramGroupReplyResult {
  if (replyIndex < 0 || replyIndex >= group.beats.length) {
    return {
      player: '先这样。',
      replies: [{ role: 'system', text: group.epilogue }],
      scriptComplete: false,
    };
  }
  const beat = group.beats[replyIndex]!;
  return {
    player: beat.player,
    replies: beat.replies,
    scriptComplete: replyIndex === group.beats.length - 1,
  };
}

/**
 * Fixed showcase scripts. Enter advances the next beat;
 * presidential lines are preset (player typing is ignored).
 * 列表重要度：幕僚 → 工会 → 旺斯 → 媒体（家族群单独置顶规则见 FelegramChat）。
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
      '总统先生，闸口那帮人已经站了三天。房租要交，医疗账单也不会等人。我们要两件事：加班补偿写清楚，复工保障签下来。不然他们今晚还会留在闸口，记者也会继续拍。',
    ],
    beats: [
      {
        player: '补偿给你，法案也给你——而且是最好的那种。工人马上复工。伟大的交易，相信我。',
        reply: [
          '太好了！工人有救了！补偿款……先打我这个账户吧。我亲手发，少过几只手，钱到得快，对吧？',
          '还有，下月劳资委员会换届。我们希望保持「稳定」。工人能交房租，我这边也知道该找谁谈。您懂的。',
          { type: 'sticker', id: 'for-the-workers' },
        ],
      },
      {
        player: '钱打你私人账户，可以，完美。但这事从没发生过。劳工部我一句话压住——你拿钱，我赢。',
        reply: [
          '当然要保密。传出去的话，媒体会把这事讲一整周。',
          '对外我就说：白宫给了方案，工会愿意让供应链先动起来。',
          '今晚我先放几条车道，让兄弟们回家休息。法案您早点颁——我也好跟他们欢呼一声：总统没把码头忘了。',
        ],
      },
    ],
    epilogue: '法案没落地之前，闸口不会全开。您把字签了，我这边就放人。',
  },
  {
    id: 'vance',
    name: '副总统旺斯',
    time: '09:35',
    advancesCase: false,
    outcome: '结果：旺斯闭嘴 · 水利署背锅 · 副总统配合调查',
    openingMessages: [
      '总统，办公室声明发您了：特勤局调水位我们事先不知道，为的是让执法船能安全开。',
      '人当时在船上。我知道看起来很差。公众很可能听不懂为什么有必要。',
    ],
    beats: [
      {
        player: '事先不知道？照片视频都在。我不信这套说法。',
        reply: [
          '行，那我对外跟团队口径走。',
          '就一句：安保需要，不是私人游玩。',
        ],
      },
      {
        player: '安保需要？闸口工人等了三天。你《乡巴佬悲歌》里写懂工人，人在船上过生日。',
        reply: ['是，这个画面确实很糟。', '但我真怕公众听不懂。'],
      },
      {
        player: '所以你今晚一个字别说。水利署对外背锅，你去配合调查。',
        reply: [
          '行，如果你们觉得该这么办，我去配合。',
          '今晚不上 F，不接电话。',
          '给我一句对外能过关的就行。',
        ],
      },
    ],
    epilogue: '收到。口径发我。',
  },
  {
    id: 'media',
    name: '媒体部',
    time: '09:38',
    advancesCase: true,
    outcome: '引导：去 F 发帖，稳住舆论',
    openingMessages: [
      'F 上全是港口。',
      '船别提。旺斯别提。水位别解释。',
    ],
    beats: [
      {
        player: '好，我去发。会是很棒的帖，相信我。',
        reply: [
          '工人。补偿。复工。',
          '一条帖。就这些。',
          '语气放低。低到今天没人去砸玻璃。',
          { type: 'sticker', id: 'this-is-fine' },
        ],
      },
    ],
    epilogue: '发完我们盯评论区。',
  },
];

/** 周循环第 2 周：媒体部催调水门 F 表态（W1 不上线）。 */
export const YACHT_WEEK2_MEDIA_CONTACT: FelegramContactScript = {
  id: 'media',
  name: '媒体部',
  time: '09:38',
  advancesCase: false,
  outcome: '引导：去 F 发切割/冷处理表态；空口不算正式指令',
  openingMessages: [
    '总统，调水门还在热搜。上周您先接了听证令，公众那边还没听见圆厅声音。',
    '港口这边您去灭火；F 上得发一条切割/冷处理。短、硬、不解释水位细节。',
  ],
  beats: [
    {
      player: '好，我去发。会是很棒的帖，相信我。',
      reply: [
        '行。一键稿我们备好了，发完我们盯评论区。',
        '签听证令是正式动作；发帖只是即时反应。两边都要。',
        { type: 'sticker', id: 'this-is-fine' },
      ],
    },
  ],
  epilogue: '去 F 发。港口补偿令走发布法案。',
};

/** @deprecated 使用 YACHT_WEEK2_MEDIA_CONTACT；W1 不再上媒体部 */
export const YACHT_WEEK1_MEDIA_CONTACT = YACHT_WEEK2_MEDIA_CONTACT;

/** 周循环第 1 周旺斯（无港口穿帮）。 */
export const YACHT_WEEK1_VANCE_CONTACT: FelegramContactScript = {
  id: 'vance',
  name: '副总统旺斯',
  time: '09:35',
  advancesCase: false,
  outcome: '结果：旺斯闭嘴 · 水利署背锅口径 · 配合听证',
  openingMessages: [
    '总统，办公室声明发您了：特勤局调水位我们事先不知道，为的是让执法船能安全开。',
    '人当时在船上。我知道看起来很差。公众很可能听不懂为什么有必要。',
  ],
  beats: [
    {
      player: '事先不知道？照片视频都在。我不信这套说法。',
      reply: [
        '行，那我对外跟团队口径走。',
        '就一句：安保需要，不是私人游玩。',
      ],
    },
    {
      player: '安保需要？你《乡巴佬悲歌》里写懂工人，人在船上过生日。录音已经全国在播。',
      reply: ['是，这个画面确实很糟。', '但我真怕公众听不懂。'],
    },
    {
      player: '所以你今晚一个字别说。水利署对外背锅，你去配合听证。',
      reply: [
        '行，如果你们觉得该这么办，我去配合。',
        '今晚不上 F，不接电话。',
        '给我一句对外能过关的就行。',
      ],
    },
  ],
  epilogue: '收到。口径发我。',
};

/** 周循环港口周：与主案例同一套工会文案（欢呼 + 私人账户性格）；落点由 outcome 覆盖指向发布法案。 */
export const WEEKLOOP_UNION_CONTACT: FelegramContactScript = {
  ...FELEGRAM_CONTACTS.find((item) => item.id === 'union')!,
  outcome: '成交：补偿入私人账户 · 工会恢复部分通行 · 去「发布法案」颁布港口补偿令',
};

export function aideActForPhase(phase: AidePhase): FelegramAideAct {
  return phase === 'investigation' ? AIDE_INVESTIGATION_ACT : AIDE_BRIEFING_ACT;
}

export function resolveAideContact(
  phase: AidePhase,
  actOverride?: FelegramAideAct,
): FelegramContactScript {
  const act = actOverride ?? aideActForPhase(phase);
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

export function createInitialFelegramThreads(): Record<
  FelegramThreadId,
  FelegramThreadSnapshot
> {
  const briefing = resolveAideContact('briefing');
  const investigation = resolveAideContact('investigation');
  const baseMs = Date.now();

  return {
    family: createFelegramGroupThreadFromScript(FAMILY_GROUP, 0, {
      markRead: false,
      updatedAtMs: baseMs + 5,
    }),
    aide: createFelegramThreadFromScript(briefing, 0, {
      updatedAtMs: baseMs + 4,
    }),
    union: createFelegramThreadFromScript(
      FELEGRAM_CONTACTS.find((item) => item.id === 'union')!,
      0,
      { updatedAtMs: baseMs + 3 },
    ),
    vance: createFelegramThreadFromScript(
      FELEGRAM_CONTACTS.find((item) => item.id === 'vance')!,
      0,
      { updatedAtMs: baseMs + 2 },
    ),
    media: createFelegramThreadFromScript(
      FELEGRAM_CONTACTS.find((item) => item.id === 'media')!,
      0,
      { updatedAtMs: baseMs + 1 },
    ),
    'aide-investigation': createFelegramThreadFromScript(investigation, 0, {
      updatedAtMs: baseMs,
    }),
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
      '假新闻乱说私人行程——错了。水位是安保，必要的安保。港口补偿已到位，货运回来了。了不起的工作。',
  },
  {
    id: 'tough',
    label: '强硬表态',
    content:
      '港口现在就复工。调查在进行，该负责的人会负责。货运不能停，一分都不能停。我说了算，相信我。',
  },
];

/** 周循环第 1–2 周：总统回应调水门的 F 帖（脚本演示，一键填写） */
export const YACHT_SCANDAL_POST_TEXT =
  '假新闻乱说私人游玩——错了。水位是安保，必要的安保。副总统办公室将配合核查。事实会说话，相信我。';

/** Prefab NPC posts for F feed (port-strike case). Drawn on open / refresh. */
export type FNpcPostSeed = {
  id: string;
  authorName: string;
  authorHandle: string;
  text: string;
};

/** 周循环第 1 周 F 时间线（无港口剧透）。 */
export const YACHT_WEEK1_NPC_POSTS: FNpcPostSeed[] = [
  {
    id: 'w1-npc-citizen-1',
    authorName: '市民老周',
    authorHandle: 'zhou_city',
    text: '录音我听了。为了游艇抬水位？用的还是我的税钱？',
  },
  {
    id: 'w1-npc-media-1',
    authorName: '分众快讯',
    authorHandle: 'FZFlash',
    text: '突发：副总统游艇调水录音上热搜。圆厅尚未正式回应。',
  },
  {
    id: 'w1-npc-oppo-1',
    authorName: '反对派观察',
    authorHandle: 'opp_watch',
    text: '私人行程。公共工程。水位标尺。这标题自己会竞选。',
  },
  {
    id: 'w1-npc-fan-1',
    authorName: '铁杆选民',
    authorHandle: 'loyal_vote',
    text: '假新闻又来了。等总统开口。别急着判。',
  },
  {
    id: 'w1-npc-analyst-1',
    authorName: '舆情所',
    authorHandle: 'pulse_lab',
    text: 'F 前五全是调水门。总统再不说话，市场会替他说。',
  },
  {
    id: 'w1-npc-party-1',
    authorName: '党内匿名',
    authorHandle: 'caucus_anon',
    text: '切割派和护短派在党团会上拍桌子。等圆厅定调。',
  },
  {
    id: 'w1-npc-anchor-1',
    authorName: '晚间评论',
    authorHandle: 'night_desk',
    text: '国会放风要听证。圆厅会签配合令吗？还是继续拖？',
  },
  {
    id: 'w1-npc-chip-1',
    authorName: '盘前笔记',
    authorHandle: 'premarket',
    text: '芯片补贴传闻又起。TECH 盘前异动。和政策窗口有没有关系？',
  },
];

export const YACHT_WEEK1_FILLER_TRENDS: string[] = [
  '副总统游艇调水录音',
  '国会听证动议放风',
  '圆厅是否切割副总统',
  '水利署安保口径争议',
  '芯片补贴政策窗口',
  'TECH 盘前异动',
  '党内切割派互撕',
  '纳税人与公共工程',
];

export const PORT_STRIKE_NPC_POSTS: FNpcPostSeed[] = [
  {
    id: 'npc-dock-1',
    authorName: '码头夜班',
    authorHandle: 'dock_shift',
    text: '等等，他们真为了副总统坐船调水位？用的还是我的税钱？',
  },
  {
    id: 'npc-media-1',
    authorName: '分众快讯',
    authorHandle: 'FZFlash',
    text: '突发：工会要钱，司机要活，圆厅要时间。经典。',
  },
  {
    id: 'npc-citizen-1',
    authorName: '市民老周',
    authorHandle: 'zhou_city',
    text: '我这边克罗格今早水架空了。港口封了。圆厅还没开口。',
  },
  {
    id: 'npc-union-1',
    authorName: '工友小陈',
    authorHandle: 'chen_union',
    text: '工人不能拿“正在处理”交房租。签字，付钱，开港。',
  },
  {
    id: 'npc-oppo-1',
    authorName: '反对派观察',
    authorHandle: 'opp_watch',
    text: '调水门余波。港口停摆。这标题自己会竞选。',
  },
  {
    id: 'npc-trader-1',
    authorName: '货运调度',
    authorHandle: 'haul_desk',
    text: '集装箱还在港里。报价一天一个价。再拖一周大家一起付账。',
  },
  {
    id: 'npc-fan-1',
    authorName: '铁杆选民',
    authorHandle: 'loyal_vote',
    text: '假新闻又来了。总统知道自己在做什么。港口会动的。',
  },
  {
    id: 'npc-analyst-1',
    authorName: '舆情所',
    authorHandle: 'pulse_lab',
    text: 'F 前五全是港口。总统再不说话，市场会替他说。',
  },
  {
    id: 'npc-driver-1',
    authorName: '长途司机阿凯',
    authorHandle: 'kai_road',
    text: '堵上了。柴油要钱。车贷要钱。圆厅有人上班吗？',
  },
  {
    id: 'npc-anchor-1',
    authorName: '晚间评论',
    authorHandle: 'night_desk',
    text: '谈判有进展？好。谁付款？什么时候开闸？',
  },
];

/** Filler trending lines (#2+) until / unless linked to real posts. */
export const PORT_STRIKE_FILLER_TRENDS: string[] = [
  '东海岸港口突发封闸',
  '调水门余波与劳工补偿',
  '超市货架告急',
  '工会临时补偿方案',
  '货运报价一日三变',
  '国会听证与调水门',
  '媒体部要求总统表态',
];

export const PORT_STRIKE_FEEDBACK = {
  delayMs: 4000,
  pendingLabel: '统计尚未回传…',
  title: '蝴蝶效应 · 港口复工',
  body: '颁布补偿令、签署调查案与公开发声已同步落地。工会宣布逐步复工，媒体热度转向「谁该为调水门负责」。',
  deltas: {
    resources: {
      prestige: 2,
      personal_safety: -1,
      dynasty_wealth: 0,
      support: 2,
      public_order: 5,
    },
    nation: {
      gdp: -0.2,
      cpi: 0.1,
      unemployment: 0.2,
      culture: 0,
      military: 0,
      diplomacy: -1,
    },
  } as const,
  summaryLines: [
    '治安指数 66 → 71',
    '民众支持率 44% → 46%',
    'GDP 增速 +1.8% → +1.6%',
    'CPI 3.9% → 4.0%',
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
    const next = item.id === 'dynasty_wealth' ? current + delta * 1e8 : current + delta;
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
    const isPercent = nationMetricUsesPercent(metric.key);
    const current = parseNumericValue(metric.value);
    const next = current + delta;
    const nextProgress = nationMetricProgress(metric.key, next);
    const nextTrend = [...metric.trend.slice(1), nextProgress];
    return {
      ...metric,
      value: formatNationValue(metric.key, next),
      delta: formatDelta(delta, isPercent),
      progress: nextProgress,
      trend: nextTrend,
      summary: [
        delta > 0 ? '指标回升，压力缓和' : metric.summary[0],
        `范围：${delta > 0 ? '+' : ''}${delta}`,
        delta > 0 ? '观察中' : metric.summary[2],
      ] as [string, string, string],
    };
  });
}

export function buildFeedbackBody(): string {
  return `${PORT_STRIKE_FEEDBACK.body}\n\n${PORT_STRIKE_FEEDBACK.summaryLines.map((line) => `· ${line}`).join('\n')}`;
}
